import { Injectable } from '@nestjs/common';
import { Paystack } from 'paystack-sdk';

@Injectable()
export class WebhookService {
  constructor() {}
  paystack = new Paystack(process.env.PAYSTACK_SK!);
}
