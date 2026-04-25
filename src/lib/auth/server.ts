import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { phoneNumber as phoneNumberPlugin } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { emailProvider } from '@/lib/providers/email/resend';
import { passwordResetEmail } from '@/lib/providers/email/templates';
import { getSmsProvider, rememberDebugCode } from '@/lib/providers/sms';
import { isValidCnPhoneNumber } from './phone';
import { ensureWelcomeCreditsOnce } from '@/lib/credits';
import { adminEmails } from '@/lib/env';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const AUTH_URL = process.env.BETTER_AUTH_URL ?? APP_URL;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: AUTH_URL,
  trustedOrigins: [APP_URL, 'https://pontai.cloud'],

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
    // Better Auth 给我们一个指向它自己 callback 的 URL：
    //   ${baseURL}/api/auth/reset-password/${token}?callbackURL=${redirectTo}
    // 用户点击 → Better Auth 验证 token → 302 跳到 ${redirectTo}?token=${token}
    // 我们的 /reset-password 页面再从 query 读 token、调 authClient.resetPassword。
    // 所以这里直接把 url 原样发给用户，让 Better Auth 自己处理跳转链路即可。
    async sendResetPassword({ user, url }) {
      const { subject, html } = passwordResetEmail({ resetUrl: url });
      await emailProvider.send({ to: user.email, subject, html });
    },
  },

  plugins: [
    phoneNumberPlugin({
      otpLength: 6,
      // 10 分钟 — 注册需要再填邮箱+密码，要给老板足够时间
      expiresIn: 600,
      allowedAttempts: 5,
      requireVerification: false,
      phoneNumberValidator: async (input) => isValidCnPhoneNumber(input),
      async sendOTP({ phoneNumber, code }) {
        rememberDebugCode(phoneNumber, code);
        await getSmsProvider().send({
          phoneNumber,
          code,
          purpose: 'register',
        });
      },
      async sendPasswordResetOTP({ phoneNumber, code }) {
        rememberDebugCode(phoneNumber, code);
        await getSmsProvider().send({
          phoneNumber,
          code,
          purpose: 'reset_password',
        });
      },
    }),
    nextCookies(),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },

  user: {
    additionalFields: {
      fullName: { type: 'string', required: false },
      companyName: { type: 'string', required: false },
      role: { type: 'string', required: false, defaultValue: 'user' },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // First-ever admin auto-promotion: if email matches ADMIN_EMAILS, set role.
          if (
            typeof user.email === 'string' &&
            adminEmails.includes(user.email.toLowerCase())
          ) {
            return { data: { ...user, role: 'admin' } };
          }
        },
        after: async (user) => {
          // 注册即赠送 50 credits
          try {
            await ensureWelcomeCreditsOnce(user.id);
          } catch (err) {
            // 只记录、不抛 — 注册流程不应被赠送失败阻塞
            // eslint-disable-next-line no-console
            console.error('[auth] ensureWelcomeCreditsOnce failed', err);
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
