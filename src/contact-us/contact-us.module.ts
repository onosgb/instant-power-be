import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { ContactUsController } from './contact-us.controller';
import { ContactUsService } from './contact-us.service';

@Module({
  imports: [SharedModule],
  providers: [ContactUsService],
  controllers: [ContactUsController],
})
export class ContactUsModule {}
