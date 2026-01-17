import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';

import { InfinitePageQueryDto } from 'src/application/dto/page-query.dto';
import { AuthGuard } from 'src/application/guards/auth.guard';

import { ALLOWED_IMAGE_MIMETYPES, CreatePhotoDto, MAX_FILE_SIZE } from '../../application/dto/photo-create.dto';
import { UpdatePhotoDto } from '../../application/dto/photo-update.dto';
import { PhotoService } from '../../application/services/photo.service';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@UseGuards(AuthGuard)
@ApiTags('Photos')
@ApiBearerAuth()
@Controller()
export class PhotoController {
  constructor(private readonly photoService: PhotoService) { }

  @Get('album/:albumId')
  async getPhotosByAlbum(@Param('albumId') albumId: string, @Query() query: InfinitePageQueryDto) {
    return this.photoService.getPhotosByAlbum(albumId, query);
  }

  @Get(':id')
  async getPhoto(@Param('id') id: string) {
    return this.photoService.getPhoto(id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_FILE_SIZE
      },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_IMAGE_MIMETYPES.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              `Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_IMAGE_MIMETYPES.join(', ')}`
            ),
            false
          );
        }
        callback(null, true);
      }
    })
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'title', 'albumId'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (jpeg, png, gif, webp, heic, heif)'
        },
        title: {
          type: 'string',
          description: 'Título da foto'
        },
        description: {
          type: 'string',
          description: 'Descrição da foto'
        },
        acquireAt: {
          type: 'string',
          format: 'date-time',
          description: 'Data de aquisição'
        },
        albumId: {
          type: 'string',
          description: 'ID do álbum'
        }
      }
    }
  })
  async createPhoto(@UploadedFile() file: MulterFile, @Body() createPhotoDto: CreatePhotoDto) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem é obrigatório');
    }
    return this.photoService.createPhoto(createPhotoDto, file);
  }

  @Patch(':id')
  async updatePhoto(@Param('id') id: string, @Body() updatePhotoDto: UpdatePhotoDto) {
    return this.photoService.updatePhoto(id, updatePhotoDto);
  }

  @Delete(':id')
  async deletePhoto(@Param('id') id: string) {
    return this.photoService.deletePhoto(id);
  }
}
