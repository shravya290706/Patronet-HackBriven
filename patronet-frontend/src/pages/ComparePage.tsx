import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { useComparison } from "@/context/ComparisonContext";
import { useCart } from "@/context/CartContext";
import { productService } from "@/services";
import { getProductPrimaryImageUrl } from "@/lib/imageUtils";
import type { Product } from "@/types";

export const ComparePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { selectedProducts: contextProducts, clearSelection, toggleProduct } = useComparison();
  const { addItem: addCartItem } = useCart();

  const [products, setProducts] = React.useState<Product[]>(contextProducts);
  const [loading, setLoading] = React.useState<boolean>(false);

  // Synchronize with context or URL ids
  React.useEffect(() => {
    if (contextProducts.length > 0) {
      setProducts(contextProducts);
      return;
    }

    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length > 0) {
        setLoading(true);
        Promise.all(ids.map((id) => productService.getProductById(id)))
          .then((results) => {
            const valid = results.filter((p): p is Product => p !== null);
            setProducts(valid);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    }
  }, [contextProducts, searchParams]);

  // Dynamically collect all unique specification keys across compared products
  const allSpecKeys = React.useMemo(() => {
    const keys = new Set<string>();
    products.forEach((p) => {
      if (p.specifications && typeof p.specifications === "object") {
        Object.keys(p.specifications).forEach((k) => {
          if (k !== "data_provenance" && k !== "Category") {
            keys.add(k);
          }
        });
      }
    });
    return Array.from(keys);
  }, [products]);

  const handleAddToCart = async (product: Product) => {
    try {
      await addCartItem(product.id, 1);
      toast.success(`Added 1 × ${product.name} to cart.`);
    } catch {
      toast.error(`Failed to add ${product.name} to cart.`);
    }
  };

  const handleRemove = (product: Product) => {
    toggleProduct(product);
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
  };

  const formatKeyLabel = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatSpecValue = (val: unknown): string => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "boolean") return val ? "Yes" : "No";
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  return (
    <Container className="py-8">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "AI Comparison Studio" }]}
        badge="Side-by-Side Analysis"
        title="AI Comparison Studio"
        description="Compare specifications, dimensions, materials, and prices across selected hardware."
      />

      {loading ? (
        <div className="py-16 text-center text-muted-gray font-label">
          Loading comparison data...
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center gap-4 border border-outline-subtle rounded-sm bg-light-gray p-8">
          <div className="flex flex-col gap-1 max-w-md">
            <h2 className="font-headline text-xl font-bold text-on-light-gray">
              No products selected for comparison.
            </h2>
            <p className="font-body text-sm text-muted-gray">
              Select 2 or more products from the catalogue using the "Compare" checkbox to analyze specifications side by side.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-sm bg-primary-orange text-deep-black font-label text-sm font-semibold hover:bg-primary-orange-hover transition-colors duration-150"
          >
            <span>Explore catalogue</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 font-label text-sm text-muted-gray hover:text-on-pure-white transition-colors duration-150"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to catalogue</span>
            </Link>
            <button
              type="button"
              onClick={clearSelection}
              className="font-label text-sm text-muted-gray hover:text-primary-orange transition-colors duration-150 cursor-pointer"
            >
              Clear all
            </button>
          </div>

          <div className="overflow-x-auto border border-outline-subtle rounded-sm bg-pure-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-subtle bg-light-gray">
                  <th className="p-4 font-label text-label-md font-semibold text-muted-gray w-1/4">
                    Product
                  </th>
                  {products.map((p) => {
                    const imgUrl = getProductPrimaryImageUrl(p);
                    return (
                      <th
                        key={p.id}
                        className="p-4 font-label text-label-md font-semibold text-on-pure-white align-top"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="relative aspect-square w-24 bg-light-gray rounded-sm overflow-hidden flex items-center justify-center p-2 border border-outline-subtle">
                            <img
                              src={imgUrl}
                              alt={p.name}
                              className="w-full h-full object-contain mix-blend-multiply"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemove(p)}
                              title="Remove from comparison"
                              aria-label={`Remove ${p.name} from comparison`}
                              className="absolute top-1 right-1 p-1 rounded-full bg-pure-white text-muted-gray hover:text-deep-black shadow-xs cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div>
                            <span className="font-label text-xs uppercase tracking-wider text-muted-gray block">
                              {p.brand}
                            </span>
                            <Link
                              to={`/products/${p.id}`}
                              className="font-title text-base font-semibold text-deep-black hover:text-accent-orange-text transition-colors line-clamp-2"
                            >
                              {p.name}
                            </Link>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(p)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-sm bg-deep-black text-on-deep-black font-label text-xs font-semibold hover:bg-surface-dark-elevated transition-colors duration-150 cursor-pointer"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add to cart</span>
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-subtle font-body text-body-md">
                <tr>
                  <td className="p-4 font-medium text-muted-gray">Price</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 font-bold tabular-nums text-deep-black">
                      ₹{p.price.toLocaleString("en-IN")}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted-gray">Category</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4">
                      {p.category?.name || "General"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted-gray">SKU</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 font-mono text-xs text-muted-gray">
                      {p.sku}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-muted-gray">Availability</td>
                  {products.map((p) => {
                    const isAvail = p.inventory && p.inventory.length > 0
                      ? p.inventory.some((i) => i.isAvailable && i.quantityOnHand > 0)
                      : p.isActive;
                    return (
                      <td key={p.id} className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 font-label text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isAvail
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {isAvail ? "In Stock" : "Unavailable"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                {allSpecKeys.map((key) => (
                  <tr key={key}>
                    <td className="p-4 font-medium text-muted-gray">
                      {formatKeyLabel(key)}
                    </td>
                    {products.map((p) => {
                      const val = p.specifications?.[key];
                      return (
                        <td key={p.id} className="p-4 text-deep-black">
                          {formatSpecValue(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Container>
  );
};
