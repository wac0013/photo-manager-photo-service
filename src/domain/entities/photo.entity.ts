import { Exclude, Expose } from 'class-transformer';

export class PhotoEntity {
  id: string;
  title: string;
  description: string | null;
  url: string;
  color: string;
  acquireAt: Date | null;
  albumId: string;
  createdAt: Date;

  @Exclude()
  metadata: Record<string, any> | null;

  @Exclude()
  createdBy: string | null;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  updatedBy: string | null;

  @Exclude()
  deletedAt: Date | null;

  @Exclude()
  deletedBy: string | null;

  @Expose()
  get sizeFormatted(): string | null {
    const size = this.metadata?.size;
    if (typeof size !== 'number') return null;

    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  constructor(data: any) {
    Object.assign(this, data);
  }
}
