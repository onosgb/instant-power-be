import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CheckMeter {
  @ApiProperty({ description: 'Meter No', type: 'number' })
  meter: number;
  @ApiProperty({ description: 'Disco', type: 'string' })
  @IsString()
  disco: string;
  @ApiProperty({ description: 'Vend Type', type: 'string' })
  @IsString()
  vendType: string;
  @ApiProperty({ description: 'Vertical', type: 'string' })
  @IsString()
  vertical: string;
  @ApiProperty({ description: 'Order Id', type: 'boolean', required: false })
  @Optional()
  orderId: boolean;
}
