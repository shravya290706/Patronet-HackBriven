import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { HomeHero } from "@/components/home/HomeHero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { PartnerBanner } from "@/components/home/PartnerBanner";
import { ProductCard } from "@/components/products/ProductCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { productService } from "@/services";
import type { Product } from "@/types";

export const HomePage: React.FC = () => {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Tab filter for Featured Products: 'all' | 'audio' | 'computing'
  const [featuredTab, setFeaturedTab] = React.useState<"all" | "audio" | "computing">("all");

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = React.useState<string>("");
  const [newsletterStatus, setNewsletterStatus] = React.useState<string | null>(null);

  const fetchProducts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProducts({ pageSize: 50 });
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Featured products filtered by tab
  const featuredProducts = React.useMemo(() => {
    if (featuredTab === "all") {
      return products.slice(0, 8);
    }
    const filtered = products.filter((p) => {
      const cat = (p.category?.name || String(p.specifications?.Category || "")).toLowerCase();
      const name = p.name.toLowerCase();
      if (featuredTab === "audio") {
        return cat.includes("audio") || name.includes("headphone") || name.includes("speaker") || name.includes("earbuds");
      }
      return cat.includes("tech") || cat.includes("computing") || cat.includes("electronic") || cat.includes("mobile") || cat.includes("accessories");
    });
    return (filtered.length > 0 ? filtered : products).slice(0, 8);
  }, [products, featuredTab]);

  // New arrivals slice
  const newArrivals = React.useMemo(() => {
    return products.slice(8, 12);
  }, [products]);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus("Thank you for subscribing to Patronet updates!");
    setNewsletterEmail("");
    setTimeout(() => setNewsletterStatus(null), 4000);
  };

  return (
    <div className="space-y-space-xl py-space-md pb-space-xl">
      {/* 1. Hero Carousel + 4 Feature Badges */}
      <Container>
        <HomeHero />
      </Container>

      {/* 2. Popular Categories Grid (6 columns) */}
      <Container>
        <CategoryGrid />
      </Container>

      {/* 3. Featured Products Section */}
      <Container>
        <section className="space-y-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
                Featured Products
              </h2>
              <p className="font-body-sm text-body-sm text-outline mt-0.5">
                Curated marketplace catalog selection
              </p>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-full overflow-x-auto">
              <button
                type="button"
                onClick={() => setFeaturedTab("all")}
                className={`px-space-md py-1 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                  featuredTab === "all"
                    ? "bg-primary text-on-primary shadow-xs font-semibold"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFeaturedTab("audio")}
                className={`px-space-md py-1 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                  featuredTab === "audio"
                    ? "bg-primary text-on-primary shadow-xs font-semibold"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                Audio
              </button>
              <button
                type="button"
                onClick={() => setFeaturedTab("computing")}
                className={`px-space-md py-1 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                  featuredTab === "computing"
                    ? "bg-primary text-on-primary shadow-xs font-semibold"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                Tech &amp; Devices
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12">
              <LoadingSpinner label="Loading featured catalog..." />
            </div>
          ) : error ? (
            <ErrorState title="Unable to load products" message={error} onRetry={fetchProducts} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </Container>

      {/* 4. Payment Partner Offers Banner */}
      <Container>
        <PartnerBanner />
      </Container>

      {/* 5. New Arrivals Section */}
      <Container>
        <section className="space-y-space-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
                New Arrivals
              </h2>
              <p className="font-body-sm text-body-sm text-outline mt-0.5">
                Recent catalog additions
              </p>
            </div>
            <Link
              to="/products?sort=newest"
              className="flex items-center gap-space-xs font-label-md text-label-md text-primary font-bold hover:text-secondary-container transition-colors cursor-pointer"
            >
              <span>See All New Items</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12">
              <LoadingSpinner label="Loading new arrivals..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </Container>

      {/* 6. Marketplace Newsletter Subscription */}
      <Container>
        <section className="w-full bg-surface-container-lowest rounded-2xl p-space-lg sm:p-space-xl shadow-sm border border-surface-container flex flex-col md:flex-row items-center justify-between gap-space-lg">
          <div className="space-y-space-xs max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">
              <Mail className="h-3.5 w-3.5" />
              <span>Newsletter</span>
            </div>
            <h3 className="font-headline-sm sm:font-headline-lg text-headline-sm sm:text-headline-lg text-on-surface font-bold">
              Subscribe to Marketplace Updates
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Receive notifications about catalog arrivals, promotions, and marketplace announcements.
            </p>
          </div>
          <div className="w-full md:w-auto min-w-[300px] sm:min-w-[360px]">
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email..."
                className="flex-1 px-space-md py-2.5 rounded-lg bg-surface-container-low border border-surface-container-highest text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-space-lg py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-bold transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
            {newsletterStatus && (
              <p role="status" className="mt-2 text-sm text-primary font-medium">
                {newsletterStatus}
              </p>
            )}
          </div>
        </section>
      </Container>
    </div>
  );
};
