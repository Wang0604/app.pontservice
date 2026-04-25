/**
 * SMS Provider abstraction.
 *
 * Stage 0: only `stub` is implemented (logs to console + optionally returns the
 * code in dev mode so QA can complete the flow without wiring a real SMS gateway).
 *
 * Future providers (一档一档接，业务逻辑不变):
 *   - `aliyun`   阿里云短信服务 — 国内最常见，需要审核签名 + 模板
 *   - `tencent`  腾讯云短信 — 备选
 *   - `supabase` 通过 Supabase Phone Auth 中转（如果未来切到 Supabase）
 *
 * Switching providers means: implement IsmsProvider, add a case in
 * `src/lib/providers/sms/index.ts`, set SMS_PROVIDER env var. Nothing else changes.
 */

export interface SendSmsParams {
  /** E.164 形式的手机号，例如 +8613800138000 */
  phoneNumber: string;
  /** 6 位验证码 */
  code: string;
  /** 用途：登录、注册、密码重置 — 用于选择不同的模板 */
  purpose: 'register' | 'login' | 'reset_password' | 'generic';
}

export interface SendSmsResult {
  /**
   * Provider 端的消息 ID（如阿里云的 BizId）。
   * Stub 模式下为空字符串。
   */
  providerMessageId: string;
  /**
   * Stub / dev 模式下泄漏出来的 OTP，便于前端在没有真实短信网关时也能完成测试。
   * 真实 provider 必须返回 undefined。绝对不能泄漏到生产环境。
   */
  debugCode?: string;
}

export interface ISmsProvider {
  readonly name: string;
  send(params: SendSmsParams): Promise<SendSmsResult>;
}
