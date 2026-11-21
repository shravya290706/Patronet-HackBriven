import type { ICartService, CartModel, CartItemModel } from '../api/cartService';
import { apiClient, getAuthToken, ApiError } from '../api/client';

export interface BackendCartItem {
  product_id: string;
  name: string;
  sku: string;
  brand?: string | null;
  image_url?: string | null;
  price: number | string;
  quantity: number;
  subtotal: number | string;
}

export interface BackendCartResponse {
  cart_id?: string | null;
  status: string;
  items: BackendCartItem[];
  total_items: number;
  total_quantity: number;
  cart_total: number | string;
}

function mapBackendCartToFrontend(response: BackendCartResponse): CartModel {
  const items: CartItemModel[] = (response?.items || []).map((it) => ({
    productId: String(it.product_id),
    quantity: Number(it.quantity || 1),
  }));

  return {
    items,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * RealCartAdapter
 * 
 * Genuine database-backed shopping cart adapter communicating with FastAPI backend:
 * - GET    /api/v1/cart
 * - POST   /api/v1/cart/items
 * - PATCH  /api/v1/cart/items/{product_id}
 * - DELETE /api/v1/cart/items/{product_id}
 * - DELETE /api/v1/cart
 */
export class RealCartAdapter implements ICartService {
  /**
   * Retrieve the authenticated customer's cart from PostgreSQL.
   */
  async getCart(): Promise<CartModel> {
    const token = getAuthToken();
    if (!token) {
      return { items: [], updatedAt: new Date().toISOString() };
    }

    try {
      const response = await apiClient<BackendCartResponse>('/cart');
      return mapBackendCartToFrontend(response);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return { items: [], updatedAt: new Date().toISOString() };
      }
      throw err;
    }
  }

  /**
   * Add a product to the cart or increment quantity if already present.
   * Optionally accepts a verified negotiation_id for negotiated price execution.
   */
  async addItem(productId: string, quantity = 1, negotiationId?: string): Promise<CartModel> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Please sign in to add items to your cart.');
    }

    const cleanId = (productId || '').trim();
    if (!cleanId) {
      throw new Error('Invalid product ID');
    }

    const safeQty = Math.max(1, Math.floor(quantity || 1));

    const payload: Record<string, unknown> = {
      product_id: cleanId,
      quantity: safeQty,
    };
    if (negotiationId) {
      payload.negotiation_id = negotiationId;
    }

    const response = await apiClient<BackendCartResponse>('/cart/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return mapBackendCartToFrontend(response);
  }

  /**
   * Update the quantity of an existing item in the cart.
   */
  async updateQuantity(productId: string, quantity: number): Promise<CartModel> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Please sign in to modify your cart.');
    }

    const cleanId = (productId || '').trim();
    if (!cleanId) {
      throw new Error('Invalid product ID');
    }

    const safeQty = Math.max(1, Math.floor(quantity));

    const response = await apiClient<BackendCartResponse>(`/cart/items/${cleanId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        quantity: safeQty,
      }),
    });

    return mapBackendCartToFrontend(response);
  }

  /**
   * Remove a specific product from the customer's cart.
   */
  async removeItem(productId: string): Promise<CartModel> {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Please sign in to modify your cart.');
    }

    const cleanId = (productId || '').trim();
    if (!cleanId) {
      throw new Error('Invalid product ID');
    }

    const response = await apiClient<BackendCartResponse>(`/cart/items/${cleanId}`, {
      method: 'DELETE',
    });

    return mapBackendCartToFrontend(response);
  }

  /**
   * Clear all items from the customer's cart in PostgreSQL.
   */
  async clearCart(): Promise<CartModel> {
    const token = getAuthToken();
    if (!token) {
      return { items: [], updatedAt: new Date().toISOString() };
    }

    const response = await apiClient<BackendCartResponse>('/cart', {
      method: 'DELETE',
    });

    return mapBackendCartToFrontend(response);
  }
}
