import { ApiProperty } from '@nestjs/swagger';
import { Cart } from '../entities/cart.entity';

export class CartUpdateErrorDto {
  @ApiProperty({ description: 'Product ID that failed' })
  productId!: string;

  @ApiProperty({ description: 'Product name that failed' })
  productName!: string;

  @ApiProperty({ description: 'Requested quantity' })
  requestedQuantity!: number;

  @ApiProperty({ description: 'Available stock' })
  availableStock!: number;

  @ApiProperty({ description: 'Error message' })
  error!: string;
}

export class UpdateCartResponseDto {
  @ApiProperty({
    type: () => Cart,
    description: 'Updated cart with successfully processed items',
  })
  cart!: Cart;

  @ApiProperty({
    type: [CartUpdateErrorDto],
    description: 'Items that failed to update due to insufficient stock',
  })
  errors!: CartUpdateErrorDto[];

  @ApiProperty({ description: 'Number of items successfully updated' })
  successCount!: number;

  @ApiProperty({ description: 'Number of items that failed' })
  errorCount!: number;
}
