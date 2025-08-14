import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, DataSource } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  BatchReservationRequestDto,
  BatchReservationResponseDto,
  ReservationResultDto,
} from './dto/batch-reservation.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly http: HttpService,
    private readonly dataSource: DataSource,
  ) {}

  private get cartsBaseUrl(): string {
    return process.env.CARTS_API_BASE || 'http://localhost:3000';
  }

  async create(input: CreateProductDto): Promise<Product> {
    // Persist numeric price as string to align with PostgreSQL numeric mapping
    const partial: DeepPartial<Product> = {
      name: input.name,
      description: input.description,
      image: input.image,
      price: String(input.price),
      stock: input.stock,
    };
    const entity = this.productRepository.create(partial);
    return this.productRepository.save(entity);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async findOne(id: string): Promise<Product> {
    const entity = await this.productRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Product not found');
    return entity;
  }

  async update(id: string, input: UpdateProductDto): Promise<Product> {
    const existing = await this.findOne(id);
    if (input.name !== undefined) existing.name = input.name;
    if (input.description !== undefined)
      existing.description = input.description;
    if (input.image !== undefined) existing.image = input.image;
    if (input.price !== undefined) existing.price = String(input.price);
    if (input.stock !== undefined) existing.stock = input.stock;
    return this.productRepository.save(existing);
  }

  async remove(id: string): Promise<void> {
    // 1. First check if product exists
    await this.findOne(id);

    // 2. Clean up all cart references to this product
    try {
      await firstValueFrom(
        this.http.delete(
          `${this.cartsBaseUrl}/internal/products/${id}/cleanup`,
        ),
      );
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        // Carts service doesn't have this cleanup endpoint or no cart items found
        // Continue with deletion
      } else {
        // Other errors should be logged but not block deletion
        console.warn(
          `Failed to cleanup cart references for product ${id}:`,
          error,
        );
      }
    }

    // 3. Delete the product
    await this.productRepository.delete({ id });
  }

  async adjustStock(id: string, delta: number): Promise<Product> {
    if (!Number.isInteger(delta)) {
      throw new BadRequestException('Delta must be an integer');
    }
    const product = await this.findOne(id);
    const nextStock = product.stock + delta;
    if (nextStock < 0) {
      throw new BadRequestException('Insufficient stock');
    }
    product.stock = nextStock;
    return this.productRepository.save(product);
  }

  async batchReservation(
    dto: BatchReservationRequestDto,
  ): Promise<BatchReservationResponseDto> {
    const results: ReservationResultDto[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Sort by productId to avoid deadlocks
    const sortedItems = [...dto.items].sort((a, b) =>
      a.productId.localeCompare(b.productId),
    );

    if (dto.allOrNothing) {
      // All-or-nothing mode: check first, then apply
      return this.dataSource.transaction(async (manager) => {
        // First pass: check all items
        for (const item of sortedItems) {
          const product = await manager.findOne(Product, {
            where: { id: item.productId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!product) {
            results.push({
              productId: item.productId,
              productName: 'Unknown Product',
              qtyDelta: item.qtyDelta,
              opId: item.opId,
              status: 'not_found',
              availableStock: 0,
              error: 'Product not found',
            });
            errorCount++;
            continue;
          }

          const newStock = product.stock + item.qtyDelta;
          if (newStock < 0) {
            results.push({
              productId: item.productId,
              productName: product.name,
              qtyDelta: item.qtyDelta,
              opId: item.opId,
              status: 'insufficient_stock',
              availableStock: product.stock,
              error: `Insufficient stock. Available: ${product.stock}, Delta: ${item.qtyDelta}`,
            });
            errorCount++;
          } else {
            results.push({
              productId: item.productId,
              productName: product.name,
              qtyDelta: item.qtyDelta,
              opId: item.opId,
              status: 'success',
              availableStock: newStock,
            });
            successCount++;
          }
        }

        // If any failed, abort
        if (errorCount > 0) {
          throw new BadRequestException(
            'Some items failed validation in all-or-nothing mode',
          );
        }

        // Second pass: apply all changes
        for (let i = 0; i < sortedItems.length; i++) {
          const item = sortedItems[i];
          const product = await manager.findOne(Product, {
            where: { id: item.productId },
          });
          if (product) {
            product.stock += item.qtyDelta;
            await manager.save(product);
            results[i].availableStock = product.stock;
          }
        }

        return { results, successCount, errorCount };
      });
    } else {
      // Partial success mode: process each item independently
      return this.dataSource.transaction(async (manager) => {
        for (const item of sortedItems) {
          try {
            const product = await manager.findOne(Product, {
              where: { id: item.productId },
              lock: { mode: 'pessimistic_write' },
            });

            if (!product) {
              results.push({
                productId: item.productId,
                productName: 'Unknown Product',
                qtyDelta: item.qtyDelta,
                opId: item.opId,
                status: 'not_found',
                availableStock: 0,
                error: 'Product not found',
              });
              errorCount++;
              continue;
            }

            const newStock = product.stock + item.qtyDelta;
            if (newStock < 0) {
              results.push({
                productId: item.productId,
                productName: product.name,
                qtyDelta: item.qtyDelta,
                opId: item.opId,
                status: 'insufficient_stock',
                availableStock: product.stock,
                error: `Insufficient stock. Available: ${product.stock}, Delta: ${item.qtyDelta}`,
              });
              errorCount++;
            } else {
              product.stock = newStock;
              await manager.save(product);
              results.push({
                productId: item.productId,
                productName: product.name,
                qtyDelta: item.qtyDelta,
                opId: item.opId,
                status: 'success',
                availableStock: newStock,
              });
              successCount++;
            }
          } catch (error) {
            results.push({
              productId: item.productId,
              productName: 'Unknown Product',
              qtyDelta: item.qtyDelta,
              opId: item.opId,
              status: 'not_found',
              availableStock: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            errorCount++;
          }
        }

        return { results, successCount, errorCount };
      });
    }
  }
}
