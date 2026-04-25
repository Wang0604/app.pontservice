import type { ISmsProvider, SendSmsParams, SendSmsResult } from './types';

/**
 * Stub SMS provider — does NOT actually send SMS.
 *
 * Behavior:
 * - Always logs the OTP to the server console with a high-visibility banner
 *   so the operator running `pnpm dev` sees it immediately.
 * - In development (`NODE_ENV !== 'production'`), the API layer surfaces the
 *   code back to the client so QA can complete the flow without a real SMS
 *   gateway. In production, the code is NEVER returned to the client.
 *
 * Use this until you wire up a real provider (阿里云 / 腾讯云 / Supabase).
 */
export class StubSmsProvider implements ISmsProvider {
  readonly name = 'stub';

  async send(params: SendSmsParams): Promise<SendSmsResult> {
    const banner = '═'.repeat(60);
    const message = [
      '',
      banner,
      `  [SMS STUB] phone=${params.phoneNumber}  purpose=${params.purpose}`,
      `  [SMS STUB] code=${params.code}`,
      `  [SMS STUB] (10 min validity, no real SMS sent)`,
      banner,
      '',
    ].join('\n');
    // eslint-disable-next-line no-console
    console.log(message);

    const isDev = process.env.NODE_ENV !== 'production';
    return {
      providerMessageId: '',
      debugCode: isDev ? params.code : undefined,
    };
  }
}
