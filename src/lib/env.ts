import { z } from 'zod';

/**
 * 把字符串里的空字符串当成 undefined，让 .optional() / .url() 能正常通过。
 * 这样 .env.local 里 `KEY=` 这种"占位空"也不会触发 zod 校验失败。
 */
const optionalUrl = z
  .preprocess((v) => (v === '' ? undefined : v), z.string().url().optional());
const optionalSecret = z
  .preprocess((v) => (v === '' ? undefined : v), z.string().min(16).optional());

// DATABASE_URL is special: in dev we accept `pglite:...` (embedded WASM Postgres)
// alongside standard postgres:// URLs. Empty falls back to PGlite auto-mode.
const optionalDbUrl = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z
    .string()
    .refine(
      (s) => /^(postgres|postgresql|pglite):/i.test(s),
      'DATABASE_URL must start with postgres://, postgresql://, or pglite:',
    )
    .optional(),
);

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: optionalDbUrl,

  BETTER_AUTH_SECRET: optionalSecret,
  BETTER_AUTH_URL: optionalUrl,

  R2_ENDPOINT: optionalUrl,
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  RESEND_ADMIN_EMAIL: z.string().optional(),

  DEEPSEEK_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  BAIDU_OCR_API_KEY: z.string().optional(),
  BAIDU_OCR_SECRET_KEY: z.string().optional(),

  ADMIN_EMAILS: z.string().optional(),

  COMPANY_NAME: z.string().optional(),
  COMPANY_LEGAL_REPRESENTATIVE: z.string().optional(),
  COMPANY_ADDRESS: z.string().optional(),
  COMPANY_UNIFIED_SOCIAL_CREDIT_CODE: z.string().optional(),
  BANK_ACCOUNT_NAME: z.string().optional(),
  BANK_NAME: z.string().optional(),
  BANK_ACCOUNT_NUMBER: z.string().optional(),
  BANK_BRANCH: z.string().optional(),

  ESIGN_PROVIDER: z.enum(['stub', 'esignbao', 'pandadoc']).default('stub'),
  ESIGN_API_KEY: z.string().optional(),
  ESIGN_WEBHOOK_SECRET: z.string().optional(),

  // SMS provider (短信服务商) - Stage 0 默认 stub
  // 真实 provider 接入时这里加 enum 值并补一个 case 在 src/lib/providers/sms/index.ts
  SMS_PROVIDER: z.enum(['stub', 'aliyun', 'tencent']).default('stub'),
  ALIYUN_SMS_ACCESS_KEY_ID: z.string().optional(),
  ALIYUN_SMS_ACCESS_KEY_SECRET: z.string().optional(),
  ALIYUN_SMS_SIGN_NAME: z.string().optional(),
  ALIYUN_SMS_TEMPLATE_CODE_REGISTER: z.string().optional(),
  ALIYUN_SMS_TEMPLATE_CODE_RESET: z.string().optional(),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: optionalUrl,
});

export const serverEnv = serverEnvSchema.parse(process.env);
export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export const adminEmails = (serverEnv.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return adminEmails.includes(email.toLowerCase());
}
