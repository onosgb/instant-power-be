import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'User password', example: 'Password123' })
  @IsStrongPassword()
  oldPassword: string;

  @ApiProperty({ description: 'User password', example: 'Password123' })
  @IsStrongPassword()
  password: string;
}
