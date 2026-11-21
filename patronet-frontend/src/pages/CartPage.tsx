import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, AlertCircle, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
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

  // Handle quantity changes
  const handleQtyChange = async (productId: string, currentQty: number, delta: number, maxLimit?: number) => {
    const nextQty = currentQty + delta;
    if (nextQty <= 0) {
      await removeItem(productId);
      return;
    }
    if (maxLimit !== undefined && nextQty > maxLimit) {
      return;
    }
    await updateQuantity(productId, nextQty);
  };

  const handleRemove = async (productId: string) => {
    await removeItem(productId);
  };

  const handleProceedToCheckout = () => {
    navigate("/checkout");
  };

  // Derive subtotal safely
  const subtotalPaise = enrichedLines.reduce((acc, line) => acc + line.lineTotalPaise, 0);
  const hasOutOfStockItems = enrichedLines.some((line) => !line.isAvailable);
  const hasUnresolvedPrices = enrichedLines.some((line) => !line.product);

  const isLoading = cartLoading || loadingProducts;

  return (
    <div className="py-space-xl">
      <Container>
        {/* Header */}
        <div className="mb-space-lg">
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold">Shopping Cart</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Review your selected items and proceed to checkout.
          </p>
        </div>

        {/* Global Cart Error Banner */}
        {loadError && (
          <div className="mb-space-md p-space-md bg-error-container text-error rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-body-md text-body-md">{loadError}</span>
            </div>
            <button
              type="button"
              onClick={() => refreshCart()}
              className="text-label-md font-bold underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" label="Synchronizing cart..." />
          </div>
        ) : enrichedLines.length === 0 ? (
          /* Empty Cart State */
          <div className="rounded-xl border border-surface-container bg-surface-container-lowest p-space-xl text-center max-w-xl mx-auto shadow-xs">
            <ShoppingCart className="h-12 w-12 mx-auto text-outline" />
            <h2 className="font-title-md text-title-md text-on-surface font-semibold mt-space-sm">
              Your shopping cart is empty
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Explore our catalogue to discover electronics and everyday essentials.
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
          /* Main Two-Column Cart Layout (Items + Summary) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
            {/* Items Column (8 cols) */}
            <div className="lg:col-span-8 space-y-space-md">
              <div className="space-y-space-sm">
                {enrichedLines.map((line) => {
                  const product = line.product;
                  const imgUrl = product ? getProductPrimaryImageUrl(product) : DEFAULT_PRODUCT_FALLBACK_IMAGE;

                  return (
                    <article
                      key={line.productId}
                      className="bg-surface-container-lowest rounded-xl p-space-md border border-surface-container/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-start gap-space-md flex-1 min-w-0">
                        <Link
                          to={product ? `/products/${product.id}` : "#"}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg bg-surface-container-low shrink-0 flex items-center justify-center p-2 border border-surface-container"
                        >
                          <img
                            src={imgUrl}
                            alt={product ? product.name : "Product"}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              if (e.currentTarget.src !== DEFAULT_PRODUCT_FALLBACK_IMAGE) {
                                e.currentTarget.src = DEFAULT_PRODUCT_FALLBACK_IMAGE;
                              }
                            }}
                          />
                        </Link>

                        <div className="flex-1 min-w-0">
                          {product ? (
                            <>
                              <Link
                                to={`/products/${product.id}`}
                                className="font-title-md text-title-md text-on-surface font-semibold hover:text-primary transition-colors line-clamp-2"
                              >
                                {product.name}
                              </Link>
                              <p className="text-body-sm text-outline mt-0.5">
                                {product.brand || product.sku}
                              </p>
                              <p className="font-title-md text-primary font-bold mt-1.5">
                                {formatInr(product.price)}
                              </p>
                              <p className="text-body-sm text-on-surface-variant">
                                Line total: {formatPaise(line.lineTotalPaise)}
                              </p>

                              {!line.isAvailable && (
                                <p className="inline-flex items-center gap-1 text-xs text-error font-medium pt-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>Currently out of stock — remove to proceed to checkout</span>
                                </p>
                              )}
                            </>
                          ) : (
                            <div>
                              <p className="text-xs text-error font-semibold">Product lookup unavailable</p>
                              <p className="text-xs text-outline">ID: {line.productId}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls & Delete */}
                      <div className="flex items-center justify-between sm:justify-end gap-space-md w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-container/60">
                        <div className="flex items-center rounded-lg border border-surface-container bg-surface-container-low">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={line.quantity <= 1}
                            onClick={() => handleQtyChange(line.productId, line.quantity, -1)}
                            className="p-2 text-primary hover:bg-surface-variant rounded-l-lg disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-8 text-center font-label-md text-label-md font-semibold text-on-surface px-1">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={line.stockLimit !== undefined && line.quantity >= line.stockLimit}
                            onClick={() => handleQtyChange(line.productId, line.quantity, 1, line.stockLimit)}
                            className="p-2 text-primary hover:bg-surface-variant rounded-r-lg disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          aria-label={`Remove ${product?.name || "item"}`}
                          onClick={() => handleRemove(line.productId)}
                          className="p-2 text-error hover:bg-error-container/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Clear Cart Trigger */}
              <div className="pt-space-xs flex justify-end">
                <button
                  type="button"
                  onClick={() => clearCart()}
                  className="font-label-md text-body-sm text-outline hover:text-error transition-colors cursor-pointer underline"
                >
                  Clear all items
                </button>
              </div>
            </div>

            {/* Order Summary Sidebar (4 cols) */}
            <aside className="lg:col-span-4 rounded-xl border border-surface-container bg-surface-container-lowest p-space-md sm:p-space-lg space-y-space-md shadow-xs sticky top-[136px]">
              <h2 className="font-title-md text-title-md font-bold text-primary pb-2 border-b border-surface-container">
                Order Summary
              </h2>

              <div className="space-y-2 py-2">
                <div className="flex justify-between text-body-md text-on-surface">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
                  <strong className="text-primary font-bold">{formatPaise(subtotalPaise)}</strong>
                </div>
                <div className="flex justify-between text-body-sm text-outline">
                  <span>Estimated Delivery</span>
                  <span>Free</span>
                </div>
              </div>

              <div className="border-t border-surface-container pt-space-sm">
                <div className="flex justify-between items-baseline">
                  <span className="font-title-md font-bold text-on-surface">Estimated Total</span>
                  <span className="font-headline-sm text-headline-sm font-bold text-primary">
                    {formatPaise(subtotalPaise)}
                  </span>
                </div>
                <p className="text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                  Shipping and any applicable charges are confirmed at checkout.
                </p>
              </div>

              <button
                type="button"
                id="checkout-btn"
                onClick={handleProceedToCheckout}
                disabled={hasUnresolvedPrices || hasOutOfStockItems || enrichedLines.length === 0}
                className="w-full rounded-lg bg-primary px-space-md py-3 text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Checkout
              </button>
            </aside>
          </div>
        )}
      </Container>
    </div>
  );
};
