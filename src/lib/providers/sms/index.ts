import type { ISmsProvider } from './types';
import { StubSmsProvider } from './stub';

/**
 * Factory: pick SMS provider based on env var SMS_PROVIDER.
 *
 * Stage 0 default: 'stub'. Switch to a real provider by:
 *   1. Implementing ISmsProvider in a new file (e.g. aliyun.ts)
 *   2. Adding a case here
 *   3. Setting SMS_PROVIDER=aliyun + the provider's API keys in env
 */
function createSmsProvider(): ISmsProvider {
  const provider = (process.env.SMS_PROVIDER ?? 'stub').toLowerCase();
  switch (provider) {
    case 'stub':
      return new StubSmsProvider();
    // case 'aliyun':
    //   return new AliyunSmsProvider();
    // case 'tencent':
    //   return new TencentSmsProvider();
    default:
      // eslint-disable-next-line no-console
      console.warn(`[sms] unknown SMS_PROVIDER=${provider}, falling back to stub`);
      return new StubSmsProvider();
  }
}

let cached: ISmsProvider | undefined;
export function getSmsProvider(): ISmsProvider {
  if (!cached) cached = createSmsProvider();
  return cached;
}

/**
 * Last-sent debug code keyed by phone number. Only populated in development
 * when using the stub provider. Used by the API to surface the code back to
 * the client so QA can complete the flow.
 *
 * Stored on `globalThis` so it survives Next.js dev HMR (module reloads would
 * otherwise clear a module-local Map between requests).
 *
 * NEVER read this in production code paths that ship a code to the client.
 */
type DebugEntry = { code: string; at: number };
const globalForSms = globalThis as unknown as {
  __pontaiSmsDebugCache?: Map<string, DebugEntry>;
};
function getDebugCache(): Map<string, DebugEntry> {
  if (!globalForSms.__pontaiSmsDebugCache) {
    globalForSms.__pontaiSmsDebugCache = new Map();
  }
  return globalForSms.__pontaiSmsDebugCache;
}

export function rememberDebugCode(phoneNumber: string, code: string): void {
  getDebugCache().set(phoneNumber, { code, at: Date.now() });
}

export function readDebugCode(phoneNumber: string): string | undefined {
  if (process.env.NODE_ENV === 'production') return undefined;
  const cache = getDebugCache();
  const entry = cache.get(phoneNumber);
  if (!entry) return undefined;
  // 10-minute window
  if (Date.now() - entry.at > 10 * 60 * 1000) {
    cache.delete(phoneNumber);
    return undefined;
  }
  return entry.code;
}

export type { ISmsProvider } from './types';
