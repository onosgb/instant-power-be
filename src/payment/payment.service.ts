import { HttpService } from '@nestjs/axios';
import { Paystack } from 'paystack-sdk';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma.service';
import { CheckMeter } from './dto/check-meter.interface';
import { Transaction } from 'prisma';
import { PayDto } from './dto/pay.dto';

@Injectable()
export class PaymentService {
  paystack = new Paystack(process.env.PAYSTACK_SK!);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async validateMeterName(checkMeter: CheckMeter) {
    try {
      const { meter, disco, vendType, vertical, orderId } = checkMeter;
      const response = await this.httpService.axiosRef.get(
        `${process.env.BUYPOWER_URL}check/meter?meter=${meter}&disco=${disco}&vendType=${vendType}&vertical=${vertical}&orderId=${orderId ?? false}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.BUYPOWER_TOKEN}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException(error.response.data.message);
    }
  }

  async createPayment(payment: Transaction) {
    try {
      return await this.prisma.transaction.create({ data: payment });
    } catch (error) {
      throw new BadRequestException(error.response.data.message);
    }
  }

  async initPayment(pay: PayDto) {
    try {
      const session = await this.paystack.transaction.initialize({
        email: pay.email,
        amount: pay.amount.toString(),
        currency: 'NGN',
        metadata: {
          orderId: pay.orderId,
          disco: pay.disco,
          meter: pay.meter,
          vendType: pay.vendType,
          vertical: pay.vertical,
          phone: pay.phone,
          amount: pay.amount,
          email: pay.email,
          name: pay.name,
        },
        callback_url: process.env.PAYSTACK_CALLBACK_URL,
      });
      return session.data;
    } catch (error) {
      throw new BadRequestException(error.response.data.message);
    }
  }
}
