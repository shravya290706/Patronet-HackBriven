import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Trash2,
  ArrowRight,
  Sparkles,
  Award,
  ThumbsUp,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  Bot,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { useComparison } from "@/context/ComparisonContext";
import { useCart } from "@/context/CartContext";
import {
  productService,
  comparorService,
  type ComparorAnalysisResponse,
} from "@/services";
import { getProductPrimaryImageUrl } from "@/lib/imageUtils";
import type { Product } from "@/types";

const PERSONA_CONTEXTS = [
  { id: "all", label: "General Evaluation" },
  { id: "developer", label: "Developer & Multitasking" },
  { id: "gaming", label: "Gaming & Graphics" },
  { id: "student", label: "Student & Budget" },
  { id: "creator", label: "Media & Content Creation" },
];

export const ComparePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { selectedProducts: contextProducts, clearSelection, toggleProduct } = useComparison();
  const { addItem: addCartItem } = useCart();

  const [products, setProducts] = React.useState<Product[]>(contextProducts);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [highlightDiffs, setHighlightDiffs] = React.useState<boolean>(true);

  // Gemini AI Analysis State
  const [aiAnalysis, setAiAnalysis] = React.useState<ComparorAnalysisResponse | null>(null);
  const [aiLoading, setAiLoading] = React.useState<boolean>(false);
  const [selectedPersona, setSelectedPersona] = React.useState<string>("all");

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

  // Trigger AI Comparison Analysis whenever products or persona changes
  React.useEffect(() => {
    if (products.length < 2) {
      setAiAnalysis(null);
      return;
    }

    let isMounted = true;
    setAiLoading(true);

    const productIds = products.map((p) => p.id);
    const context = selectedPersona !== "all" ? selectedPersona : undefined;

    comparorService
      .analyze(productIds, context)
      .then((data) => {
        if (isMounted) {
          setAiAnalysis(data);
        }
      })
      .catch((err) => {
        console.error("Comparor AI analysis error:", err);
      })
      .finally(() => {
        if (isMounted) setAiLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [products, selectedPersona]);

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

  // Identify Best Value Option & Value Analysis
  const valueAnalysis = React.useMemo(() => {
    if (products.length < 2) return null;

    let minPriceProduct = products[0];
    let maxPriceProduct = products[0];

    products.forEach((p) => {
      if (p.price < minPriceProduct.price) minPriceProduct = p;
      if (p.price > maxPriceProduct.price) maxPriceProduct = p;
    });

    // Score based on price competitiveness and specification richness
    const scores = products.map((p) => {
      const specCount = p.specifications ? Object.keys(p.specifications).length : 0;
      const isAvail = p.inventory && p.inventory.length > 0
        ? p.inventory.some((i) => i.isAvailable && i.quantityOnHand > 0)
        : p.isActive;
      const valueScore = (specCount * 10000) / (p.price || 1) + (isAvail ? 2 : 0);
      return { product: p, score: valueScore };
    });

    scores.sort((a, b) => b.score - a.score);
    const bestValue = scores[0].product;

    return {
      bestValueId: bestValue.id,
      minPrice: minPriceProduct.price,
      maxPrice: maxPriceProduct.price,
      priceSpread: maxPriceProduct.price - minPriceProduct.price,
      bestValueName: bestValue.name,
    };
  }, [products]);

  // Get AI product analysis if available
  const getAiProductAnalysis = React.useCallback(
    (productId: string) => {
      if (!aiAnalysis || !aiAnalysis.product_analyses) return null;
      return aiAnalysis.product_analyses.find((pa) => pa.id === productId);
    },
    [aiAnalysis]
  );

  // Helper to determine Pros and Cons for each product based on real attributes + AI
  const getProductProsCons = React.useCallback(
    (product: Product) => {
      const aiData = getAiProductAnalysis(product.id);
      if (aiData && aiData.pros?.length && aiData.cons?.length) {
        return {
          pros: aiData.pros,
          cons: aiData.cons,
          targetPersona: aiData.target_persona,
          differentiator: aiData.key_differentiator,
        };
      }

      const pros: string[] = [];
      const cons: string[] = [];

      if (!valueAnalysis) return { pros, cons };

      if (product.price === valueAnalysis.minPrice) {
        pros.push("Most competitive price point in selection");
      } else if (product.price === valueAnalysis.maxPrice) {
        cons.push("Highest initial investment tier");
      }

      if (product.id === valueAnalysis.bestValueId) {
        pros.push("Optimal price-to-specification ratio (Best Value)");
      }

      const isAvail = product.inventory && product.inventory.length > 0
        ? product.inventory.some((i) => i.isAvailable && i.quantityOnHand > 0)
        : product.isActive;

      if (isAvail) {
        pros.push("In stock & ready for prompt dispatch");
      } else {
        cons.push("Currently out of stock or limited stock");
      }

      const specCount = product.specifications ? Object.keys(product.specifications).length : 0;
      if (specCount >= 5) {
        pros.push("Extensive enterprise hardware specifications");
      }

      return { pros, cons, targetPersona: undefined, differentiator: undefined };
    },
    [valueAnalysis, getAiProductAnalysis]
  );

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

  const hasDifference = React.useCallback(
    (getter: (p: Product) => string | number | boolean | null | undefined) => {
      if (products.length <= 1) return false;
      const firstVal = getter(products[0]);
      return products.some((p) => getter(p) !== firstVal);
    },
    [products]
  );

  return (
    <Container className="py-8">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Comparor Studio" }]}
        badge="USP 1: Intelligent Comparison"
        title="Comparor: Intelligent Product Comparison"
        description="Side-by-side specification matrix, difference highlighting, advantages/disadvantages, and AI Best Value recommendation powered by Gemini."
      />

      {loading ? (
        <div className="py-16 text-center text-muted-gray font-label">
          Loading comparison data...
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center gap-4 border border-outline-subtle rounded-xl bg-light-gray p-8">
          <div className="flex flex-col gap-1 max-w-md">
            <h2 className="font-headline text-xl font-bold text-on-light-gray">
              No products selected for comparison.
            </h2>
            <p className="font-body text-sm text-muted-gray">
              Select 2 to 4 products from the catalogue using the "Compare" button on any product card or detail page.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-on-primary font-label text-sm font-semibold hover:bg-primary-container transition-colors duration-150"
          >
            <span>Explore catalogue</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-surface-container">
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 font-label text-sm text-muted-gray hover:text-on-pure-white transition-colors duration-150"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to catalogue</span>
            </Link>

            <div className="flex items-center gap-4 self-end sm:self-auto flex-wrap">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none text-on-surface">
                <input
                  type="checkbox"
                  checked={highlightDiffs}
                  onChange={(e) => setHighlightDiffs(e.target.checked)}
                  className="rounded border-outline text-primary focus:ring-primary w-4 h-4"
                />
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span>Highlight Differences</span>
              </label>

              <button
                type="button"
                onClick={clearSelection}
                className="font-label text-xs sm:text-sm text-muted-gray hover:text-primary transition-colors duration-150 cursor-pointer"
              >
                Clear all ({products.length}/4)
              </button>
            </div>
          </div>

          {/* Gemini AI Deep Analysis Banner */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-purple-500/10 border border-emerald-500/30 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-emerald-950 uppercase tracking-wide font-label">
                        Comparor AI Analysis
                      </span>
                      {aiAnalysis?.is_ai_powered ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold">
                          <Bot className="w-3 h-3" />
                          Gemini 2.5 Flash
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-muted-gray text-[10px] font-medium">
                          Deterministic Engine
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-gray mt-0.5">
                      Synthesized side-by-side trade-offs, personas, and specification analysis
                    </p>
                  </div>
                </div>

                {/* Persona Filter Selector */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-muted-gray font-medium">Focus Lens:</span>
                  {PERSONA_CONTEXTS.map((persona) => (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => setSelectedPersona(persona.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedPersona === persona.id
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                      }`}
                    >
                      {persona.label}
                    </button>
                  ))}
                </div>
              </div>

              {aiLoading ? (
                <div className="flex items-center gap-2 py-3 text-xs text-emerald-800">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Synthesizing product specifications with Gemini...</span>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {/* Verdict */}
                  <div className="bg-white/80 dark:bg-surface-container-lowest/80 rounded-xl p-3.5 border border-emerald-500/20">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                      Final Verdict
                    </span>
                    <p className="text-sm text-on-surface leading-relaxed">
                      {aiAnalysis?.verdict ||
                        (valueAnalysis
                          ? `Among the ${products.length} compared hardware items, price ranges from ₹${valueAnalysis.minPrice.toLocaleString("en-IN")} to ₹${valueAnalysis.maxPrice.toLocaleString("en-IN")}. ${valueAnalysis.bestValueName} provides the best price-to-specification ratio.`
                          : "Analyzing product options...")}
                    </p>
                  </div>

                  {/* Tradeoffs & Personas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiAnalysis?.tradeoffs && aiAnalysis.tradeoffs.length > 0 && (
                      <div className="bg-white/60 dark:bg-surface-container-lowest/60 rounded-xl p-3 border border-outline-subtle">
                        <span className="text-[11px] font-bold text-muted-gray uppercase tracking-wider block mb-1.5">
                          Key Trade-offs to Consider
                        </span>
                        <ul className="space-y-1">
                          {aiAnalysis.tradeoffs.map((to, i) => (
                            <li key={i} className="text-xs text-on-surface flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{to}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiAnalysis?.recommended_for_persona &&
                      Object.keys(aiAnalysis.recommended_for_persona).length > 0 && (
                        <div className="bg-white/60 dark:bg-surface-container-lowest/60 rounded-xl p-3 border border-outline-subtle">
                          <span className="text-[11px] font-bold text-muted-gray uppercase tracking-wider block mb-1.5">
                            Best Suited For
                          </span>
                          <div className="space-y-1.5">
                            {Object.entries(aiAnalysis.recommended_for_persona).map(([persona, pName]) => (
                              <div key={persona} className="flex items-center justify-between text-xs gap-2">
                                <span className="font-semibold text-emerald-900">{persona}:</span>
                                <span className="text-on-surface font-medium truncate max-w-[200px]" title={pName}>
                                  {pName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="overflow-x-auto border border-surface-container rounded-2xl bg-surface-container-lowest shadow-sm">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-surface-container bg-surface-container-low/50">
                  <th className="p-4 sm:p-5 font-label text-xs uppercase tracking-wider text-muted-gray w-1/5 min-w-[160px]">
                    Attribute Matrix
                  </th>
                  {products.map((p) => {
                    const imgUrl = getProductPrimaryImageUrl(p);
                    const isBestValue = valueAnalysis?.bestValueId === p.id;
                    const aiData = getAiProductAnalysis(p.id);

                    return (
                      <th
                        key={p.id}
                        className={`p-4 sm:p-5 font-label text-sm font-semibold align-top border-l border-surface-container/60 ${
                          isBestValue ? "bg-emerald-500/5 ring-1 ring-inset ring-emerald-500/20" : ""
                        }`}
                      >
                        <div className="flex flex-col gap-3">
                          {isBestValue && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[11px] self-start shadow-xs">
                              <Award className="w-3.5 h-3.5" />
                              <span>Best Value Pick</span>
                            </div>
                          )}

                          <div className="relative aspect-square w-24 bg-surface-container-low rounded-xl overflow-hidden flex items-center justify-center p-2 border border-surface-container">
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
                              className="absolute top-1 right-1 p-1 rounded-full bg-white text-muted-gray hover:text-deep-black shadow-xs cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div>
                            <span className="font-label text-xs uppercase tracking-wider text-muted-gray block font-bold">
                              {p.brand || "Hardware"}
                            </span>
                            <Link
                              to={`/products/${p.id}`}
                              className="font-title text-sm sm:text-base font-bold text-on-surface hover:text-primary transition-colors line-clamp-2 mt-0.5"
                            >
                              {p.name}
                            </Link>
                            {aiData?.target_persona && (
                              <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                                For: {aiData.target_persona}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleAddToCart(p)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-on-primary font-label text-xs font-bold hover:bg-primary-container transition-all shadow-xs cursor-pointer flex-1"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Add to Cart</span>
                            </button>
                            <Link
                              to={`/products/${p.id}`}
                              title="View detail page"
                              className="p-2 rounded-lg border border-surface-container hover:bg-surface-container-high transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-muted-gray" />
                            </Link>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container font-body text-sm">
                {/* Price Row */}
                <tr className={highlightDiffs && hasDifference((p) => p.price) ? "bg-amber-500/5" : ""}>
                  <td className="p-4 font-semibold text-muted-gray">
                    <div className="flex items-center gap-1.5">
                      <span>Price</span>
                      {highlightDiffs && hasDifference((p) => p.price) && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="Values differ" />
                      )}
                    </div>
                  </td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 font-bold tabular-nums text-on-surface border-l border-surface-container/60">
                      <span className="text-base text-primary">₹{p.price.toLocaleString("en-IN")}</span>
                    </td>
                  ))}
                </tr>

                {/* Category Row */}
                <tr className={highlightDiffs && hasDifference((p) => p.category?.name) ? "bg-amber-500/5" : ""}>
                  <td className="p-4 font-semibold text-muted-gray">
                    <div className="flex items-center gap-1.5">
                      <span>Category</span>
                      {highlightDiffs && hasDifference((p) => p.category?.name) && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="Values differ" />
                      )}
                    </div>
                  </td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 text-on-surface border-l border-surface-container/60">
                      {p.category?.name || "General"}
                    </td>
                  ))}
                </tr>

                {/* Brand Row */}
                <tr className={highlightDiffs && hasDifference((p) => p.brand) ? "bg-amber-500/5" : ""}>
                  <td className="p-4 font-semibold text-muted-gray">
                    <div className="flex items-center gap-1.5">
                      <span>Brand</span>
                      {highlightDiffs && hasDifference((p) => p.brand) && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="Values differ" />
                      )}
                    </div>
                  </td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 font-medium text-on-surface border-l border-surface-container/60">
                      {p.brand || "—"}
                    </td>
                  ))}
                </tr>

                {/* Availability Row */}
                <tr>
                  <td className="p-4 font-semibold text-muted-gray">Availability</td>
                  {products.map((p) => {
                    const isAvail = p.inventory && p.inventory.length > 0
                      ? p.inventory.some((i) => i.isAvailable && i.quantityOnHand > 0)
                      : p.isActive;
                    return (
                      <td key={p.id} className="p-4 border-l border-surface-container/60">
                        <span
                          className={`inline-flex items-center gap-1.5 font-label text-xs font-bold px-2.5 py-1 rounded-full ${
                            isAvail
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-red-50 text-red-800 border border-red-200"
                          }`}
                        >
                          {isAvail ? "In Stock" : "Unavailable"}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* SKU Row */}
                <tr>
                  <td className="p-4 font-semibold text-muted-gray">SKU</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 font-mono text-xs text-muted-gray border-l border-surface-container/60">
                      {p.sku}
                    </td>
                  ))}
                </tr>

                {/* Advantages & Disadvantages Row */}
                <tr className="bg-surface-container-low/30">
                  <td className="p-4 font-bold text-on-surface align-top">
                    <div className="flex flex-col gap-1">
                      <span>Pros &amp; Cons</span>
                      <span className="text-[11px] font-normal text-muted-gray">Attribute &amp; AI Analysis</span>
                    </div>
                  </td>
                  {products.map((p) => {
                    const { pros, cons, differentiator } = getProductProsCons(p);
                    return (
                      <td key={p.id} className="p-4 align-top border-l border-surface-container/60">
                        <div className="flex flex-col gap-2">
                          {differentiator && (
                            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-950">
                              <span className="font-bold block text-emerald-800 mb-0.5">Differentiator:</span>
                              {differentiator}
                            </div>
                          )}

                          {pros.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3 text-emerald-600" />
                                Advantages
                              </span>
                              <ul className="space-y-0.5">
                                {pros.map((pro, idx) => (
                                  <li key={idx} className="text-xs text-emerald-950 flex items-start gap-1">
                                    <span className="text-emerald-500 font-bold">•</span>
                                    <span>{pro}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {cons.length > 0 && (
                            <div className="space-y-1 pt-1">
                              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                Considerations
                              </span>
                              <ul className="space-y-0.5">
                                {cons.map((con, idx) => (
                                  <li key={idx} className="text-xs text-amber-950 flex items-start gap-1">
                                    <span className="text-amber-500 font-bold">•</span>
                                    <span>{con}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Dynamic Specification Rows */}
                {allSpecKeys.map((key) => {
                  const differs = hasDifference((p) => formatSpecValue(p.specifications?.[key]));
                  return (
                    <tr
                      key={key}
                      className={highlightDiffs && differs ? "bg-amber-500/5" : ""}
                    >
                      <td className="p-4 font-medium text-muted-gray">
                        <div className="flex items-center gap-1.5">
                          <span>{formatKeyLabel(key)}</span>
                          {highlightDiffs && differs && (
                            <span className="w-2 h-2 rounded-full bg-amber-500" title="Values differ" />
                          )}
                        </div>
                      </td>
                      {products.map((p) => {
                        const val = p.specifications?.[key];
                        return (
                          <td key={p.id} className="p-4 text-on-surface border-l border-surface-container/60">
                            {formatSpecValue(val)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Container>
  );
};
