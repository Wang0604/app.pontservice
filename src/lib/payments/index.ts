import { StubPaymentProvider } from './stub';
import { WeChatPaymentProvider } from './wechat';
import type { PaymentProvider, PaymentProviderName } from './types';

export function getPaymentProviderName(): PaymentProviderName {
  return process.env.PAYMENT_PROVIDER === 'wechat' ? 'wechat' : 'stub';
}

export function getPaymentProvider(): PaymentProvider {
  return getPaymentProviderName() === 'wechat'
    ? new WeChatPaymentProvider()
    : new StubPaymentProvider();
}

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '');
}
