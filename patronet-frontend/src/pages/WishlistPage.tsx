import * as React from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/layout/Container";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProductCard } from "@/components/products/ProductCard";
import { useWishlist } from "@/context/WishlistContext";
import { productService } from "@/services";
import type { Product } from "@/types";

export const WishlistPage: React.FC = () => {
  const { items, itemCount, removeFromWishlist, clearWishlist, loading: wishlistLoading } = useWishlist();

  const [products, setProducts] = React.useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = React.useState<boolean>(true);

  // Resolve product IDs through productService
  React.useEffect(() => {
    let active = true;

    async function loadWishlistProducts() {
      if (items.length === 0) {
        setProducts([]);
        setLoadingProducts(false);
        return;
      }

      setLoadingProducts(true);
      try {
        const resolved = await Promise.all(
          items.map(async (item) => {
            try {
              return await productService.getProductById(item.productId);
            } catch {
              return null;
            }
          })
        );

        if (active) {
          setProducts(resolved.filter((p): p is Product => p !== null));
        }
      } catch (err) {
        console.error("Error resolving wishlist products:", err);
      } finally {
        if (active) setLoadingProducts(false);
      }
    }

    loadWishlistProducts();

    return () => {
      active = false;
    };
  }, [items]);

  const handleToggleWishlist = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.info("Removed product from wishlist.");
    } catch {
      toast.error("Failed to remove product from wishlist.");
    }
  };

  const handleClearAll = async () => {
    try {
      await clearWishlist();
      setProducts([]);
      toast.info("Wishlist cleared.");
    } catch {
      toast.error("Failed to clear wishlist.");
    }
  };

  const isInitialLoading = wishlistLoading || (loadingProducts && items.length > 0);

  return (
    <div className="py-space-xl">
      <Container>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-space-lg">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Your Wishlist</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Products you have saved for later.
            </p>
          </div>
          {itemCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="font-label-md text-label-md text-outline hover:text-error transition-colors cursor-pointer self-start sm:self-auto underline"
            >
              Clear wishlist ({itemCount})
            </button>
          )}
        </div>

        {/* Content Area */}
        {isInitialLoading ? (
          <div className="py-20 text-center">
            <LoadingSpinner size="lg" label="Loading wishlist..." />
          </div>
        ) : products.length === 0 ? (
          /* Empty Wishlist State */
          <div className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-xl text-center max-w-xl mx-auto shadow-xs">
            <Heart className="h-12 w-12 mx-auto text-outline" />
            <h2 className="font-title-md text-title-md text-on-surface font-semibold mt-space-sm">
              No saved products yet
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Tap the heart icon on any product card or detail page to bookmark items for later.
            </p>
            <Link
              to="/products"
              className="mt-space-md inline-flex items-center justify-center gap-2 px-space-lg py-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container shadow-xs transition-colors"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* 4-Column Product Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={true}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
};
