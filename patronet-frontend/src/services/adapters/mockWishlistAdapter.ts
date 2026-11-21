import type { IWishlistService, WishlistState, WishlistItem } from '../api/wishlistService';
import type { IProductService } from '../api/productService';

const WISHLIST_STORAGE_KEY = 'patronet_wishlist_v1';

export class MockWishlistAdapter implements IWishlistService {
  constructor(_productService: IProductService) {}

  private readStorage(): WishlistState {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (!raw) {
        return { items: [], updatedAt: new Date().toISOString() };
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) {
        return { items: [], updatedAt: new Date().toISOString() };
      }

      const validItems: WishlistItem[] = [];
      const seen = new Set<string>();

      for (const item of parsed.items) {
        if (
          item &&
          typeof item.productId === 'string' &&
          item.productId.trim() &&
          !seen.has(item.productId.trim())
        ) {
          seen.add(item.productId.trim());
          validItems.push({
            productId: item.productId.trim(),
            addedAt: typeof item.addedAt === 'string' ? item.addedAt : new Date().toISOString(),
          });
        }
      }

      return {
        items: validItems,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      };
    } catch {
      return { items: [], updatedAt: new Date().toISOString() };
    }
  }

  private writeStorage(state: WishlistState): void {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Unable to write to localStorage for wishlist:', err);
    }
  }

  async getWishlist(): Promise<WishlistState> {
    await new Promise((r) => setTimeout(r, 20));
    return this.readStorage();
  }

  async addItem(productId: string): Promise<WishlistState> {
    await new Promise((r) => setTimeout(r, 40));
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      throw new Error('Invalid product ID');
    }
    const cleanId = productId.trim();
    const state = this.readStorage();

    if (!state.items.some((i) => i.productId === cleanId)) {
      state.items.unshift({
        productId: cleanId,
        addedAt: new Date().toISOString(),
      });
      state.updatedAt = new Date().toISOString();
      this.writeStorage(state);
    }

    return state;
  }

  async removeItem(productId: string): Promise<WishlistState> {
    await new Promise((r) => setTimeout(r, 40));
    const cleanId = (productId || '').trim();
    const state = this.readStorage();

    const filtered = state.items.filter((i) => i.productId !== cleanId);
    state.items = filtered;
    state.updatedAt = new Date().toISOString();
    this.writeStorage(state);

    return state;
  }

  async hasItem(productId: string): Promise<boolean> {
    const cleanId = (productId || '').trim();
    const state = this.readStorage();
    return state.items.some((i) => i.productId === cleanId);
  }

  async clearWishlist(): Promise<WishlistState> {
    await new Promise((r) => setTimeout(r, 20));
    const state: WishlistState = { items: [], updatedAt: new Date().toISOString() };
    this.writeStorage(state);
    return state;
  }
}
