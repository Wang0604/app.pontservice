import { createDecipheriv, randomBytes, sign, verify } from 'crypto';
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  QueryPaymentResult,
} from './types';

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set`);
  return value.replace(/\\n/g, '\n');
}

function optionalEnv(name: string) {
  return process.env[name]?.trim().replace(/\\n/g, '\n');
}

function getGateway() {
  return (process.env.WECHAT_PAY_GATEWAY ?? 'https://api.mch.weixin.qq.com').replace(/\/$/, '');
}

function yuanToFen(amountCny: string) {
  return Math.round(Number(amountCny) * 100);
}

function fenToYuan(fen: number) {
  return (fen / 100).toFixed(2);
}

function signRequest(method: string, urlPathWithQuery: string, body: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString('hex');
  const message = `${method}\n${urlPathWithQuery}\n${timestamp}\n${nonce}\n${body}\n`;
  const signature = sign('RSA-SHA256', Buffer.from(message), requireEnv('WECHAT_PAY_PRIVATE_KEY')).toString(
    'base64',
  );

  return `WECHATPAY2-SHA256-RSA2048 mchid="${requireEnv('WECHAT_PAY_MCH_ID')}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${requireEnv('WECHAT_PAY_CERT_SERIAL_NO')}",signature="${signature}"`;
}

async function wechatFetch<T>(method: 'GET' | 'POST', pathWithQuery: string, body?: unknown) {
  const bodyText = body ? JSON.stringify(body) : '';
  const res = await fetch(`${getGateway()}${pathWithQuery}`, {
    method,
    headers: {
      Authorization: signRequest(method, pathWithQuery, bodyText),
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'app.pontservice',
    },
    body: bodyText || undefined,
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as T) : ({} as T);
  if (!res.ok) {
    const errorData = data as T & { code?: string; message?: string; detail?: unknown };
    console.error('[wechat-pay] api error', {
      method,
      path: pathWithQuery,
      status: res.status,
      requestId: res.headers.get('request-id'),
      code: errorData.code,
      message: errorData.message,
      detail: errorData.detail,
    });
    const friendlyDetail = errorData.detail
      ? ` · ${typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail)}`
      : '';
    throw new Error(
      `微信支付请求失败 [${res.status}${errorData.code ? ' · ' + errorData.code : ''}]: ${errorData.message ?? '未知错误'}${friendlyDetail}`,
    );
  }
  return data;
}

export class WeChatPaymentProvider implements PaymentProvider {
  name = 'wechat' as const;

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const body = {
      appid: requireEnv('WECHAT_PAY_APPID'),
      mchid: requireEnv('WECHAT_PAY_MCH_ID'),
      description: input.subject,
      out_trade_no: input.orderNumber,
      notify_url: input.notifyUrl,
      amount: {
        total: yuanToFen(input.amountCny),
        currency: 'CNY',
      },
    };

    const result = await wechatFetch<{ code_url: string }>('POST', '/v3/pay/transactions/native', body);
    if (!result.code_url) throw new Error('微信支付未返回二维码链接');

    return {
      provider: this.name,
      outTradeNo: input.orderNumber,
      qrCodeUrl: result.code_url,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    };
  }

  async queryPayment(outTradeNo: string): Promise<QueryPaymentResult> {
    const mchid = requireEnv('WECHAT_PAY_MCH_ID');
    const result = await wechatFetch<{
      trade_state: string;
      transaction_id?: string;
      amount?: { payer_total?: number; total?: number };
    }>('GET', `/v3/pay/transactions/out-trade-no/${encodeURIComponent(outTradeNo)}?mchid=${mchid}`);

    if (result.trade_state === 'SUCCESS') {
      const paidFen = result.amount?.payer_total ?? result.amount?.total;
      return {
        status: 'paid',
        tradeNo: result.transaction_id,
        paidAmountCny: typeof paidFen === 'number' ? fenToYuan(paidFen) : undefined,
      };
    }

    if (result.trade_state === 'CLOSED' || result.trade_state === 'REVOKED') return { status: 'closed' };
    if (result.trade_state === 'PAYERROR') return { status: 'failed' };
    return { status: 'pending' };
  }

  verifyNotify(headers: Headers, rawBody: string) {
    const timestamp = headers.get('wechatpay-timestamp');
    const nonce = headers.get('wechatpay-nonce');
    const signature = headers.get('wechatpay-signature');
    const serial = headers.get('wechatpay-serial');
    if (!timestamp || !nonce || !signature) return false;

    const message = `${timestamp}\n${nonce}\n${rawBody}\n`;
    const wechatPayPublicKey = optionalEnv('WECHAT_PAY_PUBLIC_KEY');
    const wechatPayPublicKeyId = optionalEnv('WECHAT_PAY_PUBLIC_KEY_ID');
    const verifyKey = wechatPayPublicKey ?? requireEnv('WECHAT_PAY_PLATFORM_CERT');

    if (wechatPayPublicKeyId && serial && serial !== wechatPayPublicKeyId) {
      console.error('[wechat-notify] public key id mismatch', {
        expected: wechatPayPublicKeyId,
        received: serial,
      });
      return false;
    }

    return verify(
      'RSA-SHA256',
      Buffer.from(message),
      verifyKey,
      Buffer.from(signature, 'base64'),
    );
  }

  decryptResource(resource: { ciphertext: string; nonce: string; associated_data?: string }) {
    const ciphertext = Buffer.from(resource.ciphertext, 'base64');
    const authTag = ciphertext.subarray(ciphertext.length - 16);
    const encrypted = ciphertext.subarray(0, ciphertext.length - 16);
    const decipher = createDecipheriv(
      'aes-256-gcm',
      Buffer.from(requireEnv('WECHAT_PAY_API_V3_KEY'), 'utf8'),
      Buffer.from(resource.nonce, 'utf8'),
    );
    if (resource.associated_data) {
      decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'));
    }
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8')) as {
      out_trade_no: string;
      transaction_id: string;
      trade_state: string;
      success_time?: string;
      amount?: { payer_total?: number; total?: number };
    };
  }
}
