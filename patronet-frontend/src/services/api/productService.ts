import type { Product, ProductQuery, PaginatedProducts, SearchSuggestions } from '../../types';

export interface IProductService {
  getProducts(query?: ProductQuery): Promise<Product[]>;
  getPaginatedProducts(query?: ProductQuery): Promise<PaginatedProducts>;
  getProductById(id: string): Promise<Product | null>;
  getCategories?(): Promise<Array<{ id: string; name: string; productCount: number }>>;
  getSuggestions?(query: string, limit?: number): Promise<SearchSuggestions>;
}
