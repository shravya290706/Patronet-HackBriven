import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Plus, Heart, Check, Scale } from "lucide-react";
import type { Product } from "@/types";
import { getProductPrimaryImageUrl, DEFAULT_PRODUCT_FALLBACK_IMAGE } from "@/lib/imageUtils";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useComparison } from "@/context/ComparisonContext";

export interface ProductCardProps {
  product: Product;
  className?: string;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: string) => void;
  onAddToCart?: (product: Product) => void;
  isCompared?: boolean;
  onToggleCompare?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className = "",
  isWishlisted: propIsWishlisted,
  onToggleWishlist: propToggleWishlist,
  onAddToCart: propAddToCart,
  isCompared: propIsCompared,
  onToggleCompare: propToggleCompare,
  onViewDetails: propViewDetails,
}) => {
  const navigate = useNavigate();
  const { isWishlisted: contextIsWishlisted, toggleWishlist: contextToggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const { isCompared, addToCompare, removeFromCompare } = useComparison();

  const [isAdding, setIsAdding] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const activeIsWishlisted =
    propIsWishlisted !== undefined ? propIsWishlisted : contextIsWishlisted(product.id);

  const compared = propIsCompared !== undefined ? propIsCompared : isCompared(product.id);

  const imageUrl = getProductPrimaryImageUrl(product);
  const [imgSrc, setImgSrc] = React.useState<string>(imageUrl);

  React.useEffect(() => {
    setImgSrc(getProductPrimaryImageUrl(product));
  }, [product]);

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(product.price);

  const categoryName =
    typeof product.category === "string"
      ? product.category
      : product.category?.name || (product as { categoryName?: string }).categoryName || "";

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (propToggleCompare) {
      propToggleCompare(product);
    } else if (compared) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  const handleHeartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (propToggleWishlist) {
      propToggleWishlist(product.id);
    } else {
      contextToggleWishlist(product.id);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding) return;
    setIsAdding(true);
    setFeedback(null);
    try {
      if (propAddToCart) {
        propAddToCart(product);
      } else {
        await addItem(product.id, 1);
      }
      setFeedback("Added to your cart.");
      setTimeout(() => setFeedback(null), 2500);
    } catch {
      setFeedback("Could not add item.");
      setTimeout(() => setFeedback(null), 2500);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <article
      className={`group bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between relative border border-surface-container/60 ${className}`}
    >
      <div>
        {/* Image Container with + Compare and Wishlist Heart */}
        <div className="relative w-full aspect-square bg-surface-container-low rounded-lg overflow-hidden mb-space-sm flex items-center justify-center">
          {/* Compare Button */}
          <button
            type="button"
            onClick={handleToggleCompare}
            aria-label={compared ? "Remove from comparison" : "Add to compare"}
            aria-pressed={compared}
            title={compared ? "Remove from compare" : "Click to compare up to 4 items"}
            className={`absolute top-2 left-2 z-20 h-7.5 rounded-lg px-2.5 py-1 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer select-none ${
              compared
                ? "bg-primary text-on-primary ring-2 ring-primary/40 shadow-md"
                : "bg-surface-container-lowest/95 text-on-surface hover:text-primary hover:bg-surface-container-lowest border border-surface-container-high/80"
            }`}
          >
            {compared ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Compared</span>
              </>
            ) : (
              <>
                <Scale className="h-3.5 w-3.5" />
                <span>+ Compare</span>
              </>
            )}
          </button>

          {/* Product Image Link */}
          <Link
            to={`/products/${product.id}`}
            aria-label={`View ${product.name}`}
            className="w-full h-full flex items-center justify-center cursor-pointer"
          >
            <img
              src={imgSrc}
              alt={product.name}
              onError={() => setImgSrc(DEFAULT_PRODUCT_FALLBACK_IMAGE)}
              className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </Link>

          {/* Wishlist Heart Button */}
          <button
            type="button"
            onClick={handleHeartClick}
            aria-label={activeIsWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={activeIsWishlisted}
            className="absolute top-2 right-2 rounded-full bg-surface-container-lowest/90 p-2 text-outline shadow-sm transition-colors hover:text-primary cursor-pointer z-20"
          >
            <Heart
              className={`h-4 w-4 ${
                activeIsWishlisted ? "fill-primary text-primary" : "text-outline"
              }`}
            />
          </button>
        </div>

        {/* Brand & Category Row */}
        <div className="flex items-center justify-between gap-1 mb-1">
          {product.brand && (
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
              {product.brand}
            </span>
          )}
          {categoryName && (
            <span className="font-label-sm text-label-sm text-outline truncate">
              {categoryName}
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3 className="font-title-md text-title-md text-on-surface font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          <Link to={`/products/${product.id}`} className="cursor-pointer">
            {product.name}
          </Link>
        </h3>

        {/* SKU */}
        <div className="flex items-center justify-between text-label-sm text-label-sm text-outline my-1.5">
          <span>SKU: {product.sku}</span>
        </div>

        {/* Price in ₹ */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-headline-sm text-headline-sm font-bold text-primary">
            {formattedPrice}
          </span>
        </div>
      </div>

      {/* Bottom Action Buttons: Details & + Add */}
      <div>
        <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2 border-t border-surface-container/50">
          <button
            type="button"
            onClick={() => {
              if (propViewDetails) {
                propViewDetails(product);
              } else {
                navigate(`/products/${product.id}`);
              }
            }}
            className="w-full py-2 px-2 rounded-lg bg-surface-container-low hover:bg-primary-fixed text-primary font-label-md text-label-md transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Details</span>
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-full py-2 px-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isAdding ? "Adding…" : "+ Add"}</span>
          </button>
        </div>

        {/* Status Feedback */}
        {feedback && (
          <p role="status" className="mt-1 text-center text-label-sm text-primary font-medium">
            {feedback}
          </p>
        )}
      </div>
    </article>
  );
};
