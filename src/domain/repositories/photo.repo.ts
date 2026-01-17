import { InfinitePageQueryDto } from 'src/application/dto/page-query.dto';
import { CreatePhotoDto } from 'src/application/dto/photo-create.dto';
import { UpdatePhotoDto } from 'src/application/dto/photo-update.dto';
import { InfinitePageResponseEntity } from 'src/domain/entities/infinit-page-response.entity';
import type { PhotoEntity } from 'src/domain/entities/photo.entity';

export const IPhotoRepository = Symbol('IPhotoRepository');

export interface IPhotoRepository {
  findById(id: string): Promise<PhotoEntity | null>;
  findByAlbumId(albumId: string, query: InfinitePageQueryDto): Promise<InfinitePageResponseEntity<PhotoEntity>>;
  create(data: CreatePhotoDto): Promise<PhotoEntity>;
  update(id: string, data: UpdatePhotoDto & { url?: string; metadata?: Record<string, any> }): Promise<PhotoEntity>;
  delete(id: string): Promise<void>;
}
