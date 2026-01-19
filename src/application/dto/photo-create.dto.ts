import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreatePhotoSchema = z.object({
  title: z.string().min(1).describe('Título da foto'),
  description: z.string().optional().describe('Descrição da foto'),
  acquireAt: z.string().datetime({ offset: true }).optional().describe('Data de aquisição (ISO 8601)'),
  albumId: z.string().min(1).describe('ID do álbum'),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .describe('Cor predominante (hexadecimal)')
});

export class CreatePhotoDto extends createZodDto(CreatePhotoSchema) {}

export const ALLOWED_IMAGE_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
