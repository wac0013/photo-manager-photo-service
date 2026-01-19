import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { IPhotoRepository } from '../../domain/repositories/photo.repo';
import { IStorageService } from '../../domain/repositories/storage.repo';
import { InfinitePageQueryDto } from '../dto/page-query.dto';
import { CreatePhotoDto } from '../dto/photo-create.dto';
import { UpdatePhotoDto } from '../dto/photo-update.dto';
import { ImageMetadataService } from './image-metadata.service';
import { PhotoService } from './photo.service';

// Mock the Transactional decorator or the prisma context to avoid errors
jest.mock('../../infrastructure/db/prisma', () => ({
  Transactional: () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => descriptor
}));

describe('PhotoService', () => {
  let service: PhotoService;
  let photoRepository: IPhotoRepository;
  let storageService: IStorageService;
  let imageMetadataService: ImageMetadataService;

  const mockPhotoRepository = {
    findById: jest.fn(),
    findByAlbumId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };

  const mockStorageService = {
    upload: jest.fn(),
    delete: jest.fn()
  };

  const mockImageMetadataService = {
    extractMetadata: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotoService,
        {
          provide: IPhotoRepository,
          useValue: mockPhotoRepository
        },
        {
          provide: IStorageService,
          useValue: mockStorageService
        },
        {
          provide: ImageMetadataService,
          useValue: mockImageMetadataService
        }
      ]
    }).compile();

    service = module.get<PhotoService>(PhotoService);
    photoRepository = module.get<IPhotoRepository>(IPhotoRepository);
    storageService = module.get<IStorageService>(IStorageService);
    imageMetadataService = module.get<ImageMetadataService>(ImageMetadataService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPhoto', () => {
    it('should return a photo if found', async () => {
      const photo = { id: '1', title: 'Test Photo' };
      mockPhotoRepository.findById.mockResolvedValue(photo);

      const result = await service.getPhoto('1');
      expect(result).toBe(photo);
      expect(photoRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if photo not found', async () => {
      mockPhotoRepository.findById.mockResolvedValue(null);

      await expect(service.getPhoto('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPhotosByAlbum', () => {
    it('should return photos for an album', async () => {
      const albumId = 'album-1';
      const query: InfinitePageQueryDto = { size: 10 };
      const photos = { items: [], nextCursor: null };
      mockPhotoRepository.findByAlbumId.mockResolvedValue(photos);

      const result = await service.getPhotosByAlbum(albumId, query);
      expect(result).toBe(photos);
      expect(photoRepository.findByAlbumId).toHaveBeenCalledWith(albumId, query);
    });
  });

  describe('createPhoto', () => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test-buffer')
    };

    const mockDto: CreatePhotoDto = {
      title: 'Test Photo',
      albumId: 'album-1'
    };

    it('should successfully create a photo and upload file', async () => {
      const mockMetadata = { dominantColor: '#ff0000', width: 100, height: 100 };
      const mockPhoto = { id: 'photo-1', ...mockDto, metadata: mockMetadata };
      const mockUploadResult = { url: 'http://storage.com/photo-1.jpg', filename: 'photo-1.jpg', size: 1024 };

      mockImageMetadataService.extractMetadata.mockResolvedValue(mockMetadata);
      mockPhotoRepository.create.mockResolvedValue(mockPhoto);
      mockStorageService.upload.mockResolvedValue(mockUploadResult);
      mockPhotoRepository.update.mockResolvedValue({ ...mockPhoto, url: mockUploadResult.url });

      const result = await service.createPhoto(mockDto, mockFile as any);

      expect(result.url).toBe(mockUploadResult.url);
      expect(imageMetadataService.extractMetadata).toHaveBeenCalledWith(mockFile.buffer);
      expect(photoRepository.create).toHaveBeenCalled();
      expect(storageService.upload).toHaveBeenCalled();
      expect(photoRepository.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid mimetype', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/pdf' };

      await expect(service.createPhoto(mockDto, invalidFile as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException if upload fails', async () => {
      mockImageMetadataService.extractMetadata.mockResolvedValue({});
      mockPhotoRepository.create.mockResolvedValue({ id: 'photo-1' });
      mockStorageService.upload.mockRejectedValue(new Error('Upload failed'));

      await expect(service.createPhoto(mockDto, mockFile as any)).rejects.toThrow(InternalServerErrorException);
    });

    it('should delete file from storage if updating photo record fails', async () => {
      const mockMetadata = { dominantColor: '#ff0000' };
      const mockPhoto = { id: 'photo-1', ...mockDto, metadata: mockMetadata };
      const mockUploadResult = { url: 'http://storage.com/photo-1.jpg', filename: 'photo-1.jpg', size: 1024 };

      mockImageMetadataService.extractMetadata.mockResolvedValue(mockMetadata);
      mockPhotoRepository.create.mockResolvedValue(mockPhoto);
      mockStorageService.upload.mockResolvedValue(mockUploadResult);
      mockPhotoRepository.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.createPhoto(mockDto, mockFile as any)).rejects.toThrow(InternalServerErrorException);
      expect(storageService.delete).toHaveBeenCalledWith(mockUploadResult.filename);
    });
  });

  describe('updatePhoto', () => {
    it('should update a photo', async () => {
      const photo = { id: '1', title: 'Old Title' };
      const dto: UpdatePhotoDto = { title: 'New Title' };
      mockPhotoRepository.findById.mockResolvedValue(photo);
      mockPhotoRepository.update.mockResolvedValue({ ...photo, ...dto });

      const result = await service.updatePhoto('1', dto);
      expect(result.title).toBe('New Title');
    });
  });

  describe('deletePhoto', () => {
    it('should delete a photo', async () => {
      const photo = { id: '1', title: 'Test Photo' };
      mockPhotoRepository.findById.mockResolvedValue(photo);
      mockPhotoRepository.delete.mockResolvedValue(undefined);

      await service.deletePhoto('1');
      expect(photoRepository.delete).toHaveBeenCalledWith('1');
    });
  });
});
