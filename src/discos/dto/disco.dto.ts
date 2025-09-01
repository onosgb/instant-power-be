import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DiscoDTO {
  @ApiProperty({ description: 'Name', type: 'string' })
  name: string;
  @ApiProperty({ description: 'Slug', type: 'string' })
  @IsString()
  slug: string;
  @ApiProperty({ description: 'Description', type: 'string' })
  @IsOptional()
  description: string;
  @ApiProperty({ description: 'Image URL', type: 'string' })
  @IsOptional()
  imageUrl: string;
}
