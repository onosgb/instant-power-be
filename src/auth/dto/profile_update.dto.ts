import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class ProfileUpdateDto {
  @ApiProperty({
    description: 'Full Name',
    example: 'Godbless Onoriode',
    type: 'string',
  })
  @IsString()
  name: string;
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
    type: 'string',
  })
  @IsOptional()
  @IsEmail()
  email: string;
  @ApiProperty({ description: 'User Status', example: 'USER', type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;
  @ApiProperty({
    description: 'Phone Number',
    example: '80800344',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  phone: string;
  @ApiProperty({ description: 'Country', example: 'Nigeria', type: 'string' })
  @IsString()
  country: string;
  @ApiProperty({ description: 'Country Code', example: '+234', type: 'string' })
  @IsString()
  countryCode: string;
}
