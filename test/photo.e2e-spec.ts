import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';

import { AuthGuard } from '../src/application/guards/auth.guard';
import { ImageMetadataService } from '../src/application/services/image-metadata.service';
import { PhotoService } from '../src/application/services/photo.service';
import { IPhotoRepository } from '../src/domain/repositories/photo.repo';
import { IStorageService } from '../src/domain/repositories/storage.repo';
import { PhotoController } from '../src/infrastructure/controllers/photo.controller';

describe('PhotoController (e2e)', () => {
  let app: INestApplication;

  const mockPhoto = {
    id: 'photo-1',
    title: 'Test Photo',
    url: 'http://storage.com/photo-1.jpg',
    albumId: 'album-1',
    metadata: {}
  };
  const mockPhotos = { items: [mockPhoto], nextCursor: null };

  const mockPhotoService = {
    getPhotosByAlbum: jest.fn().mockResolvedValue(mockPhotos),
    getPhoto: jest.fn().mockResolvedValue(mockPhoto),
    createPhoto: jest.fn().mockResolvedValue(mockPhoto),
    updatePhoto: jest.fn().mockResolvedValue(mockPhoto),
    deletePhoto: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PhotoController],
      providers: [
        {
          provide: PhotoService,
          useValue: mockPhotoService
        },
        {
          provide: ImageMetadataService,
          useValue: {}
        },
        {
          provide: IPhotoRepository,
          useValue: {}
        },
        {
          provide: IStorageService,
          useValue: {}
        }
      ]
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 'user-1' };
          return true;
        }
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/album/:albumId (GET)', () => {
    return request(app.getHttpServer()).get('/album/album-1').expect(200).expect(mockPhotos);
  });

  it('/:id (GET)', () => {
    return request(app.getHttpServer()).get('/photo-1').expect(200).expect(mockPhoto);
  });

  it('/ (POST) - with file', () => {
    return request(app.getHttpServer())
      .post('/')
      .attach('file', Buffer.from('fake-image'), 'test.jpg')
      .field('title', 'Test Photo')
      .field('albumId', 'album-1')
      .expect(201);
  });

  it('/:id (PATCH)', () => {
    const updateDto = { title: 'Updated Photo' };
    return request(app.getHttpServer()).patch('/photo-1').send(updateDto).expect(200).expect(mockPhoto);
  });

  it('/:id (DELETE)', () => {
    return request(app.getHttpServer()).delete('/photo-1').expect(200);
  });
});
