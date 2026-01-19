import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';

import { AuthGuard } from '../src/application/guards/auth.guard';
import * as userContext from '../src/application/guards/user-context';
import { AlbumService } from '../src/application/services/album.service';
import { IAlbumRepository } from '../src/domain/repositories/album.repo';
import { AlbumController } from '../src/infrastructure/controllers/album.controller';

describe('AlbumController (e2e)', () => {
  let app: INestApplication;

  const mockAlbum = { id: 'album-1', title: 'Test Album', createdBy: 'user-1' };
  const mockAlbums = { items: [mockAlbum], nextCursor: null };

  const mockAlbumService = {
    getAlbumsByUser: jest.fn().mockResolvedValue(mockAlbums),
    getAlbum: jest.fn().mockResolvedValue(mockAlbum),
    createAlbum: jest.fn().mockResolvedValue(mockAlbum),
    updateAlbum: jest.fn().mockResolvedValue(mockAlbum),
    deleteAlbum: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AlbumController],
      providers: [
        {
          provide: AlbumService,
          useValue: mockAlbumService
        },
        {
          provide: IAlbumRepository,
          useValue: {} // Not used since we mock AlbumService
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

    jest.spyOn(userContext, 'getUserContext').mockReturnValue({ userId: 'user-1' });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/albums (GET)', () => {
    return request(app.getHttpServer()).get('/albums').expect(200).expect(mockAlbums);
  });

  it('/albums/:id (GET)', () => {
    return request(app.getHttpServer()).get('/albums/album-1').expect(200).expect(mockAlbum);
  });

  it('/albums (POST)', () => {
    const createDto = { title: 'New Album', createdBy: 'user-1' };
    return request(app.getHttpServer()).post('/albums').send(createDto).expect(201).expect(mockAlbum);
  });

  it('/albums/:id (PATCH)', () => {
    const updateDto = { title: 'Updated Album' };
    return request(app.getHttpServer()).patch('/albums/album-1').send(updateDto).expect(200).expect(mockAlbum);
  });

  it('/albums/:id (DELETE)', () => {
    return request(app.getHttpServer()).delete('/albums/album-1').expect(200);
  });
});
