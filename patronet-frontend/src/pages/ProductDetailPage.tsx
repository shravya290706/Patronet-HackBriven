import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Minus,
  Plus,
  Heart,
  Scale,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/layout/Container";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductSpecsTabs } from "@/components/products/ProductSpecsTabs";
import { ComparisonBar } from "@/components/products/ComparisonBar";
import { productService } from "@/services";
import { useComparison } from "@/context/ComparisonContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import type { Product } from "@/types";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSelected: isCompared, toggleProduct: toggleCompareProduct } = useComparison();
  const { addItem: addCartItem } = useCart();
  const { isWishlisted: contextIsWishlisted, toggleWishlist: contextToggleWishlist } = useWishlist();

  const [product, setProduct] = React.useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [quantity, setQuantity] = React.useState<number>(1);

  const isWishlisted = product ? contextIsWishlisted(product.id) : false;

  const [prevId, setPrevId] = React.useState<string | undefined>(id);
  if (id !== prevId) {
    setPrevId(id);
    setQuantity(1);
  }

  // Fetch Product Details and Related Products
  React.useEffect(() => {
    let isCancelled = false;

    async function loadProductAndRelated() {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const fetchedProduct = await productService.getProductById(id);
        if (isCancelled) return;

        if (!fetchedProduct) {
          setError("Product not found");
          setProduct(null);
          setLoading(false);
          return;
        }

        setProduct(fetchedProduct);

        // Fetch related products (same category or general catalogue, excluding current)
        try {
          const categoryName =
            typeof fetchedProduct.specifications?.Category === "string"
              ? fetchedProduct.specifications.Category
              : undefined;

          const allProducts = await productService.getProducts({
            categories: categoryName ? [categoryName] : undefined,
          });

          if (!isCancelled) {
            const filtered = allProducts
              .filter((p: Product) => p.id !== fetchedProduct.id)
              .slice(0, 4);
            setRelatedProducts(filtered);
          }
        } catch {
          // Non-fatal if related products fail
          if (!isCancelled) setRelatedProducts([]);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Failed to load product details");
          setProduct(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadProductAndRelated();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addCartItem(product.id, quantity);
      toast.success(`Added ${quantity} × ${product.name} to cart.`);
    } catch {
      toast.error(`Failed to add ${product.name} to cart.`);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    try {
      const nowSaved = await contextToggleWishlist(product.id);
      if (nowSaved) {
        toast.info(`Added ${product.name} to your wishlist.`);
      } else {
        toast.info(`Removed ${product.name} from wishlist.`);
      }
    } catch {
      toast.error('Failed to update wishlist.');
    }
  };

  if (loading) {
    return (
      <Container className="py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" label="Retrieving calibrated product telemetry..." />
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-16">
        <ErrorState
          title="Product Not Found"
          message={error || "We couldn't locate the requested hardware specification."}
          onRetry={() => navigate("/products")}
        />
      </Container>
    );
  }

  const categoryName =
    typeof product.specifications?.Category === "string"
      ? product.specifications.Category
      : "Catalogue";

  // Key spec highlights for the 2x2 grid
  const graphicsSpec =
    product.specifications?.Graphics ||
    product.specifications?.GPU ||
    "Discrete Architecture";
  const memorySpec =
    product.specifications?.Memory ||
    product.specifications?.RAM ||
    "Unified Memory";
  const storageSpec =
    product.specifications?.Storage ||
    product.specifications?.SSD ||
    "Fast NVMe Storage";
  const displaySpec =
    product.specifications?.Display ||
    product.specifications?.Screen ||
    "Calibrated Display";

  const isInComparison = isCompared(product.id);
  const fallbackImg = product.primaryImage || product.images?.[0]?.url || "";

  return (
    <Container className="py-8">
      {/* 1. Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 font-label text-sm text-muted-gray mb-8"
      >
        <Link to="/" className="hover:text-deep-black transition-colors duration-150">
          Home
        </Link>
        <span aria-hidden="true" className="text-outline-subtle">
          /
        </span>
        <Link
          to={`/products?category=${encodeURIComponent(categoryName)}`}
          className="hover:text-deep-black transition-colors duration-150"
        >
          {categoryName}
        </Link>
        <span aria-hidden="true" className="text-outline-subtle">
          /
        </span>
        <span className="text-deep-black font-medium truncate max-w-[280px] sm:max-w-md">
          {product.name}
        </span>
      </nav>

      {/* 2. Main Product Layout (55% Gallery / 45% Purchase Panel) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start pb-12">
        {/* LEFT COLUMN: Gallery (~55% -> 7 cols) */}
        <div className="lg:col-span-7">
          <ProductGallery
            product={product}
            images={product.images}
            fallbackImage={fallbackImg}
            productName={product.name}
          />
        </div>

        {/* RIGHT COLUMN: Product Details & Purchase Actions (~45% -> 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:pl-4">
          {/* Header & Pricing */}
          <div className="flex flex-col gap-2 pb-6 border-b border-outline-subtle">
            <span className="font-label text-sm font-semibold tracking-wider text-muted-gray uppercase">
              {product.brand}
            </span>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-deep-black tracking-tight">
              {product.name}
            </h1>
            {product.subtitle && (
              <p className="font-body text-base text-muted-gray leading-relaxed">
                {product.subtitle}
              </p>
            )}

            <div className="pt-4 flex items-baseline gap-3">
              <span className="font-headline text-3xl font-bold text-deep-black tabular-nums">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              <span className="font-body text-sm text-muted-gray">Inclusive of GST</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-sm line-through text-muted-gray ml-1">
                  ₹{product.compareAtPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>

          {/* Key Specifications (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-4 pb-6 border-b border-outline-subtle">
            <div className="flex flex-col gap-1">
              <span className="font-label text-xs uppercase tracking-wide text-muted-gray">
                Graphics
              </span>
              <span className="font-title text-sm sm:text-base font-semibold text-deep-black">
                {String(graphicsSpec)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-label text-xs uppercase tracking-wide text-muted-gray">
                Memory
              </span>
              <span className="font-title text-sm sm:text-base font-semibold text-deep-black">
                {String(memorySpec)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-label text-xs uppercase tracking-wide text-muted-gray">
                Storage
              </span>
              <span className="font-title text-sm sm:text-base font-semibold text-deep-black">
                {String(storageSpec)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-label text-xs uppercase tracking-wide text-muted-gray">
                Display
              </span>
              <span className="font-title text-sm sm:text-base font-semibold text-deep-black">
                {String(displaySpec)}
              </span>
            </div>
          </div>

          {/* Stock Availability */}
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-accent-orange-text shrink-0" />
            <span className="font-label text-sm font-semibold text-deep-black">In stock</span>
            <span className="font-body text-sm text-muted-gray">
              — Ships within 24 hours across India
            </span>
          </div>

          {/* Quantity Selector + Add to Cart */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Quantity Counter */}
              <div className="inline-flex items-center justify-between border border-outline-subtle rounded-sm bg-light-gray h-12 px-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  className="w-9 h-9 inline-flex items-center justify-center text-deep-black hover:text-accent-orange-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span
                  id="product-qty"
                  className="w-10 text-center font-label text-base font-medium tabular-nums text-deep-black"
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(1)}
                  aria-label="Increase quantity"
                  className="w-9 h-9 inline-flex items-center justify-center text-deep-black hover:text-accent-orange-text transition-colors duration-150 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 h-12 px-6 rounded-sm bg-primary-orange text-deep-black font-label text-base font-semibold hover:bg-primary-orange-hover active:scale-[0.99] transition-all duration-150 cursor-pointer shadow-sm flex items-center justify-center"
              >
                Add to Cart
              </button>
            </div>

            {/* Secondary Actions: Wishlist & Compare */}
            <div className="grid grid-cols-2 gap-4">
              <button
                id="detail-wishlist-btn"
                type="button"
                onClick={handleToggleWishlist}
                aria-pressed={isWishlisted}
                className={`h-11 inline-flex items-center justify-center gap-2 rounded-sm border font-label text-sm font-medium transition-colors duration-150 cursor-pointer ${
                  isWishlisted
                    ? "border-accent-orange-text text-accent-orange-text bg-accent-orange-text/5"
                    : "border-outline-subtle bg-pure-white text-deep-black hover:border-deep-black"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    isWishlisted ? "fill-accent-orange-text text-accent-orange-text" : "text-deep-black"
                  }`}
                />
                <span>{isWishlisted ? "Wishlisted" : "Add to Wishlist"}</span>
              </button>

              <button
                id="detail-compare-btn"
                type="button"
                onClick={() => toggleCompareProduct(product)}
                aria-pressed={isInComparison}
                className={`h-11 inline-flex items-center justify-center gap-2 rounded-sm border font-label text-sm font-medium transition-colors duration-150 cursor-pointer ${
                  isInComparison
                    ? "border-deep-black bg-deep-black text-white"
                    : "border-outline-subtle bg-pure-white text-deep-black hover:border-deep-black"
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>{isInComparison ? "Compared" : "Add to Compare"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Product Specifications Tab Panel */}
      <ProductSpecsTabs product={product} />

      {/* 4. AI Comparison Feature Banner */}
      <section className="pb-16">
        <div className="bg-deep-black text-white rounded-sm p-8 lg:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-deep-black">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-orange shrink-0" />
              <h2 className="font-headline text-xl sm:text-2xl font-bold text-white">
                Not sure if this is the right one?
              </h2>
            </div>
            <p className="font-body text-base text-gray-300">
              Compare this product with similar options and discover which one fits your workflow
              needs.
            </p>
          </div>
          <Link
            to={`/compare?ids=${product.id}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm bg-primary-orange text-deep-black font-label text-base font-semibold hover:bg-primary-orange-hover active:scale-[0.99] transition-all duration-150 shrink-0"
          >
            <span>Compare with AI</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 5. Related Products ("You might also like.") */}
      {relatedProducts.length > 0 && (
        <section className="pb-16">
          <div className="flex items-end justify-between gap-4 pb-4 border-b border-outline-subtle mb-8">
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-deep-black">
              You might also like.
            </h2>
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 font-label text-sm sm:text-base font-medium text-deep-black hover:text-accent-orange-text transition-colors duration-150 shrink-0"
            >
              <span>View catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {relatedProducts.map((relProd) => (
              <ProductCard
                key={relProd.id}
                product={relProd}
                isCompared={isCompared(relProd.id)}
                onToggleCompare={toggleCompareProduct}
                onAddToCart={async (p) => {
                  try {
                    await addCartItem(p.id, 1);
                    toast.success(`Added 1 × ${p.name} to cart.`);
                  } catch {
                    toast.error(`Failed to add ${p.name} to cart.`);
                  }
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Persistent Comparison Drawer / Bar */}
      <ComparisonBar />
    </Container>
  );
};
