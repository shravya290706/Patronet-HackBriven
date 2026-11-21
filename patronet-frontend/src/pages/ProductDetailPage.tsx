import * as React from "react";
import { useParams, Link } from "react-router-dom";
import {
  Check,
  Scale,
  Handshake,
  Heart,
  ShoppingCart,
  Truck,
  PackageOpen,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/layout/Container";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductGallery } from "@/components/products/ProductGallery";
import { productService } from "@/services";
import { NegotiationModal } from "@/components/negotiation/NegotiationModal";
import { useComparison } from "@/context/ComparisonContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import type { Product } from "@/types";

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isCompared, addToCompare, removeFromCompare } = useComparison();
  const { addItem: addCartItem } = useCart();
  const { isWishlisted: contextIsWishlisted, toggleWishlist: contextToggleWishlist } = useWishlist();

  const [product, setProduct] = React.useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [quantity, setQuantity] = React.useState<number>(1);
  const [isAdding, setIsAdding] = React.useState<boolean>(false);
  const [isNegotiateOpen, setIsNegotiateOpen] = React.useState<boolean>(false);

  // Delivery check state
  const [pincode, setPincode] = React.useState<string>("");
  const [pincodeResult, setPincodeResult] = React.useState<string | null>(null);

  const isSaved = product ? contextIsWishlisted(product.id) : false;
  const inCompare = product ? isCompared(product.id) : false;

  // Reset quantity whenever id changes
  React.useEffect(() => {
    setQuantity(1);
    setPincodeResult(null);
  }, [id]);

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

        // Fetch related products from same category or general catalogue
        try {
          const categoryName =
            fetchedProduct.category?.name ||
            (typeof fetchedProduct.specifications?.Category === "string"
              ? fetchedProduct.specifications.Category
              : undefined);

          const allProducts = await productService.getProducts({
            categories: categoryName ? [categoryName] : undefined,
            pageSize: 12,
          });

          if (!isCancelled) {
            const list = Array.isArray(allProducts) ? allProducts : [];
            const filtered = list
              .filter((p: Product) => p.id !== fetchedProduct.id)
              .slice(0, 4);
            setRelatedProducts(filtered);
          }
        } catch {
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
    if (!product || isAdding) return;
    setIsAdding(true);
    try {
      await addCartItem(product.id, quantity);
      toast.success(`Added ${quantity} × ${product.name} to cart.`);
    } catch {
      toast.error(`Failed to add ${product.name} to cart.`);
    } finally {
      setIsAdding(false);
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
      toast.error("Failed to update wishlist.");
    }
  };

  const handleToggleCompare = () => {
    if (!product) return;
    if (inCompare) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pincode.trim();
    if (!clean) {
      setPincodeResult("Please enter a 6-digit pincode.");
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(clean)) {
      setPincodeResult("Invalid PIN code format. Please enter a valid 6-digit Indian postal code.");
      return;
    }
    setPincodeResult(`Delivery available for PIN code ${clean} via Standard Dispatch (2-4 business days).`);
  };

  const formattedPrice = product
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(product.price)
    : "";

  const categoryName = product
    ? product.category?.name ||
      (typeof product.specifications?.Category === "string" ? product.specifications.Category : "Catalog")
    : "";

  return (
    <div className="bg-surface min-h-[calc(100vh-120px)] py-space-sm pb-space-xl">
      <Container>
        {/* Breadcrumb Navigation */}
        <section className="pt-space-md pb-space-sm">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-body-sm text-outline mb-space-md">
            <Link to="/" className="text-primary hover:underline font-medium">
              Home
            </Link>
            <span>/</span>
            <Link
              to={`/products?category=${encodeURIComponent(categoryName)}`}
              className="text-primary hover:underline font-medium"
            >
              {categoryName}
            </Link>
            <span>/</span>
            <span className="text-on-surface truncate max-w-xs sm:max-w-md font-semibold">
              {product ? product.name : "Product Details"}
            </span>
          </nav>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start animate-pulse my-4">
            <div className="lg:col-span-6 space-y-space-md">
              <div className="w-full aspect-square bg-surface-container-low rounded-2xl" />
              <div className="grid grid-cols-4 gap-space-sm">
                <div className="aspect-square bg-surface-container-low rounded-xl" />
                <div className="aspect-square bg-surface-container-low rounded-xl" />
                <div className="aspect-square bg-surface-container-low rounded-xl" />
                <div className="aspect-square bg-surface-container-low rounded-xl" />
              </div>
            </div>
            <div className="lg:col-span-6 bg-surface-container-lowest rounded-2xl p-space-xl border border-surface-container/60 space-y-4">
              <div className="h-4 bg-surface-container-low rounded w-1/4" />
              <div className="h-8 bg-surface-container-low rounded w-3/4" />
              <div className="h-4 bg-surface-container-low rounded w-1/2" />
              <div className="h-12 bg-surface-container-low rounded w-1/3" />
              <div className="h-24 bg-surface-container-low rounded w-full" />
              <div className="h-12 bg-surface-container-low rounded w-full" />
            </div>
          </div>
        ) : error || !product ? (
          <div className="bg-surface-container-lowest rounded-2xl p-space-xl border border-surface-container/60 text-center space-y-3 my-8 max-w-xl mx-auto shadow-sm">
            <div className="w-14 h-14 rounded-full bg-surface-container-low text-outline mx-auto flex items-center justify-center">
              <PackageOpen className="w-7 h-7" />
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Product Not Found
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              The requested product does not exist or has been removed from the catalog.
            </p>
            <Link
              to="/products"
              className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5 mt-2"
            >
              <span>Browse Available Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-space-xl">
            {/* Main Product Display: 6 Cols Gallery + 6 Cols Product Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
              {/* Product Image Gallery */}
              <div className="lg:col-span-6">
                <ProductGallery
                  product={product}
                  images={product.images}
                  productName={product.name}
                />
              </div>

              {/* Product Details Panel */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-xl shadow-sm border border-surface-container/60 flex flex-col gap-space-md">
                  {/* Brand & SKU */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {product.brand && (
                      <span className="px-2.5 py-1 rounded bg-surface-container-high text-primary font-label-sm text-label-sm tracking-widest uppercase font-bold">
                        {product.brand}
                      </span>
                    )}
                    <span className="font-mono text-body-sm text-outline">
                      SKU: {product.sku}
                    </span>
                  </div>

                  {/* Title & Category */}
                  <div>
                    <h1 className="font-display-sm text-display-sm text-on-surface leading-tight font-bold tracking-tight">
                      {product.name}
                    </h1>
                    {categoryName && (
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Category: <span className="text-on-surface font-medium">{categoryName}</span>
                      </p>
                    )}
                  </div>

                  {/* Price Banner */}
                  <div className="flex items-baseline justify-between py-space-sm bg-surface-container-low/60 rounded-xl px-space-md">
                    <div className="flex items-baseline gap-space-sm">
                      <span className="font-headline-lg text-headline-lg text-primary font-bold">
                        {formattedPrice}
                      </span>
                      <span className="font-body-sm text-outline">Inclusive of all taxes</span>
                    </div>
                  </div>

                  {/* Description */}
                  {product.description && (
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  {/* Quantity & Add to Cart & Wishlist */}
                  <div className="flex flex-col sm:flex-row items-center gap-space-md pt-space-xs">
                    <div className="flex items-center bg-surface-container-low rounded-xl p-1 w-full sm:w-auto justify-between sm:justify-start border border-outline-variant/30">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                        className="w-10 h-10 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center font-bold text-headline-sm select-none shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        aria-label="Quantity"
                        className="w-12 text-center bg-transparent font-title-md text-title-md text-on-surface focus:outline-none [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                      >
                      </input>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        aria-label="Increase quantity"
                        className="w-10 h-10 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center font-bold text-headline-sm select-none shadow-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={isAdding}
                      className="flex-1 w-full h-12 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-md text-label-md flex items-center justify-center gap-space-sm shadow-xs transition-all duration-200 active:scale-[0.99] font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>{isAdding ? "Adding..." : "Add to Cart"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleWishlist}
                      aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
                      className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors shadow-xs shrink-0 cursor-pointer ${
                        isSaved
                          ? "bg-secondary-container text-on-secondary"
                          : "bg-surface-container-low hover:bg-surface-container-high text-on-surface"
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isSaved ? "fill-current text-white" : "text-outline"}`} />
                    </button>
                  </div>

                  {/* Compare Buddy & Negotiator row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleToggleCompare}
                      aria-label={inCompare ? "Remove from Compare Buddy" : "Add to Compare Buddy"}
                      className={`h-12 rounded-xl font-label-md text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all border cursor-pointer shadow-xs ${
                        inCompare
                          ? "bg-primary text-on-primary border-primary ring-2 ring-primary/30"
                          : "bg-surface-container-low hover:bg-surface-container-high text-on-surface border-surface-container hover:border-primary/40"
                      }`}
                    >
                      {inCompare ? (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>In Compare Buddy (Click to Remove)</span>
                        </>
                      ) : (
                        <>
                          <Scale className="w-4 h-4" />
                          <span>Add to Compare Buddy (Up to 4)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsNegotiateOpen(true)}
                      aria-label="Open Negotiator to bargain price with seller"
                      className="h-12 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-950 border border-amber-300 font-label-md text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Handshake className="w-4.5 h-4.5 text-amber-800" />
                      <span>Negotiate Price / Bargain</span>
                    </button>
                  </div>

                  {/* Check Delivery Availability */}
                  <div className="border-t border-surface-container/60 pt-space-md mt-space-xs">
                    <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5 mb-2">
                      <Truck className="w-4 h-4 text-primary" />
                      <span>Check Delivery Availability</span>
                    </span>
                    <form onSubmit={handlePincodeSubmit} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter 6-digit Pincode"
                          className="w-full bg-surface-container-low rounded-lg px-3 py-2 text-body-sm font-body-sm text-on-surface border border-outline-variant/40 focus:outline-none focus:border-primary"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-surface-container-high hover:bg-surface-variant text-primary font-label-md text-label-md font-bold rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        Check
                      </button>
                    </form>
                    {pincodeResult && (
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
                        {pincodeResult}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
              <div className="mt-space-xl flex flex-col gap-space-md pt-space-md border-t border-surface-container/60">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-xs">
                  <div>
                    <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                      Related Products in {categoryName || "Category"}
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                      Explore matching items in our catalog
                    </p>
                  </div>
                  <Link
                    to={`/products?category=${encodeURIComponent(categoryName)}`}
                    className="font-label-md text-label-md text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all in category</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
                  {relatedProducts.map((relProduct) => (
                    <ProductCard key={relProduct.id} product={relProduct} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Container>

      {product && (
        <NegotiationModal
          product={product}
          isOpen={isNegotiateOpen}
          onClose={() => setIsNegotiateOpen(false)}
        />
      )}
    </div>
  );
};
