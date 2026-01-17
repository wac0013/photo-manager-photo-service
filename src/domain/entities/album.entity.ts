import { Exclude, Expose } from 'class-transformer';

export class AlbumEntity {
  id: string;
  title: string;
  description: string | null;

  @Exclude()
  createdAt: Date;

  @Exclude()
  createdBy: string | null;
  updatedAt: Date;

  @Exclude()
  updatedBy: string | null;

  @Exclude()
  deletedAt: Date | null;

  @Exclude()
  deletedBy: string | null;

  @Expose()
  coverPhoto?: string;

  @Expose()
  get hasImages(): boolean {
    return this.coverPhoto !== null && this.coverPhoto !== undefined;
  }

  constructor(data: any, lastImage?: string) {
    Object.assign(this, data);
    this.coverPhoto = lastImage;
  }
}
