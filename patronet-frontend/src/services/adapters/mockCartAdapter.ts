import type { ICartService, CartModel, CartItemModel } from '../api/cartService';

const CART_STORAGE_KEY = 'patronet_cart_v1';

export class MockCartAdapter implements ICartService {
  private readStorage(): CartModel {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) {
        return { items: [], updatedAt: new Date().toISOString() };
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) {
        return { items: [], updatedAt: new Date().toISOString() };
      }

      // Sanitize & validate items
      const validItems: CartItemModel[] = [];
      for (const item of parsed.items) {
        if (
          item &&
          typeof item.productId === 'string' &&
          item.productId.trim() &&
          typeof item.quantity === 'number' &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0
        ) {
          validItems.push({
            productId: item.productId.trim(),
            quantity: item.quantity,
          });
        }
      }

      return {
        items: validItems,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      };
    } catch {
      // Graceful recovery from malformed or unavailable localStorage
      return { items: [], updatedAt: new Date().toISOString() };
    }
  }

  private writeStorage(cart: CartModel): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn('Unable to write to localStorage for cart:', err);
    }
  }

  async getCart(): Promise<CartModel> {
    await new Promise((r) => setTimeout(r, 40));
    return this.readStorage();
  }

  async addItem(productId: string, quantity = 1, _negotiationId?: string): Promise<CartModel> {
    await new Promise((r) => setTimeout(r, 60));
    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      throw new Error('Invalid product ID');
    }
    const safeQty = Math.max(1, Math.floor(quantity || 1));

    const cart = this.readStorage();
    const existingIndex = cart.items.findIndex((i) => i.productId === productId);

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += safeQty;
    } else {
      cart.items.push({ productId, quantity: safeQty });
    }

    cart.updatedAt = new Date().toISOString();
    this.writeStorage(cart);
    return cart;
  }

  async updateQuantity(productId: string, quantity: number): Promise<CartModel> {
    await new Promise((r) => setTimeout(r, 50));
    const safeQty = Math.floor(quantity);
    const cart = this.readStorage();

    if (safeQty <= 0) {
      // Remove item if quantity falls to 0 or below
      cart.items = cart.items.filter((i) => i.productId !== productId);
    } else {
      const existing = cart.items.find((i) => i.productId === productId);
      if (existing) {
        existing.quantity = safeQty;
      }
    }

    cart.updatedAt = new Date().toISOString();
    this.writeStorage(cart);
    return cart;
  }

  async removeItem(productId: string): Promise<CartModel> {
    await new Promise((r) => setTimeout(r, 50));
    const cart = this.readStorage();
    cart.items = cart.items.filter((i) => i.productId !== productId);
    cart.updatedAt = new Date().toISOString();
    this.writeStorage(cart);
    return cart;
  }

  async clearCart(): Promise<CartModel> {
    await new Promise((r) => setTimeout(r, 40));
    const empty: CartModel = { items: [], updatedAt: new Date().toISOString() };
    this.writeStorage(empty);
    return empty;
  }
}
