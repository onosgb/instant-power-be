import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JsonString } from '../utils/utils';

export class FetchOptionDto {
  @ApiPropertyOptional({ description: 'ID of the transaction' })
  @IsOptional()
  @IsString()
  id?: number;

  @ApiPropertyOptional({
    type: Object,
    description:
      'Filters for querying transactions (e.g., { status: "completed" })',
  })
  @IsOptional()
  @IsString()
  where?: Record<string, any>;

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
    this.where = query?.where ? JsonString(query?.where) : undefined;
    this.select = query?.select ? JsonString(query?.select) : undefined;
    if (query?.id) {
      this.id = query.id;
    }
  }
  buildPrismaQuery() {
    const prismaQuery: any = {};

    if (this.id) {
      prismaQuery.where = { id: this.id };
    }

    if (this.where) {
      prismaQuery.where = this.where;
    }

    if (this.include) {
      prismaQuery.include = this.include;
    }

    if (this.select) {
      prismaQuery.select = this.select;
    }

    return prismaQuery;
  }
}
