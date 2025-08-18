import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, FindOptionsWhere } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BatchReservationRequestDto, BatchReservationResponseDto, ReservationResultDto } from './dto/batch-reservation.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { DeleteResponseDto, SingleResourceResponseDto, PaginatedResponseDto, SimpleSuccessResponseDto } from '../shared/dto';
import { BatchCreateProductsResponseDto } from './dto/batch-create-products.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { BatchCreateProductsDto } from './dto/batch-create-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly http: HttpService,
  ) {}

  private get cartsBaseUrl(): string {
    return process.env.CARTS_API_BASE || 'http://localhost:3000';
  }

  async create(input: CreateProductDto): Promise<SingleResourceResponseDto<Product>> {
    const partial: DeepPartial<Product> = {
      name: input.name,
      description: input.description,
      image: input.image,
      price: String(input.price),
      stock: input.stock,
      category: input.category,
    };
    const entity = this.productRepository.create(partial);
    const product = await this.productRepository.save(entity);

    return {
      success: true,
      data: product,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  async batchCreate(dto: BatchCreateProductsDto): Promise<BatchCreateProductsResponseDto> {
    const successful: Product[] = [];
    const failed: Array<{ input: any; error: { code: string; message: string } }> = [];

    for (const productInput of dto.products) {
      try {
        const existingProduct = await this.productRepository.findOne({
          where: { name: productInput.name },
        });

        if (existingProduct) {
          failed.push({
            input: productInput,
            error: {
              code: 'DUPLICATE_NAME',
              message: `Product with name '${productInput.name}' already exists`,
            },
          });
          continue;
        }

        const productResponse = await this.create(productInput);
        successful.push(productResponse.data);
      } catch (error) {
        let errorCode = 'CREATION_ERROR';
        let errorMessage = 'Failed to create product';

        if (error instanceof BadRequestException) {
          errorCode = 'VALIDATION_ERROR';
          errorMessage = error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        failed.push({
          input: productInput,
          error: {
            code: errorCode,
            message: errorMessage,
          },
        });
      }
    }

    const successCount = successful.length;
    const failureCount = failed.length;
    let overallSuccess: boolean | 'partial';

    if (successCount === dto.products.length) {
      overallSuccess = true;
    } else if (successCount === 0) {
      overallSuccess = false;
    } else {
      overallSuccess = 'partial';
    }

    const successRate = Math.round((successCount / dto.products.length) * 100);

    const response = new BatchCreateProductsResponseDto();
    response.success = overallSuccess;
    response.data = {
      successful,
      failed,
    };
    response.meta = {
      total: dto.products.length,
      successful: successCount,
      failed: failureCount,
      successRate,
      timestamp: new Date().toISOString(),
    };
    return response;
  }

  async findAll(query: ProductQueryDto): Promise<PaginatedResponseDto<Product>> {
    const { category, page = 1, limit = 10 } = query;

    const where: FindOptionsWhere<Product> = {};
    if (category) {
      where.category = category;
    }

    const offset = (page - 1) * limit;

    const total = await this.productRepository.count({ where });

    const products = await this.productRepository.find({
      where,
      skip: offset,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      success: true,
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
        requestId: `find-products-${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async findOne(identifier: string): Promise<SingleResourceResponseDto<Product>> {
    const entity = await this.productRepository.createQueryBuilder('product').where('product.id::text = :identifier', { identifier }).orWhere('product.name = :identifier', { identifier }).getOne();

    if (!entity) {
      throw new NotFoundException(`Product not found with ID or name: ${identifier}`);
    }

    return {
      success: true,
      data: entity,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getCategories(): Promise<SimpleSuccessResponseDto<string[]>> {
    const query = this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.category', 'category')
      .where('product.category IS NOT NULL')
      .andWhere("product.category != ''")
      .orderBy('product.category', 'ASC');

    const result = await query.getRawMany<{ category: string }>();
    const categories: string[] = result.map((row) => row.category);

    return {
      success: true,
      data: categories,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  async update(id: string, input: UpdateProductDto): Promise<SingleResourceResponseDto<Product>> {
    const existingResponse = await this.findOne(id);
    const existing = existingResponse.data;

    if (input.name !== undefined) existing.name = input.name;
    if (input.description !== undefined) existing.description = input.description;
    if (input.image !== undefined) existing.image = input.image;
    if (input.price !== undefined) existing.price = String(input.price);
    if (input.stock !== undefined) existing.stock = input.stock;
    if (input.category !== undefined) existing.category = input.category;

    existing.updatedAt = new Date();

    const updated = await this.productRepository.save(existing);

    return {
      success: true,
      data: updated,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  async remove(id: string): Promise<DeleteResponseDto> {
    const productResponse = await this.findOne(id);
    const product = productResponse.data;

    try {
      await firstValueFrom(this.http.delete(`${this.cartsBaseUrl}/internal/products/${product.id}/cleanup`));
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        // Cart service not found, ignore
      } else {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(`Failed to cleanup cart references for product ${product.id}:`, errorMsg);
      }
    }

    const deleteResult = await this.productRepository.delete({ id: product.id });

    if (deleteResult.affected === 0) {
      throw new NotFoundException('Product not found or already deleted');
    }

    const response = new DeleteResponseDto();
    response.success = true;
    response.data = {
      message: `Product "${product.name}" deleted successfully`,
      deletedId: product.id,
    };
    response.meta = {
      timestamp: new Date().toISOString(),
      deletedProductName: product.name,
      requestId: `delete-product-${Date.now()}`,
    };

    return response;
  }

  async adjustStock(id: string, delta: number): Promise<SingleResourceResponseDto<Product>> {
    if (!Number.isInteger(delta)) {
      throw new BadRequestException('Delta must be an integer');
    }

    if (delta === 0) {
      throw new BadRequestException('Delta cannot be zero');
    }

    const result = await this.adjustStockWithOptimisticLock(id, delta);

    if (!result.success) {
      if (result.error?.includes('not found')) {
        throw new NotFoundException(result.error);
      } else if (result.error?.includes('Insufficient stock')) {
        throw new BadRequestException(result.error);
      } else if (result.error?.includes('concurrent modifications')) {
        throw new BadRequestException(result.error);
      } else {
        throw new BadRequestException(result.error || 'Stock adjustment failed');
      }
    }

    return {
      success: true,
      data: result.product!,
      meta: {
        timestamp: new Date().toISOString(),
        operation: 'single_stock_adjustment',
        deltaApplied: delta,
        version: result.product!.version,
      },
    };
  }

  async batchReservation(dto: BatchReservationRequestDto): Promise<BatchReservationResponseDto> {
    type ReservationItem = { productId: string; qtyDelta: number; opId?: string };

    const results: ReservationResultDto[] = [];
    let successCount = 0;
    let errorCount = 0;

    const sortedItems: ReservationItem[] = [...dto.items].sort((a, b) => a.productId.localeCompare(b.productId));

    if (dto.allOrNothing) {
      const validationResults: Array<{
        item: ReservationItem;
        success: boolean;
        error?: string;
        currentStock?: number;
      }> = [];

      for (const item of sortedItems) {
        const product = await this.productRepository.findOne({
          where: { id: item.productId },
        });

        if (!product) {
          validationResults.push({
            item,
            success: false,
            error: `Product with ID ${item.productId} not found`,
          });
          results.push({
            productId: item.productId,
            productName: 'Unknown Product',
            qtyDelta: item.qtyDelta,
            opId: item.opId || `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'not_found',
            availableStock: 0,
            error: `Product with ID ${item.productId} not found`,
          });
          errorCount++;
        } else {
          const wouldBeStock = product.stock + item.qtyDelta;
          if (wouldBeStock < 0) {
            validationResults.push({
              item,
              success: false,
              error: `Insufficient stock. Available: ${product.stock}, Required: ${Math.abs(item.qtyDelta)}`,
              currentStock: product.stock,
            });
            results.push({
              productId: item.productId,
              productName: product.name,
              qtyDelta: item.qtyDelta,
              opId: item.opId || `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              status: 'insufficient_stock',
              availableStock: product.stock,
              error: `Insufficient stock. Available: ${product.stock}, Required: ${Math.abs(item.qtyDelta)}`,
            });
            errorCount++;
          } else {
            validationResults.push({ item, success: true, currentStock: product.stock });
          }
        }
      }

      if (errorCount > 0) {
        throw new BadRequestException('Some items failed validation in all-or-nothing mode');
      }

      results.length = 0;
      for (const { item } of validationResults.filter((r) => r.success)) {
        const adjustResult = await this.adjustStockWithOptimisticLock(item.productId, item.qtyDelta);

        if (adjustResult.success) {
          results.push({
            productId: item.productId,
            productName: adjustResult.product!.name,
            qtyDelta: item.qtyDelta,
            opId: item.opId || `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'success',
            availableStock: adjustResult.product!.stock,
          });
          successCount++;
        } else {
          throw new BadRequestException(`Failed to adjust stock for product ${item.productId}: ${adjustResult.error}`);
        }
      }
    } else {
      for (const item of sortedItems) {
        const adjustResult = await this.adjustStockWithOptimisticLock(item.productId, item.qtyDelta);

        if (adjustResult.success) {
          results.push({
            productId: item.productId,
            productName: adjustResult.product!.name,
            qtyDelta: item.qtyDelta,
            opId: item.opId || `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'success',
            availableStock: adjustResult.product!.stock,
          });
          successCount++;
        } else {
          const status = adjustResult.error?.includes('not found') ? 'not_found' : 'insufficient_stock';
          results.push({
            productId: item.productId,
            productName: status === 'not_found' ? 'Unknown Product' : 'Product',
            qtyDelta: item.qtyDelta,
            opId: item.opId || `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status,
            availableStock: 0,
            error: adjustResult.error!,
          });
          errorCount++;
        }
      }
    }

    return { results, successCount, errorCount };
  }
  private async adjustStockWithOptimisticLock(productId: string, deltaQuantity: number, maxRetries: number = 3): Promise<{ success: boolean; product?: Product; error?: string }> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const product = await this.productRepository.findOne({
          where: { id: productId },
        });

        if (!product) {
          return {
            success: false,
            error: `Product with ID ${productId} not found`,
          };
        }

        const newStock = product.stock + deltaQuantity;

        if (newStock < 0) {
          return {
            success: false,
            error: `Insufficient stock. Available: ${product.stock}, Required: ${Math.abs(deltaQuantity)}`,
          };
        }

        const productToUpdate = { ...product };
        productToUpdate.stock = newStock;
        productToUpdate.updatedAt = new Date();

        const updatedProduct = await this.productRepository.save(productToUpdate);

        return {
          success: true,
          product: updatedProduct,
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const errorCode = err instanceof Error && 'code' in err ? String(err.code) : '';
        const errorName = err instanceof Error ? err.name : '';

        // Detect optimistic lock conflicts
        const isOptimisticLockError =
          msg.includes('OptimisticLockVersionMismatchError') || msg.includes('version') || errorCode === 'ER_DUP_ENTRY' || errorName === 'OptimisticLockVersionMismatchError';

        if (isOptimisticLockError) {
          console.log(`Optimistic lock conflict - Attempt ${attempt + 1}/${maxRetries}: ${msg}`);

          if (attempt >= maxRetries - 1) {
            return {
              success: false,
              error: `Stock adjustment failed after ${maxRetries} attempts due to concurrent modifications. Please try again.`,
            };
          }

          await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 10));
          continue;
        }

        return {
          success: false,
          error: msg,
        };
      }
    }

    return {
      success: false,
      error: 'Unexpected error in stock adjustment',
    };
  }
}
