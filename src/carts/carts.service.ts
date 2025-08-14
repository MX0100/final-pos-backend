import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  UpdateCartItemDto,
  CartItemUpdateDto,
} from './dto/update-cart-item.dto';
import {
  UpdateCartResponseDto,
  CartUpdateErrorDto,
} from './dto/update-cart-response.dto';
import { AxiosError } from 'axios';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly dataSource: DataSource,
    private readonly http: HttpService,
  ) {}

  private get productsBaseUrl(): string {
    return process.env.PRODUCTS_API_BASE || 'http://localhost:3000';
  }

  async createCart(): Promise<Cart> {
    const cart = this.cartRepository.create();
    return this.cartRepository.save(cart);
  }

  async deleteCart(cartId: string): Promise<void> {
    // restore all items' stocks then delete cart
    await this.dataSource.transaction(async (manager) => {
      const items = await manager.find(CartItem, { where: { cartId } });
      for (const item of items) {
        await firstValueFrom(
          this.http.post(
            `${this.productsBaseUrl}/products/${item.productId}/adjust-stock/${item.quantity}`,
          ),
        );
      }
      await manager.delete(Cart, { id: cartId });
    });
  }

  async getCart(cartId: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });
    if (!cart) throw new NotFoundException('Cart not found');
    return cart;
  }

  async updateSingleItem(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart> {
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
        await firstValueFrom(
          this.http.post(
            `${this.productsBaseUrl}/products/${productId}/adjust-stock/${item.quantity}`,
          ),
        );
      } else {
        const delta = quantity - item.quantity;

        if (delta !== 0) {
          // Reserve or release first, then persist, compensate on failure
          try {
            await firstValueFrom(
              this.http.post(
                `${this.productsBaseUrl}/products/${productId}/adjust-stock/${-delta}`,
              ),
            );
          } catch (error) {
            if (error instanceof AxiosError && error.response?.status === 400) {
              const errorMessage =
                (error.response.data as { message?: string })?.message ||
                'Insufficient stock';
              throw new BadRequestException(errorMessage);
            }
            throw error;
          }

          try {
            item.quantity = quantity;
            await manager.save(item);
          } catch (err) {
            // Compensate: reverse stock adjustment
            try {
              await firstValueFrom(
                this.http.post(
                  `${this.productsBaseUrl}/products/${productId}/adjust-stock/${delta}`,
                ),
              );
            } catch (compensationError) {
              console.error(
                'Failed to compensate stock adjustment:',
                compensationError,
              );
            }
            throw err;
          }
        }
      }

      return manager.findOneOrFail(Cart, {
        where: { id: cartId },
        relations: ['items'],
      });
    });
  }

  async batchUpdateItems(
    cartId: string,
    dto: UpdateCartItemDto,
  ): Promise<UpdateCartResponseDto> {
    // SQL Transaction mode: All or nothing approach
    try {
      // Step 1: Prepare reservation items for batch API
      const reservationItems = dto.items.map((item) => ({
        productId: item.productId,
        qtyDelta: -item.quantity, // Negative = reserve stock
        opId: `cart-${cartId}-${Date.now()}`,
      }));

      // Step 2: Call batch reservation with allOrNothing=true
      const reservationResponse = await firstValueFrom(
        this.http.post<{
          results: Array<{
            productId: string;
            productName: string;
            status: string;
            availableStock: number;
            error?: string;
          }>;
        }>(`${this.productsBaseUrl}/products/reservations:batch`, {
          items: reservationItems,
          allOrNothing: true,
        }),
      );

      // Step 3: If reservation succeeded, update cart in transaction
      return await this.dataSource.transaction(async (manager) => {
        const cart = await manager.findOne(Cart, {
          where: { id: cartId },
          relations: ['items'],
        });
        if (!cart) throw new NotFoundException('Cart not found');

        // Apply all cart updates
        for (const itemUpdate of dto.items) {
          const existingItem = await manager.findOne(CartItem, {
            where: { cartId, productId: itemUpdate.productId },
          });

          if (itemUpdate.quantity === 0) {
            if (existingItem) {
              await manager.remove(existingItem);
            }
          } else {
            if (existingItem) {
              existingItem.quantity = itemUpdate.quantity;
              await manager.save(existingItem);
            } else {
              const newItem = this.cartItemRepository.create({
                cartId,
                productId: itemUpdate.productId,
                quantity: itemUpdate.quantity,
              });
              await manager.save(newItem);
            }
          }
        }

        const updatedCart = await manager.findOne(Cart, {
          where: { id: cartId },
          relations: ['items'],
        });

        return {
          cart: updatedCart!,
          errors: [],
          successCount: dto.items.length,
          errorCount: 0,
        };
      });
    } catch (error) {
      // All operations failed - return unchanged cart with errors
      const cart = await this.cartRepository.findOne({
        where: { id: cartId },
        relations: ['items'],
      });

      let errorDetails: CartUpdateErrorDto[] = [];

      if (error instanceof AxiosError && error.response?.data?.results) {
        // Parse detailed errors from batch reservation API
        errorDetails = error.response.data.results.map((r: any) => ({
          productId: r.productId,
          productName: r.productName || 'Unknown Product',
          requestedQuantity:
            dto.items.find((item) => item.productId === r.productId)
              ?.quantity || 0,
          availableStock: r.availableStock || 0,
          error: r.error || `Operation failed: ${r.status}`,
        }));
      } else {
        // Generic error for all items
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update cart';
        errorDetails = dto.items.map((item) => ({
          productId: item.productId,
          productName: 'Product',
          requestedQuantity: item.quantity,
          availableStock: 0,
          error: errorMessage,
        }));
      }

      return {
        cart: cart!,
        errors: errorDetails,
        successCount: 0,
        errorCount: errorDetails.length,
      };
    }
  }

  async cleanupProductReferences(productId: string): Promise<void> {
    // Find all cart items with this product and remove them
    // No need to adjust stock since the product is being deleted
    await this.dataSource.transaction(async (manager) => {
      const items = await manager.find(CartItem, { where: { productId } });
      if (items.length > 0) {
        await manager.remove(items);
        console.log(
          `Cleaned up ${items.length} cart items for deleted product ${productId}`,
        );
      }
    });
  }
}
