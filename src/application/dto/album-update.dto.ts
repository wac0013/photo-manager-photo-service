import { createZodDto } from 'nestjs-zod';

import { CreateAlbumSchema } from './album-create.dto';

export const UpdateAlbumSchema = CreateAlbumSchema.partial();

export class UpdateAlbumDto extends createZodDto(UpdateAlbumSchema) {}
