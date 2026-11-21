import React from "react";
import {
  Search,
  Sparkles,
  ShoppingBag,
  Folder,
  Tag,
  ArrowRight,
  Loader2,
  X,
} from "lucide-react";
import type { SearchSuggestions, SuggestProduct } from "../../types";
import {
  resolveProductImageUrl,
  DEFAULT_FALLBACK_IMAGE,
} from "../../lib/productImageCatalog";

export interface SearchSuggestionsDropdownProps {
  query: string;
  suggestions: SearchSuggestions | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: SuggestProduct) => void;
  onSelectCategory: (categoryName: string) => void;
  onSelectBrand: (brandName: string) => void;
  onSelectCorrection: (correctionText: string) => void;
  onSelectQuery: (queryText: string) => void;
  highlightedIndex: number;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export const SearchSuggestionsDropdown: React.FC<
  SearchSuggestionsDropdownProps
> = ({
  query,
  suggestions,
  isLoading,
  isOpen,
  onClose,
  onSelectProduct,
  onSelectCategory,
  onSelectBrand,
  onSelectCorrection,
  onSelectQuery,
  highlightedIndex,
  dropdownRef,
}) => {
  if (!isOpen || (!isLoading && !suggestions && query.trim().length < 2)) {
    return null;
  }

  const products = suggestions?.products || [];
  const categories = suggestions?.categories || [];
  const brands = suggestions?.brands || [];
  const corrections = suggestions?.corrections || [];

  const hasResults =
    products.length > 0 ||
    categories.length > 0 ||
    brands.length > 0 ||
    corrections.length > 0;

  // Flatten items to map highlightedIndex to specific item
  // 0..C-1: corrections, C..C+P-1: products, C+P..C+P+Cat-1: categories, etc.
  let currIndex = 0;
  const correctionStart = currIndex;
  currIndex += corrections.length;
  const productStart = currIndex;
  currIndex += products.length;
  const categoryStart = currIndex;
  currIndex += categories.length;
  const brandStart = currIndex;
  currIndex += brands.length;
  const queryActionIndex = currIndex;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 z-[70] bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container/90 overflow-hidden text-on-surface animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
      role="listbox"
      aria-label="Search suggestions"
      onMouseDown={(e) => {
        // Prevent click from closing dropdown prematurely before selection handler runs
        e.stopPropagation();
      }}
    >
      {/* 1. "Did you mean?" Spelling Corrections Banner */}
      {corrections.length > 0 && (
        <div className="bg-primary/5 border-b border-primary/10 px-4 py-2.5 flex items-center justify-between text-body-sm flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span className="text-on-surface-variant font-medium text-xs sm:text-sm">
              Did you mean:
            </span>
            {corrections.map((corr, idx) => {
              const isSelected = highlightedIndex === correctionStart + idx;
              return (
                <button
                  key={corr}
                  type="button"
                  onClick={() => onSelectCorrection(corr)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-on-primary ring-2 ring-primary/40 shadow-xs"
                      : "bg-primary/10 text-primary hover:bg-primary hover:text-on-primary"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span>{corr}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close suggestions"
            className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low transition-colors ml-auto cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Main Suggestion Content Body */}
      <div className="max-h-[65vh] overflow-y-auto divide-y md:divide-y-0 divide-surface-container/60">
        {isLoading && !hasResults ? (
          <div className="p-8 flex items-center justify-center gap-3 text-on-surface-variant">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-body-sm font-medium">
              Finding suggestions for &quot;{query}&quot;...
            </span>
          </div>
        ) : !hasResults ? (
          <div className="p-8 text-center space-y-2">
            <p className="font-semibold text-on-surface text-body-md">
              No matching suggestions for &quot;{query}&quot;
            </p>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              Press <strong>Enter</strong> to search the entire PATRONET
              marketplace catalog.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-surface-container/60">
            {/* Left Column: Product Suggestions (md:col-span-7 lg:col-span-8) */}
            <div className="md:col-span-7 lg:col-span-8 p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                  Product Suggestions ({products.length})
                </span>
                {isLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                )}
              </div>

              {products.length === 0 ? (
                <p className="text-xs text-on-surface-variant px-2 py-3 italic">
                  No specific products found. Try selecting a category or brand
                  on the right.
                </p>
              ) : (
                <div className="space-y-1">
                  {products.map((product, pIdx) => {
                    const isSelected =
                      highlightedIndex === productStart + pIdx;
                    const imgUrl = resolveProductImageUrl({
                      id: product.id,
                      name: product.name,
                      sku: product.sku || undefined,
                      primaryImage: product.primary_image_url || undefined,
                    });

                    return (
                      <div
                        key={product.id}
                        onClick={() => onSelectProduct(product)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-surface-container-low ring-1 ring-primary/40 shadow-xs"
                            : "hover:bg-surface-container-low/80"
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <img
                          src={imgUrl}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover bg-surface-container shrink-0 border border-surface-container/80"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              DEFAULT_FALLBACK_IMAGE;
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm font-semibold text-on-surface truncate">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                            {product.brand && (
                              <span className="font-medium text-primary">
                                {product.brand}
                              </span>
                            )}
                            {product.sku && (
                              <span className="text-outline font-mono text-[11px]">
                                {product.sku}
                              </span>
                            )}
                            {product.category_name && (
                              <span className="text-outline text-[11px] hidden sm:inline">
                                • {product.category_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <span className="text-body-sm font-bold text-primary">
                            ₹{product.price.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Categories & Brands (md:col-span-5 lg:col-span-4) */}
            <div className="md:col-span-5 lg:col-span-4 p-3 sm:p-4 space-y-4 bg-surface-container-low/30">
              {/* Category Suggestions */}
              {categories.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline flex items-center gap-1.5 px-1 mb-2">
                    <Folder className="w-3.5 h-3.5 text-secondary" />
                    Categories
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat, cIdx) => {
                      const isSelected =
                        highlightedIndex === categoryStart + cIdx;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => onSelectCategory(cat.name)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? "bg-secondary text-on-secondary ring-2 ring-secondary/40 shadow-xs"
                              : "bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-surface-container/80 shadow-xs"
                          }`}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <span>{cat.name}</span>
                          <ArrowRight className="w-3 h-3 opacity-60" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Brand Suggestions */}
              {brands.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline flex items-center gap-1.5 px-1 mb-2">
                    <Tag className="w-3.5 h-3.5 text-tertiary" />
                    Brands
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {brands.map((brand, bIdx) => {
                      const isSelected =
                        highlightedIndex === brandStart + bIdx;
                      return (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => onSelectBrand(brand)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-on-primary ring-2 ring-primary/40 shadow-xs"
                              : "bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-surface-container/80 shadow-xs"
                          }`}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <span>{brand}</span>
                          <ArrowRight className="w-3 h-3 opacity-60" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Suggestions Helper Tip */}
              <div className="text-[11px] text-on-surface-variant px-1 pt-1 leading-relaxed">
                Click any suggestion to jump directly into filtered results.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Footer Bar: Search for Query & Keyboard Shortcuts */}
      <div className="bg-surface-container-low px-4 py-2.5 border-t border-surface-container/60 flex items-center justify-between text-xs text-on-surface-variant flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelectQuery(query)}
          className={`inline-flex items-center gap-1.5 font-medium text-primary hover:underline cursor-pointer rounded-lg px-2 py-1 transition-colors ${
            highlightedIndex === queryActionIndex
              ? "bg-primary/10 ring-1 ring-primary/30"
              : ""
          }`}
          role="option"
          aria-selected={highlightedIndex === queryActionIndex}
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span>
            Search all products for <strong>&quot;{query}&quot;</strong>
          </span>
          <ArrowRight className="w-3 h-3 shrink-0" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-[11px] text-outline select-none">
          <span className="px-1.5 py-0.5 rounded bg-surface-container border border-surface-container-high font-mono">
            ↑↓
          </span>
          <span>navigate</span>
          <span className="px-1.5 py-0.5 rounded bg-surface-container border border-surface-container-high font-mono">
            ↵
          </span>
          <span>select</span>
          <span className="px-1.5 py-0.5 rounded bg-surface-container border border-surface-container-high font-mono">
            ESC
          </span>
          <span>dismiss</span>
        </div>
      </div>
    </div>
  );
};
