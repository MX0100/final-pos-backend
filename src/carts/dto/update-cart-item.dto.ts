import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CartItemUpdateDto } from './cart-item-update.dto';

export class UpdateCartItemDto {
  @ApiProperty({
    type: [CartItemUpdateDto],
    description: 'Array of items to add/update. Supports batch processing of multiple items for add, update, or remove operations',
    minItems: 1,
    example: [
      { productId: '123e4567-e89b-12d3-a456-426614174000', quantity: 2 },
      { productId: '987fcdeb-51a4-43b2-9876-543210987654', quantity: 0 },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => CartItemUpdateDto)
  @ArrayMinSize(1)
  items!: CartItemUpdateDto[];
}
