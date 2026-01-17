import { Injectable, Logger } from '@nestjs/common';

import sharp from 'sharp';

export interface ImageMetadata {
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  hasAlpha?: boolean;
  orientation?: number;
  exif?: Record<string, any>;
  icc?: Record<string, any>;
  dominantColor?: string;
}

@Injectable()
export class ImageMetadataService {
  private readonly logger = new Logger(ImageMetadataService.name);

  async extractMetadata(buffer: Buffer): Promise<ImageMetadata> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      const stats = await image.stats();
      const dominantColor = this.calculateDominantColor(stats);

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: buffer.length,
        hasAlpha: metadata.hasAlpha || false,
        orientation: metadata.orientation,
        exif: metadata.exif ? this.parseExif(metadata.exif) : undefined,
        icc: metadata.icc ? { profile: 'present' } : undefined,
        dominantColor
      };
    } catch (error) {
      this.logger.error('Error extracting image metadata:', error);
      return {} as ImageMetadata;
    }
  }

  async extractDominantColor(buffer: Buffer): Promise<string> {
    try {
      const stats = await sharp(buffer).stats();
      return this.calculateDominantColor(stats);
    } catch (error) {
      this.logger.error('Error extracting dominant color:', error);
      return '#000000';
    }
  }

  private calculateDominantColor(stats: sharp.Stats): string {
    const r = Math.round(stats.channels[0]?.mean || 0);
    const g = Math.round(stats.channels[1]?.mean || 0);
    const b = Math.round(stats.channels[2]?.mean || 0);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private parseExif(exifBuffer: Buffer): Record<string, any> {
    return {
      hasData: true,
      size: exifBuffer.length
    };
  }

  async resizeImage(buffer: Buffer, maxWidth: number, maxHeight: number, quality: number = 80): Promise<Buffer> {
    const result = await sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toBuffer();

    return result as Buffer;
  }
}
