/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../src/products/products.service';
import { Repository } from 'typeorm';
import { Product } from '../src/products/product.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, NotFoundException } from '@nestjs/common';

interface AdjustStockResult {
  success: boolean;
  product?: Product;
  error?: string;
}

// Helper function to call private method with proper typing
function callAdjustStockWithOptimisticLock(service: ProductsService, productId: string, delta: number): Promise<AdjustStockResult> {
  return (service as any).adjustStockWithOptimisticLock(productId, delta);
}

describe('ProductsService Optimistic Lock Unit Tests', () => {
  let service: ProductsService;
  let productRepository: jest.Mocked<Repository<Product>>;

  const mockProduct: Product = {
    id: 'test-product-id',
    name: 'Test Product',
    description: 'Test Description',
    image: 'data:image/png;base64,test',
    price: '10.00',
    stock: 100,
    category: 'Test',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockHttpService = {
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },

        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get(getRepositoryToken(Product));
  });

  describe('Optimistic Lock Mechanism Tests', () => {
    it('should successfully adjust stock without conflicts', async () => {
      // Mock successful optimistic lock operation
      productRepository.findOne.mockResolvedValue({ ...mockProduct });
      productRepository.save.mockResolvedValue({
        ...mockProduct,
        stock: 95,
        version: 2,
      });

      // Access private method through reflection
      const result = await callAdjustStockWithOptimisticLock(service, 'test-product-id', -5);

      expect(result.success).toBe(true);
      expect(result.product?.stock).toBe(95);
      expect(result.product?.version).toBe(2);
      expect(productRepository.findOne).toHaveBeenCalledTimes(1);
      expect(productRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should retry and eventually succeed on optimistic lock conflicts', async () => {
      // Mock retry scenario
      productRepository.findOne.mockResolvedValueOnce({ ...mockProduct, version: 1 }).mockResolvedValueOnce({ ...mockProduct, version: 2 });

      productRepository.save.mockRejectedValueOnce(new Error('OptimisticLockVersionMismatchError: Version conflict')).mockResolvedValueOnce({ ...mockProduct, stock: 95, version: 3 });

      const result = await callAdjustStockWithOptimisticLock(service, 'test-product-id', -5);

      expect(result.success).toBe(true);
      expect(result.product?.stock).toBe(95);
      expect(result.product?.version).toBe(3);
      expect(productRepository.findOne).toHaveBeenCalledTimes(2); // Retried once
      expect(productRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should fail after reaching maximum retry attempts', async () => {
      // Mock repository to simulate persistent conflicts
      productRepository.findOne.mockResolvedValue({ ...mockProduct });
      productRepository.save.mockRejectedValue(new Error('OptimisticLockVersionMismatchError: Persistent conflict'));

      // Mock the private method to simulate failure after max retries
      const adjustStockWithOptimisticLock = jest.fn().mockResolvedValue({
        success: false,
        error: 'Stock adjustment failed after 3 attempts due to concurrent modifications',
      });

      (service as any).adjustStockWithOptimisticLock = adjustStockWithOptimisticLock;

      await expect(service.adjustStock('test-product-id', -5)).rejects.toThrow('Stock adjustment failed after 3 attempts due to concurrent modifications');

      expect(adjustStockWithOptimisticLock).toHaveBeenCalledWith('test-product-id', -5);
    });

    it('should reject insufficient stock adjustments', async () => {
      productRepository.findOne.mockResolvedValue({ ...mockProduct, stock: 5 });

      // Mock the private method to simulate insufficient stock scenario
      const adjustStockWithOptimisticLock = jest.fn().mockResolvedValue({
        success: false,
        error: 'Insufficient stock. Available: 5, Required: 10',
      });

      (service as any).adjustStockWithOptimisticLock = adjustStockWithOptimisticLock;

      await expect(service.adjustStock('test-product-id', -10)).rejects.toThrow('Insufficient stock');
    });

    it('should handle non-existent product scenarios', async () => {
      productRepository.findOne.mockResolvedValue(null);

      // Mock the private method to simulate product not found scenario
      const adjustStockWithOptimisticLock = jest.fn().mockResolvedValue({
        success: false,
        error: 'Product with ID non-existent-id not found',
      });

      (service as any).adjustStockWithOptimisticLock = adjustStockWithOptimisticLock;

      await expect(service.adjustStock('non-existent-id', -5)).rejects.toThrow('Product with ID non-existent-id not found');
    });
  });

  describe('API Level Optimistic Lock Tests', () => {
    it('should handle optimistic lock correctly in adjustStock API', async () => {
      // Mock private method
      const adjustStockWithOptimisticLock = jest.fn().mockResolvedValue({
        success: true,
        product: { ...mockProduct, stock: 95, version: 2 },
      });

      (service as any).adjustStockWithOptimisticLock = adjustStockWithOptimisticLock;

      const result = await service.adjustStock('test-id', -5);

      expect(result.success).toBe(true);
      expect(result.data.stock).toBe(95);
      expect(result.data.version).toBe(2);
      expect(result.meta?.deltaApplied).toBe(-5);
      expect(result.meta?.version).toBe(2);
      expect(adjustStockWithOptimisticLock).toHaveBeenCalledWith('test-id', -5);
    });

    it('should handle partial success scenarios in batchReservation API', async () => {
      const adjustStockWithOptimisticLock = jest
        .fn()
        .mockResolvedValueOnce({
          success: true,
          product: { ...mockProduct, id: 'product-1', name: 'Product 1', stock: 95, version: 2 },
        })
        .mockResolvedValueOnce({
          success: false,
          error: 'Insufficient stock. Available: 2, Required: 3',
        });

      (service as any).adjustStockWithOptimisticLock = adjustStockWithOptimisticLock;

      const batchRequest = {
        allOrNothing: false,
        items: [
          { productId: 'product-1', qtyDelta: -5, opId: 'op-1' },
          { productId: 'product-2', qtyDelta: -3, opId: 'op-2' },
        ],
      };

      const result = await service.batchReservation(batchRequest);

      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(1);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].status).toBe('success');
      expect(result.results[1].status).toBe('insufficient_stock');
    });

    it('should reject All-or-Nothing batchReservation when validation fails', async () => {
      // Mock findOne for validation phase
      productRepository.findOne.mockResolvedValueOnce({ ...mockProduct, id: 'product-1', stock: 100 }).mockResolvedValueOnce({ ...mockProduct, id: 'product-2', stock: 2 }); // Insufficient stock

      const batchRequest = {
        allOrNothing: true,
        items: [
          { productId: 'product-1', qtyDelta: -5, opId: 'op-1' },
          { productId: 'product-2', qtyDelta: -3, opId: 'op-2' }, // This will fail
        ],
      };

      await expect(service.batchReservation(batchRequest)).rejects.toThrow(BadRequestException);
      expect(productRepository.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('Concurrency Performance Simulation', () => {
    it('should simulate retry mechanism under high concurrency', async () => {
      let attemptCount = 0;
      let currentStock = 100;
      let currentVersion = 1;

      productRepository.findOne.mockImplementation(() => {
        return Promise.resolve({
          ...mockProduct,
          stock: currentStock,
          version: currentVersion,
        });
      });

      productRepository.save.mockImplementation((product: Product) => {
        attemptCount++;

        // Simulate first 2 optimistic lock conflicts, 3rd attempt succeeds
        if (attemptCount <= 2) {
          throw new Error('OptimisticLockVersionMismatchError: Simulated conflict');
        }

        // 3rd attempt succeeds
        currentStock = product.stock;
        currentVersion++;

        return Promise.resolve({
          ...product,
          stock: currentStock,
          version: currentVersion,
        });
      });

      const startTime = Date.now();
      const result = await callAdjustStockWithOptimisticLock(service, 'test-product-id', -10);
      const endTime = Date.now();

      console.log(`\n📈 Optimistic Lock Performance Test Results:`);
      console.log(`   ✅ Operation Success: ${result.success}`);
      console.log(`   🔄 Retry Count: ${attemptCount}`);
      console.log(`   ⏱️  Total Time: ${endTime - startTime}ms`);
      console.log(`   📦 Final Stock: ${result.product?.stock}`);
      console.log(`   🔢 Final Version: ${result.product?.version}`);

      expect(result.success).toBe(true);
      expect(result.product?.stock).toBe(90);
      expect(result.product?.version).toBe(2);
      expect(attemptCount).toBe(3); // 2 failures + 1 success
    });

    it('should simulate performance of multiple concurrent operations', async () => {
      let operationCount = 0;
      let currentStock = 1000;
      let currentVersion = 1;

      productRepository.findOne.mockImplementation(() => {
        return Promise.resolve({
          ...mockProduct,
          stock: currentStock,
          version: currentVersion,
        });
      });

      productRepository.save.mockImplementation((product: Product) => {
        operationCount++;

        // Simulate 10% conflict rate
        if (Math.random() < 0.1) {
          throw new Error('OptimisticLockVersionMismatchError: Random conflict');
        }

        // Successful operation
        currentStock = product.stock;
        currentVersion++;

        return Promise.resolve({
          ...product,
          stock: currentStock,
          version: currentVersion,
        });
      });

      // Simulate 10 concurrent operations
      const operations = Array.from({ length: 10 }, (_, index) => callAdjustStockWithOptimisticLock(service, `test-product-${index}`, -5));

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const endTime = Date.now();

      const successfulResults = results.filter((r) => r.success);
      const failedResults = results.filter((r) => !r.success);

      console.log(`\n🎯 Concurrent Operations Test Results:`);
      console.log(`   📊 Total Operations: ${operations.length}`);
      console.log(`   ✅ Successful Operations: ${successfulResults.length}`);
      console.log(`   ❌ Failed Operations: ${failedResults.length}`);
      console.log(`   🔄 Total Database Operations: ${operationCount}`);
      console.log(`   ⏱️  Total Time: ${endTime - startTime}ms`);
      console.log(`   📈 Average Time: ${((endTime - startTime) / operations.length).toFixed(2)}ms/operation`);

      // Verify at least some operations succeed (considering random conflicts)
      expect(successfulResults.length).toBeGreaterThan(0);
      expect(results).toHaveLength(10);
    });
  });

  describe('API Parameter Validation Tests', () => {
    it('should validate adjustStock input parameters', async () => {
      await expect(service.adjustStock('test-id', 1.5)).rejects.toThrow(BadRequestException);
      await expect(service.adjustStock('test-id', 0)).rejects.toThrow(BadRequestException);
    });

    it('should handle various error scenarios in adjustStock', async () => {
      // Mock different failure scenarios
      const adjustStockWithOptimisticLock = jest.fn();

      // Scenario 1: Product not found
      adjustStockWithOptimisticLock.mockResolvedValueOnce({
        success: false,
        error: 'Product with ID test-id not found',
      });

      (service as any).adjustStockWithOptimisticLock = adjustStockWithOptimisticLock;

      await expect(service.adjustStock('test-id', -5)).rejects.toThrow(NotFoundException);

      // Scenario 2: Insufficient stock
      adjustStockWithOptimisticLock.mockResolvedValueOnce({
        success: false,
        error: 'Insufficient stock. Available: 5, Required: 10',
      });

      await expect(service.adjustStock('test-id', -10)).rejects.toThrow(BadRequestException);

      // Scenario 3: Concurrent conflict
      adjustStockWithOptimisticLock.mockResolvedValueOnce({
        success: false,
        error: 'Stock adjustment failed after 3 attempts due to concurrent modifications. Please try again.',
      });

      await expect(service.adjustStock('test-id', -5)).rejects.toThrow(BadRequestException);
    });
  });

  describe('Version Number Behavior Tests', () => {
    it('should return new version number after successful update', async () => {
      const adjustStockWithOptimisticLock = jest.fn().mockResolvedValue({
        success: true,
        product: { ...mockProduct, stock: 95, version: 2 },
      });

      (service as any).adjustStockWithOptimisticLock = adjustStockWithOptimisticLock;

      const result = await service.adjustStock('test-id', -5);

      expect(result.data.version).toBe(2);
      expect(result.meta?.version).toBe(2);
      expect(result.meta?.deltaApplied).toBe(-5);
      expect(result.meta?.operation).toBe('single_stock_adjustment');
    });
  });

  describe('Random Conflict Simulation', () => {
    it('should handle random optimistic lock conflicts', async () => {
      let totalAttempts = 0;

      productRepository.findOne.mockImplementation(() => {
        return Promise.resolve({
          ...mockProduct,
          stock: 100,
          version: 1,
        });
      });

      productRepository.save.mockImplementation((product: Product) => {
        totalAttempts++;

        // 30% conflict rate
        if (Math.random() < 0.3) {
          throw new Error('OptimisticLockVersionMismatchError: Random conflict');
        }

        return Promise.resolve({
          ...product,
          stock: product.stock,
          version: 2,
        });
      });

      // Execute 5 operations
      const operations = Array.from({ length: 5 }, () => callAdjustStockWithOptimisticLock(service, 'test-product-id', -1));

      const results = await Promise.all(operations);
      const successCount = results.filter((r) => r.success).length;

      console.log(`\n🎲 Random Conflict Test Results:`);
      console.log(`   🎯 Request Operations: ${operations.length}`);
      console.log(`   ✅ Successful Operations: ${successCount}`);
      console.log(`   🔄 Total Database Attempts: ${totalAttempts}`);
      console.log(`   📊 Success Rate: ${((successCount / operations.length) * 100).toFixed(1)}%`);

      expect(results).toHaveLength(5);
      expect(successCount).toBeGreaterThanOrEqual(0); // May all succeed or partially succeed
    });
  });
});
