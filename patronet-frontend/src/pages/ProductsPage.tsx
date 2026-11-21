import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, RotateCcw, X, Grid, ChevronDown, AlertCircle } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters, type CategoryCount, type BrandCount } from "@/components/products/ProductFilters";
import { Pagination } from "@/components/products/Pagination";
import { productService } from "@/services";
import type { Product, ProductSortOption, PaginatedProducts } from "@/types";

const PAGE_SIZE = 12;

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL search parameters
  const searchQuery = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || searchParams.get("cat") || "";
  const brandParam = searchParams.get("brand") || "";
  const minPriceParam = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPriceParam = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const sortParam = (searchParams.get("sort") as ProductSortOption) || "newest";
  const pageParam = Math.max(1, Number(searchParams.get("page") || 1));

  // Mobile drawer state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = React.useState(false);

  // Data fetching state
  const [paginatedData, setPaginatedData] = React.useState<PaginatedProducts>({
    items: [],
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
  });
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const [dbCategories, setDbCategories] = React.useState<CategoryCount[]>([]);

  // Fetch categories from API to populate accurate categories and counts
  React.useEffect(() => {
    let isMounted = true;
    if (productService.getCategories) {
      productService.getCategories()
        .then((cats) => {
          if (isMounted && Array.isArray(cats) && cats.length > 0) {
            setDbCategories(cats.map((c) => ({ name: c.name, count: c.productCount })));
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch product sample across catalogue to dynamically derive brand facets
  React.useEffect(() => {
    let isMounted = true;
    productService.getProducts({ pageSize: 150 })
      .then((data) => {
        if (isMounted) setAllProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute dynamic facets
  const categoryFacets: CategoryCount[] = React.useMemo(() => {
    if (dbCategories.length > 0) {
      return dbCategories;
    }
    const counts: Record<string, number> = {};
    allProducts.forEach((p) => {
      const cat = String(p.category?.name || p.specifications?.Category || "");
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [dbCategories, allProducts]);

  const brandFacets: BrandCount[] = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allProducts.forEach((p) => {
      if (p.brand) {
        counts[p.brand] = (counts[p.brand] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [allProducts]);

  // Load paginated & filtered products on query state changes
  React.useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const res = await productService.getPaginatedProducts({
          search: searchQuery,
          categories: categoryParam ? [categoryParam] : undefined,
          brands: brandParam ? [brandParam] : undefined,
          minPrice: minPriceParam,
          maxPrice: maxPriceParam,
          sort: sortParam,
          page: pageParam,
          pageSize: PAGE_SIZE,
        });

        if (active) {
          setPaginatedData(res);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load catalogue");
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, [searchQuery, categoryParam, brandParam, minPriceParam, maxPriceParam, sortParam, pageParam]);

  // URL State Mutators
  const updateParams = (newParams: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    setSearchParams(next, { replace: true });
  };

  const handleSelectCategory = (catName: string) => {
    updateParams({
      category: catName || null,
      cat: null,
      page: "1",
    });
  };

  const handleSelectBrand = (brandName: string) => {
    updateParams({
      brand: brandName || null,
      page: "1",
    });
  };

  const handlePriceChange = (min: number, max: number) => {
    updateParams({
      minPrice: min > 0 ? String(min) : null,
      maxPrice: max < 150000 ? String(max) : null,
      page: "1",
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateParams({
      sort: e.target.value,
      page: "1",
    });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearAll = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Active filter count
  const activeFilterCount =
    (categoryParam ? 1 : 0) +
    (brandParam ? 1 : 0) +
    (minPriceParam !== undefined || maxPriceParam !== undefined ? 1 : 0);

  const priceFilterLabel =
    minPriceParam !== undefined && maxPriceParam !== undefined
      ? `Price: ₹${minPriceParam} - ₹${maxPriceParam}`
      : minPriceParam !== undefined
      ? `Price: > ₹${minPriceParam}`
      : maxPriceParam !== undefined
      ? `Price: < ₹${maxPriceParam}`
      : null;

  const startItem = paginatedData.total === 0 ? 0 : (paginatedData.page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(paginatedData.page * PAGE_SIZE, paginatedData.total);

  return (
    <div className="w-full py-space-sm pb-space-xl">
      <Container>
        {/* 1. Header Banner */}
        <div className="w-full bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low rounded-2xl p-space-lg sm:p-space-xl border border-surface-container/80 relative overflow-hidden mb-space-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md relative z-10">
            <div className="space-y-space-xs max-w-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold">
                  Catalog
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold">
                  Pan-India Delivery
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                {categoryParam || (searchQuery ? `Search: "${searchQuery}"` : "All Products & Tech Accessories")}
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {searchQuery
                  ? `Showing results for query "${searchQuery}" across verified marketplace catalog.`
                  : "Explore our collection of consumer tech, computing hardware, audio wearables and lifestyle accessories."}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end flex-shrink-0 relative z-10">
              <span className="font-label-md text-label-md text-outline">Available Items</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-headline-sm text-headline-sm text-primary font-bold">
                  {paginatedData.total}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Products Listed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Active Filters Bar */}
        <div className="flex items-center justify-between flex-wrap gap-space-sm pt-space-xs pb-space-md">
          <div className="flex items-center flex-wrap gap-space-xs text-body-sm font-body-sm">
            <span className="font-label-md text-label-md text-outline mr-1">Active filters:</span>
            {activeFilterCount === 0 && (
              <span className="text-on-surface-variant text-body-sm italic">
                None (showing full catalog)
              </span>
            )}
            {categoryParam && (
              <button
                type="button"
                onClick={() => handleSelectCategory("")}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all shadow-xs cursor-pointer"
                title="Remove category filter"
              >
                <span>Category: {categoryParam}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {brandParam && (
              <button
                type="button"
                onClick={() => handleSelectBrand("")}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-all shadow-xs cursor-pointer"
                title="Remove brand filter"
              >
                <span>Brand: {brandParam}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {priceFilterLabel && (
              <button
                type="button"
                onClick={() => handlePriceChange(0, 150000)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-all shadow-xs cursor-pointer"
                title="Remove price filter"
              >
                <span>{priceFilterLabel}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="font-label-md text-label-md text-secondary hover:text-on-secondary-container transition-colors font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>

        {/* 3. Main Grid Layout (Filters Sidebar + Product Grid) */}
        <section className="py-space-sm pb-space-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
            {/* Desktop Filters Panel */}
            <div className="hidden lg:block lg:col-span-3 sticky top-[136px]">
              <ProductFilters
                categories={categoryFacets}
                selectedCategory={categoryParam}
                onSelectCategory={handleSelectCategory}
                brands={brandFacets}
                selectedBrand={brandParam}
                onSelectBrand={handleSelectBrand}
                minPrice={minPriceParam}
                maxPrice={maxPriceParam}
                onPriceChange={handlePriceChange}
                onResetFilters={handleClearAll}
                activeFilterCount={activeFilterCount}
              />
            </div>

            {/* Main Products Grid & Controls */}
            <main className="lg:col-span-9 flex flex-col space-y-space-md">
              {/* Controls bar */}
              <div className="bg-surface-container-lowest p-3 px-5 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-sm border border-surface-container/60">
                <div className="flex items-center justify-between w-full sm:w-auto gap-space-sm text-body-sm font-body-sm">
                  <span className="text-on-surface-variant">
                    Showing{" "}
                    <span className="font-semibold text-primary">
                      {startItem}–{endItem}
                    </span>{" "}
                    of <span className="font-semibold text-primary">{paginatedData.total}</span> items ·{" "}
                    <span className="text-outline">
                      Page {paginatedData.page} ({PAGE_SIZE} per page)
                    </span>
                  </span>

                  {/* Mobile Filters trigger button */}
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-variant text-primary font-label-md text-label-md border border-outline-variant/40 cursor-pointer"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="ml-1 w-5 h-5 rounded-full bg-primary text-on-primary text-label-sm font-bold flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Sort dropdown and View Mode */}
                <div className="flex items-center gap-space-md w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-1.5 text-body-sm font-body-sm">
                    <span className="text-outline hidden md:inline">Sort by:</span>
                    <div className="relative">
                      <select
                        value={sortParam}
                        onChange={handleSortChange}
                        className="bg-surface-container-low font-label-md text-label-md text-primary font-semibold py-1.5 pl-3 pr-8 rounded-lg border-0 focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none"
                      >
                        <option value="newest">Newest First</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-outline pointer-events-none absolute right-2 top-2.5" />
                    </div>
                  </div>

                  <div className="flex items-center bg-surface-container-low p-1 rounded-lg gap-1">
                    <div
                      className="p-1.5 rounded bg-surface-container-lowest text-primary shadow-xs"
                      title="Grid View Active"
                    >
                      <Grid className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Area */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-gutter">
                  {Array.from({ length: PAGE_SIZE }).map((_, t) => (
                    <div
                      key={`skeleton-${t}`}
                      className="bg-surface-container-lowest rounded-xl p-space-md border border-surface-container/60 animate-pulse space-y-3"
                    >
                      <div className="w-full aspect-square bg-surface-container-low rounded-lg" />
                      <div className="h-4 bg-surface-container-low rounded w-1/3" />
                      <div className="h-5 bg-surface-container-low rounded w-5/6" />
                      <div className="h-4 bg-surface-container-low rounded w-1/2" />
                      <div className="h-6 bg-surface-container-low rounded w-2/5 pt-2" />
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="h-8 bg-surface-container-low rounded" />
                        <div className="h-8 bg-surface-container-low rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-surface-container-lowest rounded-xl p-space-xl border border-error/20 text-center space-y-3 my-4">
                  <div className="w-12 h-12 rounded-full bg-error-container text-error mx-auto flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Failed to Load Products
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
                    {error}
                  </p>
                  <button
                    type="button"
                    onClick={() => handlePageChange(1)}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors shadow-xs cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : paginatedData.items.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-xl p-space-xl border border-surface-container/60 text-center space-y-3 my-4">
                  <div className="w-14 h-14 rounded-full bg-surface-container-low text-outline mx-auto flex items-center justify-center">
                    <Filter className="w-7 h-7" />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    No Products Found
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
                    We couldn't find any products matching your selected filters. Try adjusting your
                    price range, category, or brand selection.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-gutter">
                    {paginatedData.items.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Clean Pagination */}
                  <div className="pt-space-md">
                    <Pagination
                      currentPage={paginatedData.page}
                      totalPages={paginatedData.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </>
              )}
            </main>
          </div>
        </section>
      </Container>

      {/* Mobile Drawer Filter Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-xs"
            onClick={() => setIsMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-surface-container-lowest h-full shadow-2xl p-space-md flex flex-col justify-between overflow-y-auto z-10">
            <div>
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-container/60 mb-space-sm">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Filters</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1 rounded-lg text-outline hover:text-on-surface cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ProductFilters
                categories={categoryFacets}
                selectedCategory={categoryParam}
                onSelectCategory={(cat) => {
                  handleSelectCategory(cat);
                  setIsMobileFiltersOpen(false);
                }}
                brands={brandFacets}
                selectedBrand={brandParam}
                onSelectBrand={(br) => {
                  handleSelectBrand(br);
                  setIsMobileFiltersOpen(false);
                }}
                minPrice={minPriceParam}
                maxPrice={maxPriceParam}
                onPriceChange={handlePriceChange}
                onResetFilters={handleClearAll}
                activeFilterCount={activeFilterCount}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
