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

  const initialImageUrl = getProductPrimaryImageUrl(product);
  const [imgSrc, setImgSrc] = React.useState<string>(initialImageUrl);
  const [hasError, setHasError] = React.useState<boolean>(false);

  React.useEffect(() => {
    setImgSrc(getProductPrimaryImageUrl(product));
    setHasError(false);
  }, [product]);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(DEFAULT_PRODUCT_FALLBACK_IMAGE);
    }
  };

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
              className={`w-4 h-4 ${
                activeIsWishlisted ? "fill-primary-orange text-primary-orange" : "text-muted-gray"
              }`}
            />
          </button>
        </div>

        {/* Brand & Title */}
        <div className="flex flex-col gap-1">
          <span className="font-label text-xs uppercase tracking-wider text-muted-gray">
            {product.brand}
          </span>
          <Link to={`/products/${product.id}`}>
            <h3 className="font-title text-base font-semibold text-deep-black line-clamp-2 hover:text-accent-orange-text transition-colors duration-150">
              {product.name}
            </h3>
          </Link>
          <div className="pt-1 flex items-baseline gap-2">
            <span className="font-headline text-lg font-bold tabular-nums text-deep-black">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs line-through text-muted-gray">
                ₹{product.compareAtPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Controls: Compare Checkbox & Add to Cart */}
      <footer className="flex items-center justify-between gap-2 pt-3 border-t border-outline-subtle">
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isCompared}
            onChange={() => onToggleCompare?.(product)}
            className="rounded-sm border-outline-subtle text-deep-black focus:ring-deep-black"
          />
          <span className="font-label text-xs text-muted-gray">Compare</span>
        </label>
        <button
          type="button"
          disabled={!isAvailable}
          onClick={() => onAddToCart?.(product)}
          aria-label={`Add ${product.name} to cart`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-deep-black text-on-deep-black font-label text-xs font-semibold hover:bg-surface-dark-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{isAvailable ? "Add" : "Unavailable"}</span>
        </button>
      </footer>
    </article>
  );
};
