import * as React from "react";
import { HomeHero } from "@/components/home/HomeHero";
import { AIShoppingSearch } from "@/components/home/AIShoppingSearch";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { BestSellers } from "@/components/home/BestSellers";
import { AIFeatureSection } from "@/components/home/AIFeatureSection";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { productService } from "@/services";
import type { Product } from "@/types";

export const HomePage: React.FC = () => {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchProducts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load best sellers");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="w-full flex flex-col">
      {/* 1. Cinematic Hero Section */}
      <HomeHero />

      {/* 2. AI Shopping Search Bar */}
      <AIShoppingSearch />

      {/* 3. Hardware Departments Grid */}
      <CategoryGrid />

      {/* 4. Best-Selling Products Section */}
      {loading ? (
        <div className="py-16">
          <LoadingSpinner label="Loading best-selling hardware..." />
        </div>
      ) : error ? (
        <div className="max-w-[1360px] mx-auto px-4 md:px-6 xl:px-12 pb-16">
          <ErrorState
            title="Unable to load products"
            message={error}
            onRetry={fetchProducts}
          />
        </div>
      ) : (
        <BestSellers products={products} />
      )}

      {/* 5. AI Shopping & Procurement Feature Highlights */}
      <AIFeatureSection />
    </div>
  );
};
