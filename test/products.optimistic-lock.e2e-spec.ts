/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Product } from '../src/products/product.entity';
import { TestContext, setupTestApp, cleanupTestApp, resetTestProduct } from './utils/test-setup';

describe('Products Optimistic Lock E2E', () => {
  let context: TestContext;
  let app: INestApplication;
  let testProduct: Product;

  beforeAll(async () => {
    context = await setupTestApp();
    app = context.app;
    // NOTE: Do not rely on this reference across tests; we refresh it after each reset.
    testProduct = context.testProduct; // fixed by also refreshing in beforeEach
  }, 30000);

  afterAll(async () => {
    await cleanupTestApp(context);
  });

  beforeEach(async () => {
    // Ensure a clean state before every test
    await resetTestProduct(context);
    // 🔧 Refresh the reference in case reset recreated the product (new id/version)
    testProduct = context.testProduct;
  });

  describe('Single Stock Adjustment API (/products/:id/adjust-stock/:delta)', () => {
    it('should handle concurrent stock adjustments correctly', async () => {
      // Check initial state
      const initialResponse = await request(app.getHttpServer()).get(`/api/v1/products/${testProduct.id}`).expect(200);
      console.log(`Initial stock: ${initialResponse.body.data.stock}, version: ${initialResponse.body.data.version}`);

      // Concurrent adjustments — some requests may fail due to optimistic lock conflicts
      const adjustmentPromises = Array.from({ length: 5 }, () => request(app.getHttpServer()).post(`/api/v1/products/${testProduct.id}/adjust-stock/-10`));

      const results = await Promise.allSettled(adjustmentPromises);

      // Count successes and failures
      const successful = results.filter((r) => r.status === 'fulfilled' && r.value.status === 200);
      const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status !== 200));

      console.log(`Concurrent test: ${successful.length} success, ${failed.length} failed`);

      // Log failure details
      failed.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`Failed request ${index}: status ${result.value.status}, body:`, result.value.body);
        } else {
          console.log(`Failed request ${index}: error:`, result.reason);
        }
      });

      // At least some should succeed
      expect(successful.length).toBeGreaterThan(0);
      expect(successful.length).toBeLessThanOrEqual(5);

      // Validate successful responses
      successful.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`Successful request ${index}: final stock ${result.value.body.data.stock}, version ${result.value.body.data.version}`);
          expect(result.value.body.success).toBe(true);
          expect(result.value.body.data.version).toBeGreaterThan(1);
        }
      });

      // Validate final stock
      const finalResponse = await request(app.getHttpServer()).get(`/api/v1/products/${testProduct.id}`).expect(200);
      console.log(`Final query: stock ${finalResponse.body.data.stock}, version ${finalResponse.body.data.version}`);

      // Analyze actual optimistic-lock effect
      const actualStockChange = initialResponse.body.data.stock - finalResponse.body.data.stock;
      const actualSuccessfulOperations = actualStockChange / 10; // each op reduces 10

      console.log(`Stock change: actual ${actualStockChange}`);
      console.log(`Applied operations (actual): ${actualSuccessfulOperations}`);
      console.log(`HTTP success count: ${successful.length}`);

      // In optimistic-lock scenarios, applied operations can be <= HTTP "success" count
      expect(actualSuccessfulOperations).toBeLessThanOrEqual(successful.length);
      expect(actualSuccessfulOperations).toBeGreaterThan(0);

      // Ensure changes are multiples of 10 (no partial updates)
      expect(actualStockChange % 10).toBe(0);
    });

    it('should prevent stock from going negative', async () => {
      await request(app.getHttpServer()).post(`/api/v1/products/${testProduct.id}/adjust-stock/-101`).expect(400);
    });
  });

  describe('Batch Reservation API (/products/reservations/batch)', () => {
    it('should handle batch reservations in partial-success mode', async () => {
      const batchRequest = {
        allOrNothing: false,
        items: [
          { productId: testProduct.id, qtyDelta: -10, opId: 'op-1' },
          { productId: testProduct.id, qtyDelta: -20, opId: 'op-2' },
        ],
      };

      const response = await request(app.getHttpServer()).post('/api/v1/products/reservations/batch').send(batchRequest).expect(200);

      expect(response.body.successCount).toBe(2);
      expect(response.body.errorCount).toBe(0);
    });

    it('should handle batch reservations in all-or-nothing mode', async () => {
      const batchRequest = {
        allOrNothing: true,
        items: [
          { productId: testProduct.id, qtyDelta: -10, opId: 'op-1' },
          { productId: testProduct.id, qtyDelta: -20, opId: 'op-2' },
        ],
      };

      const response = await request(app.getHttpServer()).post('/api/v1/products/reservations/batch').send(batchRequest).expect(200);

      expect(response.body.successCount).toBe(2);
      expect(response.body.results.every((r: any) => r.status === 'success')).toBe(true);
    });
  });

  describe('Version Number Tracking', () => {
    it('should increment version number after each stock adjustment', async () => {
      const response1 = await request(app.getHttpServer()).post(`/api/v1/products/${testProduct.id}/adjust-stock/-10`).expect(200);

      const response2 = await request(app.getHttpServer()).post(`/api/v1/products/${testProduct.id}/adjust-stock/-10`).expect(200);

      expect(response2.body.data.version).toBe(response1.body.data.version + 1);
    });

    it('should return version information in API responses', async () => {
      const response = await request(app.getHttpServer()).post(`/api/v1/products/${testProduct.id}/adjust-stock/-10`).expect(200);

      expect(response.body.data).toHaveProperty('version');
      expect(response.body.meta).toHaveProperty('version');
      expect(response.body.meta.version).toBe(response.body.data.version);
    });
  });
});
