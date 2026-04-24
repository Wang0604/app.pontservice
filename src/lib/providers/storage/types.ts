export interface PresignedUploadOptions {
  key: string;
  contentType: string;
  maxBytes?: number;
  expiresInSeconds?: number;
}

export interface PresignedUploadResult {
  url: string;
  key: string;
  headers?: Record<string, string>;
}

export interface IStorageProvider {
  putObject(params: {
    key: string;
    body: Buffer | Uint8Array | string;
    contentType?: string;
    metadata?: Record<string, string>;
  }): Promise<{ key: string }>;

  getPresignedUploadUrl(opts: PresignedUploadOptions): Promise<PresignedUploadResult>;

  getPresignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;

  deleteObject(key: string): Promise<void>;
}
