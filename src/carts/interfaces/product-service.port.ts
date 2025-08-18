export interface StockAdjustmentResult {
  success: boolean;
  productId: string;
  newStock: number;
  version?: number;
  error?: string;
}

export interface BatchStockAdjustmentResult {
  success: boolean;
  results: StockAdjustmentResult[];
  errors?: string[];
}

export interface IProductService {
  adjustStock(productId: string, delta: number, opId?: string): Promise<StockAdjustmentResult>;
  batchAdjustStock(items: Array<{ productId: string; qtyDelta: number; opId?: string }>, allOrNothing?: boolean): Promise<BatchStockAdjustmentResult>;
}

export const PRODUCT_SERVICE = Symbol('PRODUCT_SERVICE');
