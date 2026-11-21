import * as React from "react";
import type { Product } from "@/types";

export interface ComparisonContextType {
  selectedProducts: Product[];
  comparisonList: Product[];
  toggleProduct: (product: Product) => void;
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearSelection: () => void;
  isSelected: (productId: string) => boolean;
  isCompared: (productId: string) => boolean;
}

const ComparisonContext = React.createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProducts, setSelectedProducts] = React.useState<Product[]>([]);

  const toggleProduct = React.useCallback((product: Product) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 4) {
        // Limit to 4 products maximum as in Stitch reference
        return prev;
      }
      return [...prev, product];
    });
  }, []);

  const addToCompare = React.useCallback((product: Product) => {
    setSelectedProducts((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      if (prev.length >= 4) return prev;
      return [...prev, product];
    });
  }, []);

  const removeFromCompare = React.useCallback((productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedProducts([]);
  }, []);

  const isSelected = React.useCallback(
    (productId: string) => selectedProducts.some((p) => p.id === productId),
    [selectedProducts]
  );

  return (
    <ComparisonContext.Provider
      value={{
        selectedProducts,
        comparisonList: selectedProducts,
        toggleProduct,
        addToCompare,
        removeFromCompare,
        clearSelection,
        isSelected,
        isCompared: isSelected,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

export function useComparison() {
  const context = React.useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
}
