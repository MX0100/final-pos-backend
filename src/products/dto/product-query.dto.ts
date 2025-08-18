import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Filter by product category',
    required: false,
    example: 'Electronics',
  })
  category?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : Number(value)))
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'Page number (starts from 1)',
    minimum: 1,
    default: 1,
    required: false,
    example: 1,
  })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiProperty({
    description: 'Number of items per page (max 100)',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
    example: 10,
  })
  limit?: number = 10;
}
