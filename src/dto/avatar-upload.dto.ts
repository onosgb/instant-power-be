import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

export class AvatarUploadDto {
  @ApiProperty({
    description: "FileKey (Optional) it's used to delete previous file",
    example:
      'https://optimaconnect.s3.us-east-2.amazonaws.com/uploads/da811186-54ec-4e75-8b79-c59dd55ba310-Gb.jpg',
  })
  @IsOptional()
  @IsUrl()
  fileKey: String;
}
