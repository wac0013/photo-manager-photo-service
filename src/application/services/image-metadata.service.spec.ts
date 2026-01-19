import { Test, TestingModule } from '@nestjs/testing';

import sharp from 'sharp';

import { ImageMetadataService } from './image-metadata.service';

jest.mock('sharp');

describe('ImageMetadataService', () => {
  let service: ImageMetadataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageMetadataService]
    }).compile();

    service = module.get<ImageMetadataService>(ImageMetadataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractMetadata', () => {
    it('should extract metadata correctly', async () => {
      const mockBuffer = Buffer.from('mock-image');
      const mockMetadata = {
        width: 100,
        height: 100,
        format: 'jpeg',
        hasAlpha: false,
        orientation: 1,
        exif: Buffer.from('exif-data'),
        icc: Buffer.from('icc-data')
      };
      const mockStats = {
        channels: [{ mean: 255 }, { mean: 0 }, { mean: 0 }]
      };

      (sharp as unknown as jest.Mock).mockReturnValue({
        metadata: jest.fn().mockResolvedValue(mockMetadata),
        stats: jest.fn().mockResolvedValue(mockStats)
      });

      const result = await service.extractMetadata(mockBuffer);

      expect(result).toEqual({
        width: 100,
        height: 100,
        format: 'jpeg',
        size: mockBuffer.byteLength,
        hasAlpha: false,
        orientation: 1,
        exif: { hasData: true, size: mockMetadata.exif.length },
        icc: { profile: 'present' },
        dominantColor: '#ff0000'
      });
    });

    it('should return empty object on error', async () => {
      const mockBuffer = Buffer.from('mock-image');
      (sharp as unknown as jest.Mock).mockReturnValue({
        metadata: jest.fn().mockRejectedValue(new Error('Sharp error'))
      });

      const result = await service.extractMetadata(mockBuffer);

      expect(result).toEqual({});
    });
  });

  describe('extractDominantColor', () => {
    it('should extract dominant color correctly', async () => {
      const mockBuffer = Buffer.from('mock-image');
      const mockStats = {
        channels: [{ mean: 0 }, { mean: 255 }, { mean: 0 }]
      };

      (sharp as unknown as jest.Mock).mockReturnValue({
        stats: jest.fn().mockResolvedValue(mockStats)
      });

      const result = await service.extractDominantColor(mockBuffer);

      expect(result).toBe('#00ff00');
    });

    it('should return black color on error', async () => {
      const mockBuffer = Buffer.from('mock-image');
      (sharp as unknown as jest.Mock).mockReturnValue({
        stats: jest.fn().mockRejectedValue(new Error('Sharp error'))
      });

      const result = await service.extractDominantColor(mockBuffer);

      expect(result).toBe('#000000');
    });
  });

  describe('resizeImage', () => {
    it('should resize image correctly', async () => {
      const mockBuffer = Buffer.from('mock-image');
      const mockResizedBuffer = Buffer.from('resized-image');

      const mockSharp = {
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(mockResizedBuffer)
      };

      (sharp as unknown as jest.Mock).mockReturnValue(mockSharp);

      const result = await service.resizeImage(mockBuffer, 800, 600, 90);

      expect(result).toBe(mockResizedBuffer);
      expect(mockSharp.resize).toHaveBeenCalledWith(800, 600, {
        fit: 'inside',
        withoutEnlargement: true
      });
      expect(mockSharp.jpeg).toHaveBeenCalledWith({ quality: 90 });
    });
  });
});
