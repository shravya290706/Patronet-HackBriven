export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export interface WishlistState {
  items: WishlistItem[];
  updatedAt: string;
}

export interface IWishlistService {
  getWishlist(): Promise<WishlistState>;
  addItem(productId: string): Promise<WishlistState>;
  removeItem(productId: string): Promise<WishlistState>;
  hasItem(productId: string): Promise<boolean>;
  clearWishlist(): Promise<WishlistState>;
}
