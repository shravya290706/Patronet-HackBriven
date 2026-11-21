import type { ICartService, CartModel } from '../api/cartService';

/**
 * RealCartAdapter
 * 
 * Boundary for integration with the teammate's FastAPI backend.
 * Unconfirmed endpoints remain explicitly unimplemented with clear diagnostic errors
 * to avoid guessing backend routing contracts or auth schemes.
 */
export class RealCartAdapter implements ICartService {
  async getCart(): Promise<CartModel> {
    throw new Error('RealCartAdapter.getCart is not yet implemented. FastAPI cart endpoints pending.');
  }

  async addItem(_productId: string, _quantity?: number): Promise<CartModel> {
    throw new Error('RealCartAdapter.addItem is not yet implemented. FastAPI cart endpoints pending.');
  }

  async updateQuantity(_productId: string, _quantity: number): Promise<CartModel> {
    throw new Error('RealCartAdapter.updateQuantity is not yet implemented. FastAPI cart endpoints pending.');
  }

  async removeItem(_productId: string): Promise<CartModel> {
    throw new Error('RealCartAdapter.removeItem is not yet implemented. FastAPI cart endpoints pending.');
  }

  async clearCart(): Promise<CartModel> {
    throw new Error('RealCartAdapter.clearCart is not yet implemented. FastAPI cart endpoints pending.');
  }
}
