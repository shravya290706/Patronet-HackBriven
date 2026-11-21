import * as React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '@/components/layout/Container';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { productService } from '@/services';
import type { Product } from '@/types';
import { getProductPrimaryImageUrl, DEFAULT_PRODUCT_FALLBACK_IMAGE } from '@/lib/imageUtils';

interface WishlistProductLine {
  productId: string;
  product: Product | null;
  error?: string;
  isAvailable: boolean;
}

export const WishlistPage: React.FC = () => {
  const { items, itemCount, removeFromWishlist, clearWishlist, loading: wishlistLoading } = useWishlist();
  const { addItem: addCartItem } = useCart();

  const [products, setProducts] = React.useState<WishlistProductLine[]>([]);
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
        const resolved: WishlistProductLine[] = await Promise.all(
          items.map(async (item) => {
            try {
              const product = await productService.getProductById(item.productId);
              if (!product) {
                return {
                  productId: item.productId,
                  product: null,
                  error: 'Product no longer in catalogue',
                  isAvailable: false,
                };
              }
              const isAvailable = product.inventory && product.inventory.length > 0
                ? product.inventory.some((i) => i.isAvailable && i.quantityOnHand > 0)
                : product.isActive;

              return {
                productId: item.productId,
                product,
                isAvailable,
              };
            } catch {
              return {
                productId: item.productId,
                product: null,
                error: 'Lookup failed',
                isAvailable: false,
              };
            }
          })
        );

        if (active) {
          setProducts(resolved);
        }
      } catch (err) {
        console.error('Error resolving wishlist products:', err);
      } finally {
        if (active) setLoadingProducts(false);
      }
    }

    loadWishlistProducts();

    return () => {
      active = false;
    };
  }, [items]);

  const handleAddToCart = async (line: WishlistProductLine) => {
    if (!line.product || !line.isAvailable) {
      toast.error('This product is currently unavailable.');
      return;
    }
    try {
      await addCartItem(line.product.id, 1);
      toast.success(`Added 1 × ${line.product.name} to cart.`);
    } catch {
      toast.error(`Failed to add ${line.product.name} to cart.`);
    }
  };

  const handleRemove = async (productId: string, productName?: string) => {
    try {
      await removeFromWishlist(productId);
      toast.info(`Removed ${productName || 'product'} from wishlist.`);
    } catch {
      toast.error('Failed to remove product from wishlist.');
    }
  };

  const handleClearAll = async () => {
    try {
      await clearWishlist();
      toast.info('Wishlist cleared.');
    } catch {
      toast.error('Failed to clear wishlist.');
    }
  };

  const isInitialLoading = wishlistLoading || (loadingProducts && items.length > 0);

  return (
    <div className="bg-pure-white text-on-pure-white min-h-[calc(100vh-72px)]">
      <Container className="py-8 lg:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label text-sm text-muted-gray mb-6">
          <Link to="/" className="hover:text-on-pure-white transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-on-pure-white font-semibold">Wishlist</span>
        </nav>

        {/* Page Header */}
        <div className="pb-6 border-b border-outline-subtle mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-pure-white">
              Saved Wishlist.
            </h1>
            <p className="font-body text-base text-muted-gray mt-1">
              Hardware configurations and gear bookmarked for future purchase.
            </p>
          </div>
          {itemCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="font-label text-sm font-semibold text-muted-gray hover:text-red-600 transition-colors self-start sm:self-auto"
            >
              Clear wishlist ({itemCount})
            </button>
          )}
        </div>

        {/* Content Area */}
        {isInitialLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-orange mx-auto mb-3" />
            <p className="font-body text-sm text-muted-gray">Loading your saved hardware...</p>
          </div>
        ) : products.length === 0 ? (
          /* Approved Empty State matching Stitch styling */
          <div className="max-w-md mx-auto p-12 text-center rounded-sm border border-outline-subtle bg-light-gray my-8">
            <div className="w-14 h-14 bg-pure-white border border-outline-subtle rounded-full flex items-center justify-center mx-auto mb-4 text-muted-gray">
              <Heart className="w-7 h-7 text-muted-gray" />
            </div>
            <h2 className="font-headline text-2xl font-bold text-on-pure-white">
              Your wishlist is empty
            </h2>
            <p className="font-body text-sm text-muted-gray mt-2 mb-6 leading-relaxed">
              Save your preferred laptops, audio gear, and monitors as you browse the PATRONET catalogue.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-primary-orange text-deep-black font-label text-sm font-bold hover:bg-primary-orange-hover transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Products</span>
            </Link>
          </div>
        ) : (
          /* 4-Column Structured Retail Grid matching PATRONET catalogue proportions */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {products.map((line) => {
              const product = line.product;

              if (!product) {
                // Safely render stale / missing product card with removal option
                return (
                  <article
                    key={line.productId}
                    className="p-5 rounded-sm border border-outline-subtle bg-light-gray flex flex-col justify-between gap-4"
                  >
                    <div>
                      <p className="font-label text-xs uppercase text-muted-gray">Discontinued</p>
                      <h3 className="font-title text-base font-semibold text-muted-gray mt-1">
                        Product unavailable
                      </h3>
                      <p className="font-body text-xs text-muted-gray mt-1">
                        ID: {line.productId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(line.productId)}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-sm border border-outline-subtle text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </article>
                );
              }

              const imgUrl = getProductPrimaryImageUrl(product);

              return (
                <article
                  key={product.id}
                  className="product-card h-full flex flex-col justify-between gap-4 border border-outline-subtle rounded-sm p-4 bg-pure-white hover:border-deep-black transition-all duration-150"
                >
                  <div className="flex flex-col gap-3">
                    {/* Image Container with Remove Button */}
                    <div className="relative aspect-square w-full bg-light-gray rounded-sm overflow-hidden flex items-center justify-center p-6">
                      <Link to={`/products/${product.id}`} className="w-full h-full flex items-center justify-center">
                        <img
                          src={imgUrl}
                          alt={product.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK_IMAGE;
                          }}
                          className="w-full h-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-200"
                        />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemove(product.id, product.name)}
                        aria-label={`Remove ${product.name} from wishlist`}
                        title="Remove from wishlist"
                        className="absolute top-2.5 right-2.5 inline-flex items-center justify-center w-8 h-8 rounded-full bg-pure-white text-muted-gray hover:text-red-600 shadow-xs transition-colors duration-150"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Brand & Title */}
                    <div className="flex flex-col gap-1">
                      <span className="font-label text-xs uppercase tracking-wider text-muted-gray">
                        {product.brand}
                      </span>
                      <Link to={`/products/${product.id}`}>
                        <h3 className="font-title text-base font-semibold text-deep-black line-clamp-2 hover:text-accent-orange-text transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="pt-1 flex items-baseline gap-2">
                        <span className="font-headline text-lg font-bold tabular-nums text-deep-black">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-xs line-through text-muted-gray">
                            ₹{product.compareAtPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-gray font-medium">
                        {line.isAvailable ? (
                          <span className="text-green-700">In stock</span>
                        ) : (
                          <span className="text-muted-gray">Currently unavailable</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Actions: View Product & Add to Cart */}
                  <div className="pt-3 border-t border-outline-subtle flex items-center gap-2">
                    <Link
                      to={`/products/${product.id}`}
                      className="flex-1 py-2 px-3 rounded-sm border border-outline-subtle bg-pure-white text-on-pure-white font-label text-xs font-semibold hover:border-deep-black text-center transition-colors"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      disabled={!line.isAvailable}
                      onClick={() => handleAddToCart(line)}
                      className="flex-1 py-2 px-3 rounded-sm bg-deep-black text-on-deep-black font-label text-xs font-semibold hover:bg-surface-dark-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{line.isAvailable ? 'Add to Cart' : 'Out of Stock'}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
};
export default WishlistPage;
