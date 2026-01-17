import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreateAlbumDto } from 'src/application/dto/album-create.dto';
import { UpdateAlbumDto } from 'src/application/dto/album-update.dto';
import { InfinitePageQueryDto } from 'src/application/dto/page-query.dto';
import { AuthGuard } from 'src/application/guards/auth.guard';
import { getUserContext } from 'src/application/guards/user-context';
import { AlbumService } from 'src/application/services/album.service';

@UseGuards(AuthGuard)
@ApiTags('Albums')
@ApiBearerAuth()
@Controller('albums')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) { }

  @Get()
  async getAlbums(@Query() query: InfinitePageQueryDto) {
    return this.albumService.getAlbumsByUser(getUserContext()?.userId ?? '', query);
  }

  @Get(':id')
  async getAlbum(@Param('id') id: string) {
    return this.albumService.getAlbum(id);
  }

  @Post()
  async createAlbum(@Body() createAlbumDto: CreateAlbumDto) {
    return this.albumService.createAlbum(createAlbumDto);
  }

  @Patch(':id')
  async updateAlbum(@Param('id') id: string, @Body() updateAlbumDto: UpdateAlbumDto) {
    return this.albumService.updateAlbum(id, updateAlbumDto);
  }

  @Delete(':id')
  async deleteAlbum(@Param('id') id: string) {
    return this.albumService.deleteAlbum(id);
  }
}
