import * as React from "react";
import { Search } from "lucide-react";

export interface CategoryCount {
  name: string;
  count: number;
}

export interface BrandCount {
  name: string;
  count: number;
}

export interface ProductFiltersProps {
  categories: CategoryCount[];
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  brands: BrandCount[];
  selectedBrands: string[];
  onToggleBrand: (brand: string) => void;
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
  inStockOnly: boolean;
  onToggleInStock: (inStock: boolean) => void;
  onClearAll: () => void;
  className?: string;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  selectedCategories,
  onToggleCategory,
  brands,
  selectedBrands,
  onToggleBrand,
  minPrice,
  maxPrice,
  onPriceChange,
  inStockOnly,
  onToggleInStock,
  onClearAll,
  className = "",
}) => {
  const [brandSearch, setBrandSearch] = React.useState("");

  const filteredBrands = React.useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const q = brandSearch.trim().toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  const handleMinPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 0;
    if (val >= 0 && val <= maxPrice) {
      onPriceChange(val, maxPrice);
    }
  };

  const handleMaxPriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 0;
    if (val >= minPrice) {
      onPriceChange(minPrice, val);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 0;
    onPriceChange(minPrice, Math.max(minPrice, val));
  };

  return (
    <aside aria-label="Product filters" className={className}>
      <div className="flex items-center justify-between pb-4 border-b border-outline-subtle">
        <h2 className="font-title text-base font-semibold text-on-pure-white">Filters</h2>
        <button
          type="button"
          onClick={onClearAll}
          className="font-label text-sm text-muted-gray hover:text-accent-orange-text transition-colors duration-150 cursor-pointer"
        >
          Clear filters
        </button>
      </div>

      <div className="divide-y divide-outline-subtle">
        {/* Category Filter */}
        <section className="py-6 flex flex-col gap-3">
          <h3 className="font-label text-sm font-semibold text-on-pure-white">Category</h3>
          <div className="flex flex-col gap-2.5 pt-1">
            {categories.map((cat) => {
              const isChecked = selectedCategories.includes(cat.name);
              return (
                <label key={cat.name} className="flex items-center justify-between gap-2 cursor-pointer select-none">
                  <span className="inline-flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleCategory(cat.name)}
                      className="rounded-sm border-outline-subtle text-deep-black focus:ring-deep-black cursor-pointer"
                    />
                    <span className="font-body text-sm text-on-pure-white">{cat.name}</span>
                  </span>
                  <span className="font-label text-xs text-muted-gray tabular-nums">{cat.count}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* Brand Filter (Searchable) */}
        <section className="py-6 flex flex-col gap-3">
          <h3 className="font-label text-sm font-semibold text-on-pure-white">Brand</h3>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm bg-light-gray border border-outline-subtle focus-within:border-deep-black">
            <Search className="w-3.5 h-3.5 text-muted-gray shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder="Filter brands"
              aria-label="Search brands"
              className="w-full bg-transparent border-0 p-0 font-body text-sm text-on-pure-white placeholder:text-muted-gray focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2.5 pt-1 max-h-48 overflow-y-auto">
            {filteredBrands.length === 0 ? (
              <span className="text-xs text-muted-gray py-1">No brands found</span>
            ) : (
              filteredBrands.map((brand) => {
                const isChecked = selectedBrands.includes(brand.name);
                return (
                  <label key={brand.name} className="flex items-center justify-between gap-2 cursor-pointer select-none">
                    <span className="inline-flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleBrand(brand.name)}
                        className="rounded-sm border-outline-subtle text-deep-black focus:ring-deep-black cursor-pointer"
                      />
                      <span className="font-body text-sm text-on-pure-white">{brand.name}</span>
                    </span>
                    <span className="font-label text-xs text-muted-gray tabular-nums">{brand.count}</span>
                  </label>
                );
              })
            )}
          </div>
        </section>

        {/* Price Range (INR) */}
        <section className="py-6 flex flex-col gap-3">
          <h3 className="font-label text-sm font-semibold text-on-pure-white">Price range (₹)</h3>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex flex-col gap-1">
              <label htmlFor="price-min" className="font-label text-xs text-muted-gray">Min</label>
              <input
                id="price-min"
                type="number"
                value={minPrice}
                min={0}
                max={150000}
                step={1000}
                onChange={handleMinPriceInput}
                className="w-full px-2.5 py-1.5 rounded-sm bg-light-gray border border-outline-subtle font-body text-sm tabular-nums text-on-pure-white focus:border-deep-black focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="price-max" className="font-label text-xs text-muted-gray">Max</label>
              <input
                id="price-max"
                type="number"
                value={maxPrice}
                min={minPrice}
                max={150000}
                step={1000}
                onChange={handleMaxPriceInput}
                className="w-full px-2.5 py-1.5 rounded-sm bg-light-gray border border-outline-subtle font-body text-sm tabular-nums text-on-pure-white focus:border-deep-black focus:outline-none"
              />
            </div>
          </div>
          <input
            id="price-range-slider"
            type="range"
            min={0}
            max={120000}
            step={1000}
            value={maxPrice}
            aria-label="Maximum price slider"
            onChange={handleSliderChange}
            className="w-full accent-primary-orange mt-2 cursor-pointer"
          />
        </section>

        {/* Availability Toggle */}
        <section className="py-6 flex items-center justify-between gap-3">
          <span className="font-label text-sm font-medium text-on-pure-white">In stock only</span>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => onToggleInStock(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-outline-subtle rounded-full peer peer-checked:bg-primary-orange transition-colors duration-150 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-pure-white after:rounded-full after:h-4 after:w-4 after:transition-transform after:duration-150 peer-checked:after:translate-x-5"></div>
          </label>
        </section>
      </div>
    </aside>
  );
};
