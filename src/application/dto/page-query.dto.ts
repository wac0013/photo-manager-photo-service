import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const infinitePageQuerySchema = z.object({
  cursor: z.string().optional(),
  size: z.coerce.number().min(1).max(100).default(10)
});

export class InfinitePageQueryDto extends createZodDto(infinitePageQuerySchema) { }