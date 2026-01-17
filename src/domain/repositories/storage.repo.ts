export interface StorageUploadResult {
  url: string;
  filename: string;
  contentType: string;
  size: number;
}

export const IStorageService = Symbol('IStorageService');

export interface IStorageService {
  upload(file: Buffer, filename: string, contentType: string, folder?: string): Promise<StorageUploadResult>;
  delete(filename: string, folder?: string): Promise<void>;
  getSignedUrl(filename: string, folder?: string, expiresInMinutes?: number): Promise<string>;
}
