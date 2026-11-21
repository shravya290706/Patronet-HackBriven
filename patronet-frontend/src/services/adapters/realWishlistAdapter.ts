import type { IWishlistService, WishlistState } from '../api/wishlistService';

/**
 * RealWishlistAdapter
 * Explicit integration boundary for FastAPI backend wishlist endpoints.
 * When real customer auth & backend are wired, this communicates with GET/POST/DELETE /api/v1/wishlist.
 */
export class RealWishlistAdapter implements IWishlistService {
  async getWishlist(): Promise<WishlistState> {
    throw new Error('RealWishlistAdapter: Backend wishlist endpoint not connected.');
  }

  async addItem(_productId: string): Promise<WishlistState> {
    throw new Error('RealWishlistAdapter: Backend wishlist endpoint not connected.');
  }

  async removeItem(_productId: string): Promise<WishlistState> {
    throw new Error('RealWishlistAdapter: Backend wishlist endpoint not connected.');
  }

  async hasItem(_productId: string): Promise<boolean> {
    throw new Error('RealWishlistAdapter: Backend wishlist endpoint not connected.');
  }

  async clearWishlist(): Promise<WishlistState> {
    throw new Error('RealWishlistAdapter: Backend wishlist endpoint not connected.');
  }
}
