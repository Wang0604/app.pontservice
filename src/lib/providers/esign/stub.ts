import { randomUUID } from 'node:crypto';
import type {
  IEsignProvider,
  CreateSignTaskParams,
  SignTaskResult,
  VerifyWebhookResult,
} from './types';

/**
 * Stub e-signature provider.
 *
 * Used in Stage 0 before real provider (e签宝 / PandaDoc) is integrated.
 * The "signing" UX is: customer opens /contracts/[id]/sign and clicks a
 * button to confirm; we immediately mark it as signed.
 *
 * For production Stage 0 with a real provider, swap with EsignbaoProvider
 * or PandaDocProvider implementation.
 */
export class StubEsignProvider implements IEsignProvider {
  readonly id = 'stub' as const;

  async createSignTask(params: CreateSignTaskParams): Promise<SignTaskResult> {
    const taskId = `stub-${randomUUID()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return {
      provider: 'stub',
      taskId,
      signUrl: `${appUrl}/contracts/${params.contractId}/sign`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  async verifyWebhook(): Promise<VerifyWebhookResult> {
    return { valid: true, event: 'signed' };
  }
}

export const stubEsignProvider = new StubEsignProvider();
