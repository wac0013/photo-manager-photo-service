
export class PhotoEntity {
  id: string;
  title: string;
  description: string | null;
  url: string;
  color: string;
  acquireAt: Date | null;
  metadata: Record<string, any> | null;
  albumId: string;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
  deletedAt: Date | null;
  deletedBy: string | null;

  constructor(data: any) {
    Object.assign(this, data);
  }
}
