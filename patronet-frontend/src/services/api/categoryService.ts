import { apiClient } from "@/services/api/client";
import { resolveCategoryImageUrl } from "@/lib/imageUtils";

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: "accessories", name: "Accessories", description: "Premium backpacks, wallets, watches and personal gear", productCount: 8 },
  { id: "beauty-personal-care", name: "Beauty & Personal Care", description: "Skin care, personal wellness, and grooming essentials", productCount: 8 },
  { id: "electronics", name: "Electronics", description: "Smartphones, laptops, audio gear, and personal tech", productCount: 8 },
  { id: "fashion", name: "Fashion", description: "Quality apparel, casual streetwear, and ethnic wear", productCount: 8 },
  { id: "grocery", name: "Grocery", description: "Premium staples, pantry essentials, and daily groceries", productCount: 8 },
  { id: "home-kitchen", name: "Home & Kitchen", description: "Kitchenware, cookware, appliances, and home essentials", productCount: 8 },
];

export const categoryService = {
  async getCategories(): Promise<CategoryItem[]> {
    try {
      const data = await apiClient<any>("/categories");
      const items = Array.isArray(data) ? data : data?.items || [];
      if (items.length > 0) {
        return items.map((c: { id?: string; name: string; description?: string; product_count?: number; productCount?: number }) => ({
          id: c.id || c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name: c.name,
          description: c.description || DEFAULT_CATEGORIES.find((d) => d.name.toLowerCase() === c.name.toLowerCase())?.description || "Marketplace category",
          imageUrl: resolveCategoryImageUrl(c.name),
          productCount: c.product_count ?? c.productCount ?? 8,
        }));
      }
    } catch {
      // Fallback below
    }

    return DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      imageUrl: resolveCategoryImageUrl(cat.name),
    }));
  },
};
