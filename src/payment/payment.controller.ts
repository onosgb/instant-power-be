import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CheckMeter } from './dto/check-meter.interface';
import { ApiResponse } from '@nestjs/swagger';
import { PayDto } from './dto/pay.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiResponse({ status: 200, description: 'Meter validation successful.' })
  @ApiResponse({ status: 400, description: 'Meter validation failed.' })
  @Post('validate-meter')
  async validateMeterName(@Body() checkMeter: CheckMeter) {
    return this.paymentService.validateMeterName(checkMeter);
  }

  @ApiResponse({
    status: 201,
    description: 'Payment initialized successfully.',
  })
  @ApiResponse({ status: 400, description: 'Payment initialization failed.' })
  @Post('init-payment')
  async initPayment(@Body() pay: PayDto) {
    return this.paymentService.initPayment(pay);
  }
}
