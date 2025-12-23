import { PaymentAdapter, PaymentIntent, PaymentStatus, PaymentCallbackData } from "../types";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const log = logger.child({ module: 'EPayProvider' });

export class EpayProvider implements PaymentAdapter {
  name = "epay";

  private apiUrl: string = "";
  private pid: string = "";
  private key: string = "";
  private signType: "MD5" | "RSA" = "MD5";
  private publicKey: string = "";
  private privateKey: string = "";
  private isEnabled: boolean = false;
  private siteUrl: string = "";

  constructor() {}

  private async loadConfig() {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: {
          key: {
            in: [
              "epay_api_url", 
              "epay_pid", 
              "epay_key", 
              "epay_sign_type", 
              "epay_public_key", 
              "epay_private_key",
              "epay_enabled",
              "epay_channels",
              "site_url"
            ] 
          }
        }
      });
      
      const config = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);

      this.isEnabled = config.epay_enabled === "true";
      this.apiUrl = config.epay_api_url || "";
      this.pid = config.epay_pid || "";
      this.key = config.epay_key || "";
      this.signType = (config.epay_sign_type as "MD5" | "RSA") || "MD5";
      this.publicKey = config.epay_public_key || "";
      this.privateKey = config.epay_private_key || "";
      
      let url = config.site_url || process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
      if (url.endsWith("/")) url = url.slice(0, -1);
      this.siteUrl = url;

      if (this.apiUrl && !this.apiUrl.endsWith("/")) {
        this.apiUrl += "/";
      }

    } catch (e) {
      log.error({ err: e }, "Failed to load payment config from DB");
      throw new Error("Payment configuration database error");
    }
  }

  private formatKey(key: string, type: "PUBLIC" | "PRIVATE"): string {
    if (!key) return "";
    
    let raw = key
      .replace(/-----BEGIN (RSA )?(PUBLIC|PRIVATE) KEY-----/g, "")
      .replace(/-----END (RSA )?(PUBLIC|PRIVATE) KEY-----/g, "")
      .replace(/[\s\r\n]/g, "");

    const chunks = raw.match(/.{1,64}/g);
    if (!chunks) return key;

    const body = chunks.join("\n");
    
    if (type === "PRIVATE") {
       return `-----BEGIN RSA PRIVATE KEY-----\n${body}\n-----END RSA PRIVATE KEY-----`;
    } else {
       return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
    }
  }

  private getParamString(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort();
    return sortedKeys
      .filter(k => params[k] !== "" && k !== "sign" && k !== "sign_type")
      .map(k => `${k}=${params[k]}`)
      .join("&");
  }

  private signMD5(params: Record<string, string>): string {
    const paramStr = this.getParamString(params);
    const signStr = `${paramStr}${this.key}`;
    return crypto.createHash("md5").update(signStr).digest("hex");
  }

  private signRSA(params: Record<string, string>): string {
    const paramStr = this.getParamString(params);
    if (!this.privateKey) throw new Error("RSA Private Key is not configured");
    const formattedKey = this.formatKey(this.privateKey, "PRIVATE");
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(paramStr);
    return sign.sign(formattedKey, "base64");
  }

  private sign(params: Record<string, string>): string {
    return this.signType === "RSA" ? this.signRSA(params) : this.signMD5(params);
  }

  async createPayment(
    orderNo: string, 
    amount: number, 
    description: string,
    options?: { channel?: string }
  ): Promise<PaymentIntent> {
    await this.loadConfig();

    if (!this.isEnabled) {
      throw new Error("易支付渠道目前已停用，请在后台开启");
    }

    if (!this.apiUrl || !this.pid) {
      throw new Error("易支付参数未配置，请在后台设置");
    }

    const type = options?.channel || "alipay"; 
    const notifyUrl = `${this.siteUrl}/api/payments/epay/notify`;
    const returnUrl = `${this.siteUrl}/orders/${orderNo}`;

    const params: Record<string, string> = {
      pid: this.pid,
      type: type,
      out_trade_no: orderNo,
      notify_url: notifyUrl,
      return_url: returnUrl,
      name: description,
      money: amount.toFixed(2),
      sitename: "GeekFaka",
      sign_type: this.signType
    };

    const signature = this.sign(params);
    const queryString = new URLSearchParams({ ...params, sign: signature }).toString();
    const payUrl = `${this.apiUrl}submit.php?${queryString}`;

    log.info({ orderNo, amount, type, signType: this.signType }, "Payment URL generated");

    return {
      orderId: orderNo,
      amount: amount,
      currency: "CNY",
      payUrl: payUrl
    };
  }

  async verifyCallback(data: any, headers?: any): Promise<PaymentCallbackData> {
    await this.loadConfig();
    
    if (!this.isEnabled) {
        log.warn("Received callback but payment channel is disabled");
        throw new Error("Payment channel disabled");
    }

    const { sign, sign_type, ...params } = data;
    
    if (!sign) throw new Error("Missing signature");

    const incomingSignType = (sign_type || this.signType).toUpperCase();

    log.info({ incomingSignType, sign }, "Verifying callback signature");

    if (incomingSignType === "RSA") {
       if (!this.publicKey) throw new Error("RSA Public Key missing in settings");
       const formattedKey = this.formatKey(this.publicKey, "PUBLIC");
       const verify = crypto.createVerify("RSA-SHA256");
       verify.update(this.getParamString(params as Record<string, string>));
       if (!verify.verify(formattedKey, sign, "base64")) {
         log.error("RSA Signature verification failed");
         throw new Error("Invalid RSA signature from callback");
       }
    } else {
       if (!this.key) throw new Error("MD5 Key missing in settings");
       const calculatedSign = this.signMD5(params as Record<string, string>);
       if (calculatedSign !== sign) {
         log.error({ calculated: calculatedSign, received: sign }, "MD5 Signature verification failed");
         throw new Error("Invalid MD5 signature from callback");
       }
    }
    
    log.info("Signature verified successfully");

    const status = params.trade_status === "TRADE_SUCCESS" ? PaymentStatus.PAID : PaymentStatus.FAILED;

    return {
      orderNo: params.out_trade_no,
      status: status,
      transactionId: params.trade_no,
      raw: data
    };
  }
}
