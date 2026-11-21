import type { Product, ProductImage } from '@/types';

export const DEFAULT_PRODUCT_FALLBACK_IMAGE = '/images/products/placeholder.svg';

/**
 * Resolves the primary display image URL for a product, handling:
 * 1. product.primaryImage
 * 2. product.images with isPrimary === true (or is_primary from raw API)
 * 3. product.images sorted by sortOrder / display_order
 * 4. Fallback to placeholder if unresolvable or empty
 */
export function getProductPrimaryImageUrl(
  product?: Partial<Product> | null,
  fallback = DEFAULT_PRODUCT_FALLBACK_IMAGE
): string {
  if (!product) return fallback;

  // Direct primaryImage property on Product
  if (product.primaryImage && typeof product.primaryImage === 'string' && product.primaryImage.trim()) {
    return product.primaryImage;
  }

  // Check product.images array
  if (Array.isArray(product.images) && product.images.length > 0) {
    const primaryImg = product.images.find(
      (img: ProductImage & { is_primary?: boolean }) => img.isPrimary || img.is_primary
    );
    if (primaryImg && (primaryImg.url || (primaryImg as unknown as { image_url?: string }).image_url)) {
      return (
        primaryImg.url ||
        (primaryImg as unknown as { image_url: string }).image_url ||
        fallback
      );
    }

    // Sort by sortOrder / display_order
    const sorted = [...product.images].sort((a, b) => {
      const orderA = a.sortOrder ?? (a as unknown as { display_order?: number }).display_order ?? 0;
      const orderB = b.sortOrder ?? (b as unknown as { display_order?: number }).display_order ?? 0;
      return orderA - orderB;
    });

    const first = sorted[0];
    const firstUrl = first.url || (first as unknown as { image_url?: string }).image_url;
    if (firstUrl) return firstUrl;
  }

  return fallback;
}

/**
 * Normalizes all gallery image URLs for a product, honoring:
 * - isPrimary / is_primary precedence
 * - sortOrder / display_order sorting
 * - image_url / url attribute mapping
 */
export function getProductGalleryImageUrls(
  product?: Partial<Product> | null,
  fallback = DEFAULT_PRODUCT_FALLBACK_IMAGE
): string[] {
  if (!product || !Array.isArray(product.images) || product.images.length === 0) {
    const primary = getProductPrimaryImageUrl(product, fallback);
    return [primary];
  }

  const sorted = [...product.images].sort((a, b) => {
    // Primary first
    const isPriA = a.isPrimary || (a as unknown as { is_primary?: boolean }).is_primary;
    const isPriB = b.isPrimary || (b as unknown as { is_primary?: boolean }).is_primary;
    if (isPriA && !isPriB) return -1;
    if (!isPriA && isPriB) return 1;

    // Display order
    const orderA = a.sortOrder ?? (a as unknown as { display_order?: number }).display_order ?? 0;
    const orderB = b.sortOrder ?? (b as unknown as { display_order?: number }).display_order ?? 0;
    return orderA - orderB;
  });

  const urls = sorted
    .map((img) => img.url || (img as unknown as { image_url?: string }).image_url)
    .filter((url): url is string => Boolean(url && typeof url === 'string' && url.trim()));

  return urls.length > 0 ? urls : [fallback];
}
