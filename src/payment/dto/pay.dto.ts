import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { CheckMeter } from './check-meter.interface';

export class PayDto extends CheckMeter {
  @ApiProperty({ description: 'Amount', type: 'number' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Email', type: 'string' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Phone', type: 'number' })
  @IsNumber()
  phone: number;

  @ApiProperty({ description: 'Address', type: 'string' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'Name', type: 'string' })
  @IsString()
  name: string;
  receiptNo?: string;
}
