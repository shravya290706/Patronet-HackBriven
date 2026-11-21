import * as React from 'react';
import { cartService } from '@/services';
import type { CartModel } from '@/services/api/cartService';
import { useAuth } from './AuthContext';

interface CartContextValue {
  cart: CartModel;
  itemCount: number;
  loading: boolean;
  error: string | null;
  addItem: (productId: string, quantity?: number, negotiationId?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = React.createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [cart, setCart] = React.useState<CartModel>({ items: [], updatedAt: new Date().toISOString() });
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load cart synchronized with authenticated customer session
  const refreshCart = React.useCallback(async () => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setCart({ items: [], updatedAt: new Date().toISOString() });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await cartService.getCart();
      setCart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  // Synchronize cart with customer identity (ensures account isolation)
  React.useEffect(() => {
    refreshCart();
  }, [refreshCart, user?.id]);

  const addItem = React.useCallback(async (productId: string, quantity = 1, negotiationId?: string) => {
    try {
      setError(null);
      const updated = await cartService.addItem(productId, quantity, negotiationId);
      setCart(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add item to cart';
      setError(msg);
      throw err;
    }
  }, []);

  const updateQuantity = React.useCallback(async (productId: string, quantity: number) => {
    try {
      setError(null);
      const updated = await cartService.updateQuantity(productId, quantity);
      setCart(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update quantity';
      setError(msg);
      throw err;
    }
  }, []);

  const removeItem = React.useCallback(async (productId: string) => {
    try {
      setError(null);
      const updated = await cartService.removeItem(productId);
      setCart(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove item';
      setError(msg);
      throw err;
    }
  }, []);

  const clearCart = React.useCallback(async () => {
    try {
      setError(null);
      const updated = await cartService.clearCart();
      setCart(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to clear cart';
      setError(msg);
      throw err;
    }
  }, []);

  // Compute total item count (sum of quantities)
  const itemCount = React.useMemo(() => {
    return cart.items.reduce((total, item) => total + (item.quantity || 0), 0);
  }, [cart.items]);

  const value = React.useMemo(
    () => ({
      cart,
      itemCount,
      loading,
      error,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart,
    }),
    [cart, itemCount, loading, error, addItem, updateQuantity, removeItem, clearCart, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
