import { Injectable, NotFoundException, BadRequestException, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCartResponseDto } from './dto/update-cart-response.dto';

import { DeleteResponseDto } from '../shared/dto/index';
import { CartStatus, CART_EXPIRY_MINUTES } from './enums/cart-status.enum';

import type { IProductService } from './interfaces/product-service.port';
import { CartDto } from './dto/cart.dto';
import { PRODUCT_SERVICE } from './interfaces/product-service.port';

@Injectable()
export class CartsService implements OnModuleInit {
  private readonly logger = new Logger(CartsService.name);
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(PRODUCT_SERVICE)
    private readonly productService: IProductService,
  ) {}

  // Map entity to API DTO to avoid circular serialization and align Swagger examples
  private toCartDto(cart: Cart): CartDto {
    return {
      id: cart.id,
      status: cart.status,
      expiresAt: cart.expiresAt ? cart.expiresAt.toISOString() : null,
      createdAt: cart.createdAt.toISOString(),
      updatedAt: cart.updatedAt.toISOString(),
      items: (cart.items ?? []).map((i) => ({
        id: i.id,
        cartId: i.cartId,
        productId: i.productId,
        quantity: i.quantity,
      })),
    };
  }

  onModuleInit(): void {
    if (process.env.CART_EXPIRY_JOBS === 'disabled') {
      this.logger.log('Cart expiry jobs are disabled by CART_EXPIRY_JOBS=disabled');
    }
  }

  async createCart(): Promise<UpdateCartResponseDto> {
    const cart = this.cartRepository.create({
      status: CartStatus.ACTIVE,
      expiresAt: this.calculateExpiryTime(),
    });
    const savedCart = await this.cartRepository.save(cart);

    const response = new UpdateCartResponseDto();
    response.success = true;
    response.data = {
      cart: this.toCartDto(savedCart),
      blocked: false,
    };
    return response;
  }

  private calculateExpiryTime(): Date {
    const now = new Date();
    return new Date(now.getTime() + CART_EXPIRY_MINUTES * 60 * 1000);
  }

  private async updateCartExpiry(cartId: string): Promise<void> {
    await this.cartRepository.update(cartId, {
      expiresAt: this.calculateExpiryTime(),
    });
  }

  private async checkAndHandleExpiredCart(cart: Cart): Promise<Cart> {
    if (cart.status === CartStatus.ACTIVE && cart.expiresAt && new Date() > cart.expiresAt) {
      cart.status = CartStatus.EXPIRED;

      await this.releaseCartStock(cart.id, 'expire');

      await this.cartRepository.save(cart);
    }

    return cart;
  }

  private async releaseCartStock(cartId: string, reason: 'expire' | 'delete'): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });

    if (!cart || !cart.items || cart.items.length === 0) return;

    const releaseItems = cart.items.map((item) => ({
      productId: item.productId,
      qtyDelta: item.quantity,
      opId: `${reason}-cart-${cartId}-${item.productId}`,
    }));

    // Best-effort release; ignore errors
    try {
      await this.productService.batchAdjustStock(releaseItems, false);
    } catch {}
  }

  async processExpiredCarts(): Promise<{
    processedCarts: number;
    releasedItems: number;
  }> {
    const now = new Date();
    const expiredCarts = await this.cartRepository.find({
      where: {
        status: CartStatus.ACTIVE,
        expiresAt: LessThan(now),
      },
      relations: ['items'],
    });

    let processedCarts = 0;
    let releasedItems = 0;

    for (const cart of expiredCarts) {
      await this.checkAndHandleExpiredCart(cart);
      processedCarts++;
      releasedItems += cart.items?.length || 0;
    }

    return { processedCarts, releasedItems };
  }

  // Run every 5 minutes to check for expired carts when enabled
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledProcessExpiredCarts(): Promise<void> {
    if (process.env.CART_EXPIRY_JOBS === 'disabled') return;
    await this.processExpiredCarts();
  }

  async deleteCart(cartId: string): Promise<DeleteResponseDto> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });
    if (!cart) throw new NotFoundException('Cart not found');

    const itemCount = cart.items.length;

    await this.releaseCartStock(cartId, 'delete');

    await this.cartRepository.delete({ id: cartId });

    const response = new DeleteResponseDto();
    response.success = true;
    response.data = {
      message: `Cart deleted successfully. ${itemCount} items restored to stock.`,
      deletedId: cartId,
    };
    response.meta = {
      timestamp: new Date().toISOString(),
      itemsRestored: itemCount,
      requestId: `delete-cart-${Date.now()}`,
    };

    return response;
  }

  async addItemsToCart(cartId: string, dto: UpdateCartItemDto): Promise<UpdateCartResponseDto> {
    // Add items incrementally (add to existing quantities)
    return this.batchUpdateItems(cartId, dto, 'add');
  }

  async updateCartItems(cartId: string, dto: UpdateCartItemDto): Promise<UpdateCartResponseDto> {
    // Update items by overwriting (set exact quantities)
    return this.batchUpdateItems(cartId, dto, 'overwrite');
  }

  async getCart(cartId: string): Promise<UpdateCartResponseDto> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });
    if (!cart) throw new NotFoundException('Cart not found');

    // Check and handle expiry before returning
    const checkedCart = await this.checkAndHandleExpiredCart(cart);

    const response = new UpdateCartResponseDto();
    response.success = true;
    response.data = {
      cart: this.toCartDto(checkedCart),
      blocked: false,
    };
    return response;
  }

  async updateItemQuantity(cartId: string, productId: string, quantity: number): Promise<UpdateCartResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {
        where: { id: cartId },
        relations: ['items'],
      });
      if (!cart) throw new NotFoundException('Cart not found');

      const item = await manager.findOne(CartItem, {
        where: { cartId, productId },
      });
      if (!item) throw new NotFoundException('Item not found');

      if (quantity === 0) {
        // Remove item completely and restore all stock
        await manager.remove(item);
        const result = await this.productService.adjustStock(productId, item.quantity);
        if (!result.success) {
          // ignore compensate failure
        }
      } else {
        const delta = quantity - item.quantity;

        if (delta !== 0) {
          // Reserve or release first, then persist, compensate on failure
          const stockResult = await this.productService.adjustStock(productId, -delta);
          if (!stockResult.success) {
            throw new BadRequestException(stockResult.error || 'Insufficient stock');
          }

          try {
            item.quantity = quantity;
            await manager.save(item);
          } catch (err) {
            try {
              await this.productService.adjustStock(productId, delta);
            } catch {}
            throw err;
          }
        }
      }

      const updatedCart = await manager.findOneOrFail(Cart, {
        where: { id: cartId },
        relations: ['items'],
      });

      const response = new UpdateCartResponseDto();
      response.success = true;
      response.data = {
        cart: this.toCartDto(updatedCart),
        blocked: false,
      };
      return response;
    });
  }

  async batchUpdateItems(cartId: string, dto: UpdateCartItemDto, mode: 'add' | 'overwrite' = 'add'): Promise<UpdateCartResponseDto> {
    const requestId = `cart-${cartId}-${Date.now()}`;

    // Step 1: Get current cart state
    let cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });
    if (!cart) throw new NotFoundException('Cart not found');

    // Check if cart is expired before allowing updates
    cart = await this.checkAndHandleExpiredCart(cart);

    // Don't allow updates to expired or paid carts
    if (cart.status !== CartStatus.ACTIVE) {
      throw new BadRequestException(`Cannot update cart with status: ${cart.status}`);
    }

    // Step 2: Prepare batch reservation request
    const reservationItems: Array<{ productId: string; qtyDelta: number; opId: string }> = [];
    const errors: Array<{ code: string; message: string; target: string }> = [];

    await this.dataSource.transaction(async (manager) => {
      // Calculate deltas for each item
      for (const itemUpdate of dto.items) {
        const existingItem = await manager.findOne(CartItem, {
          where: { cartId, productId: itemUpdate.productId },
        });

        const currentQty = existingItem?.quantity || 0;
        const requestedQty = itemUpdate.quantity;

        let qtyDelta: number;
        let finalQty: number;

        if (mode === 'add') {
          // Add mode: only add positive quantities
          if (requestedQty <= 0) continue;
          finalQty = currentQty + requestedQty;
          qtyDelta = requestedQty; // Only reserve the new quantity
        } else {
          // Overwrite mode: set to exact quantity (can be 0 to remove)
          finalQty = requestedQty;
          qtyDelta = requestedQty - currentQty; // Reserve the difference (can be negative to release)
        }

        if (qtyDelta !== 0) {
          reservationItems.push({
            productId: itemUpdate.productId,
            qtyDelta: -qtyDelta, // Negative because we're reserving stock (positive qtyDelta means release)
            opId: `${requestId}-${itemUpdate.productId}`,
          });
        }
      }

      // Step 3: Call batch reservation API if there are changes
      let batchResult: any = null;
      if (reservationItems.length > 0) {
        try {
          batchResult = await this.productService.batchAdjustStock(reservationItems, false);
        } catch (error) {
          // Create a failed batch result for all items
          batchResult = {
            success: false,
            results: reservationItems.map((item) => ({
              success: false,
              productId: item.productId,
              newStock: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
            })),
            errors: [error instanceof Error ? error.message : 'Unknown error'],
          };
        }
      }

      // Step 4: Process results and update cart items
      for (const itemUpdate of dto.items) {
        const existingItem = await manager.findOne(CartItem, {
          where: { cartId, productId: itemUpdate.productId },
        });

        const currentQty = existingItem?.quantity || 0;
        const requestedQty = itemUpdate.quantity;

        // Skip items with invalid quantities in ADD mode
        if (mode === 'add' && requestedQty <= 0) {
          continue;
        }

        let finalQty: number;
        if (mode === 'add') {
          finalQty = currentQty + requestedQty;
        } else {
          finalQty = requestedQty;
        }

        const reservationResult = batchResult?.results.find((r) => r.productId === itemUpdate.productId);

        if (mode === 'overwrite' && itemUpdate.quantity === 0) {
          // Remove item
          if (existingItem) {
            await manager.remove(existingItem);
          }
        } else if (reservationResult) {
          // Process reservation result
          if (reservationResult.success) {
            // Update or create cart item
            if (existingItem) {
              existingItem.quantity = finalQty;
              await manager.save(existingItem);
            } else {
              const newItem = manager.create(CartItem, {
                cartId,
                productId: itemUpdate.productId,
                quantity: finalQty,
              });
              await manager.save(newItem);
            }
          } else {
            // Reservation failed
            errors.push({
              code: 'INSUFFICIENT_STOCK',
              message: reservationResult.error || 'Reservation failed',
              target: `items[${itemUpdate.productId}]`,
            });
          }
        }
      }
    });

    // Step 5: Get updated cart state
    let updatedCart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });

    // Step 6: Determine success status and blocking state
    const totalItems = dto.items.length;
    const errorCount = errors.length;
    const successCount = totalItems - errorCount;

    let success: boolean | 'partial';
    if (errorCount === 0) {
      success = true;
    } else if (successCount === 0) {
      success = false;
    } else {
      success = 'partial';
    }

    const blocked = errorCount > 0;
    let blockReason: 'UNAVAILABLE_ITEMS_PRESENT' | 'PARTIAL_QUANTITIES_PRESENT' | undefined;
    if (blocked) {
      blockReason = 'UNAVAILABLE_ITEMS_PRESENT';
    }

    // If any items were successfully updated, extend cart expiry time
    if (successCount > 0) {
      await this.updateCartExpiry(cartId);
      updatedCart = await this.cartRepository.findOne({
        where: { id: cartId },
        relations: ['items'],
      });
    }

    return {
      success,
      data: {
        blocked,
        blockReason,
        cart: this.toCartDto(updatedCart!),
      },
      errors,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        successCount,
        errorCount,
        totalItems,
      },
    };
  }
}
