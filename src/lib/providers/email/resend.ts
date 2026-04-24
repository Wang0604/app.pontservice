import { Resend } from 'resend';
import type { IEmailProvider, SendEmailParams } from './types';

export class ResendEmailProvider implements IEmailProvider {
  private client: Resend | null = null;

  private getClient(): Resend {
    if (!this.client) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error('RESEND_API_KEY is not set');
      }
      this.client = new Resend(apiKey);
    }
    return this.client;
  }

  async send(params: SendEmailParams): Promise<{ id: string }> {
    const from = process.env.RESEND_FROM_EMAIL ?? 'Pontai <[email protected]>';

    const result = await this.getClient().emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html ?? '',
      text: params.text,
      replyTo: params.replyTo,
      attachments: params.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    if (result.error) {
      throw new Error(`Resend send failed: ${result.error.message}`);
    }

    return { id: result.data?.id ?? '' };
  }
}

export const emailProvider = new ResendEmailProvider();
