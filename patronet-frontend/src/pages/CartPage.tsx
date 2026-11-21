import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, AlertCircle, ShoppingCart } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useCart } from "@/context/CartContext";
import { productService } from "@/services";
import { getProductPrimaryImageUrl, DEFAULT_PRODUCT_FALLBACK_IMAGE } from "@/lib/imageUtils";
import { inrToPaise, formatInr, formatPaise } from "@/lib/moneyUtils";
import type { Product } from "@/types";

interface EnrichedCartLine {
  productId: string;
  quantity: number;
  product: Product | null;
  error?: string;
  unitPricePaise: number;
  lineTotalPaise: number;
  isAvailable: boolean;
  stockLimit?: number;
}

export const CartPage: React.FC = () => {
  const { cart, itemCount, loading: cartLoading, updateQuantity, removeItem, clearCart, refreshCart } = useCart();
  const navigate = useNavigate();

  const [enrichedLines, setEnrichedLines] = React.useState<EnrichedCartLine[]>([]);
  const [loadingProducts, setLoadingProducts] = React.useState<boolean>(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Synchronize cart items with live product service
  React.useEffect(() => {
    let active = true;

    async function loadCartProducts() {
      if (!cart.items || cart.items.length === 0) {
        setEnrichedLines([]);
        setLoadingProducts(false);
        setLoadError(null);
        return;
      }

      setLoadingProducts(true);
      setLoadError(null);

      try {
        const lines: EnrichedCartLine[] = await Promise.all(
          cart.items.map(async (item) => {
            try {
              const product = await productService.getProductById(item.productId);
              if (!product) {
                return {
                  productId: item.productId,
                  quantity: item.quantity,
                  product: null,
                  error: "Product specification not found",
                  unitPricePaise: 0,
                  lineTotalPaise: 0,
                  isAvailable: false,
                };
              }

              // Compute stock limits from inventory telemetry if available
              const totalStock = product.inventory && product.inventory.length > 0
                ? product.inventory.reduce((sum, inv) => sum + (inv.quantityOnHand || 0), 0)
                : undefined;

              const isAvailable = product.inventory && product.inventory.length > 0
                ? product.inventory.some((inv) => inv.isAvailable && inv.quantityOnHand > 0)
                : product.isActive;

              // Safe paise-based calculations avoiding IEEE 754 rounding accumulation
              const unitPricePaise = inrToPaise(product.price);
              const lineTotalPaise = unitPricePaise * item.quantity;

              return {
                productId: item.productId,
                quantity: item.quantity,
                product,
                unitPricePaise,
                lineTotalPaise,
                isAvailable,
                stockLimit: totalStock,
              };
            } catch (err) {
              return {
                productId: item.productId,
                quantity: item.quantity,
                product: null,
                error: err instanceof Error ? err.message : "Lookup failed",
                unitPricePaise: 0,
                lineTotalPaise: 0,
                isAvailable: false,
              };
            }
          })
        );

        if (active) {
          setEnrichedLines(lines);
        }
      } catch (err) {
        if (active) {
          setLoadError(err instanceof Error ? err.message : "Failed to load product details for cart");
        }
      } finally {
        if (active) {
          setLoadingProducts(false);
        }
      }
    }

    loadCartProducts();

    return () => {
      active = false;
    };
  }, [cart.items]);

  // Frontend estimated calculations in integer paise
  const { subtotalPaise, hasUnresolvedPrices, hasOutOfStockItems } = React.useMemo(() => {
    let sumPaise = 0;
    let unresolved = false;
    let oos = false;

    for (const line of enrichedLines) {
      if (!line.product || line.error) {
        unresolved = true;
      }
      if (!line.isAvailable) {
        oos = true;
      }
      sumPaise += line.lineTotalPaise;
    }

    return {
      subtotalPaise: sumPaise,
      hasUnresolvedPrices: unresolved,
      hasOutOfStockItems: oos,
    };
  }, [enrichedLines]);

  const handleQtyChange = async (productId: string, currentQty: number, delta: number, limit?: number) => {
    const nextQty = currentQty + delta;
    if (nextQty < 1) return;
    if (limit !== undefined && nextQty > limit) return;
    await updateQuantity(productId, nextQty);
  };

  const handleRemove = async (productId: string) => {
    await removeItem(productId);
  };

  const handleProceedToCheckout = () => {
    if (enrichedLines.length === 0 || hasUnresolvedPrices) return;
    navigate("/checkout");
  };

  const isLoading = cartLoading || loadingProducts;

  return (
    <Container className="py-8">
      {/* 1. Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label text-sm text-muted-gray mb-4">
        <Link to="/" className="hover:text-deep-black transition-colors duration-150">
          Home
        </Link>
        <span aria-hidden="true" className="text-outline-subtle">
          /
        </span>
        <span className="text-deep-black font-medium">Shopping Cart</span>
      </nav>

      {/* 2. Cart Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-outline-subtle mb-8">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-deep-black tracking-tight">
            Your cart.
          </h1>
          <span className="font-label text-sm text-muted-gray tabular-nums">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 font-label text-sm md:text-base font-semibold text-deep-black hover:text-accent-orange-text transition-colors duration-150 shrink-0"
        >
          <span>Continue shopping</span>
          <span className="text-lg">→</span>
        </Link>
      </div>

      {/* Error Banner (if connection or lookup issue) */}
      {loadError && (
        <div
          role="alert"
          className="mb-8 p-4 rounded-sm border border-outline-subtle bg-light-gray flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent-orange-text shrink-0 mt-0.5" />
            <div>
              <p className="font-label text-sm font-semibold text-deep-black">Unable to sync cart updates</p>
              <p className="font-body text-sm text-muted-gray">
                Please check your connection and try again. Your local selections are preserved.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refreshCart()}
            className="px-4 py-2 rounded-sm bg-deep-black text-white font-label text-sm hover:bg-surface-dark-elevated transition-colors shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Cart Contents State */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center min-h-[40vh] border-y border-outline-subtle">
          <LoadingSpinner size="lg" label="Updating your cart..." />
        </div>
      ) : enrichedLines.length === 0 ? (
        /* 3. Empty Cart State matching Stitch specifications */
        <section
          id="empty-cart-state"
          className="py-16 text-center flex flex-col items-center justify-center gap-4 border-y border-outline-subtle"
        >
          <div className="w-16 h-16 rounded-full bg-light-gray flex items-center justify-center text-muted-gray mb-2">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h2 className="font-headline text-2xl md:text-3xl font-bold text-deep-black">
              Your cart is empty.
            </h2>
            <p className="font-body text-base text-muted-gray">
              Discover something worth adding from our calibrated hardware collection.
            </p>
          </div>
          <Link
            to="/products"
            className="mt-4 inline-flex items-center justify-center px-8 py-3.5 rounded-sm bg-primary-orange text-deep-black font-label text-base font-semibold hover:bg-primary-orange-hover active:scale-[0.99] transition-all duration-150"
          >
            Explore products
          </Link>
        </section>
      ) : (
        /* 4. Main Two-Column Cart Layout (~65% Items / ~35% Order Summary) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: Cart Items List (~65% -> 8 cols) */}
          <div className="lg:col-span-8">
            <div className="divide-y divide-outline-subtle border-b border-outline-subtle">
              {enrichedLines.map((line) => {
                const product = line.product;
                const imgUrl = product ? getProductPrimaryImageUrl(product) : DEFAULT_PRODUCT_FALLBACK_IMAGE;

                return (
                  <article
                    key={line.productId}
                    className="py-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between"
                  >
                    {/* Thumbnail and Info */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Product Thumbnail */}
                      <Link
                        to={product ? `/products/${product.id}` : "#"}
                        className="w-24 h-24 sm:w-28 sm:h-28 bg-light-gray rounded-sm p-3 shrink-0 flex items-center justify-center overflow-hidden border border-outline-subtle hover:border-deep-black transition-colors"
                      >
                        <img
                          src={imgUrl}
                          alt={product ? product.name : "Cart hardware"}
                          className="w-full h-full object-contain mix-blend-multiply"
                          onError={(e) => {
                            if (e.currentTarget.src !== DEFAULT_PRODUCT_FALLBACK_IMAGE) {
                              e.currentTarget.src = DEFAULT_PRODUCT_FALLBACK_IMAGE;
                            }
                          }}
                        />
                      </Link>

                      {/* Product Details */}
                      <div className="flex flex-col gap-1 flex-1">
                        {product ? (
                          <>
                            <span className="font-label text-xs uppercase tracking-wider text-muted-gray">
                              {product.brand}
                            </span>
                            <Link
                              to={`/products/${product.id}`}
                              className="font-title text-base sm:text-lg font-semibold text-deep-black hover:text-accent-orange-text transition-colors"
                            >
                              {product.name}
                            </Link>
                            <span className="font-body text-xs sm:text-sm text-muted-gray tabular-nums">
                              Unit price: {formatInr(product.price)}
                            </span>

                            {/* Out-of-stock warning notice if applicable */}
                            {!line.isAvailable && (
                              <p className="inline-flex items-center gap-1 font-label text-xs text-accent-orange-text pt-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Currently out of stock — remove to proceed to checkout</span>
                              </p>
                            )}

                            {/* Stock limit note */}
                            {line.stockLimit !== undefined && line.quantity >= line.stockLimit && (
                              <span className="font-label text-xs text-muted-gray">
                                (Max {line.stockLimit} available units)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="font-label text-xs text-red-500 font-semibold">
                              Product lookup unavailable
                            </span>
                            <span className="font-body text-xs text-muted-gray">
                              ID: {line.productId}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Quantity controls and Line Subtotal */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                      {/* Price subtotal formatted with Intl currency */}
                      <p className="font-headline text-lg sm:text-xl font-bold text-deep-black tabular-nums">
                        {formatPaise(line.lineTotalPaise)}
                      </p>

                      <div className="flex items-center gap-4">
                        {/* Compact Quantity Selector matching Stitch specifications */}
                        <div className="inline-flex items-center border border-outline-subtle rounded-sm bg-light-gray h-9 px-1">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(line.productId, line.quantity, -1)}
                            disabled={line.quantity <= 1}
                            aria-label={`Decrease quantity of ${product?.name || "item"}`}
                            className="w-7 h-7 inline-flex items-center justify-center text-deep-black hover:text-accent-orange-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-label text-sm tabular-nums text-deep-black font-medium">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(line.productId, line.quantity, 1, line.stockLimit)}
                            disabled={line.stockLimit !== undefined && line.quantity >= line.stockLimit}
                            aria-label={`Increase quantity of ${product?.name || "item"}`}
                            className="w-7 h-7 inline-flex items-center justify-center text-deep-black hover:text-accent-orange-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Remove Action Button */}
                        <button
                          type="button"
                          onClick={() => handleRemove(line.productId)}
                          className="font-label text-sm text-muted-gray hover:text-accent-orange-text transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Clear Cart Trigger */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => clearCart()}
                className="font-label text-xs text-muted-gray hover:text-deep-black underline transition-colors cursor-pointer"
              >
                Clear all items
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary Card (~35% -> 4 cols) */}
          <aside
            aria-label="Order summary"
            className="lg:col-span-4 bg-light-gray rounded-sm p-6 lg:p-8 flex flex-col gap-6 border border-outline-subtle sticky top-24"
          >
            <h2 className="font-headline text-xl font-bold text-deep-black">
              Order summary
            </h2>

            <div className="flex flex-col gap-3 pb-6 border-b border-outline-subtle">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-body text-sm text-muted-gray">Subtotal</span>
                <span className="font-title text-base font-semibold text-deep-black tabular-nums">
                  {formatPaise(subtotalPaise)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-body text-sm text-muted-gray">Shipping</span>
                <span className="font-body text-sm text-muted-gray">Calculated at checkout</span>
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <span className="font-title text-lg font-bold text-deep-black">Estimated Total</span>
              <span className="font-headline text-2xl font-bold text-deep-black tabular-nums">
                {formatPaise(subtotalPaise)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                id="checkout-btn"
                onClick={handleProceedToCheckout}
                disabled={hasUnresolvedPrices || hasOutOfStockItems || enrichedLines.length === 0}
                className="w-full py-3.5 px-6 rounded-sm bg-primary-orange text-deep-black font-label text-base font-semibold hover:bg-primary-orange-hover active:scale-[0.99] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm text-center"
              >
                Proceed to Checkout
              </button>
              <p className="font-body text-xs text-muted-gray leading-normal">
                Final availability, taxes, and total will be calculated and confirmed at checkout by the backend.
              </p>
            </div>
          </aside>
        </div>
      )}
    </Container>
  );
};
