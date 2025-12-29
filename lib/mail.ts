import { Resend } from 'resend';
import { prisma } from './prisma';
import { logger } from './logger';

const log = logger.child({ module: 'Mail' });

function formatLicense(code: string, index: number, format: string) {
  const prefix = `\n[条目 #${index + 1}]`;
  
  if (format === "ACCOUNT_PASS") {
    const [u, p] = code.split("----");
    return `${prefix}\n账号: ${u || '-'}\n密码: ${p || '-'}`;
  }
  
  if (format === "ACCOUNT_FULL") {
    const [u, p, e, k] = code.split("----");
    return `${prefix}\n账号: ${u || '-'}\n密码: ${p || '-'}\n辅助邮箱: ${e || '-'}\n2FA密钥: ${k || '-'}`;
  }
  
  if (format === "VIRTUAL_CARD") {
    const [n, d, c] = code.split("|");
    return `${prefix}\n卡号: ${n || '-'}\n有效期: ${d || '-'}\nCVV: ${c || '-'}`;
  }
  
  if (format === "PROXY_IP") {
    const [h, p, u, pw] = code.split(":");
    return `${prefix}\n主机: ${h || '-'}\n端口: ${p || '-'}\n用户: ${u || '-'}\n密码: ${pw || '-'}`;
  }

  // Default SINGLE format
  return `${prefix}\n卡密内容: ${code}`;
}

export async function sendOrderEmail(orderNo: string) {
  try {
    // 1. Fetch Order details with product and licenses first to check status
    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: {
        product: true,
        licenses: true
      }
    });

    if (!order || !order.email || order.status !== 'PAID' || order.emailSent) {
      log.info({ orderNo, reason: !order ? "NotFound" : (order.emailSent ? "AlreadySent" : "NotPaid") }, "Skipping email sending");
      return;
    }

    if (order.licenses.length === 0) {
      log.warn({ orderNo }, "Skipping email sending: No licenses found attached to order");
      return;
    }

    // 2. Fetch Resend configuration
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ['resend_api_key', 'resend_from_email', 'resend_enabled', 'site_title'] }
      }
    });

    const config = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    if (config.resend_enabled !== 'true' || !config.resend_api_key) {
      return;
    }

    const resend = new Resend(config.resend_api_key);
    const siteTitle = config.site_title || 'GeekFaka';

    const deliveryFormat = (order.product as any).deliveryFormat || "SINGLE";
    const licenseList = order.licenses
      .map((l, i) => formatLicense(l.code, i, deliveryFormat))
      .join('\n');

    const { data, error } = await resend.emails.send({
      from: config.resend_from_email || 'onboarding@resend.dev',
      to: order.email,
      subject: `[${siteTitle}] 您的订单已发货 - ${order.product.name}`,
      text: `尊敬的客户：\n\n您的订单 ${orderNo} 已支付成功，感谢您的购买！\n\n商品名称：${order.product.name}\n购买数量：${order.quantity}\n支付金额：¥${Number(order.totalAmount).toFixed(2)}\n\n您的卡密信息如下：\n--------------------------${licenseList}\n--------------------------\n\n您可以随时访问以下链接查询订单详情：\n${process.env.NEXT_PUBLIC_URL}/orders/${orderNo}\n\n如有任何问题，请联系在线客服。`,
    });

    if (error) {
      log.error({ error, orderNo }, "Failed to send email via Resend");
    } else {
      log.info({ data, orderNo }, "Order email sent successfully");
      // Mark as sent to prevent duplicates
      await prisma.order.update({
        where: { id: order.id },
        data: { emailSent: true }
      });
    }

  } catch (err) {
    log.error({ err, orderNo }, "Unexpected error in sendOrderEmail");
  }
}
