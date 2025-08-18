import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';
import { ApiResponseDto } from '../../shared/dto/base-response.dto';
import { Product } from '../product.entity';

export class BatchCreateProductsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateProductDto)
  @ApiProperty({
    description: 'Array of products to create (max 50 items)',
    type: [CreateProductDto],
    minItems: 1,
    maxItems: 50,
    example: [
      {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with A17 Pro chip',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...',
        price: 999.99,
        stock: 100,
        category: 'Electronics',
      },
      {
        name: 'MacBook Air M3',
        description: '13-inch laptop with M3 chip',
        image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...',
        price: 1299.99,
        stock: 50,
        category: 'Electronics',
      },
    ],
  })
  products!: CreateProductDto[];
}

/**
 * Batch operation response for product creation
 */
export class BatchCreateProductsResponseDto extends ApiResponseDto<{
  successful: Product[];
  failed: Array<{ input: CreateProductDto; error: { code: string; message: string } }>;
}> {
  @ApiProperty({
    description: 'Batch product creation results',
    type: 'object',
    properties: {
      successful: { type: 'array', description: 'Successfully created products' },
      failed: {
        type: 'array',
        description: 'Failed products with error details',
        items: {
          type: 'object',
          properties: {
            input: { type: 'object', description: 'Original product data' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  declare data: {
    successful: Product[];
    failed: Array<{ input: CreateProductDto; error: { code: string; message: string } }>;
  };

  @ApiProperty({
    description: 'Batch operation summary',
    type: 'object',
    properties: {
      total: { type: 'number', example: 10 },
      successful: { type: 'number', example: 8 },
      failed: { type: 'number', example: 2 },
      successRate: { type: 'number', example: 80 },
      timestamp: { type: 'string', format: 'date-time' },
    },
  })
  declare meta: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    timestamp: string;
    [key: string]: any;
  };
}
