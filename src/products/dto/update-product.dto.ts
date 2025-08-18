import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, Validate } from 'class-validator';
import { IsDataUrlUnder1MB } from '../../shared/validators/is-dataurl-under-1mb.validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @ApiProperty({
    description: 'Product name',
    maxLength: 64,
    required: false,
    example: 'Updated Product Name',
  })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @ApiProperty({
    description: 'Product description',
    maxLength: 2048,
    required: false,
    example: 'Updated product description',
  })
  description?: string;

  @IsOptional()
  @IsString()
  @Validate(IsDataUrlUnder1MB)
  @ApiProperty({
    description: 'Base64 data URL (<1MB)',
    required: false,
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...',
  })
  image?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: 'Product price',
    required: false,
    example: 299.99,
  })
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ApiProperty({
    description: 'Stock quantity',
    minimum: 0,
    required: false,
    example: 150,
  })
  stock?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @ApiProperty({
    description: 'Product category',
    maxLength: 64,
    required: false,
    example: 'Electronics',
  })
  category?: string;
}
