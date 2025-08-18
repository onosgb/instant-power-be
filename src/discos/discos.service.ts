import { PrismaService } from './../shared/services/prisma.service';
import { Injectable } from '@nestjs/common';
import { DiscoDTO } from './dto/disco.dto';

@Injectable()
export class DiscosService {
  constructor(private readonly prismaService: PrismaService) {}
  createDisco(dto: DiscoDTO) {
    return this.prismaService.disco.create({ data: dto });
  }

  updateDisco(id: number, dto: DiscoDTO) {
    return this.prismaService.disco.update({ where: { id }, data: dto });
  }

  deleteDisco(id: number) {
    return this.prismaService.disco.delete({ where: { id } });
  }

  findAllDiscos() {
    return this.prismaService.disco.findMany();
  }

  findDiscoById(id: number) {
    return this.prismaService.disco.findUnique({ where: { id } });
  }
}
