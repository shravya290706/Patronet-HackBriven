import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Sparkles,
  Plus,
  Trash2,
  Check,
  ShoppingCart,
  Heart,
  Loader2,
  AlertCircle,
  ArrowRight,
  Search,
  X,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '@/components/layout/Container';
import { useComparison } from '@/context/ComparisonContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { aiComparisonService, productService } from '@/services';
import type { AiComparisonResponse } from '@/services/api/aiComparisonService';
import type { Product } from '@/types';
import { getProductPrimaryImageUrl, DEFAULT_PRODUCT_FALLBACK_IMAGE } from '@/lib/imageUtils';

export const ComparePage: React.FC = () => {
  const { selectedProducts, toggleProduct, clearSelection } = useComparison();
  const { addItem: addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  // State
  const [highlightDifferences, setHighlightDifferences] = React.useState(false);
  const [priorityInput, setPriorityInput] = React.useState(
    'Programming performance, battery life, and value for money.'
  );
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiResult, setAiResult] = React.useState<AiComparisonResponse | null>(null);
  const [lastAnalyzedIds, setLastAnalyzedIds] = React.useState<string[]>([]);
  const [addedCartIds, setAddedCartIds] = React.useState<Record<string, boolean>>({});

  // Product picker modal state
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const [pickerSearch, setPickerSearch] = React.useState('');
  const [allCatalogueProducts, setAllCatalogueProducts] = React.useState<Product[]>([]);
  const [pickerLoading, setPickerLoading] = React.useState(false);

  // Invalidate stale AI recommendation if selected product set changed
  React.useEffect(() => {
    const currentIds = selectedProducts.map((p) => p.id).sort().join(',');
    const analyzedIds = lastAnalyzedIds.slice().sort().join(',');
    if (aiResult && currentIds !== analyzedIds) {
      setAiResult(null);
    }
  }, [selectedProducts, lastAnalyzedIds, aiResult]);

  // Load catalogue products for product picker
  const loadCatalogue = React.useCallback(async () => {
    try {
      setPickerLoading(true);
      const prods = await productService.getProducts();
      setAllCatalogueProducts(prods);
    } catch (err) {
      console.error('Failed to load catalogue:', err);
    } finally {
      setPickerLoading(false);
    }
  }, []);

  const handleOpenPicker = () => {
    if (selectedProducts.length >= 3) {
      toast.info('Maximum 3 products can be compared at once.');
      return;
    }
    setIsPickerOpen(true);
    if (allCatalogueProducts.length === 0) {
      loadCatalogue();
    }
  };

  const handleAddProductFromPicker = (product: Product) => {
    if (selectedProducts.some((p) => p.id === product.id)) return;
    if (selectedProducts.length >= 3) {
      toast.info('Maximum 3 products can be compared at once.');
      return;
    }
    toggleProduct(product);
    setIsPickerOpen(false);
    toast.success(`Added ${product.name} to comparison`);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product.id, 1);
      setAddedCartIds((prev) => ({ ...prev, [product.id]: true }));
      toast.success(`${product.name} added to cart`);
      setTimeout(() => {
        setAddedCartIds((prev) => ({ ...prev, [product.id]: false }));
      }, 2000);
    } catch {
      toast.error('Unable to add product to cart');
    }
  };

  const handleCompareAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product to compare.');
      return;
    }

    setAiLoading(true);
    try {
      const response = await aiComparisonService.compareProducts({
        productIds: selectedProducts.map((p) => p.id),
        requirements: priorityInput.trim(),
      });
      setAiResult(response);
      setLastAnalyzedIds(selectedProducts.map((p) => p.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI comparison evaluation failed.';
      toast.error(msg);
    } finally {
      setAiLoading(false);
    }
  };

  const appendPriority = (text: string) => {
    const current = priorityInput.trim();
    if (!current) {
      setPriorityInput(text);
    } else if (!current.toLowerCase().includes(text.toLowerCase())) {
      const cleaned = current.replace(/\.$/, '');
      setPriorityInput(`${cleaned}, ${text.toLowerCase()}.`);
    }
  };

  // Inspect cross-category condition
  const uniqueCategories = Array.from(
    new Set(selectedProducts.map((p) => p.category?.name || p.categoryId))
  );
  const isCrossCategory = uniqueCategories.length > 1;

  // Extract all distinct specification keys across selected products
  const allSpecKeys = React.useMemo(() => {
    const keySet = new Set<string>();
    selectedProducts.forEach((p) => {
      if (p.specifications) {
        Object.keys(p.specifications).forEach((k) => keySet.add(k));
      }
    });

    // Standard ordering preference
    const preferredOrder = [
      'Processor',
      'RAM',
      'Memory',
      'Storage',
      'Graphics',
      'Display',
      'Battery',
      'Weight',
      'Connectivity',
      'Operating System',
      'Ports',
      'Color',
      'Warranty',
    ];

    const ordered: string[] = [];
    preferredOrder.forEach((k) => {
      if (keySet.has(k)) {
        ordered.push(k);
        keySet.delete(k);
      }
    });
    // Add remaining keys alphabetically
    Array.from(keySet).sort().forEach((k) => ordered.push(k));

    return ordered;
  }, [selectedProducts]);

  // Determine if a specification row differs across products
  const isRowDifferent = (specKey: string) => {
    if (selectedProducts.length < 2) return false;
    const values = selectedProducts.map((p) => {
      const val = p.specifications?.[specKey];
      return val !== undefined && val !== null ? String(val).trim().toLowerCase() : null;
    });

    // Only compare rows where at least two products have known values
    const knownValues = values.filter((v): v is string => v !== null);
    if (knownValues.length < 2) return false;
    return new Set(knownValues).size > 1;
  };

  // Filtered catalogue products for picker
  const filteredCatalogue = allCatalogueProducts.filter((p) => {
    if (selectedProducts.some((sp) => sp.id === p.id)) return false;
    if (!pickerSearch.trim()) return true;
    const query = pickerSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query) ||
      p.category?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-pure-white text-on-pure-white">
      <Container className="py-8 md:py-12 flex flex-col gap-8 md:gap-12">
        {/* Header Section */}
        <div className="pb-6 border-b border-outline-subtle flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-label text-xs tracking-wider uppercase text-accent-orange-text font-semibold">
              AI Product Comparison
            </span>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-on-pure-white">
              Compare smarter. Choose better.
            </h1>
            <p className="font-body text-base text-muted-gray max-w-2xl">
              Compare specifications, understand the differences, and find the product that fits your needs.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="font-label text-sm text-muted-gray tabular-nums">
              {selectedProducts.length} of 3 products selected
            </span>
            {selectedProducts.length > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="font-label text-sm text-muted-gray hover:text-accent-orange-text transition-colors duration-state-change underline cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Empty State (0 Products) */}
        {selectedProducts.length === 0 && (
          <section className="py-16 text-center flex flex-col items-center gap-4 border border-outline-subtle rounded-sm bg-light-gray px-4">
            <div className="w-12 h-12 rounded-full bg-pure-white flex items-center justify-center border border-outline-subtle text-muted-gray shadow-xs">
              <Scale className="w-6 h-6 text-primary-orange" />
            </div>
            <div className="flex flex-col gap-1 max-w-md">
              <h2 className="font-headline text-2xl font-bold text-on-pure-white">
                No products selected for comparison
              </h2>
              <p className="font-body text-sm text-muted-gray">
                Select up to three electronics products from our catalogue or recommendations to inspect side-by-side technical differences.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <button
                type="button"
                onClick={handleOpenPicker}
                className="px-6 py-3 rounded-sm bg-deep-black text-on-deep-black font-label text-sm font-semibold hover:bg-surface-dark-elevated transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Select Products to Compare
              </button>
              <Link
                to="/products"
                className="px-6 py-3 rounded-sm border border-outline-subtle bg-pure-white font-label text-sm font-semibold text-on-pure-white hover:border-deep-black transition-colors"
              >
                Browse Catalogue
              </Link>
            </div>
          </section>
        )}

        {/* Workspace: 1, 2, or 3 products */}
        {selectedProducts.length > 0 && (
          <div className="flex flex-col gap-10">
            {/* Cross-Category Advisory */}
            {isCrossCategory && (
              <div className="p-4 rounded-sm border border-outline-subtle bg-primary-orange-tint/40 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-accent-orange-text shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 font-body text-sm text-on-pure-white">
                  <span className="font-semibold text-accent-orange-text">Cross-Category Comparison</span>
                  <p className="text-muted-gray">
                    You have selected products from different categories ({uniqueCategories.join(', ')}). While general attributes like price and brand align, specific architectural metrics (e.g. processor vs audio drivers) differ across hardware domains.
                  </p>
                </div>
              </div>
            )}

            {/* AI Requirement Prompt Bar */}
            <section
              aria-label="Comparison priorities"
              className="p-5 md:p-6 rounded-sm border border-outline-subtle bg-light-gray flex flex-col gap-4"
            >
              <form onSubmit={handleCompareAI} className="flex flex-col lg:flex-row lg:items-end gap-3">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label htmlFor="compare-priority-input" className="font-label text-sm font-semibold text-on-pure-white">
                    What matters most in your workflow?
                  </label>
                  <input
                    id="compare-priority-input"
                    type="text"
                    value={priorityInput}
                    onChange={(e) => setPriorityInput(e.target.value)}
                    placeholder="e.g. Programming performance, battery life, and value under ₹80,000"
                    className="w-full px-3.5 py-3 rounded-sm border border-outline-subtle bg-pure-white font-body text-sm text-on-pure-white placeholder:text-muted-gray focus:border-deep-black focus:outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="px-6 py-3 rounded-sm bg-primary-orange text-on-deep-black font-label text-sm font-semibold hover:bg-primary-orange-hover transition-colors inline-flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Compare with AI</span>
                    </>
                  )}
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="font-label text-xs text-muted-gray mr-1">Suggested priorities:</span>
                {[
                  'Programming & ML',
                  'Battery life',
                  'Portability',
                  'Value for money',
                  'Display quality',
                  'Gaming graphics',
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => appendPriority(tag)}
                    className="px-2.5 py-1 rounded-sm border border-outline-subtle bg-pure-white font-label text-xs text-on-pure-white hover:border-deep-black transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </section>

            {/* Table Controls (Highlight Differences & Add Product) */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={highlightDifferences}
                  onChange={(e) => setHighlightDifferences(e.target.checked)}
                  className="w-4 h-4 rounded-xs border-outline-subtle text-primary-orange focus:ring-0 cursor-pointer"
                />
                <span className="font-label text-sm font-medium text-on-pure-white inline-flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-muted-gray" />
                  Highlight Specification Differences
                </span>
              </label>

              {selectedProducts.length < 3 && (
                <button
                  type="button"
                  onClick={handleOpenPicker}
                  className="px-4 py-2 rounded-sm border border-outline-subtle bg-pure-white font-label text-xs font-semibold text-on-pure-white hover:border-deep-black transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-primary-orange" />
                  Add another product ({3 - selectedProducts.length} slot left)
                </button>
              )}
            </div>

            {/* Side-by-Side Product Comparison Table */}
            <section
              aria-label="Side-by-side product specification comparison"
              className="border border-outline-subtle rounded-sm overflow-x-auto bg-pure-white shadow-xs"
            >
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-outline-subtle align-top">
                    {/* Fixed Spec Label Column */}
                    <th className="w-48 min-w-[160px] p-4 md:p-6 bg-pure-white sticky left-0 z-10 border-r border-outline-subtle align-bottom">
                      <span className="font-label text-xs uppercase tracking-wider text-muted-gray font-semibold">
                        Products & Specs
                      </span>
                    </th>

                    {/* Selected Products Cards */}
                    {selectedProducts.map((prod) => (
                      <th
                        key={prod.id}
                        className="w-72 min-w-[240px] p-4 md:p-6 border-r last:border-r-0 border-outline-subtle font-normal bg-pure-white"
                      >
                        <div className="flex flex-col gap-4">
                          {/* Brand & Remove */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-label text-xs text-muted-gray font-medium uppercase tracking-wider">
                              {prod.brand}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleProduct(prod)}
                              title="Remove from comparison"
                              className="font-label text-xs text-muted-gray hover:text-accent-orange-text transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>

                          {/* Image */}
                          <Link
                            to={`/products/${prod.id}`}
                            className="block bg-light-gray rounded-sm aspect-4/3 p-4 flex items-center justify-center overflow-hidden group border border-outline-subtle/50"
                          >
                            <img
                              src={getProductPrimaryImageUrl(prod)}
                              alt={prod.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK_IMAGE;
                              }}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-surface-enter"
                            />
                          </Link>

                          {/* Name & Price */}
                          <div className="flex flex-col gap-1">
                            <Link
                              to={`/products/${prod.id}`}
                              className="font-headline text-base font-bold text-on-pure-white hover:text-primary-orange transition-colors line-clamp-2"
                            >
                              {prod.name}
                            </Link>
                            <span className="font-headline text-xl font-bold text-on-pure-white tabular-nums">
                              ₹{prod.price.toLocaleString('en-IN')}
                            </span>
                            {prod.compareAtPrice && prod.compareAtPrice > prod.price && (
                              <span className="font-body text-xs text-muted-gray line-through tabular-nums">
                                ₹{prod.compareAtPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>

                          {/* Actions: Add to Cart, Wishlist, View */}
                          <div className="flex flex-col gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleAddToCart(prod)}
                              className={`w-full py-2.5 px-3 rounded-sm font-label text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                addedCartIds[prod.id]
                                  ? 'bg-primary-orange text-on-deep-black'
                                  : 'bg-deep-black text-on-deep-black hover:bg-surface-dark-elevated'
                              }`}
                            >
                              {addedCartIds[prod.id] ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Added to Cart</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                  <span>Add to Cart</span>
                                </>
                              )}
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => toggleWishlist(prod.id)}
                                className={`py-2 px-2 rounded-sm border font-label text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                  isWishlisted(prod.id)
                                    ? 'border-primary-orange text-accent-orange-text bg-primary-orange-tint'
                                    : 'border-outline-subtle bg-pure-white text-on-pure-white hover:border-deep-black'
                                }`}
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 ${isWishlisted(prod.id) ? 'fill-primary-orange text-primary-orange' : ''}`}
                                />
                                <span>{isWishlisted(prod.id) ? 'Saved' : 'Wishlist'}</span>
                              </button>

                              <Link
                                to={`/products/${prod.id}`}
                                className="py-2 px-2 rounded-sm border border-outline-subtle bg-pure-white font-label text-xs font-semibold text-on-pure-white hover:border-deep-black text-center transition-colors inline-flex items-center justify-center gap-1"
                              >
                                <span>Details</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </th>
                    ))}

                    {/* Empty Slot Column if fewer than 3 */}
                    {selectedProducts.length < 3 && (
                      <th className="w-64 min-w-[220px] p-6 align-middle bg-light-gray/60 border-r last:border-r-0 border-outline-subtle">
                        <div className="flex flex-col items-center text-center gap-3 py-6">
                          <div className="w-10 h-10 rounded-full border border-dashed border-outline-subtle bg-pure-white flex items-center justify-center text-muted-gray">
                            <Plus className="w-5 h-5 text-muted-gray" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-label text-sm font-semibold text-on-pure-white">
                              Add Product
                            </span>
                            <p className="font-body text-xs text-muted-gray max-w-[160px]">
                              Compare up to 3 models side-by-side
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleOpenPicker}
                            className="px-4 py-2 rounded-sm border border-outline-subtle bg-pure-white font-label text-xs font-semibold text-on-pure-white hover:border-deep-black transition-colors cursor-pointer"
                          >
                            Browse Options
                          </button>
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-outline-subtle font-body text-sm">
                  {/* Price Row */}
                  <tr className="bg-pure-white">
                    <th
                      scope="row"
                      className="p-3.5 md:p-4 font-label text-xs md:text-sm font-semibold text-on-pure-white sticky left-0 z-10 bg-pure-white border-r border-outline-subtle"
                    >
                      Catalogue Price
                    </th>
                    {selectedProducts.map((p) => (
                      <td
                        key={p.id}
                        className="p-3.5 md:p-4 font-bold tabular-nums text-on-pure-white border-r last:border-r-0 border-outline-subtle"
                      >
                        ₹{p.price.toLocaleString('en-IN')}
                      </td>
                    ))}
                    {selectedProducts.length < 3 && <td className="p-3.5 md:p-4 bg-light-gray/40"></td>}
                  </tr>

                  {/* Brand Row */}
                  <tr className="bg-light-gray/30">
                    <th
                      scope="row"
                      className="p-3.5 md:p-4 font-label text-xs md:text-sm font-semibold text-on-pure-white sticky left-0 z-10 bg-light-gray/30 border-r border-outline-subtle"
                    >
                      Brand
                    </th>
                    {selectedProducts.map((p) => (
                      <td
                        key={p.id}
                        className="p-3.5 md:p-4 text-on-pure-white border-r last:border-r-0 border-outline-subtle"
                      >
                        {p.brand}
                      </td>
                    ))}
                    {selectedProducts.length < 3 && <td className="p-3.5 md:p-4 bg-light-gray/40"></td>}
                  </tr>

                  {/* Category Row */}
                  <tr className="bg-pure-white">
                    <th
                      scope="row"
                      className="p-3.5 md:p-4 font-label text-xs md:text-sm font-semibold text-on-pure-white sticky left-0 z-10 bg-pure-white border-r border-outline-subtle"
                    >
                      Category
                    </th>
                    {selectedProducts.map((p) => (
                      <td
                        key={p.id}
                        className="p-3.5 md:p-4 text-on-pure-white border-r last:border-r-0 border-outline-subtle"
                      >
                        {p.category?.name || 'Electronics'}
                      </td>
                    ))}
                    {selectedProducts.length < 3 && <td className="p-3.5 md:p-4 bg-light-gray/40"></td>}
                  </tr>

                  {/* Dynamic Catalogue Specifications */}
                  {allSpecKeys.map((key, rowIdx) => {
                    const isDiff = isRowDifferent(key);
                    const shouldHighlight = highlightDifferences && isDiff;
                    const rowBg = shouldHighlight
                      ? 'bg-primary-orange-tint/20'
                      : rowIdx % 2 === 1
                      ? 'bg-light-gray/30'
                      : 'bg-pure-white';

                    return (
                      <tr key={key} className={rowBg}>
                        <th
                          scope="row"
                          className={`p-3.5 md:p-4 font-label text-xs md:text-sm font-medium sticky left-0 z-10 border-r border-outline-subtle ${
                            shouldHighlight ? 'bg-primary-orange-tint/40 text-accent-orange-text font-semibold' : rowBg
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{key}</span>
                            {shouldHighlight && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-orange inline-block" />
                            )}
                          </div>
                        </th>

                        {selectedProducts.map((prod) => {
                          const val = prod.specifications?.[key];
                          const hasVal = val !== undefined && val !== null && String(val).trim().length > 0;
                          return (
                            <td
                              key={prod.id}
                              className={`p-3.5 md:p-4 border-r last:border-r-0 border-outline-subtle tabular-nums ${
                                shouldHighlight ? 'font-medium text-on-pure-white' : ''
                              }`}
                            >
                              {hasVal ? (
                                <span>{String(val)}</span>
                              ) : (
                                <span className="text-muted-gray/70 italic text-xs">Not specified</span>
                              )}
                            </td>
                          );
                        })}

                        {selectedProducts.length < 3 && (
                          <td className="p-3.5 md:p-4 bg-light-gray/40"></td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            {/* AI Recommendation Panel (Dark Editorial Block per Google Stitch) */}
            <section
              id="ai-recommendation-panel"
              aria-labelledby="ai-rec-heading"
              className="bg-deep-black text-on-deep-black rounded-sm p-6 md:p-8 flex flex-col gap-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-outline-dark">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-label text-xs tracking-wider uppercase text-primary-orange font-semibold">
                      AI Recommendation Analysis
                    </span>
                    <span className="px-2 py-0.5 rounded-xs bg-surface-dark-elevated text-xs font-label text-muted-gray">
                      Demo Mode (Deterministic)
                    </span>
                  </div>
                  <h2
                    id="ai-rec-heading"
                    className="font-headline text-2xl md:text-3xl font-bold text-pure-white"
                  >
                    Which one is right for you?
                  </h2>
                </div>
                <span className="font-label text-xs text-muted-gray">
                  Evaluated against stated priorities
                </span>
              </div>

              {/* Loading State */}
              {aiLoading && (
                <div className="py-8 flex items-center justify-center gap-3 text-pure-white">
                  <Loader2 className="w-5 h-5 text-primary-orange animate-spin" />
                  <p className="font-body text-base text-muted-gray">
                    Evaluating listed specifications against your priorities...
                  </p>
                </div>
              )}

              {/* Recommendation Content */}
              {!aiLoading && aiResult && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-label text-xs uppercase tracking-wider text-primary-orange font-semibold">
                        Recommended Choice
                      </span>
                      <h3 className="font-headline text-xl md:text-2xl font-bold text-pure-white">
                        {aiResult.recommendedProductId
                          ? selectedProducts.find((p) => p.id === aiResult.recommendedProductId)?.name ||
                            'Top Recommendation'
                          : 'Evenly Balanced'}
                      </h3>
                    </div>
                    <p className="font-body text-sm md:text-base text-muted-gray leading-relaxed">
                      {aiResult.summary}
                    </p>
                    {aiResult.recommendedProductId && (
                      <div>
                        <Link
                          to={`/products/${aiResult.recommendedProductId}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-primary-orange text-on-deep-black font-label text-sm font-semibold hover:bg-primary-orange-hover transition-colors"
                        >
                          <span>View Product Details</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Advantages */}
                    <div className="p-5 rounded-sm bg-surface-dark-elevated border border-outline-dark flex flex-col gap-3">
                      <h4 className="font-title text-sm font-semibold text-pure-white flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-primary-orange" />
                        Key Advantages
                      </h4>
                      <ul className="flex flex-col gap-2 font-body text-xs text-muted-gray">
                        {aiResult.reasons.length > 0 ? (
                          aiResult.reasons.map((r, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-orange shrink-0 mt-1.5" />
                              <span>{r}</span>
                            </li>
                          ))
                        ) : (
                          <li className="italic">Standard catalogue parameters apply.</li>
                        )}
                      </ul>
                    </div>

                    {/* Tradeoffs */}
                    <div className="p-5 rounded-sm bg-surface-dark-elevated border border-outline-dark flex flex-col gap-3">
                      <h4 className="font-title text-sm font-semibold text-pure-white flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-muted-gray" />
                        Important Trade-offs
                      </h4>
                      <ul className="flex flex-col gap-2 font-body text-xs text-muted-gray">
                        {aiResult.tradeoffs.length > 0 ? (
                          aiResult.tradeoffs.map((t, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-gray shrink-0 mt-1.5" />
                              <span>{t}</span>
                            </li>
                          ))
                        ) : (
                          <li className="italic">No significant drawbacks identified.</li>
                        )}
                      </ul>
                    </div>

                    {/* Missing Information note if cross-category or missing specs */}
                    {aiResult.missingInformation && aiResult.missingInformation.length > 0 && (
                      <div className="sm:col-span-2 p-3.5 rounded-sm bg-surface-dark-elevated/70 border border-outline-dark flex items-start gap-2.5 text-xs text-muted-gray">
                        <AlertCircle className="w-4 h-4 text-primary-orange shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-pure-white">Data transparency note: </span>
                          {aiResult.missingInformation.join(' ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Initial prompt CTA if not yet evaluated */}
              {!aiLoading && !aiResult && (
                <div className="py-6 text-center flex flex-col items-center gap-2 text-muted-gray">
                  <p className="font-body text-sm">
                    Enter your specific priorities above (e.g. battery life, coding, budget) and click{' '}
                    <strong className="text-pure-white">Compare with AI</strong> to get a reasoned recommendation.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </Container>

      {/* Product Selection Modal (Picker) */}
      {isPickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-xl bg-pure-white rounded-sm shadow-xl border border-outline-subtle flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b border-outline-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary-orange" />
                <h3 className="font-headline text-base font-bold text-on-pure-white">
                  Add Product to Comparison ({selectedProducts.length}/3)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="p-1 rounded-xs text-muted-gray hover:text-on-pure-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-outline-subtle bg-light-gray/50">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-muted-gray absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search products by title, brand, or category..."
                  className="w-full pl-9 pr-3 py-2 bg-pure-white border border-outline-subtle rounded-sm font-body text-xs text-on-pure-white placeholder:text-muted-gray focus:border-deep-black focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-outline-subtle">
              {pickerLoading ? (
                <div className="py-12 flex items-center justify-center gap-2 text-muted-gray font-label text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-orange" />
                  <span>Loading catalogue...</span>
                </div>
              ) : filteredCatalogue.length === 0 ? (
                <div className="py-12 text-center text-muted-gray font-body text-sm">
                  No matching unselected products found.
                </div>
              ) : (
                filteredCatalogue.map((prod) => (
                  <div key={prod.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-light-gray rounded-sm p-1 flex items-center justify-center shrink-0 border border-outline-subtle/40">
                        <img
                          src={getProductPrimaryImageUrl(prod)}
                          alt={prod.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK_IMAGE;
                          }}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline text-xs font-bold text-on-pure-white line-clamp-1">
                          {prod.name}
                        </span>
                        <span className="font-label text-xs text-muted-gray">
                          {prod.brand} · {prod.category?.name || 'Electronics'}
                        </span>
                        <span className="font-headline text-xs font-bold text-on-pure-white tabular-nums">
                          ₹{prod.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddProductFromPicker(prod)}
                      className="px-3 py-1.5 rounded-sm bg-deep-black text-on-deep-black font-label text-xs font-semibold hover:bg-surface-dark-elevated transition-colors inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Compare</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-outline-subtle bg-light-gray flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="px-4 py-1.5 rounded-sm border border-outline-subtle bg-pure-white font-label text-xs font-semibold text-on-pure-white hover:border-deep-black transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
