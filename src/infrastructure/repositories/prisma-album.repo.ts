import { Injectable } from '@nestjs/common';

import { CreateAlbumDto } from 'src/application/dto/album-create.dto';
import { UpdateAlbumDto } from 'src/application/dto/album-update.dto';
import { InfinitePageQueryDto } from 'src/application/dto/page-query.dto';
import { AlbumEntity } from 'src/domain/entities/album.entity';
import { InfinitePageResponseEntity } from 'src/domain/entities/infinit-page-response.entity';
import { IAlbumRepository } from 'src/domain/repositories/album.repo';

import { PrismaService } from '../db/prisma';

@Injectable()
export class PrismaAlbumRepository implements IAlbumRepository {
  constructor(private readonly prisma: PrismaService) { }

  get model() {
    return this.prisma.client.album;
  }

  async findById(id: string): Promise<AlbumEntity | null> {
    const album = await this.model.findUnique({ where: { id } });
    return album ? new AlbumEntity(album) : null;
  }

  async findByCreatedBy(userId: string, query: InfinitePageQueryDto): Promise<InfinitePageResponseEntity<AlbumEntity>> {
    const albums = await this.model.findMany({
      where: {
        createdBy: userId
      },
      orderBy: { id: 'desc' },
      take: query.size,
      ...(query.cursor ? { cursor: { id: query.cursor } } : {})
    });
    return new InfinitePageResponseEntity(
      albums.map(album => new AlbumEntity(album)),
      query
    );
  }

  async create(data: CreateAlbumDto): Promise<AlbumEntity> {
    const album = await this.model.create({
      data: {
        title: data.title,
        description: data.description
      } as any
    });
    return new AlbumEntity(album);
  }

  async update(id: string, data: UpdateAlbumDto): Promise<AlbumEntity> {
    const album = await this.model.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description
      }
    });
    return new AlbumEntity(album);
  }

  async delete(id: string): Promise<void> {
    await this.model.softDelete({
      where: { id }
    });
  }
}
