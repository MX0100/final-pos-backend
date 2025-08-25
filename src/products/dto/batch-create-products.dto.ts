import { ApiProperty, ApiExtraModels } from '@nestjs/swagger';
import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';
import { ApiResponseDto } from '../../shared/dto/base-response.dto';
import { ProductDto } from './Product.dto';

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

export class BatchErrorDto {
  @ApiProperty() code!: string;
  @ApiProperty() message!: string;
}

export class FailedItemDto {
  @ApiProperty({ type: () => CreateProductDto })
  input!: CreateProductDto;

  @ApiProperty({ type: () => BatchErrorDto })
  error!: BatchErrorDto;
}

export class BatchDataDto {
  @ApiProperty({ type: () => [ProductDto], description: 'Successfully created products' })
  successful!: ProductDto[];

  @ApiProperty({ type: () => [FailedItemDto], description: 'Failed items with error details' })
  failed!: FailedItemDto[];
}

export class BatchSummaryDto {
  @ApiProperty() total!: number;
  @ApiProperty() successful!: number;
  @ApiProperty() failed!: number;
  @ApiProperty() successRate!: number;
}

@ApiExtraModels(ProductDto, CreateProductDto, BatchErrorDto, FailedItemDto, BatchDataDto, BatchSummaryDto)
export class BatchCreateProductsResponseDto extends ApiResponseDto<BatchDataDto> {
  @ApiProperty({ type: () => BatchDataDto })
  declare data: BatchDataDto;

  @ApiProperty({ type: () => BatchSummaryDto })
  declare meta: BatchSummaryDto;
}
