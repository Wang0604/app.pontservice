import type { CreatePaymentInput, CreatePaymentResult, PaymentProvider, QueryPaymentResult } from './types';

export class StubPaymentProvider implements PaymentProvider {
  name = 'stub' as const;

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    return {
      provider: this.name,
      outTradeNo: input.orderNumber,
      qrCodeUrl: input.paymentPageUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  async queryPayment(): Promise<QueryPaymentResult> {
    return { status: 'pending' };
  }
}
