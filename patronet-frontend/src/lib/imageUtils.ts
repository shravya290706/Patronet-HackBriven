import type { Product, ProductImage } from '@/types';
import {
  resolveProductImageUrl,
  resolveProductGalleryUrls,
  resolveCategoryImageUrl,
  DEFAULT_FALLBACK_IMAGE,
  isPlaceholderUrl,
} from './productImageCatalog';

export const DEFAULT_PRODUCT_FALLBACK_IMAGE = DEFAULT_FALLBACK_IMAGE;

export function isPlaceholderOrSvg(url?: string | null): boolean {
  return isPlaceholderUrl(url);
}

export { resolveCategoryImageUrl };

/**
 * Resolves the primary display image URL for a product, handling:
 * 1. Real non-placeholder primary image (if valid)
 * 2. Deterministic keyword match on product name
 * 3. Category image pool
 * 4. High-definition studio fallback
 */
export function getProductPrimaryImageUrl(
  product?: Partial<Product> | null,
  fallback = DEFAULT_FALLBACK_IMAGE
): string {
  if (!product) return fallback;

  const rawUrl =
    (typeof product.primaryImage === 'string' && product.primaryImage.trim() ? product.primaryImage : null) ||
    (Array.isArray(product.images) && product.images.length > 0
      ? (product.images.find((img: ProductImage & { is_primary?: boolean }) => img.isPrimary || img.is_primary)?.url ||
         (product.images[0] as { url?: string; image_url?: string })?.url ||
         (product.images[0] as { url?: string; image_url?: string })?.image_url)
      : null);

  const categoryName =
    typeof product.category === 'string'
      ? product.category
      : product.category?.name || (product as { categoryName?: string })?.categoryName || null;

  return resolveProductImageUrl(
    rawUrl,
    categoryName,
    product.sku || product.id,
    0,
    product.name
  );
}

/**
 * Normalizes all gallery image URLs for a product
 */
export function getProductGalleryImageUrls(
  product?: Partial<Product> | null,
  fallback = DEFAULT_FALLBACK_IMAGE
): string[] {
  if (!product) return [fallback];

  const primary = getProductPrimaryImageUrl(product, fallback);

  const rawUrls = Array.isArray(product.images)
    ? product.images
        .map((img) => img.url || (img as unknown as { image_url?: string })?.image_url)
        .filter((u): u is string => Boolean(u && typeof u === 'string'))
    : undefined;

  const categoryName =
    typeof product.category === 'string'
      ? product.category
      : product.category?.name || (product as { categoryName?: string })?.categoryName || null;

  return resolveProductGalleryUrls(
    rawUrls,
    primary,
    categoryName,
    product.sku || product.id,
    product.name
  );
}
