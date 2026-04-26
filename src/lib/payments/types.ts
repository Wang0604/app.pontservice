export type PaymentProviderName = 'stub' | 'wechat';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'closed' | 'failed';

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amountCny: string;
  subject: string;
  notifyUrl: string;
  paymentPageUrl: string;
}

export interface CreatePaymentResult {
  provider: PaymentProviderName;
  outTradeNo: string;
  qrCodeUrl: string;
  expiresAt: Date;
}

export interface QueryPaymentResult {
  status: PaymentStatus;
  tradeNo?: string;
  paidAmountCny?: string;
}

export interface PaymentProvider {
  name: PaymentProviderName;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  queryPayment(outTradeNo: string): Promise<QueryPaymentResult>;
}
