import type { Product, ProductQuery, PaginatedProducts } from '../../types';
import type { IProductService } from '../api/productService';
import { MOCK_PRODUCTS } from '../../mocks/products';

export class MockProductAdapter implements IProductService {
  async getProducts(query?: ProductQuery): Promise<Product[]> {
    await new Promise((r) => setTimeout(r, 60));
    return this.filterAndSort(MOCK_PRODUCTS, query);
  }

  async getPaginatedProducts(query?: ProductQuery): Promise<PaginatedProducts> {
    await new Promise((r) => setTimeout(r, 80));
    const filtered = this.filterAndSort(MOCK_PRODUCTS, query);
    
    const page = Math.max(1, query?.page || 1);
    const pageSize = Math.max(1, query?.pageSize || 9);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    
    const startIndex = (page - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async getProductById(id: string): Promise<Product | null> {
    await new Promise((r) => setTimeout(r, 60));
    const found = MOCK_PRODUCTS.find((p) => p.id === id || p.slug === id);
    return found || null;
  }

  private filterAndSort(products: Product[], query?: ProductQuery): Product[] {
    let result = [...products];

    if (!query) return result;

    // 1. Text Search (Name, Brand, Category, Specifications)
    if (query.search && query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      result = result.filter((p) => {
        const inName = p.name.toLowerCase().includes(q);
        const inBrand = p.brand.toLowerCase().includes(q);
        const inCategory = (p.category?.name || String(p.specifications?.['Category'] || '')).toLowerCase().includes(q);
        const inDesc = (p.shortDescription || p.description || '').toLowerCase().includes(q);
        const inSpecs = Object.values(p.specifications || {}).some((val) =>
          String(val).toLowerCase().includes(q)
        );
        return inName || inBrand || inCategory || inDesc || inSpecs;
      });
    }

    // 2. Category Filter (single category string or categories array)
    const activeCategories = [
      ...(query.category ? [query.category] : []),
      ...(query.categories || []),
    ].map((c) => c.toLowerCase());

    if (activeCategories.length > 0) {
      result = result.filter((p) => {
        const cat = String(p.category?.name || p.specifications?.['Category'] || '').toLowerCase();
        return activeCategories.includes(cat);
      });
    }

    // 3. Brand Filter
    if (query.brands && query.brands.length > 0) {
      const lowerBrands = query.brands.map((b) => b.toLowerCase());
      result = result.filter((p) => lowerBrands.includes(p.brand.toLowerCase()));
    }

    // 4. Price Filter
    if (typeof query.minPrice === 'number' && !isNaN(query.minPrice)) {
      result = result.filter((p) => p.price >= query.minPrice!);
    }
    if (typeof query.maxPrice === 'number' && !isNaN(query.maxPrice)) {
      result = result.filter((p) => p.price <= query.maxPrice!);
    }

    // 5. In-stock availability filter
    if (query.inStockOnly) {
      result = result.filter((p) => {
        if (!p.inventory || p.inventory.length === 0) return p.isActive;
        return p.inventory.some((inv) => inv.isAvailable && inv.quantityOnHand > 0);
      });
    }

    // 6. Sorting
    switch (query.sort) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'featured':
      default:
        // Stable order matching Stitch catalogue curation
        break;
    }

    return result;
  }
}
