import type { Product, ProductQuery, PaginatedProducts } from '../../types';
import type { IProductService } from '../api/productService';
import { apiClient } from '../api/client';

export class RealProductAdapter implements IProductService {
  async getProducts(query?: ProductQuery): Promise<Product[]> {
    const params = query ? { ...query } as Record<string, string | number | boolean | undefined> : undefined;
    return apiClient<Product[]>('/products', { params });
  }

  async getPaginatedProducts(query?: ProductQuery): Promise<PaginatedProducts> {
    const params = query ? { ...query } as Record<string, string | number | boolean | undefined> : undefined;
    return apiClient<PaginatedProducts>('/products/search', { params });
  }

  async getProductById(id: string): Promise<Product | null> {
    return apiClient<Product>(`/products/${id}`);
  }
}
