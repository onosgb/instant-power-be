import { Module } from '@nestjs/common';
import { DiscosService } from './discos.service';
import { DiscosController } from './discos.controller';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [DiscosService],
  controllers: [DiscosController],
})
export class DiscosModule {}
