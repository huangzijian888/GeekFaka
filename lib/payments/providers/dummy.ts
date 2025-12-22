import { PaymentAdapter, PaymentIntent, PaymentStatus, PaymentCallbackData } from "../types";

export class DummyProvider implements PaymentAdapter {
  name = "dummy";

  async createPayment(orderNo: string, amount: number, description: string, options?: { channel?: string }): Promise<PaymentIntent> {
    // In a real app, this would call an API.
    // Here we just return a fake link that acts as the "pay" action.
    console.log(`[DummyProvider] Creating payment for ${orderNo} - $${amount}`);
    
    return {
      orderId: orderNo,
      amount: amount,
      currency: "CNY",
      payUrl: `/api/payments/dummy/pay?orderNo=${orderNo}`, // Internal mock endpoint
      transactionId: `mock_${Date.now()}`
    };
  }

  async verifyCallback(data: any, headers: any): Promise<PaymentCallbackData> {
    // Dummy provider trusts everything
    return {
      orderNo: data.orderNo,
      status: PaymentStatus.PAID,
      transactionId: `mock_cb_${Date.now()}`,
      raw: data
    };
  }
}
