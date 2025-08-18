import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IProductService, StockAdjustmentResult, BatchStockAdjustmentResult } from '../interfaces/product-service.port';
import { ProductsApi, Configuration } from '../../generated/products';

@Injectable()
export class HttpProductService implements IProductService {
  private readonly productsApi: ProductsApi;

  constructor(private readonly http: HttpService) {
    // Reuse Nest HttpService's axios instance to inherit timeouts/interceptors
    const config = new Configuration();
    // basePath controls host; path already contains /api/v1
    const basePath = process.env.PRODUCTS_API_BASE || 'http://localhost:3000';
    this.productsApi = new ProductsApi(config, basePath, this.http.axiosRef);
  }

  async adjustStock(productId: string, delta: number, opId?: string): Promise<StockAdjustmentResult> {
    try {
      const resp = await this.productsApi.productsControllerAdjustStockV1({ id: productId, delta: String(delta) });
      const body: any = resp.data;
      return {
        success: true,
        productId,
        newStock: body.data?.stock ?? 0,
        version: body.data?.version,
      };
    } catch (err: any) {
      const message: string = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      return { success: false, productId, newStock: 0, error: message };
    }
  }

  async batchAdjustStock(items: Array<{ productId: string; qtyDelta: number; opId?: string }>, allOrNothing: boolean = false): Promise<BatchStockAdjustmentResult> {
    try {
      const resp = await this.productsApi.productsControllerBatchReservationV1({
        batchReservationRequestDto: {
          items: items.map((i) => ({ productId: i.productId, qtyDelta: i.qtyDelta, opId: i.opId })),
          allOrNothing,
        },
      });

      const body: any = resp.data;
      const results: StockAdjustmentResult[] = (body.results ?? []).map((r: any) => ({
        success: r.status === 'success',
        productId: r.productId,
        newStock: r.availableStock,
        version: r.version,
        error: r.error,
      }));

      return { success: true, results, errors: [] };
    } catch (err: any) {
      const message: string = err?.response?.data?.message ?? err?.message ?? 'Unknown error';
      return { success: false, results: [], errors: [message] };
    }
  }
}
