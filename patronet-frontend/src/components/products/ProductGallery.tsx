import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product, ProductImage } from "@/types";
import { getProductGalleryImageUrls, DEFAULT_PRODUCT_FALLBACK_IMAGE } from "@/lib/imageUtils";

export interface ProductGalleryProps {
  product?: Product;
  images?: ProductImage[];
  fallbackImage?: string;
  productName: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  product,
  images,
  fallbackImage = DEFAULT_PRODUCT_FALLBACK_IMAGE,
  productName,
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

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
  };

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
    <div className="flex flex-col gap-4">
      {/* Main Image Display */}
      <div className="relative aspect-[5/4] w-full bg-light-gray rounded-sm overflow-hidden flex items-center justify-center p-6 sm:p-10 border border-outline-subtle">
        <img
          id="main-product-image"
          src={activeUrl}
          alt={`${productName} — View ${activeIndex + 1}`}
          className="w-full h-full object-contain mix-blend-multiply transition-all duration-200"
          onError={() => handleImageError(activeIndex)}
        />

        {galleryImages.length > 1 && (
          <>
            {/* Prev Button */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous product image"
              className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-pure-white border border-outline-subtle text-on-pure-white hover:border-deep-black shadow-sm transition-colors duration-150 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-deep-black" />
            </button>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next product image"
              className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-pure-white border border-outline-subtle text-on-pure-white hover:border-deep-black shadow-sm transition-colors duration-150 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 text-deep-black" />
            </button>
          </>
        )}
      </div>

      {/* Selectable Image Thumbnails */}
      {galleryImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {galleryImages.map((imgUrl, idx) => {
            const isSelected = idx === activeIndex;
            const thumbUrl = failedIndices.has(idx) ? fallbackImage : imgUrl;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`View image ${idx + 1}`}
                aria-pressed={isSelected}
                className={`gallery-thumb aspect-square bg-light-gray rounded-sm p-2 overflow-hidden transition-all duration-150 cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? "border-2 border-deep-black"
                    : "border border-outline-subtle hover:border-deep-black"
                }`}
              >
                <img
                  src={thumbUrl}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  className="w-full h-full object-contain mix-blend-multiply"
                  onError={() => handleImageError(idx)}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
