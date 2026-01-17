import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';

import { IPhotoRepository } from '../../domain/repositories/photo.repo';
import { IStorageService, StorageUploadResult } from '../../domain/repositories/storage.repo';
import { Transactional } from '../../infrastructure/db/prisma';
import { InfinitePageQueryDto } from '../dto/page-query.dto';
import { ALLOWED_IMAGE_MIMETYPES, CreatePhotoDto } from '../dto/photo-create.dto';
import { UpdatePhotoDto } from '../dto/photo-update.dto';
import { ImageMetadataService } from './image-metadata.service';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const TEMP_URL_PLACEHOLDER = 'pending://upload';

@Injectable()
export class PhotoService {
  private readonly logger = new Logger(PhotoService.name);

  constructor(
    @Inject(IPhotoRepository)
    private readonly photoRepository: IPhotoRepository,
    @Inject(IStorageService)
    private readonly storageService: IStorageService,
    private readonly imageMetadataService: ImageMetadataService
  ) { }

  async getPhoto(id: string) {
    const photo = await this.photoRepository.findById(id);
    if (!photo) {
      throw new NotFoundException(`Photo with id ${id} not found`);
    }
    return photo;
  }

  async getPhotosByAlbum(albumId: string, query: InfinitePageQueryDto) {
    return this.photoRepository.findByAlbumId(albumId, query);
  }

  @Transactional()
  async createPhoto(data: CreatePhotoDto, file: MulterFile) {
    if (!ALLOWED_IMAGE_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_IMAGE_MIMETYPES.join(', ')}`
      );
    }

    const imageMetadata = await this.imageMetadataService.extractMetadata(file.buffer);
    const dominantColor = imageMetadata.dominantColor || '#000000';
    const createData: CreatePhotoDto & {
      url: string;
      metadata: Record<string, any>;
    } = {
      title: data.title,
      description: data.description,
      acquireAt: data.acquireAt,
      albumId: data.albumId,
      url: TEMP_URL_PLACEHOLDER,
      color: dominantColor,
      metadata: imageMetadata
    };

    const photo = await this.photoRepository.create(createData);

    const fileExtension = this.getFileExtension(file.mimetype);
    const filename = `${photo.id}.${fileExtension}`;
    const folder = `photos/${data.albumId}`;

    let uploadResult: StorageUploadResult;
    try {
      uploadResult = await this.storageService.upload(file.buffer, filename, file.mimetype, folder);
    } catch (uploadError) {
      this.logger.error(`Falha no upload do arquivo para photo ${photo.id}:`, uploadError);
      throw new InternalServerErrorException('Falha ao fazer upload da imagem');
    }

    try {
      const updatedPhoto = await this.photoRepository.update(photo.id, {
        url: uploadResult.url,
        metadata: {
          ...(photo.metadata as object),
          storagePath: uploadResult.filename,
          size: uploadResult.size
        }
      });

      return updatedPhoto;
    } catch (updateError) {
      this.logger.error(
        `Falha ao atualizar registro da photo ${photo.id}, deletando arquivo do bucket..., ${updateError instanceof Error ? updateError.message : 'Erro desconhecido'}`,
        updateError
      );

      try {
        await this.storageService.delete(uploadResult.filename);
        this.logger.debug(`Arquivo ${uploadResult.filename} deletado com sucesso após falha na atualização`);
      } catch (deleteError) {
        this.logger.error(`Falha ao deletar arquivo ${uploadResult.filename} após erro na atualização:`, deleteError);
      }
      throw new InternalServerErrorException('Falha ao salvar informações da imagem');
    }
  }

  async updatePhoto(id: string, data: UpdatePhotoDto) {
    await this.getPhoto(id);
    return this.photoRepository.update(id, data);
  }

  async deletePhoto(id: string) {
    const photo = await this.getPhoto(id);
    await this.photoRepository.delete(photo.id);
  }

  private getFileExtension(mimetype: string): string {
    const mimeToExtension: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif'
    };
    return mimeToExtension[mimetype] ?? 'jpg';
  }
}
