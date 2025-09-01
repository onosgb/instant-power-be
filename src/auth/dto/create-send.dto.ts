// query.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class CallbackQueryDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  email?: string; // Note: IsNumberString for query params

  @IsOptional()
  @IsString()
  realmId?: string;
}
