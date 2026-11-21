import * as React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, SearchX, X } from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters, type CategoryCount, type BrandCount } from "@/components/products/ProductFilters";
import { Pagination } from "@/components/products/Pagination";
import { ComparisonBar } from "@/components/products/ComparisonBar";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { useComparison } from "@/context/ComparisonContext";
import { useCart } from "@/context/CartContext";
import { productService } from "@/services";
import type { Product, ProductSortOption, PaginatedProducts } from "@/types";

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toggleProduct, isSelected } = useComparison();
  const { addItem: addCartItem } = useCart();

  // Read URL search parameters primitive values
  const searchQuery = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const categoriesRaw = searchParams.getAll("cat").join(",");
  const brandsRaw = searchParams.getAll("brand").join(",");
  const minPriceParam = Number(searchParams.get("minPrice") || 0);
  const maxPriceParam = Number(searchParams.get("maxPrice") || 150000);
  const inStockParam = searchParams.get("inStock") === "true";
  const sortParam = (searchParams.get("sort") as ProductSortOption) || "featured";
  const pageParam = Math.max(1, Number(searchParams.get("page") || 1));

  // Stabilize array references with React.useMemo based on primitive serialized strings
  const selectedCategories = React.useMemo(() => {
    const list = categoriesRaw ? categoriesRaw.split(",") : [];
    if (categoryParam && !list.includes(categoryParam)) {
      list.push(categoryParam);
    }
    return list;
  }, [categoryParam, categoriesRaw]);

  const selectedBrands = React.useMemo(() => {
    return brandsRaw ? brandsRaw.split(",") : [];
  }, [brandsRaw]);

  // Mobile drawer state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = React.useState(false);

  // Data fetching state
  const [paginatedData, setPaginatedData] = React.useState<PaginatedProducts>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 9,
    totalPages: 1,
  });
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch all products once to dynamically derive category & brand facets
  React.useEffect(() => {
    let isMounted = true;
    productService.getProducts().then((data) => {
      if (isMounted) setAllProducts(data);
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Compute dynamic facets
  const categoryFacets: CategoryCount[] = React.useMemo(() => {
    const counts: Record<string, number> = {
      Laptops: 0,
      Audio: 0,
      Monitors: 0,
      Wearables: 0,
      Accessories: 0,
      Gaming: 0,
    };
    allProducts.forEach((p) => {
      const cat = String(p.category?.name || p.specifications?.['Category'] || '');
      if (counts[cat] !== undefined) {
        counts[cat] += 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [allProducts]);

  const brandFacets: BrandCount[] = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allProducts.forEach((p) => {
      if (!counts[p.brand]) counts[p.brand] = 0;
      counts[p.brand] += 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [allProducts]);

  // Load paginated & filtered products on query state changes with request cancellation guard
  React.useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const res = await productService.getPaginatedProducts({
          search: searchQuery,
          categories: selectedCategories,
          brands: selectedBrands,
          minPrice: minPriceParam > 0 ? minPriceParam : undefined,
          maxPrice: maxPriceParam < 150000 ? maxPriceParam : undefined,
          inStockOnly: inStockParam,
          sort: sortParam,
          page: pageParam,
          pageSize: 9,
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
  }, [
    searchQuery,
    selectedCategories,
    selectedBrands,
    minPriceParam,
    maxPriceParam,
    inStockParam,
    sortParam,
    pageParam,
  ]);

  // URL State Mutators
  const updateParams = (newParams: Record<string, string | string[] | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null) {
        next.delete(key);
      } else if (Array.isArray(value)) {
        next.delete(key);
        value.forEach((v) => next.append(key, v));
      } else {
        next.set(key, value);
      }
    });
    setSearchParams(next, { replace: true });
  };

  const handleToggleCategory = (catName: string) => {
    const exists = selectedCategories.includes(catName);
    const updated = exists
      ? selectedCategories.filter((c) => c !== catName)
      : [...selectedCategories, catName];

    updateParams({
      category: null, // clear single category in favor of multi
      cat: updated.length > 0 ? updated : null,
      page: "1",
    });
  };

  const handleToggleBrand = (brandName: string) => {
    const exists = selectedBrands.includes(brandName);
    const updated = exists
      ? selectedBrands.filter((b) => b !== brandName)
      : [...selectedBrands, brandName];

    updateParams({
      brand: updated.length > 0 ? updated : null,
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

  const handleToggleInStock = (inStock: boolean) => {
    updateParams({
      inStock: inStock ? "true" : null,
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

  const handleAddToCart = async (product: Product) => {
    try {
      await addCartItem(product.id, 1);
      toast.success(`Added 1 × ${product.name} to cart.`);
    } catch {
      toast.error(`Failed to add ${product.name} to cart.`);
    }
  };

  return (
    <div className="w-full pb-16">
      <Container className="py-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label text-sm text-muted-gray mb-4">
          <Link to="/" className="hover:text-on-pure-white transition-colors duration-150">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/products" className="hover:text-on-pure-white transition-colors duration-150">Shop All</Link>
          <span aria-hidden="true">/</span>
          <span className="text-on-pure-white font-medium">
            {selectedCategories.length === 1 ? selectedCategories[0] : "Electronics"}
          </span>
        </nav>

        {/* Catalogue Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-outline-subtle mb-8">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-headline text-2xl md:text-3xl font-bold text-on-pure-white">
                Explore products.
              </h1>
              <span className="font-label text-sm text-muted-gray tabular-nums">
                {paginatedData.total} {paginatedData.total === 1 ? "product" : "products"}
              </span>
            </div>
            <p className="font-body text-sm md:text-base text-muted-gray">
              {searchQuery ? `Search results for "${searchQuery}"` : "Find the right technology for every need."}
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
            {/* Mobile / Tablet Filter Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm border border-outline-subtle bg-pure-white font-label text-sm text-on-pure-white hover:border-deep-black transition-colors duration-150 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-muted-gray" aria-hidden="true" />
              <span>Filters</span>
            </button>

            {/* Compact Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="font-label text-sm text-muted-gray whitespace-nowrap">
                Sort by
              </label>
              <select
                id="sort-select"
                value={sortParam}
                onChange={handleSortChange}
                className="px-3 py-2 pr-8 rounded-sm bg-light-gray border border-outline-subtle font-label text-sm text-on-pure-white focus:border-deep-black focus:outline-none cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Catalogue Layout: 272px Sidebar + 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[272px_minmax(0,1fr)] gap-8 xl:gap-12 items-start">
          {/* Desktop Filter Sidebar */}
          <ProductFilters
            categories={categoryFacets}
            selectedCategories={selectedCategories}
            onToggleCategory={handleToggleCategory}
            brands={brandFacets}
            selectedBrands={selectedBrands}
            onToggleBrand={handleToggleBrand}
            minPrice={minPriceParam}
            maxPrice={maxPriceParam}
            onPriceChange={handlePriceChange}
            inStockOnly={inStockParam}
            onToggleInStock={handleToggleInStock}
            onClearAll={handleClearAll}
            className="hidden lg:block"
          />

          {/* Product Grid & States */}
          <div className="flex flex-col gap-8 min-w-0">
            {loading ? (
              <div className="py-24">
                <LoadingSpinner label="Calibrating product catalogue..." />
              </div>
            ) : error ? (
              <ErrorState
                title="Catalogue unavailable"
                message={error}
                onRetry={() => {
                  setLoading(true);
                  productService.getPaginatedProducts({
                    search: searchQuery,
                    categories: selectedCategories,
                    brands: selectedBrands,
                    minPrice: minPriceParam > 0 ? minPriceParam : undefined,
                    maxPrice: maxPriceParam < 150000 ? maxPriceParam : undefined,
                    inStockOnly: inStockParam,
                    sort: sortParam,
                    page: pageParam,
                    pageSize: 9,
                  }).then((res) => {
                    setPaginatedData(res);
                    setLoading(false);
                  }).catch((e) => {
                    setError(e instanceof Error ? e.message : "Failed to load catalogue");
                    setLoading(false);
                  });
                }}
              />
            ) : paginatedData.items.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center gap-4 border border-outline-subtle rounded-sm bg-light-gray p-8">
                <SearchX className="w-10 h-10 text-muted-gray" aria-hidden="true" />
                <div className="flex flex-col gap-1">
                  <h2 className="font-headline text-xl font-bold text-on-light-gray">
                    No products match your filters.
                  </h2>
                  <p className="font-body text-sm text-muted-gray max-w-md">
                    Try widening your price range, clearing brand selections, or checking back soon.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-6 py-2.5 rounded-sm bg-primary-orange text-deep-black font-label text-sm font-semibold hover:bg-primary-orange-hover transition-colors duration-150 cursor-pointer"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {paginatedData.items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isCompared={isSelected(product.id)}
                      onToggleCompare={() => toggleProduct(product)}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {/* Minimal Pagination */}
                <Pagination
                  currentPage={paginatedData.page}
                  totalPages={paginatedData.totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </Container>

      {/* Floating Comparison Bar matching Stitch reference */}
      <ComparisonBar />

      {/* Mobile Drawer Filter Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-deep-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-pure-white h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl ml-auto animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-outline-subtle">
                <h3 className="font-headline text-lg font-bold">Filters</h3>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1 rounded-sm text-muted-gray hover:text-deep-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ProductFilters
                categories={categoryFacets}
                selectedCategories={selectedCategories}
                onToggleCategory={handleToggleCategory}
                brands={brandFacets}
                selectedBrands={selectedBrands}
                onToggleBrand={handleToggleBrand}
                minPrice={minPriceParam}
                maxPrice={maxPriceParam}
                onPriceChange={handlePriceChange}
                inStockOnly={inStockParam}
                onToggleInStock={handleToggleInStock}
                onClearAll={handleClearAll}
              />
            </div>
            <div className="pt-6 border-t border-outline-subtle mt-6">
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full py-3 rounded-sm bg-primary-orange text-deep-black font-label text-sm font-semibold hover:bg-primary-orange-hover"
              >
                Apply &amp; View Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
