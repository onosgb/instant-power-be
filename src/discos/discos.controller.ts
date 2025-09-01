import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DiscosService } from './discos.service';
import { DiscoDTO } from './dto/disco.dto';

@Controller('discos')
export class DiscosController {
  constructor(private readonly discosService: DiscosService) {}
  @Get()
  async getAll() {
    return this.discosService.findAllDiscos();
  }

  @Get(':id')
  async getById(@Param('id') id: number) {
    return this.discosService.findDiscoById(id);
  }

  @Post()
  async create(@Body() dto: DiscoDTO) {
    return this.discosService.createDisco(dto);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: DiscoDTO) {
    return this.discosService.updateDisco(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    return this.discosService.deleteDisco(id);
  }
}
