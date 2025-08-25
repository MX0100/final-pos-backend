import { Controller, Get, Post, Put, Delete, Param, Body, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CartsService } from './carts.service';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCartResponseDto } from './dto/update-cart-response.dto';
import { DeleteResponseDto } from '../shared/dto/index';
import { UpdateQuantityDto } from './dto/update-quantity.dto';

@ApiTags('carts')
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new cart',
    description: 'Create a new shopping cart with default expiry time',
  })
  @ApiResponse({
    status: 201,
    description: 'Cart created successfully',
    type: UpdateCartResponseDto,
  })
  createCart(): Promise<UpdateCartResponseDto> {
    return this.cartsService.createCart();
  }

  @Post(':cartId/items')
  @ApiOperation({
    summary: 'Add items to cart (incremental)',
    description: 'Add items to cart. If item already exists, quantity will be added to existing quantity.',
  })
  @ApiResponse({
    status: 200,
    description: 'Items added to cart successfully',
    type: UpdateCartResponseDto,
  })
  addItemsToCart(@Param('cartId') cartId: string, @Body() dto: UpdateCartItemDto): Promise<UpdateCartResponseDto> {
    return this.cartsService.addItemsToCart(cartId, dto);
  }

  @Put(':cartId/items')
  @ApiOperation({
    summary: 'Update cart items (overwrite)',
    description: 'Set cart items to exact quantities. This will overwrite existing cart contents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart items updated successfully',
    type: UpdateCartResponseDto,
  })
  updateCartItems(@Param('cartId') cartId: string, @Body() dto: UpdateCartItemDto): Promise<UpdateCartResponseDto> {
    return this.cartsService.updateCartItems(cartId, dto);
  }

  @Get(':cartId')
  @ApiOperation({
    summary: 'Get cart by ID',
    description: 'Get cart details including items and status',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
    type: UpdateCartResponseDto,
  })
  getCart(@Param('cartId') cartId: string): Promise<UpdateCartResponseDto> {
    return this.cartsService.getCart(cartId);
  }

  @Patch(':cartId/items/:productId')
  @ApiOperation({
    summary: 'Update item quantity',
    description: 'Update quantity of a specific item in cart',
  })
  @ApiResponse({
    status: 200,
    description: 'Item quantity updated successfully',
    type: UpdateCartResponseDto,
  })
  updateItemQuantity(@Param('cartId') cartId: string, @Param('productId') productId: string, @Body() dto: UpdateQuantityDto): Promise<UpdateCartResponseDto> {
    return this.cartsService.updateItemQuantity(cartId, productId, dto.quantity);
  }

  @Delete(':cartId')
  @ApiOperation({
    summary: 'Delete cart',
    description: 'Delete cart and release all reserved stock',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart deleted successfully',
    type: DeleteResponseDto,
  })
  deleteCart(@Param('cartId') cartId: string): Promise<DeleteResponseDto> {
    return this.cartsService.deleteCart(cartId);
  }
}
