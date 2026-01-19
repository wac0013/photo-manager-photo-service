import { Injectable } from '@nestjs/common';

import { InfinitePageQueryDto } from 'src/application/dto/page-query.dto';
import { CreatePhotoDto } from 'src/application/dto/photo-create.dto';
import { UpdatePhotoDto } from 'src/application/dto/photo-update.dto';
import { InfinitePageResponseEntity } from 'src/domain/entities/infinit-page-response.entity';
import { PhotoEntity } from 'src/domain/entities/photo.entity';
import type { IPhotoRepository } from 'src/domain/repositories/photo.repo';

import { PrismaService } from '../db/prisma';

@Injectable()
export class PrismaPhotoRepository implements IPhotoRepository {
  constructor(private readonly prisma: PrismaService) {}

  get model() {
    return this.prisma.getCurrentTransaction().photo;
  }

  async findById(id: string): Promise<PhotoEntity | null> {
    const photo = await this.model.findUnique({ where: { id } });
    return photo ? new PhotoEntity(photo) : null;
  }

  async findByAlbumId(albumId: string, query: InfinitePageQueryDto): Promise<InfinitePageResponseEntity<PhotoEntity>> {
    const photos = await this.model.findMany({
      where: { albumId, ...(query.cursor ? { createdAt: { lt: new Date(query.cursor) } } : {}) },
      take: query.size,
      orderBy: { createdAt: 'desc' }
    });
    return new InfinitePageResponseEntity<PhotoEntity>(
      photos.map(photo => new PhotoEntity(photo)),
      query,
      'createdAt'
    );
  }

  async create(data: CreatePhotoDto & { url: string; metadata: Record<string, any> }): Promise<PhotoEntity> {
    const photo = await this.model.create({
      data: {
        title: data.title,
        description: data.description,
        url: data.url,
        color: data.color,
        acquireAt: data.acquireAt ? new Date(data.acquireAt) : null,
        metadata: data.metadata ?? null,
        albumId: data.albumId
      } as any
    });
    return new PhotoEntity(photo);
  }

  async update(
    id: string,
    data: UpdatePhotoDto & { url?: string; metadata?: Record<string, any> }
  ): Promise<PhotoEntity> {
    const photo = await this.model.update({
      where: { id },
      data: {
        ...data,
        acquireAt: data.acquireAt ? new Date(data.acquireAt) : undefined
      }
    });
    return new PhotoEntity(photo);
  }

  async delete(id: string): Promise<void> {
    await this.model.softDelete({ where: { id } });
  }
}
