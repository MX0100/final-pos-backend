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
    testProduct = context.testProduct;
  }, 30000);

  afterAll(async () => {
    await cleanupTestApp(context);
  });

  beforeEach(async () => {
    await resetTestProduct(context);
    testProduct = context.testProduct;
  });

  describe('Single Stock Adjustment API (/products/:id/stock/adjust)', () => {
    it('should handle concurrent stock adjustments correctly', async () => {
      const initialResponse = await request(app.getHttpServer()).get(`/api/v1/products/${testProduct.id}`).expect(200);
      console.log(`Initial stock: ${initialResponse.body.data.stock}, version: ${initialResponse.body.data.version}`);

      const adjustmentPromises = Array.from({ length: 5 }, () => request(app.getHttpServer()).post(`/api/v1/products/${testProduct.id}/stock/adjust?delta=-10`));

      const results = await Promise.allSettled(adjustmentPromises);

      const successful = results.filter((r) => r.status === 'fulfilled' && r.value.status === 200);
      const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status !== 200));

      console.log(`Concurrent test: ${successful.length} success, ${failed.length} failed`);

      failed.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`Failed request ${index}: status ${result.value.status}, body:`, result.value.body);
        } else {
          console.log(`Failed request ${index}: error:`, result.reason);
        }
      });

      expect(successful.length).toBeGreaterThan(0);
      expect(successful.length).toBeLessThanOrEqual(5);

      successful.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`Successful request ${index}: final stock ${result.value.body.data.stock}, version ${result.value.body.data.version}`);
          expect(result.value.body.success).toBe(true);
          expect(result.value.body.data.version).toBeGreaterThan(1);
        }
      });

      const finalResponse = await request(app.getHttpServer()).get(`/api/v1/products/${testProduct.id}`).expect(200);
      console.log(`Final query: stock ${finalResponse.body.data.stock}, version ${finalResponse.body.data.version}`);

      const actualStockChange = initialResponse.body.data.stock - finalResponse.body.data.stock;
      const actualSuccessfulOperations = actualStockChange / 10;

      console.log(`Stock change: actual ${actualStockChange}`);
      console.log(`Applied operations (actual): ${actualSuccessfulOperations}`);
      console.log(`HTTP success count: ${successful.length}`);
      expect(actualSuccessfulOperations).toBeLessThanOrEqual(successful.length);
      expect(actualSuccessfulOperations).toBeGreaterThan(0);

      expect(actualStockChange % 10).toBe(0);
    });

    it('should prevent stock from going negative', async () => {
      await request(app.getHttpServer()).post(`/api/v1/products/${testProduct.id}/stock/adjust?delta=-101`).expect(400);
    });
  });

  describe('Batch Reservation API (/products/batch-reservation)', () => {
    it('should handle batch reservations in partial-success mode', async () => {
      const batchRequest = {
        allOrNothing: false,
        items: [
          { productId: testProduct.id, qtyDelta: -10, opId: 'op-1' },
          { productId: testProduct.id, qtyDelta: -20, opId: 'op-2' },
        ],
      };

      const response = await request(app.getHttpServer()).post('/api/v1/products/batch-reservation').send(batchRequest).expect(200);

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

      const response = await request(app.getHttpServer()).post('/api/v1/products/batch-reservation').send(batchRequest).expect(200);

      expect(response.body.successCount).toBe(2);
      expect(response.body.results.every((r: any) => r.status === 'success')).toBe(true);
    });
  });

  describe('Version Number Tracking', () => {
    it('should increment version number after each stock adjustment', async () => {
      const response1 = await request(app.getHttpServer()).post(`/api/v1/products/${testProduct.id}/stock/adjust?delta=-10`).expect(200);

      const response2 = await request(app.getHttpServer()).post(`/api/v1/products/${testProduct.id}/stock/adjust?delta=-10`).expect(200);

      expect(response2.body.data.version).toBe(response1.body.data.version + 1);
    });

    it('should return version information in API responses', async () => {
      const response = await request(app.getHttpServer()).post(`/api/v1/products/${testProduct.id}/stock/adjust?delta=-10`).expect(200);

      expect(response.body.data).toHaveProperty('version');
      expect(response.body.meta).toHaveProperty('version');
      expect(response.body.meta.version).toBe(response.body.data.version);
    });
  });
});
