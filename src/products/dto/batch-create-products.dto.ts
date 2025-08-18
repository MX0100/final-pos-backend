import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';

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
