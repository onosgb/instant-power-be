import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { WebhookModule } from './webhook/webhook.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [AuthModule, WebhookModule, PaymentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
