import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as uuid from 'uuid';
import { Paystack } from 'paystack-sdk';
import { PaymentStatus, Prisma } from 'prisma';
import { PayDto } from 'src/payment/dto/pay.dto';
import { PrismaService } from 'src/shared/services/prisma.service';
import { PaymentService } from 'src/payment/payment.service';

@Injectable()
export class WebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private http: HttpService,
    private readonly paymentService: PaymentService,
  ) {}
  paystack = new Paystack(process.env.PAYSTACK_SK!);

  async handleWebhook(event: any) {
    // Handle the webhook event from Paystack
    const { event: eventType } = event;

    switch (eventType) {
      case 'charge.success':
        await this.vendRequest(event.data.metadata);
        // Handle successful charge
        break;
      case 'charge.failed':
        console.log('Charge failed:', event.data.metadata);
        // Handle failed charge
        break;
      default:
        break;
    }
  }

  private async vendRequest(pay: PayDto) {
    try {
      const meter = await this.paymentService.validateMeterName({
        meter: pay.meter,
        disco: pay.disco,
        vendType: pay.vendType,
        vertical: pay.vertical,
        orderId: pay.orderId,
      });
      const data = {
        orderId: uuid.v4(),
        meter: pay.meter,
        disco: pay.disco,
        phone: pay.phone,
        paymentType: 'ONLINE',
        vendType: pay.vendType,
        amount: pay.amount,
        email: pay.email,
        name: pay.name,
        receiptNo: pay.receiptNo,
      };
      const vendRequest = await this.http.axiosRef.post(
        `${process.env.BUYPOWER_URL}/vend`,
        data,
        {
          headers: {
            Authorization: `Bearer ${process.env.BUYPOWER_TOKEN}`,
          },
        },
      );

      const paymentData = vendRequest.data.data;
      const create: Prisma.TransactionCreateInput = {
        email: data.email,
        name: data.name,
        meterName: meter?.name ?? '',
        ref: paymentData.vendRef.toString(),
        amount: +data.amount,
        tax: paymentData.tax,
        disco: data.disco,
        dept: paymentData.token,
        token: paymentData.token,
        status: PaymentStatus.Success,
        method: 'Online',
        receipt: paymentData.receiptNo,
      };
      const res = await this.prisma.transaction.create({
        data: create,
      });

      return { msg: 'Vend request created successfully', data: res };
    } catch (error) {
      console.error('Error creating vend request:', error);
      throw new BadRequestException('Failed to create vend request');
    }
  }
}
