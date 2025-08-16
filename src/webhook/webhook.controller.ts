import {
  Body,
  Controller,
  Post,
  Headers,
  Res,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import * as crypto from 'crypto';
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('paystack')
  async handlePaystackWebhook(
    @Body() event: any,
    @Headers('X-Paystack-Signature') signature: string,
    @Req() req: Request,
  ) {
    const rawBody = req['rawBody'];
    if (!signature || !rawBody) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Missing signature or body',
      };
    }

    try {
      const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SK!)
        .update(rawBody)
        .digest('hex');
      if (hash == signature) {
        return this.webhookService.handleWebhook(event);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
    }
  }
}
