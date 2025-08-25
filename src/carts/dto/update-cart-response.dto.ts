import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiResponseDto } from '../../shared/dto';
import { CartDto } from './cart.dto';

export class CartUpdateDataDto {
  @ApiProperty({ type: () => CartDto, description: 'Cart' })
  cart!: CartDto;

  @ApiProperty({
    description: 'Whether the cart is blocked due to unavailable items',
    example: false,
  })
  blocked!: boolean;

  @ApiPropertyOptional({
    description: 'Reason for blocking if blocked is true',
    enum: ['UNAVAILABLE_ITEMS_PRESENT', 'PARTIAL_QUANTITIES_PRESENT'],
  })
  blockReason?: 'UNAVAILABLE_ITEMS_PRESENT' | 'PARTIAL_QUANTITIES_PRESENT' | null;
}

export class UpdateCartResponseDto extends ApiResponseDto<CartUpdateDataDto> {
  @ApiProperty({
    type: CartUpdateDataDto,
    description: 'Cart update results',
  })
  declare data: CartUpdateDataDto;
}
