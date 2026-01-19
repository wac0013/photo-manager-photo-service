import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { IAlbumRepository } from '../../domain/repositories/album.repo';
import { CreateAlbumDto } from '../dto/album-create.dto';
import { UpdateAlbumDto } from '../dto/album-update.dto';
import { InfinitePageQueryDto } from '../dto/page-query.dto';
import { AlbumService } from './album.service';

describe('AlbumService', () => {
  let service: AlbumService;
  let repository: IAlbumRepository;

  const mockAlbumRepository = {
    findById: jest.fn(),
    findByCreatedBy: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlbumService,
        {
          provide: IAlbumRepository,
          useValue: mockAlbumRepository
        }
      ]
    }).compile();

    service = module.get<AlbumService>(AlbumService);
    repository = module.get<IAlbumRepository>(IAlbumRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAlbum', () => {
    it('should return an album if found', async () => {
      const album = { id: '1', title: 'Test Album' };
      mockAlbumRepository.findById.mockResolvedValue(album);

      const result = await service.getAlbum('1');
      expect(result).toBe(album);
      expect(repository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if album not found', async () => {
      mockAlbumRepository.findById.mockResolvedValue(null);

      await expect(service.getAlbum('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAlbumsByUser', () => {
    it('should return albums for a user', async () => {
      const userId = 'user-1';
      const query: InfinitePageQueryDto = { size: 10 };
      const albums = { items: [], nextCursor: null };
      mockAlbumRepository.findByCreatedBy.mockResolvedValue(albums);

      const result = await service.getAlbumsByUser(userId, query);
      expect(result).toBe(albums);
      expect(repository.findByCreatedBy).toHaveBeenCalledWith(userId, query);
    });
  });

  describe('createAlbum', () => {
    it('should create an album', async () => {
      const dto: CreateAlbumDto = { title: 'New Album' };
      const createdAlbum = { id: '1', ...dto };
      mockAlbumRepository.create.mockResolvedValue(createdAlbum);

      const result = await service.createAlbum(dto);
      expect(result).toBe(createdAlbum);
      expect(repository.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateAlbum', () => {
    it('should update an album if it exists', async () => {
      const album = { id: '1', title: 'Old Title' };
      const dto: UpdateAlbumDto = { title: 'New Title' };
      mockAlbumRepository.findById.mockResolvedValue(album);
      mockAlbumRepository.update.mockResolvedValue({ ...album, ...dto });

      const result = await service.updateAlbum('1', dto);
      expect(result.title).toBe('New Title');
      expect(repository.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('deleteAlbum', () => {
    it('should delete an album if it exists and has no images', async () => {
      const album = { id: '1', title: 'Test Album', hasImages: false };
      mockAlbumRepository.findById.mockResolvedValue(album);
      mockAlbumRepository.delete.mockResolvedValue(undefined);

      await service.deleteAlbum('1');
      expect(repository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw BadRequestException if album has images', async () => {
      const album = { id: '1', title: 'Test Album', hasImages: true };
      mockAlbumRepository.findById.mockResolvedValue(album);

      await expect(service.deleteAlbum('1')).rejects.toThrow(BadRequestException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
