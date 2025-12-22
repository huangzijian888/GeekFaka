export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
}

export interface PaymentIntent {
  orderId: string;
  amount: number;
  currency: string;
  payUrl?: string;     // URL to redirect user to
  qrCode?: string;     // QR code content to display
  transactionId?: string; // External transaction ID
}

export interface PaymentCallbackData {
  orderNo: string;
  status: PaymentStatus;
  transactionId?: string;
  raw: any; // Raw payload for debugging
}

// The interface every payment plugin must implement
export interface PaymentAdapter {
  name: string; // e.g., "alipay", "stripe", "epay"
  
  /**
   * Create a payment transaction
   */
  createPayment(
    orderNo: string, 
    amount: number, 
    description: string,
    options?: { channel?: string } // e.g., "alipay", "wxpay"
  ): Promise<PaymentIntent>;

  /**
   * Verify a callback/webhook request
   */
  verifyCallback(
    data: any, 
    headers: any
  ): Promise<PaymentCallbackData>;

  /**
   * Check status manually (optional)
   */
  queryStatus?(orderNo: string): Promise<PaymentStatus>;
}
