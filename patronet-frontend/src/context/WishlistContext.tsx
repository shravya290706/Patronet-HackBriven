import * as React from 'react';
import { wishlistService } from '@/services';
import type { WishlistState, WishlistItem } from '@/services/api/wishlistService';

interface WishlistContextValue {
  items: WishlistItem[];
  itemCount: number;
  loading: boolean;
  error: string | null;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = React.createContext<WishlistContextValue | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = React.useState<WishlistState>({
    items: [],
    updatedAt: new Date().toISOString(),
  });
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const refreshWishlist = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await wishlistService.getWishlist();
      setWishlist(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const addToWishlist = React.useCallback(async (productId: string) => {
    try {
      setError(null);
      const updated = await wishlistService.addItem(productId);
      setWishlist(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add item to wishlist';
      setError(msg);
      throw err;
    }
  }, []);

  const removeFromWishlist = React.useCallback(async (productId: string) => {
    try {
      setError(null);
      const updated = await wishlistService.removeItem(productId);
      setWishlist(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove item from wishlist';
      setError(msg);
      throw err;
    }
  }, []);

  const isWishlisted = React.useCallback(
    (productId: string) => {
      const cleanId = (productId || '').trim();
      return wishlist.items.some((i) => i.productId === cleanId);
    },
    [wishlist.items]
  );

  const toggleWishlist = React.useCallback(
    async (productId: string): Promise<boolean> => {
      const cleanId = (productId || '').trim();
      const currentlySaved = wishlist.items.some((i) => i.productId === cleanId);
      if (currentlySaved) {
        await removeFromWishlist(cleanId);
        return false;
      } else {
        await addToWishlist(cleanId);
        return true;
      }
    },
    [wishlist.items, addToWishlist, removeFromWishlist]
  );

  const clearWishlist = React.useCallback(async () => {
    try {
      setError(null);
      const updated = await wishlistService.clearWishlist();
      setWishlist(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to clear wishlist';
      setError(msg);
      throw err;
    }
  }, []);

  const value = React.useMemo<WishlistContextValue>(
    () => ({
      items: wishlist.items,
      itemCount: wishlist.items.length,
      loading,
      error,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      isWishlisted,
      clearWishlist,
      refreshWishlist,
    }),
    [wishlist, loading, error, addToWishlist, removeFromWishlist, toggleWishlist, isWishlisted, clearWishlist, refreshWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = (): WishlistContextValue => {
  const context = React.useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
