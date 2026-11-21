import * as React from "react";
import type { Product } from "@/types";

const COMPARISON_STORAGE_KEY = "patronet_comparison_selection_v1";
const MAX_COMPARISON_PRODUCTS = 3;

interface ComparisonContextType {
  selectedProducts: Product[];
  toggleProduct: (product: Product) => void;
  clearSelection: () => void;
  isSelected: (productId: string) => boolean;
}

const ComparisonContext = React.createContext<ComparisonContextType | undefined>(undefined);

function loadSavedProducts(): Product[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(COMPARISON_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Validate that items have minimal valid product shape (id, name, price)
    const validProducts = parsed.filter(
      (item): item is Product =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number"
    );

    // Deduplicate by product ID and slice to MAX_COMPARISON_PRODUCTS
    const seenIds = new Set<string>();
    const deduplicated: Product[] = [];
    for (const prod of validProducts) {
      if (!seenIds.has(prod.id)) {
        seenIds.add(prod.id);
        deduplicated.push(prod);
      }
      if (deduplicated.length >= MAX_COMPARISON_PRODUCTS) break;
    }

    return deduplicated;
  } catch (err) {
    console.warn("Failed to load saved comparison selection:", err);
    return [];
  }
}

export const ComparisonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedProducts, setSelectedProducts] = React.useState<Product[]>(loadSavedProducts);

  // Sync to localStorage on changes
  React.useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        if (selectedProducts.length > 0) {
          window.localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(selectedProducts));
        } else {
          window.localStorage.removeItem(COMPARISON_STORAGE_KEY);
        }
      }
    } catch (err) {
      console.warn("Failed to persist comparison selection to localStorage:", err);
    }
  }, [selectedProducts]);

  const toggleProduct = React.useCallback((product: Product) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= MAX_COMPARISON_PRODUCTS) {
        // Limit to 3 products maximum
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
