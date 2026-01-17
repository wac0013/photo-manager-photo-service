
export class AlbumEntity {
  id: string;
  title: string;
  description: string | null;
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
