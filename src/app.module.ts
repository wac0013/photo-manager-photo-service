import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { AuthGuard } from './application/guards/auth.guard';
import { UserContextInterceptor } from './application/guards/user-context.interceptor';
import { AlbumService } from './application/services/album.service';
import { ImageMetadataService } from './application/services/image-metadata.service';
import { PhotoService } from './application/services/photo.service';
import { IAlbumRepository } from './domain/repositories/album.repo';
import { IPhotoRepository } from './domain/repositories/photo.repo';
import { IStorageService } from './domain/repositories/storage.repo';
import { AlbumController } from './infrastructure/controllers/album.controller';
import { PhotoController } from './infrastructure/controllers/photo.controller';
import { PrismaService } from './infrastructure/db/prisma/prisma.service';
import { PrismaAlbumRepository } from './infrastructure/repositories/prisma-album.repo';
import { PrismaPhotoRepository } from './infrastructure/repositories/prisma-photo.repo';
import { GcsStorageService } from './infrastructure/storage/gcs-storage.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 3000,
      maxRedirects: 5
    })
  ],
  controllers: [AlbumController, PhotoController],
  providers: [
    PrismaService,
    AlbumService,
    PhotoService,
    ImageMetadataService,
    {
      provide: IAlbumRepository,
      useClass: PrismaAlbumRepository
    },
    {
      provide: IPhotoRepository,
      useClass: PrismaPhotoRepository
    },
    {
      provide: IStorageService,
      useClass: GcsStorageService
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: UserContextInterceptor
    }
  ]
})
export class AppModule { }
