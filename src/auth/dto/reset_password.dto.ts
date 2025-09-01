import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User code', example: '123456' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'User password', example: 'Password123' })
  @IsStrongPassword()
  password: string;
}
