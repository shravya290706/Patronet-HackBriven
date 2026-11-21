import * as React from "react";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { categoryService, type CategoryItem } from "@/services/api/categoryService";

export interface CategoryCount {
  name: string;
  count?: number;
}

export interface BrandCount {
  name: string;
  count?: number;
}

export interface FilterState {
  categoryId?: string;
  categoryName?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
}

export interface ProductFiltersProps {
  filters?: FilterState;
  onFilterChange?: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  availableBrands?: string[];
  className?: string;

  // Direct props alternative
  categories?: CategoryCount[];
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  brands?: BrandCount[];
  selectedBrand?: string;
  onSelectBrand?: (brand: string) => void;
  minPrice?: number;
  maxPrice?: number;
  onPriceChange?: (min: number, max: number) => void;
  activeFilterCount?: number;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters: propFilters,
  onFilterChange,
  onResetFilters,
  availableBrands: propBrands,
  className = "",
  categories: propCategoryList,
  selectedCategory,
  onSelectCategory,
  brands: propBrandList,
  selectedBrand,
  onSelectBrand,
  minPrice: propMinPrice,
  maxPrice: propMaxPrice,
  onPriceChange,
  activeFilterCount: propActiveCount,
}) => {
  // Unify props into state/getters
  const currentCategory = selectedCategory !== undefined ? selectedCategory : (propFilters?.categoryName || propFilters?.categoryId || "");
  const currentBrand = selectedBrand !== undefined ? selectedBrand : (propFilters?.brand || "");
  const currentMinPrice = propMinPrice !== undefined ? propMinPrice : propFilters?.minPrice;
  const currentMaxPrice = propMaxPrice !== undefined ? propMaxPrice : propFilters?.maxPrice;

  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [minPriceInput, setMinPriceInput] = React.useState<string>(
    currentMinPrice !== undefined ? String(currentMinPrice) : ""
  );
  const [maxPriceInput, setMaxPriceInput] = React.useState<string>(
    currentMaxPrice !== undefined ? String(currentMaxPrice) : ""
  );
  const [priceError, setPriceError] = React.useState<string | null>(null);
  const [brandSearch, setBrandSearch] = React.useState("");

  React.useEffect(() => {
    let active = true;
    categoryService
      .getCategories()
      .then((cats: CategoryItem[]) => {
        if (active) {
          setCategories(cats);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    setMinPriceInput(currentMinPrice !== undefined ? String(currentMinPrice) : "");
    setMaxPriceInput(currentMaxPrice !== undefined ? String(currentMaxPrice) : "");
  }, [currentMinPrice, currentMaxPrice]);

  const activeFilterCount =
    propActiveCount !== undefined
      ? propActiveCount
      : (currentCategory ? 1 : 0) +
        (currentMinPrice !== undefined || currentMaxPrice !== undefined ? 1 : 0) +
        (currentBrand ? 1 : 0);

  // Derive brand options
  const brandNames = React.useMemo(() => {
    if (propBrandList && propBrandList.length > 0) {
      return propBrandList.map((b) => b.name);
    }
    if (propBrands && propBrands.length > 0) {
      return propBrands;
    }
    return [
      "Apple", "Samsung", "Sony", "Bajaj", "Allen Solly", "Aashirvaad",
      "Fastrack", "Wildcraft", "Himalaya", "Drools", "Amul", "Cosco",
      "Funskool", "Biba", "Skybags"
    ];
  }, [propBrandList, propBrands]);

  const filteredBrands = React.useMemo(() => {
    if (!brandSearch.trim()) return brandNames;
    const q = brandSearch.toLowerCase();
    return brandNames.filter((b) => b.toLowerCase().includes(q));
  }, [brandNames, brandSearch]);

  const handleCategorySelect = (catName: string) => {
    if (onSelectCategory) {
      onSelectCategory(catName);
    } else if (onFilterChange && propFilters) {
      onFilterChange({
        ...propFilters,
        categoryName: catName || undefined,
        categoryId: undefined,
      });
    }
  };

  const handleBrandSelect = (brandName: string) => {
    const nextBrand = currentBrand === brandName ? "" : brandName;
    if (onSelectBrand) {
      onSelectBrand(nextBrand);
    } else if (onFilterChange && propFilters) {
      onFilterChange({
        ...propFilters,
        brand: nextBrand || undefined,
      });
    }
  };

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPriceError(null);
    const min = minPriceInput.trim() === "" ? 0 : Number(minPriceInput);
    const max = maxPriceInput.trim() === "" ? 150000 : Number(maxPriceInput);

    if (isNaN(min) || min < 0) {
      setPriceError("Minimum price must be positive.");
      return;
    }
    if (isNaN(max) || max < 0) {
      setPriceError("Maximum price must be positive.");
      return;
    }
    if (min > max) {
      setPriceError("Min price cannot exceed Max price.");
      return;
    }

    if (onPriceChange) {
      onPriceChange(min, max);
    } else if (onFilterChange && propFilters) {
      onFilterChange({
        ...propFilters,
        minPrice: min > 0 ? min : undefined,
        maxPrice: max < 150000 ? max : undefined,
      });
    }
  };

  // Category list items
  const categoryOptions = React.useMemo(() => {
    if (propCategoryList && propCategoryList.length > 0) {
      return propCategoryList.map((c) => ({ id: c.name.toLowerCase(), name: c.name, count: c.count }));
    }
    return categories.map((c) => ({ id: c.id, name: c.name, count: c.productCount }));
  }, [propCategoryList, categories]);

  return (
    <aside
      className={`space-y-space-md bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container/60 ${className}`}
      aria-label="Filter products"
    >
      {/* Header: Filters + Active Count */}
      <div className="flex items-center justify-between pb-space-xs border-b border-surface-container/60">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
            Filters
          </h2>
        </div>
        {activeFilterCount > 0 ? (
          <span className="px-2 py-0.5 rounded-full bg-surface-container-low font-label-sm text-label-sm text-outline font-medium">
            {activeFilterCount} Active
          </span>
        ) : (
          <button
            type="button"
            onClick={onResetFilters}
            className="font-label-sm text-label-sm text-outline hover:text-primary transition-colors cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Categories Filter (Radio-list with scrollbar matching Screenshot 3) */}
      <div className="space-y-space-xs pt-space-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-bold">
            Categories
          </h3>
          {currentCategory && (
            <button
              type="button"
              onClick={() => handleCategorySelect("")}
              className="font-label-sm text-label-sm text-primary font-semibold hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="max-h-56 overflow-y-auto space-y-1 pr-1 border-b border-surface-container/60 pb-space-sm custom-scrollbar">
          {/* All Categories Option */}
          <label className="flex items-center gap-2.5 py-1 px-2 rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors text-body-sm font-body-sm text-on-surface">
            <input
              type="radio"
              name="category_filter"
              checked={!currentCategory}
              onChange={() => handleCategorySelect("")}
              className="accent-primary w-4 h-4 cursor-pointer"
            />
            <span className={!currentCategory ? "font-semibold text-primary" : ""}>
              All Categories
            </span>
          </label>

          {/* Individual Categories */}
          {categoryOptions.map((cat) => {
            const isSelected =
              currentCategory.toLowerCase() === cat.name.toLowerCase() ||
              currentCategory.toLowerCase() === cat.id.toLowerCase();

            return (
              <label
                key={cat.id}
                className={`flex items-center justify-between py-1 px-2 rounded-lg cursor-pointer transition-colors text-body-sm font-body-sm ${
                  isSelected
                    ? "bg-primary-fixed/30 text-primary font-semibold"
                    : "hover:bg-surface-container-low text-on-surface"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <input
                    type="radio"
                    name="category_filter"
                    checked={isSelected}
                    onChange={() => handleCategorySelect(cat.name)}
                    className="accent-primary w-4 h-4 cursor-pointer"
                  />
                  <span className="truncate">{cat.name}</span>
                </div>
                {cat.count !== undefined && cat.count > 0 && (
                  <span className="text-outline text-xs tabular-nums ml-1">
                    {cat.count}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter (Min - Max inputs + Apply Price button matching Screenshot 3) */}
      <div className="space-y-space-xs pt-space-xs border-b border-surface-container/60 pb-space-md">
        <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-bold">
          Price Range (₹)
        </h3>

        <form onSubmit={handlePriceSubmit} className="space-y-space-xs mt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-label-sm text-xs text-outline mb-1">Min Price</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-outline text-body-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  placeholder="0"
                  className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-surface-container-low border border-surface-container text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block font-label-sm text-xs text-outline mb-1">Max Price</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-outline text-body-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  placeholder="50000"
                  className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-surface-container-low border border-surface-container text-body-sm font-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {priceError && (
            <p className="text-error text-xs font-medium">{priceError}</p>
          )}

          <button
            type="submit"
            className="w-full py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg font-label-md text-label-md font-bold transition-colors cursor-pointer shadow-xs mt-2"
          >
            Apply Price
          </button>
        </form>
      </div>

      {/* Brand Filter (Search input + Checkboxes matching Screenshot 3) */}
      <div className="space-y-space-xs pt-space-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider font-bold">
            Brand
          </h3>
          {currentBrand && (
            <button
              type="button"
              onClick={() => handleBrandSelect("")}
              className="font-label-sm text-label-sm text-primary font-semibold hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Brand search box */}
        <div className="relative my-2">
          <Search className="w-4 h-4 text-outline absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            placeholder="Filter brands..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-low border border-surface-container text-body-sm font-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary"
          />
          {brandSearch && (
            <button
              type="button"
              onClick={() => setBrandSearch("")}
              className="absolute right-2 top-2 text-outline hover:text-on-surface"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Brand Checkboxes */}
        <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {filteredBrands.map((brand) => {
            const isChecked = currentBrand.toLowerCase() === brand.toLowerCase();
            return (
              <label
                key={brand}
                className="flex items-center gap-2.5 py-1 px-2 rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors text-body-sm font-body-sm text-on-surface"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleBrandSelect(brand)}
                  className="accent-primary w-4 h-4 rounded cursor-pointer"
                />
                <span className={isChecked ? "font-semibold text-primary" : ""}>
                  {brand}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
