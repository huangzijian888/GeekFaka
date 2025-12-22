import { PaymentAdapter, PaymentIntent, PaymentStatus, PaymentCallbackData } from "../types";
import crypto from "crypto";

export class EpayProvider implements PaymentAdapter {
  name = "epay";

  private signType: "MD5" | "RSA";
  private publicKey: string;
  private privateKey: string;

  constructor() {
    this.apiUrl = process.env.EPAY_API_URL || "";
    this.pid = process.env.EPAY_PID || "";
    this.key = process.env.EPAY_KEY || "";
    this.signType = (process.env.EPAY_SIGN_TYPE as "MD5" | "RSA") || "MD5";
    this.publicKey = process.env.EPAY_PUBLIC_KEY || "";
    this.privateKey = process.env.EPAY_PRIVATE_KEY || "";

    // Ensure API URL ends with slash
    if (this.apiUrl && !this.apiUrl.endsWith("/")) {
      this.apiUrl += "/";
    }
  }

  private getParamString(params: Record<string, string>): string {
    const sortedKeys = Object.keys(params).sort();
    return sortedKeys
      .filter(k => params[k] !== "" && k !== "sign" && k !== "sign_type")
      .map(k => `${k}=${params[k]}`)
      .join("&");
  }

  private formatKey(key: string, type: "PUBLIC" | "PRIVATE"): string {
    // 1. Remove existing headers/footers/whitespace to get raw body
    let raw = key
      .replace(/-----BEGIN (RSA )?(PUBLIC|PRIVATE) KEY-----/g, "")
      .replace(/-----END (RSA )?(PUBLIC|PRIVATE) KEY-----/g, "")
      .replace(/[\s\r\n]/g, "");

    // 2. Chunk into 64-char lines
    const chunks = raw.match(/.{1,64}/g);
    if (!chunks) return key; // Should not happen if key is valid

    const body = chunks.join("\n");
    
    // 3. Add correct headers back
    if (type === "PRIVATE") {
       // Check if it was RSA or generic PRIVATE KEY. 
       // Most EPay use PKCS#1 (RSA PRIVATE KEY), but Node.js is flexible if wrapped correctly.
       // We'll use the generic PRIVATE KEY header as it's safer for PKCS#8, 
       // but if it fails, users might need to convert. 
       // Let's try to infer or default to standard "RSA PRIVATE KEY" which is common in PHP worlds.
       return `-----BEGIN RSA PRIVATE KEY-----\n${body}\n-----END RSA PRIVATE KEY-----`;
    } else {
       return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
    }
  }

  private sign(params: Record<string, string>): string {
    const paramStr = this.getParamString(params);
    
    if (this.signType === "RSA") {
      if (!this.privateKey) throw new Error("Missing EPAY_PRIVATE_KEY for RSA signing");
      
      const formattedKey = this.formatKey(this.privateKey, "PRIVATE");
      const sign = crypto.createSign("RSA-SHA256");
      sign.update(paramStr);
      return sign.sign(formattedKey, "base64");
    } else {
      // MD5 Default
      const signStr = `${paramStr}${this.key}`;
      return crypto.createHash("md5").update(signStr).digest("hex");
    }
  }

  async createPayment(
    orderNo: string, 
    amount: number, 
    description: string,
    options?: { channel?: string }
  ): Promise<PaymentIntent> {
    if (!this.apiUrl || !this.pid) {
      throw new Error("EPay configuration missing");
    }

    const type = options?.channel || "alipay"; 
    const notifyUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/payments/epay/notify`;
    const returnUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/orders/${orderNo}`;

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

    return {
      orderId: orderNo,
      amount: amount,
      currency: "CNY",
      payUrl: payUrl
    };
  }

  async verifyCallback(data: any): Promise<PaymentCallbackData> {
    const { sign, sign_type, ...params } = data;
    
    if (!sign) throw new Error("Missing signature");

    // Use RSA verification if current config is RSA, or if callback explicitly says RSA
    // Note: Some gateways return sign_type, some don't. We trust our config first.
    const isRSA = this.signType === "RSA" || sign_type === "RSA";

    if (isRSA) {
       if (!this.publicKey) throw new Error("Missing EPAY_PUBLIC_KEY for RSA verification");
       
       const formattedKey = this.formatKey(this.publicKey, "PUBLIC");
       const verify = crypto.createVerify("RSA-SHA256");
       verify.update(this.getParamString(params as Record<string, string>));
       if (!verify.verify(formattedKey, sign, "base64")) {
         throw new Error("Invalid RSA signature");
       }
    } else {
       const calculatedSign = this.sign(params as Record<string, string>);
       if (calculatedSign !== sign) {
         throw new Error("Invalid MD5 signature");
       }
    }

    const status = params.trade_status === "TRADE_SUCCESS" ? PaymentStatus.PAID : PaymentStatus.FAILED;

    return {
      orderNo: params.out_trade_no,
      status: status,
      transactionId: params.trade_no,
      raw: data
    };
  }
}
