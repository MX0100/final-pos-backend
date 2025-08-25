import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IProductService, StockAdjustmentResult, BatchStockAdjustmentResult } from '../interfaces/product-service.port';
import { ProductsApi, Configuration } from '../../generated';

interface ProductApiResponse {
  data?: {
    stock?: number;
    version?: number;
  };
}

interface BatchReservationApiResponse {
  results?: Array<{
    status?: string;
    productId?: string;
    availableStock?: number;
    version?: number;
    error?: string;
  }>;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

@Injectable()
export class HttpProductService implements IProductService {
  private readonly productsApi: ProductsApi;

  constructor(private readonly http: HttpService) {
    const config = new Configuration({
      basePath: process.env.PRODUCTS_API_BASE || 'http://localhost:3000/api/v1',
    });
    this.productsApi = new ProductsApi(config, config.basePath, this.http.axiosRef);
  }

  async adjustStock(productId: string, delta: number, opId?: string): Promise<StockAdjustmentResult> {
    try {
      const resp = await this.productsApi.productsControllerAdjustStockV1(productId, String(delta), opId);
      const body = resp.data as ProductApiResponse;
      return {
        success: true,
        productId,
        newStock: body.data?.stock ?? 0,
        version: body.data?.version,
      };
    } catch (err: unknown) {
      const error = err as ApiError;
      const message: string = error?.response?.data?.message ?? error?.message ?? 'Unknown error';
      return { success: false, productId, newStock: 0, error: message };
    }
  }

  async batchAdjustStock(items: Array<{ productId: string; qtyDelta: number; opId?: string }>, allOrNothing: boolean = false): Promise<BatchStockAdjustmentResult> {
    try {
      const resp = await this.productsApi.productsControllerBatchReservationV1({
        items: items.map((i) => ({ productId: i.productId, qtyDelta: i.qtyDelta, opId: i.opId })),
        allOrNothing,
      });

      const body = resp.data as BatchReservationApiResponse;
      const results: StockAdjustmentResult[] = (body.results ?? []).map((r) => ({
        success: r.status === 'success',
        productId: r.productId ?? '',
        newStock: r.availableStock ?? 0,
        version: r.version,
        error: r.error || (r.status !== 'success' ? r.status : undefined),
      }));

      return { success: true, results, errors: [] };
    } catch (err: unknown) {
      const error = err as ApiError;
      const message: string = error?.response?.data?.message ?? error?.message ?? 'Unknown error';
      return { success: false, results: [], errors: [message] };
    }
  }
}
