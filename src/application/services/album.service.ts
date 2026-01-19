import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CreateAlbumDto } from 'src/application/dto/album-create.dto';
import { UpdateAlbumDto } from 'src/application/dto/album-update.dto';

import { IAlbumRepository } from '../../domain/repositories/album.repo';
import { InfinitePageQueryDto } from '../dto/page-query.dto';

@Injectable()
export class AlbumService {
  constructor(
    @Inject(IAlbumRepository)
    private readonly albumRepository: IAlbumRepository
  ) {}

  async getAlbum(id: string) {
    const album = await this.albumRepository.findById(id);
    if (!album) {
      throw new NotFoundException(`Album with id ${id} not found`);
    }
    return album;
  }

  async getAlbumsByUser(userId: string, query: InfinitePageQueryDto) {
    return this.albumRepository.findByCreatedBy(userId, query);
  }

  async createAlbum(data: CreateAlbumDto) {
    return this.albumRepository.create(data);
  }

  async updateAlbum(id: string, data: UpdateAlbumDto) {
    await this.getAlbum(id);
    return this.albumRepository.update(id, data);
  }

  async deleteAlbum(id: string) {
    const album = await this.getAlbum(id);
    if (album.hasImages) {
      throw new BadRequestException('Não é possível excluir um álbum que contém imagens. Remova as imagens primeiro.');
    }
    return this.albumRepository.delete(id);
  }
}
