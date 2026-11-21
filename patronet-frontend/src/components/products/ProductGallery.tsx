import * as React from "react";
import type { Product, ProductImage } from "@/types";
import { getProductGalleryImageUrls, DEFAULT_PRODUCT_FALLBACK_IMAGE } from "@/lib/imageUtils";

export interface ProductGalleryProps {
  product?: Product;
  images?: ProductImage[];
  fallbackImage?: string;
  productName: string;
  className?: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  product,
  images,
  fallbackImage = DEFAULT_PRODUCT_FALLBACK_IMAGE,
  productName,
  className = "",
}) => {
  // Resolve gallery images from Product abstraction or images prop
  const galleryImages = React.useMemo(() => {
    if (product) {
      return getProductGalleryImageUrls(product, fallbackImage);
    }
    if (images && images.length > 0) {
      return images.map(
        (img: ProductImage & { image_url?: string }) => img.url || img.image_url || fallbackImage
      );
    }
    return [fallbackImage];
  }, [product, images, fallbackImage]);

  const [activeIndex, setActiveIndex] = React.useState<number>(0);
  const [failedIndices, setFailedIndices] = React.useState<Set<number>>(new Set());

  // Reset index when gallery changes
  React.useEffect(() => {
    setActiveIndex(0);
    setFailedIndices(new Set());
  }, [galleryImages]);

  const currentRawUrl = galleryImages[activeIndex] || fallbackImage;
  const isCurrentFailed = failedIndices.has(activeIndex);
  const activeUrl = isCurrentFailed ? fallbackImage : currentRawUrl;

  const handleImageError = (index: number) => {
    setFailedIndices((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  return (
    <div className={`flex flex-col gap-space-md ${className}`}>
      {/* Main Image Card */}
      <div className="relative bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-xl flex flex-col items-center justify-center shadow-sm border border-surface-container/60 overflow-hidden group">
        <div className="relative w-full aspect-square max-w-[440px] my-space-sm flex items-center justify-center overflow-hidden">
          <img
            id="main-product-image"
            src={activeUrl}
            alt={`${productName} view ${activeIndex + 1}`}
            className="w-full h-full object-contain p-2 transition-transform duration-300 ease-out group-hover:scale-105"
            onError={() => handleImageError(activeIndex)}
          />
        </div>
        <div className="text-center font-label-sm text-label-sm text-outline select-none mt-1">
          <span>Image {Math.max(1, activeIndex + 1)} of {galleryImages.length}</span>
        </div>
      </div>

      {/* Selectable Image Thumbnails */}
      {galleryImages.length > 1 && (
        <div role="region" aria-label="Product thumbnails" className="grid grid-cols-4 sm:grid-cols-4 gap-space-sm">
          {galleryImages.map((imgUrl, index) => {
            const isActive = index === activeIndex;
            const isFailed = failedIndices.has(index);
            const thumbSrc = isFailed ? fallbackImage : imgUrl;

            return (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Thumbnail ${index + 1}`}
                className={`relative aspect-square rounded-xl overflow-hidden bg-surface-container-lowest p-1.5 border-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-primary shadow-xs ring-2 ring-primary/20"
                    : "border-surface-container hover:border-outline-variant/60"
                }`}
              >
                <img
                  src={thumbSrc}
                  alt={`${productName} thumbnail ${index + 1}`}
                  className="w-full h-full object-contain p-1"
                  onError={() => handleImageError(index)}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
