import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min, IsUUID } from 'class-validator';

export class CartItemUpdateDto {
  @ApiProperty({
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  productId!: string;

  @ApiProperty({
    description: 'Quantity to set. Set to 0 to remove item, greater than 0 to add or update quantity',
    example: 2,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @Max(2147483647)
  quantity!: number;
}
