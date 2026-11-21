import type { IWishlistService, WishlistState, WishlistItem } from '../api/wishlistService';
import { apiClient, getAuthToken, ApiError } from '../api/client';

export interface BackendWishlistItem {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  brand?: string | null;
  price: number | string;
  image_url?: string | null;
  added_at: string;
}

export interface BackendWishlistResponse {
  items: BackendWishlistItem[];
  total_items: number;
  updated_at?: string;
}

function mapBackendWishlistToFrontend(response: BackendWishlistResponse): WishlistState {
  const items: WishlistItem[] = (response?.items || []).map((it) => ({
    productId: String(it.product_id),
    addedAt: typeof it.added_at === 'string' ? it.added_at : new Date().toISOString(),
  }));

  return {
    items,
    updatedAt: response?.updated_at || new Date().toISOString(),
  };
}

/**
 * RealWishlistAdapter
 *
 * Genuine database-backed customer wishlist adapter communicating with FastAPI backend:
 * - GET    /api/v1/wishlist
 * - POST   /api/v1/wishlist/items
 * - DELETE /api/v1/wishlist/items/{product_id}
 * - DELETE /api/v1/wishlist
 */
export class RealWishlistAdapter implements IWishlistService {
  /**
   * Retrieve the authenticated customer's wishlist from PostgreSQL.
   */
  async getWishlist(): Promise<WishlistState> {
    const token = getAuthToken();
    if (!token) {
      return { items: [], updatedAt: new Date().toISOString() };
    }

    try {
      const response = await apiClient<BackendWishlistResponse>('/wishlist');
      return mapBackendWishlistToFrontend(response);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return { items: [], updatedAt: new Date().toISOString() };
      }
      throw err;
    }
  }

  /**
   * Add a product to the customer's wishlist in PostgreSQL.
   */
  async addItem(productId: string): Promise<WishlistState> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Please sign in to save items to your wishlist.');
    }

    const cleanId = (productId || '').trim();
    if (!cleanId) {
      throw new Error('Invalid product ID');
    }

    const response = await apiClient<BackendWishlistResponse>('/wishlist/items', {
      method: 'POST',
      body: JSON.stringify({
        product_id: cleanId,
      }),
    });

    return mapBackendWishlistToFrontend(response);
  }

  /**
   * Remove a specific product from the customer's wishlist in PostgreSQL.
   */
  async removeItem(productId: string): Promise<WishlistState> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Please sign in to modify your wishlist.');
    }

    const cleanId = (productId || '').trim();
    if (!cleanId) {
      throw new Error('Invalid product ID');
    }

    const response = await apiClient<BackendWishlistResponse>(`/wishlist/items/${cleanId}`, {
      method: 'DELETE',
    });

    return mapBackendWishlistToFrontend(response);
  }

  /**
   * Check whether a product is currently wishlisted.
   */
  async hasItem(productId: string): Promise<boolean> {
    const cleanId = (productId || '').trim();
    if (!cleanId) return false;
    const state = await this.getWishlist();
    return state.items.some((i) => i.productId === cleanId);
  }

  /**
   * Clear all items from the customer's wishlist in PostgreSQL.
   */
  async clearWishlist(): Promise<WishlistState> {
    const token = getAuthToken();
    if (!token) {
      return { items: [], updatedAt: new Date().toISOString() };
    }

    const response = await apiClient<BackendWishlistResponse>('/wishlist', {
      method: 'DELETE',
    });

    return mapBackendWishlistToFrontend(response);
  }
}
