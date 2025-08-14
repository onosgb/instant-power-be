import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AccountVerificationDto {
  @ApiProperty({ description: 'OTP Code', example: '0000' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'User id', example: 'password123' })
  @IsString()
  userId: string;
}
