import { Bucket, Storage } from '@google-cloud/storage';
import { Injectable, Logger } from '@nestjs/common';

import { IStorageService, StorageUploadResult } from '../../domain/repositories/storage.repo';

@Injectable()
export class GcsStorageService implements IStorageService {
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly bucket: Bucket;
  private readonly logger = new Logger(GcsStorageService.name);

  constructor() {
    this.bucketName = process.env.GCS_BUCKET_NAME as string;
    const keyFilename = process.env.GC_BASE64_CREDENTIALS as string;

    this.storage = new Storage({ credentials: JSON.parse(Buffer.from(keyFilename, 'base64').toString('utf-8')) });
    this.bucket = this.storage.bucket(this.bucketName);
  }

  async upload(file: Buffer, filename: string, contentType: string, folder?: string): Promise<StorageUploadResult> {
    const filePath = folder ? `${folder}/${filename}` : filename;
    const blob = this.bucket.file(filePath);

    await blob.save(file, {
      metadata: {
        contentType
      },
      resumable: false
    });

    const isPublic = process.env.GCS_PUBLIC_FILES === 'true';

    let url: string;
    if (isPublic) {
      await blob.makePublic();
      url = `https://storage.googleapis.com/${this.bucketName}/${filePath}`;
    } else {
      const [signedUrl] = await blob.getSignedUrl({ action: 'read', expires: new Date(Date.now() + 60 * 1000) });
      url = signedUrl;
    }

    this.logger.debug(`File uploaded: ${filePath}`);

    return {
      url,
      filename: filePath,
      contentType,
      size: file.length
    };
  }

  async getSignedUrl(filename: string, folder?: string, expiresInMinutes: number = 60): Promise<string> {
    const filePath = folder ? `${folder}/${filename}` : filename;

    const [signedUrl] = await this.bucket.file(filePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000
    });

    return signedUrl as string;
  }

  async delete(filename: string, folder?: string): Promise<void> {
    const filePath = folder ? `${folder}/${filename}` : filename;

    try {
      await this.bucket.file(filePath).delete();
      this.logger.debug(`File deleted: ${filePath}`);
    } catch (error) {
      this.logger.error(`Error deleting file ${filePath}:`, error);
      throw error;
    }
  }
}
