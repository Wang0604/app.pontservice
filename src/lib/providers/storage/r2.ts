import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  IStorageProvider,
  PresignedUploadOptions,
  PresignedUploadResult,
} from './types';

export class R2StorageProvider implements IStorageProvider {
  private client: S3Client | null = null;
  private bucket: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET_NAME ?? 'pontai-uploads';
  }

  private getClient(): S3Client {
    if (!this.client) {
      const endpoint = process.env.R2_ENDPOINT;
      const accessKeyId = process.env.R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

      if (!endpoint || !accessKeyId || !secretAccessKey) {
        throw new Error('R2 credentials not configured (R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)');
      }

      this.client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
      });
    }
    return this.client;
  }

  async putObject(params: {
    key: string;
    body: Buffer | Uint8Array | string;
    contentType?: string;
    metadata?: Record<string, string>;
  }) {
    await this.getClient().send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
        Metadata: params.metadata,
      }),
    );
    return { key: params.key };
  }

  async getPresignedUploadUrl(opts: PresignedUploadOptions): Promise<PresignedUploadResult> {
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: opts.key,
      ContentType: opts.contentType,
    });
    const url = await getSignedUrl(this.getClient(), cmd, {
      expiresIn: opts.expiresInSeconds ?? 600,
    });
    return {
      url,
      key: opts.key,
      headers: { 'Content-Type': opts.contentType },
    };
  }

  async getPresignedDownloadUrl(key: string, expiresInSeconds = 600): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return await getSignedUrl(this.getClient(), cmd, { expiresIn: expiresInSeconds });
  }

  async deleteObject(key: string): Promise<void> {
    await this.getClient().send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

export const storageProvider = new R2StorageProvider();
