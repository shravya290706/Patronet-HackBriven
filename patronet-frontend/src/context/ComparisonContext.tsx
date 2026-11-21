import * as React from "react";
import type { Product } from "@/types";

interface ComparisonContextType {
  selectedProducts: Product[];
  toggleProduct: (product: Product) => void;
  clearSelection: () => void;
  isSelected: (productId: string) => boolean;
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
      if (prev.length >= 3) {
        // Limit to 3 products maximum as specified
        return prev;
      }
      return [...prev, product];
    });
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedProducts([]);
  }, []);

  const isSelected = React.useCallback(
    (productId: string) => selectedProducts.some((p) => p.id === productId),
    [selectedProducts]
  );

  return (
    <ComparisonContext.Provider value={{ selectedProducts, toggleProduct, clearSelection, isSelected }}>
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
