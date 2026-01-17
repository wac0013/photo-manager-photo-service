import { CreateAlbumDto } from 'src/application/dto/album-create.dto';
import { UpdateAlbumDto } from 'src/application/dto/album-update.dto';
import { InfinitePageQueryDto } from 'src/application/dto/page-query.dto';

import type { AlbumEntity } from '../entities/album.entity';
import { InfinitePageResponseEntity } from '../entities/infinit-page-response.entity';

export const IAlbumRepository = Symbol('IAlbumRepository');

export interface IAlbumRepository {
  findById(id: string): Promise<AlbumEntity | null>;
  findByCreatedBy(userId: string, query: InfinitePageQueryDto): Promise<InfinitePageResponseEntity<AlbumEntity>>;
  create(data: CreateAlbumDto): Promise<AlbumEntity>;
  update(id: string, data: UpdateAlbumDto): Promise<AlbumEntity>;
  delete(id: string): Promise<void>;
}
