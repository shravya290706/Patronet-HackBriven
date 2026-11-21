import type {
  Product,
  ProductQuery,
  PaginatedProducts,
  ProductImage,
  Category,
  InventoryAvailability,
  SearchSuggestions,
} from '../../types';
import type { IProductService } from '../api/productService';
import { apiClient } from '../api/client';
import {
  resolveProductImageUrl,
  resolveProductGalleryUrls,
} from '../../lib/productImageCatalog';

export interface BackendCategory {
  id: string;
  name: string;
}

export interface BackendProductItem {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  sku: string;
  price: number | string;
  subtitle?: string | null;
  is_active?: boolean;
  isActive?: boolean;
  category?: BackendCategory | string | null;
  categoryId?: string;
  primary_image_url?: string | null;
  primaryImage?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string | null;
  updatedAt?: string | null;
  specifications?: Record<string, string | number | boolean | string[]>;
  images?: Array<{
    id?: string;
    image_url?: string;
    url?: string;
    is_primary?: boolean;
    isPrimary?: boolean;
    display_order?: number;
    sortOrder?: number;
    alt_text?: string;
    altText?: string;
  }>;
  inventory?: Array<{
    store_id?: string;
    storeId?: string;
    store_name?: string;
    storeName?: string;
    city?: string;
    state?: string;
    pincode?: string;
    available_stock?: number;
    quantityOnHand?: number;
    quantityReserved?: number;
    is_in_stock?: boolean;
    isAvailable?: boolean;
  }>;
  total_stock?: number;
  badge?: string;
  slug?: string;
}

export interface BackendProductListResponse {
  items: BackendProductItem[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * Transforms raw backend product data into the standard frontend Product model.
 */
export function adaptBackendProduct(raw: unknown): Product {
  if (!raw || typeof raw !== 'object') {
    return {} as Product;
  }

  const r = raw as BackendProductItem;

  const id = String(r.id || '');
  const name = String(r.name || '');
  const sku = String(r.sku || '');
  const brand = String(r.brand || 'PATRONET');
  const description = String(r.description || '');
  const price = typeof r.price === 'number' ? r.price : parseFloat(String(r.price || 0));
  const isActive = r.isActive !== undefined ? Boolean(r.isActive) : (r.is_active !== undefined ? Boolean(r.is_active) : true);

  // Slug derivation
  const rawSlug = r.slug ? String(r.slug) : '';
  const slug = rawSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || id;

  // Category adaptation
  let category: Category | undefined = undefined;
  let categoryId = '';
  if (r.category && typeof r.category === 'object') {
    const cat = r.category as BackendCategory;
    categoryId = String(cat.id || '');
    category = {
      id: categoryId,
      name: String(cat.name || ''),
      slug: String(cat.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      isActive: true,
    };
  } else if (typeof r.category === 'string') {
    category = {
      id: `cat-${r.category}`,
      name: r.category,
      slug: r.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      isActive: true,
    };
  } else if (r.categoryId) {
    categoryId = String(r.categoryId);
  }

  // Specifications
  const specifications: Record<string, string | number | boolean | string[]> =
    r.specifications && typeof r.specifications === 'object'
      ? r.specifications
      : {};

  if (category && !specifications['Category']) {
    specifications['Category'] = category.name;
  }

  // Primary Image URL with Curated & Deterministic Catalogue Precedence
  const primaryImageUrl = resolveProductImageUrl({
    id,
    sku,
    name,
    category,
    primaryImage: (typeof r.primaryImage === 'string' && r.primaryImage) ||
      (typeof r.primary_image_url === 'string' && r.primary_image_url) || null,
  });

  // Complementary Gallery Images
  const galleryUrls = resolveProductGalleryUrls({
    id,
    sku,
    name,
    category,
    primaryImage: primaryImageUrl,
  });

  const images: ProductImage[] = galleryUrls.map((url, idx) => ({
    id: `img-${id}-${idx}`,
    productId: id,
    url,
    altText: `${name} - View ${idx + 1}`,
    isPrimary: idx === 0,
    sortOrder: idx,
  }));

  // Inventory adaptation
  let inventory: InventoryAvailability[] | undefined = undefined;
  if (Array.isArray(r.inventory)) {
    inventory = r.inventory.map((inv) => ({
      storeId: inv.storeId || inv.store_id,
      storeName: inv.storeName || inv.store_name,
      quantityOnHand: Number(inv.quantityOnHand ?? inv.available_stock ?? 0),
      quantityReserved: Number(inv.quantityReserved ?? 0),
      isAvailable: Boolean(inv.isAvailable ?? inv.is_in_stock ?? true),
    }));
  }

  return {
    id,
    sku,
    name,
    subtitle: r.subtitle ? String(r.subtitle) : undefined,
    slug,
    brand,
    categoryId,
    category,
    description,
    shortDescription: description.slice(0, 160),
    price,
    compareAtPrice: null,
    isActive,
    specifications,
    images,
    inventory,
    primaryImage: primaryImageUrl,
    badge: r.badge ? String(r.badge) : undefined,
    createdAt: String(r.createdAt || r.created_at || new Date().toISOString()),
    updatedAt: String(r.updatedAt || r.updated_at || new Date().toISOString()),
  };
}

export class RealProductAdapter implements IProductService {
  private mapQueryParams(query?: ProductQuery): Record<string, string | number | undefined> {
    const params: Record<string, string | number | undefined> = {};
    if (!query) return params;

    const categoryAliases: Record<string, string> = {
      laptops: 'Electronics',
      computers: 'Electronics',
      monitors: 'Electronics',
      audio: 'Electronics',
      gaming: 'Electronics',
      wearables: 'Mobile Accessories',
      deals: 'Electronics',
    };

    if (query.search?.trim()) {
      params.q = query.search.trim();
    }

    if (query.category?.trim()) {
      const lower = query.category.trim().toLowerCase();
      params.category = categoryAliases[lower] || query.category.trim();
    } else if (query.categories && query.categories.length > 0 && query.categories[0].trim()) {
      const lower = query.categories[0].trim().toLowerCase();
      params.category = categoryAliases[lower] || query.categories[0].trim();
    }

    if (query.brands && query.brands.length > 0 && query.brands[0].trim()) {
      params.brand = query.brands[0].trim();
    }

    if (query.minPrice !== undefined && query.minPrice >= 0) {
      params.min_price = query.minPrice;
    }

    if (query.maxPrice !== undefined && query.maxPrice >= 0) {
      params.max_price = query.maxPrice;
    }

    if (query.sort) {
      params.sort = query.sort;
    }

    if (query.page !== undefined && query.page >= 1) {
      params.page = query.page;
    }

    if (query.pageSize !== undefined && query.pageSize >= 1) {
      params.limit = Math.min(query.pageSize, 100);
    }

    return params;
  }

  async getProducts(query?: ProductQuery): Promise<Product[]> {
    const params = this.mapQueryParams(query);
    // If no limit is specified, fetch up to 20 products for display
    if (!params.limit) {
      params.limit = 20;
    }

    const response = await apiClient<BackendProductListResponse | BackendProductItem[]>('/products', { params });

    // Handle standard FastAPI response { items: [...], pagination: {...} }
    if (response && 'items' in response && Array.isArray(response.items)) {
      return response.items.map(adaptBackendProduct);
    }

    // Handle direct array response if returned
    if (Array.isArray(response)) {
      return response.map(adaptBackendProduct);
    }

    return [];
  }

  async getPaginatedProducts(query?: ProductQuery): Promise<PaginatedProducts> {
    const page = Math.max(1, query?.page || 1);
    const pageSize = Math.max(1, query?.pageSize || 9);

    const params = this.mapQueryParams(query);
    params.page = page;
    params.limit = Math.min(pageSize, 100);

    const response = await apiClient<BackendProductListResponse | BackendProductItem[]>('/products', { params });

    // Handle standard FastAPI response { items: [...], pagination: {...} }
    if (response && 'items' in response && Array.isArray(response.items)) {
      const items = response.items.map(adaptBackendProduct);
      const pagination = response.pagination;

      return {
        items,
        total: pagination?.total ?? items.length,
        page: pagination?.page ?? page,
        pageSize: pagination?.limit ?? pageSize,
        totalPages: pagination?.total_pages ?? Math.max(1, Math.ceil((pagination?.total ?? items.length) / pageSize)),
      };
    }

    // Handle direct array response if returned
    if (Array.isArray(response)) {
      const items = response.map(adaptBackendProduct);
      return {
        items,
        total: items.length,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
      };
    }

    return {
      items: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 1,
    };
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const response = await apiClient<BackendProductItem>(`/products/${id}`);
      if (response && response.id) {
        return adaptBackendProduct(response);
      }
      return null;
    } catch {
      return null;
    }
  }

  async getCategories(): Promise<Array<{ id: string; name: string; productCount: number }>> {
    try {
      const response = await apiClient<Array<{ id: string; name: string; product_count: number }>>('/categories');
      if (Array.isArray(response)) {
        return response.map((c) => ({
          id: String(c.id),
          name: String(c.name),
          productCount: Number(c.product_count || 0),
        }));
      }
      return [];
    } catch {
      return [];
    }
  }

  async getSuggestions(query: string, limit: number = 5): Promise<SearchSuggestions> {
    const q = query.trim();
    if (!q || q.length < 2) {
      return { query, products: [], categories: [], brands: [], corrections: [] };
    }
    try {
      const response = await apiClient<SearchSuggestions>('/search/suggest', {
        params: { q, limit },
      });
      return (
        response || {
          query,
          products: [],
          categories: [],
          brands: [],
          corrections: [],
        }
      );
    } catch {
      return { query, products: [], categories: [], brands: [], corrections: [] };
    }
  }
}
