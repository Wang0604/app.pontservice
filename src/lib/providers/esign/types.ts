export interface CreateSignTaskParams {
  orderId: string;
  contractId: string;
  pdfUrl: string;
  signers: Array<{
    role: 'customer' | 'provider';
    name: string;
    email: string;
    phone?: string;
  }>;
  returnUrl: string;
}

export interface SignTaskResult {
  provider: 'stub' | 'esignbao' | 'pandadoc';
  taskId: string;
  signUrl: string;
  expiresAt?: Date;
}

export interface VerifyWebhookResult {
  valid: boolean;
  event?: 'signed' | 'viewed' | 'declined' | 'expired';
  taskId?: string;
  signedPdfUrl?: string;
  signedAt?: Date;
}

export interface IEsignProvider {
  readonly id: 'stub' | 'esignbao' | 'pandadoc';
  createSignTask(params: CreateSignTaskParams): Promise<SignTaskResult>;
  verifyWebhook(body: string, signature: string): Promise<VerifyWebhookResult>;
}
