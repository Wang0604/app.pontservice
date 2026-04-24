import { stubEsignProvider } from './stub';
import type { IEsignProvider } from './types';

export function getEsignProvider(): IEsignProvider {
  const chosen = process.env.ESIGN_PROVIDER ?? 'stub';
  switch (chosen) {
    case 'stub':
      return stubEsignProvider;
    // TODO: Day 5+ 接入真实供应商
    // case 'esignbao': return esignbaoProvider;
    // case 'pandadoc': return pandadocProvider;
    default:
      console.warn(`[esign] unknown provider '${chosen}', falling back to stub`);
      return stubEsignProvider;
  }
}

export const esignProvider = getEsignProvider();
export type { IEsignProvider } from './types';
