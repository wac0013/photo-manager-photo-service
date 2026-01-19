import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateAlbumSchema = z.object({
  title: z.string().min(1).describe('Título do álbum'),
  description: z.string().optional().describe('Descrição do álbum')
});

export class CreateAlbumDto extends createZodDto(CreateAlbumSchema) {}
