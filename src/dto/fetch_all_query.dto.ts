import { IsNumber, IsOptional, IsIn, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { JsonString } from '../utils/utils';

export class FetchAllQueryDto {
  @ApiPropertyOptional({
    default: 1,
    description: 'Page number for pagination',
    type: 'number',
  })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  page: number;

  @ApiPropertyOptional({
    default: 10,
    description: 'Number of items per page',
    type: 'number',
  })
  @IsNumber()
  pageSize: number;

  @ApiPropertyOptional({
    description: 'Field to sort by (e.g., createdAt)',
    type: 'string',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    description: 'Sort order (asc or desc)',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    type: Object,
    description: 'Filters for querying (e.g., { status: "ACTIVE" })',
  })
  @IsOptional()
  @IsString()
  filters?: Record<string, any>;

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

  @ApiPropertyOptional({
    type: Object,
    description:
      'Select Fields (e.g., { id: true, createdAt: true, updatedAt: true, title: true})',
  })
  @IsOptional()
  @IsString()
  search?: string;
  @ApiPropertyOptional({
    type: Object,
    description: 'Search Fields (e.g., name,email,)',
  })
  @IsOptional()
  @IsString()
  searchFields?: string;

  constructor(query: any) {
    this.page = query?.page ? Number(query.page) : 1;
    this.pageSize = query?.pageSize ? Number(query.pageSize) : 10;
    this.sortBy = query?.sortBy;
    this.sortOrder = query?.sortOrder;
    this.search = query?.search ?? '';
    this.searchFields = query?.searchFields ?? '';

    try {
      this.include = query?.include ? JsonString(query.include) : undefined;
      this.filters = query?.filters ? JsonString(query?.filters) : undefined;
      this.select = query?.select ? JsonString(query?.select) : undefined;
    } catch (error) {
      throw new Error(
        'Invalid JSON format in filters, include, or select fields.',
      );
    }
  }

  buildPrismaQuery() {
    const offset = (this.page - 1) * this.pageSize;

    const prismaQuery: any = {
      skip: offset,
      take: this.pageSize,
    };

    if (this.sortBy && this.sortOrder) {
      prismaQuery.orderBy = {
        [this.sortBy]: this.sortOrder,
      };
    }

    if (this.filters) {
      prismaQuery.where = this.filters;
    }

    if (this.include) {
      prismaQuery.include = this.include;
    }

    if (this.select) {
      prismaQuery.select = this.select;
    }

    if (this.search && this.searchFields) {
      const fields = this.searchFields.split(',').map((f) => f.trim());

      const orConditions = fields.map((field) => ({
        [field]: {
          contains: this.search,
          mode: 'insensitive',
        },
      }));
      prismaQuery.where = {
        ...(prismaQuery.where || {}),
        OR: orConditions,
      };
    }

    return prismaQuery;
  }
}
