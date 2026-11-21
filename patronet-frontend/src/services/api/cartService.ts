import type { Product } from '../../types';

export interface CartItemModel {
  productId: string;
  quantity: number;
}

export interface PopulatedCartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface CartModel {
  items: CartItemModel[];
  updatedAt: string;
}

export interface ICartService {
  getCart(): Promise<CartModel>;
  addItem(productId: string, quantity?: number, negotiationId?: string): Promise<CartModel>;
  updateQuantity(productId: string, quantity: number): Promise<CartModel>;
  removeItem(productId: string): Promise<CartModel>;
  clearCart(): Promise<CartModel>;
}
