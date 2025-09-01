import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JsonString } from '../utils/utils';

export class FetchQueryDto {
  id: number;
  @ApiPropertyOptional({
    type: Object,
    description: 'Relationships to include (e.g., { user: true, items: true })',
  })
  @IsOptional()
  @IsString()
  include?: Record<string, any>;

  @ApiPropertyOptional({
    type: Object,
    description:
      'Select Fields (e.g., { id: true, createdAt: true, updatedAt: true, title: true})',
  })
  @IsOptional()
  @IsString()
  select?: Record<string, any>;
  constructor(query: any) {
    this.include = query?.include ? JsonString(query.include) : undefined;
    this.select = query?.select ? JsonString(query?.select) : undefined;
    if (query?.id) {
      this.id = +query.id;
    }
  }
  buildPrismaQuery() {
    const prismaQuery: any = {
      where: { id: this.id },
    };

    if (this.include) {
      prismaQuery.include = this.include;
    }

    if (this.select) {
      prismaQuery.select = this.select;
    }

    return prismaQuery;
  }
}
