import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { SharedModule } from 'src/shared/shared.module';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  imports: [SharedModule, PaymentModule],
  providers: [WebhookService],
  controllers: [WebhookController],
})
export class WebhookModule {}
