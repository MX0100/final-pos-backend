import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  Max,
  Min,
  IsUUID,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemUpdateDto {
  @ApiProperty({ 
    description: 'Product ID - 商品ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  productId!: string;

  @ApiProperty({ 
    minimum: 0,
    description: 'Quantity to set - 要设置的数量。设为0删除商品，大于0添加或更新数量',
    example: 2
  })
  @IsInt()
  @Min(0)
  @Max(2147483647)
  quantity!: number;
}

export class UpdateCartItemDto {
  @ApiProperty({
    type: [CartItemUpdateDto],
    description: 'Array of items to add/update - 要添加或更新的商品列表。支持一次性处理多个商品的添加、更新或删除操作',
    minItems: 1,
    example: [
      { productId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2 },
      { productId: '987fcdeb-51a4-43b2-9876-543210987654', quantity: 0 }
    ]
  })
  @ValidateNested({ each: true })
  @Type(() => CartItemUpdateDto)
  @ArrayMinSize(1)
  items!: CartItemUpdateDto[];
}
