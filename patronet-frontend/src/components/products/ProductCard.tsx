import * as React from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import type { Product } from "@/types";
import { getProductPrimaryImageUrl, DEFAULT_PRODUCT_FALLBACK_IMAGE } from "@/lib/imageUtils";
import { useWishlist } from "@/context/WishlistContext";

export interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;
  isCompared?: boolean;
  onToggleCompare?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted: propIsWishlisted,
  onToggleWishlist,
  isCompared = false,
  onToggleCompare,
  onAddToCart,
}) => {
  const { isWishlisted: contextIsWishlisted, toggleWishlist: contextToggleWishlist } = useWishlist();

  // Use prop if provided, else fallback to global WishlistContext
  const activeIsWishlisted = propIsWishlisted !== undefined ? propIsWishlisted : contextIsWishlisted(product.id);

  const isAvailable = product.inventory && product.inventory.length > 0
    ? product.inventory.some((i) => i.isAvailable && i.quantityOnHand > 0)
    : product.isActive;

  const [hasError, setHasError] = React.useState<boolean>(false);
  const [prevProductId, setPrevProductId] = React.useState<string>(product.id);

  // Derived state adjustment pattern recommended by React docs for props change:
  if (product.id !== prevProductId) {
    setPrevProductId(product.id);
    setHasError(false);
  }

  const handleImageError = () => {
    setHasError(true);
  };

  const imgSrc = hasError ? DEFAULT_PRODUCT_FALLBACK_IMAGE : getProductPrimaryImageUrl(product);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    } else {
      contextToggleWishlist(product.id);
    }
  };

  return (
    <article className="product-card h-full flex flex-col justify-between gap-4 border border-transparent hover:border-outline-subtle rounded-sm p-2 transition-all duration-150 bg-pure-white">
      <div className="flex flex-col gap-3">
        {/* Image Container with Wishlist Button */}
        <div className="relative aspect-square w-full bg-light-gray rounded-sm overflow-hidden flex items-center justify-center p-6">
          <Link to={`/products/${product.id}`} className="w-full h-full flex items-center justify-center">
            <img
              src={imgSrc}
              alt={product.name}
              onError={handleImageError}
              className="w-full h-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          </Link>
          <button
            type="button"
            onClick={handleHeartClick}
            aria-label={activeIsWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={activeIsWishlisted}
            title={activeIsWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-pure-white text-muted-gray hover:text-deep-black shadow-sm transition-colors duration-150 cursor-pointer z-10"
          >
            <Heart
              className={`w-4.5 h-4.5 transition-colors duration-150 ${
                activeIsWishlisted
                  ? "fill-primary-orange text-primary-orange"
                  : "hover:fill-muted-gray hover:text-deep-black"
              }`}
            />
          </button>
        </div>

        {/* Product Details */}
        <div className="flex flex-col gap-1">
          <Link to={`/products/${product.id}`} className="group">
            <h3 className="font-headline text-base font-semibold text-on-pure-white group-hover:text-accent-orange-text transition-colors duration-150 line-clamp-2">
              {product.name}
            </h3>
          </Link>

          <p className="font-body text-xs text-muted-gray line-clamp-2">
            {product.description}
          </p>
        </div>
      </div>

      {/* Pricing & Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-lg font-bold text-on-pure-white">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="font-body text-xs text-muted-gray line-through">
                ₹{product.compareAtPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>
          <span
            className={`font-label text-xs ${
              isAvailable ? "text-muted-gray" : "text-signal-error"
            }`}
          >
            {isAvailable ? "In stock" : "Out of stock"}
          </span>
        </div>

        {/* Action Row: Add to Cart and Compare Checkbox */}
        <div className="flex items-center gap-2">
          {onAddToCart && (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={!isAvailable}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-deep-black hover:bg-neutral-800 disabled:bg-light-gray disabled:text-muted-gray disabled:cursor-not-allowed text-pure-white text-xs font-medium rounded-sm transition-colors duration-150 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
          )}

          {onToggleCompare && (
            <button
              type="button"
              onClick={() => onToggleCompare(product)}
              aria-label={isCompared ? `Remove ${product.name} from comparison` : `Add ${product.name} to comparison`}
              aria-pressed={isCompared}
              className={`inline-flex items-center justify-center px-2 py-2 border rounded-sm text-xs font-medium transition-colors duration-150 cursor-pointer ${
                isCompared
                  ? "bg-primary-orange border-primary-orange text-deep-black font-semibold"
                  : "border-outline-subtle hover:border-deep-black text-on-pure-white bg-pure-white"
              }`}
            >
              {isCompared ? "Compared" : "Compare"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
