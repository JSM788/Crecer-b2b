import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

export class StorageService {
  private client: S3Client | null = null;
  private bucket: string;
  private publicDomain: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET_NAME || 'ventaspro';
    this.publicDomain =
      process.env.R2_PUBLIC_DOMAIN ||
      'https://pub-3550cce562a14a619169a17a72097574.r2.dev';

    const accessKeyId =
      process.env.R2_ACCESS_KEY_ID || '1ca1e9c8425d82ad652f1e3a06f747ef';
    const secretAccessKey =
      process.env.R2_SECRET_ACCESS_KEY ||
      'ce31cad25a18f98b98a77d1a3fc9900174bd9f674c65beff24892d1a337055f3';
    const endpoint =
      process.env.R2_ENDPOINT ||
      'https://5a3c4bcbdcf1bfff7973be98f4e56c8c.r2.cloudflarestorage.com';

    if (accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: process.env.R2_REGION || 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  async uploadBase64(
    base64Data: string,
    mimeType: string,
    folder = 'evidences',
  ): Promise<string | null> {
    if (!this.client) return null;
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = mimeType.split('/')[1] || 'jpg';
      const key = `${folder}/${Date.now()}-${randomUUID()}.${ext}`;

      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        }),
      );

      return `${this.publicDomain.replace(/\/$/, '')}/${key}`;
    } catch (err) {
      console.error('Error uploading to Cloudflare R2:', err);
      return null;
    }
  }
}

export const storage = new StorageService();

