import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartsService } from './carts.service';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCartResponseDto } from './dto/update-cart-response.dto';
import { Cart } from './entities/cart.entity';

@ApiTags('carts')
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new cart' })
  createCart(): Promise<Cart> {
    return this.cartsService.createCart();
  }

  @Get(':cartId')
  @ApiOperation({ summary: 'Get cart with items' })
  getCart(@Param('cartId') cartId: string): Promise<Cart> {
    return this.cartsService.getCart(cartId);
  }

  @Delete(':cartId')
  @ApiOperation({ summary: 'Delete cart' })
  deleteCart(@Param('cartId') cartId: string): Promise<void> {
    return this.cartsService.deleteCart(cartId);
  }

  @Post(':cartId/items')
  @ApiOperation({
    summary: 'Add/update cart items (ACID compliant batch operation)',
  })
  addOrUpdateItems(
    @Param('cartId') cartId: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<UpdateCartResponseDto> {
    return this.cartsService.batchUpdateItems(cartId, dto);
  }

  @Delete(':cartId/items/:productId')
  @ApiOperation({ summary: 'Remove item from cart' })
  removeItem(
    @Param('cartId') cartId: string,
    @Param('productId') productId: string,
  ): Promise<Cart> {
    // Reuse updateSingleItem with quantity=0
    return this.cartsService.updateSingleItem(cartId, productId, 0);
  }

  @Patch(':cartId/items/:productId')
  @ApiOperation({
    summary: 'Update single item quantity - 更新单个商品数量',
    description:
      '用于更新购物车中单个商品的数量。支持增加或减少数量，设为0删除商品。适合用户在购物车页面调整数量的场景。',
  })
  updateItemQuantity(
    @Param('cartId') cartId: string,
    @Param('productId') productId: string,
    @Body() dto: { quantity: number },
  ): Promise<Cart> {
    return this.cartsService.updateSingleItem(cartId, productId, dto.quantity);
  }

  // Internal API for products module to clean up cart references
  @Delete('internal/products/:productId/cleanup')
  @ApiOperation({
    summary: 'Internal: Remove all cart items for deleted product',
  })
  cleanupProductReferences(
    @Param('productId') productId: string,
  ): Promise<void> {
    return this.cartsService.cleanupProductReferences(productId);
  }
}
