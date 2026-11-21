import type { Product, ProductQuery, PaginatedProducts } from '../../types';

export interface IProductService {
  getProducts(query?: ProductQuery): Promise<Product[]>;
  getPaginatedProducts(query?: ProductQuery): Promise<PaginatedProducts>;
  getProductById(id: string): Promise<Product | null>;
}
