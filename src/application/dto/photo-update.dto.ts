import { createZodDto } from 'nestjs-zod';

import { CreatePhotoSchema } from './photo-create.dto';

export const UpdatePhotoSchema = CreatePhotoSchema.partial().omit({
  albumId: true,
  color: true
});

export class UpdatePhotoDto extends createZodDto(UpdatePhotoSchema) {}
