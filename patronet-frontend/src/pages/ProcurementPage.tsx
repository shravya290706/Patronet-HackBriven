import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  User,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '@/components/layout/Container';
import { productService, procurementService } from '@/services';
import type { Product } from '@/types';
import type { CustomerType, ProcurementLineItem } from '@/services/api/procurementService';
import { inrToPaise, formatPaise } from '@/lib/moneyUtils';
import { getProductPrimaryImageUrl, DEFAULT_PRODUCT_FALLBACK_IMAGE } from '@/lib/imageUtils';

export const ProcurementPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [customerType, setCustomerType] = React.useState<CustomerType>('business');
  const [title, setTitle] = React.useState('Developer Fleet & Office Hardware');
  const [organizationName, setOrganizationName] = React.useState('Acme Technologies Pvt Ltd');
  const [deliveryLocation, setDeliveryLocation] = React.useState('Bandra Kurla Complex, Mumbai, Maharashtra - 400051');
  const [preferredDeliveryDate, setPreferredDeliveryDate] = React.useState('2026-12-10');
  const [targetBudgetInr, setTargetBudgetInr] = React.useState('1000000');
  const [notes, setNotes] = React.useState('Require GST tax invoice and delivery to Mumbai within 10 business days.');

  // Catalogue & Line Items State
  const [catalogueProducts, setCatalogueProducts] = React.useState<Product[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = React.useState(true);
  const [selectedProductId, setSelectedProductId] = React.useState('');
  const [addQty, setAddQty] = React.useState(10);
  const [items, setItems] = React.useState<ProcurementLineItem[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorBanner, setErrorBanner] = React.useState<string | null>(null);

  // Load products on mount
  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoadingCatalogue(true);
        const prods = await productService.getProducts();
        if (mounted) {
          setCatalogueProducts(prods);
          if (prods.length > 0) {
            setSelectedProductId(prods[0].id);
            // Default seed items matching Stitch reference
            const p1 = prods[0];
            const p2 = prods[1] || prods[0];
            setItems([
              {
                productId: p1.id,
                quantity: 10,
                productName: p1.name,
                unitPricePaise: inrToPaise(p1.price),
                primaryImageUrl: getProductPrimaryImageUrl(p1),
              },
              {
                productId: p2.id,
                quantity: 10,
                productName: p2.name,
                unitPricePaise: inrToPaise(p2.price),
                primaryImageUrl: getProductPrimaryImageUrl(p2),
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load catalogue products:', err);
      } finally {
        if (mounted) setLoadingCatalogue(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Handlers
  const handleAddProduct = () => {
    setErrorBanner(null);
    if (!selectedProductId) return;

    if (items.some((i) => i.productId === selectedProductId)) {
      setErrorBanner('This product is already in your procurement request. Adjust its quantity below.');
      return;
    }

    if (!addQty || addQty < 1 || !Number.isInteger(Number(addQty))) {
      setErrorBanner('Please enter a valid positive integer quantity.');
      return;
    }

    const prod = catalogueProducts.find((p) => p.id === selectedProductId);
    if (!prod) return;

    setItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        quantity: Number(addQty),
        productName: prod.name,
        unitPricePaise: inrToPaise(prod.price),
        primaryImageUrl: getProductPrimaryImageUrl(prod),
      },
    ]);
    toast.success(`Added ${prod.name} (${addQty} units)`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setErrorBanner(null);
    if (quantity < 1 || !Number.isInteger(quantity)) return;
    setItems((prev) =>
      prev.map((it) => (it.productId === productId ? { ...it, quantity } : it))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  // Financial calculations
  const totalUnits = items.reduce((acc, it) => acc + it.quantity, 0);
  const estimatedSubtotalPaise = items.reduce(
    (acc, it) => acc + (it.unitPricePaise || 0) * it.quantity,
    0
  );

  const handleSubmitProcurement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);

    if (items.length === 0) {
      setErrorBanner('Please add at least one product with a valid quantity before requesting quotations.');
      return;
    }

    if (!title.trim()) {
      setErrorBanner('Please provide a procurement request title.');
      return;
    }

    if (!deliveryLocation.trim()) {
      setErrorBanner('Please provide a delivery location.');
      return;
    }

    if (customerType === 'business' && !organizationName.trim()) {
      setErrorBanner('Please enter your business or organization name.');
      return;
    }

    setSubmitting(true);
    try {
      const budgetNum = targetBudgetInr ? parseFloat(targetBudgetInr) : undefined;
      const targetBudgetPaise = budgetNum && !isNaN(budgetNum) ? inrToPaise(budgetNum) : undefined;

      const created = await procurementService.createRequest({
        title: title.trim(),
        customerType,
        organizationName: customerType === 'business' ? organizationName.trim() : undefined,
        deliveryLocation: deliveryLocation.trim(),
        preferredDeliveryDate: preferredDeliveryDate || undefined,
        targetBudgetPaise,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
        })),
      });

      toast.success('Procurement request generated successfully!');
      navigate(`/procurement/${created.id}/progress`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit procurement request.';
      setErrorBanner(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-pure-white text-on-pure-white">
      <Container className="py-8 md:py-12 flex flex-col gap-8">
        {/* Breadcrumb Header */}
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label text-sm text-muted-gray mb-3">
            <Link to="/" className="hover:text-on-pure-white transition-colors">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-on-pure-white">Bulk Procurement</span>
          </nav>

          <div className="pb-6 border-b border-outline-subtle flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-label text-xs tracking-wider uppercase text-accent-orange-text font-semibold">
                Enterprise Sourcing
              </span>
              <span className="px-2 py-0.5 rounded-xs bg-light-gray text-xs font-label text-muted-gray border border-outline-subtle">
                Demo Workflow (Simulated Suppliers)
              </span>
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-on-pure-white">
              Smarter procurement. Better deals.
            </h1>
            <p className="font-body text-base text-muted-gray max-w-2xl">
              Build a bulk order, connect with registered suppliers, and compare competitive offers in one place.
            </p>
          </div>
        </div>

        {/* Product Selector / Quick Add Bar */}
        <section
          aria-label="Add products to procurement request"
          className="p-5 md:p-6 rounded-sm border border-outline-subtle bg-light-gray flex flex-col gap-4"
        >
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <label htmlFor="bulk-product-select" className="font-label text-sm font-semibold text-on-pure-white">
                Add product from catalogue
              </label>
              {loadingCatalogue ? (
                <div className="h-10.5 px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white text-xs text-muted-gray flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-orange" />
                  <span>Loading catalogue products...</span>
                </div>
              ) : (
                <select
                  id="bulk-product-select"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white font-body text-sm text-on-pure-white focus:border-deep-black focus:outline-none"
                >
                  {catalogueProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price.toLocaleString('en-IN')} ({p.brand})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="w-full md:w-36 flex flex-col gap-1.5">
              <label htmlFor="bulk-add-qty" className="font-label text-sm font-semibold text-on-pure-white">
                Quantity
              </label>
              <input
                id="bulk-add-qty"
                type="number"
                min="1"
                value={addQty}
                onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white font-body text-sm text-on-pure-white tabular-nums focus:border-deep-black focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleAddProduct}
              className="px-6 py-2.5 rounded-sm bg-deep-black text-on-deep-black font-label text-sm font-semibold hover:bg-surface-dark-elevated transition-colors inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add to request</span>
            </button>
          </div>
        </section>

        {/* Validation Error Banner */}
        {errorBanner && (
          <div
            role="alert"
            className="p-4 rounded-sm border border-primary-orange bg-primary-orange-tint/40 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-accent-orange-text shrink-0 mt-0.5" />
            <p className="font-body text-sm text-on-pure-white">{errorBanner}</p>
          </div>
        )}

        {/* Main Form & Overview Grid */}
        <form onSubmit={handleSubmitProcurement} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Requirements & Line Items */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* Procurement Metadata Inputs */}
            <div className="p-6 rounded-sm border border-outline-subtle bg-pure-white flex flex-col gap-5">
              <h2 className="font-headline text-lg font-bold text-on-pure-white pb-3 border-b border-outline-subtle">
                Procurement Requirements & Delivery Details
              </h2>

              {/* Customer Type Selector */}
              <div className="flex flex-col gap-2">
                <label className="font-label text-xs uppercase tracking-wider text-muted-gray font-semibold">
                  Customer Type
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setCustomerType('business')}
                    className={`p-3 rounded-sm border font-label text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      customerType === 'business'
                        ? 'border-primary-orange bg-primary-orange-tint/40 text-accent-orange-text'
                        : 'border-outline-subtle bg-pure-white text-muted-gray hover:border-deep-black'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Business / Enterprise</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerType('individual')}
                    className={`p-3 rounded-sm border font-label text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      customerType === 'individual'
                        ? 'border-primary-orange bg-primary-orange-tint/40 text-accent-orange-text'
                        : 'border-outline-subtle bg-pure-white text-muted-gray hover:border-deep-black'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Individual / Personal</span>
                  </button>
                </div>
              </div>

              {/* Title & Organization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="proc-title" className="font-label text-xs font-semibold text-on-pure-white">
                    Procurement Title <span className="text-primary-orange">*</span>
                  </label>
                  <input
                    id="proc-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Developer Fleet & Monitors"
                    className="w-full px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white font-body text-sm text-on-pure-white focus:border-deep-black focus:outline-none"
                    required
                  />
                </div>

                {customerType === 'business' && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="proc-org" className="font-label text-xs font-semibold text-on-pure-white">
                      Organization Name <span className="text-primary-orange">*</span>
                    </label>
                    <input
                      id="proc-org"
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="e.g. Acme Technologies Pvt Ltd"
                      className="w-full px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white font-body text-sm text-on-pure-white focus:border-deep-black focus:outline-none"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Location, Preferred Date, Target Budget */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="proc-location" className="font-label text-xs font-semibold text-on-pure-white">
                    Delivery Location <span className="text-primary-orange">*</span>
                  </label>
                  <input
                    id="proc-location"
                    type="text"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="City, State, Pincode"
                    className="w-full px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white font-body text-sm text-on-pure-white focus:border-deep-black focus:outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="proc-date" className="font-label text-xs font-semibold text-on-pure-white">
                    Preferred Delivery Date
                  </label>
                  <input
                    id="proc-date"
                    type="date"
                    value={preferredDeliveryDate}
                    onChange={(e) => setPreferredDeliveryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white font-body text-sm text-on-pure-white focus:border-deep-black focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="proc-budget" className="font-label text-xs font-semibold text-on-pure-white">
                    Target Budget (₹ INR)
                  </label>
                  <input
                    id="proc-budget"
                    type="number"
                    value={targetBudgetInr}
                    onChange={(e) => setTargetBudgetInr(e.target.value)}
                    placeholder="e.g. 1000000"
                    className="w-full px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white font-body text-sm text-on-pure-white tabular-nums focus:border-deep-black focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="proc-notes" className="font-label text-xs font-semibold text-on-pure-white">
                  Special Notes & Procurement Specifications (Optional)
                </label>
                <textarea
                  id="proc-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detail configuration requirements, operating system image needs, or targeted delivery milestones..."
                  className="w-full p-3 rounded-sm border border-outline-subtle bg-pure-white font-body text-sm text-on-pure-white placeholder:text-muted-gray focus:border-deep-black focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-headline text-lg font-bold text-on-pure-white">
                  Requested Items ({items.length})
                </h2>
                <span className="font-label text-xs text-muted-gray">
                  {totalUnits} Total Units Requested
                </span>
              </div>

              {items.length === 0 ? (
                <div className="p-12 rounded-sm border border-outline-subtle bg-light-gray text-center flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 text-muted-gray" />
                  <p className="font-title text-base font-semibold text-on-pure-white">No products in your request</p>
                  <p className="font-body text-xs text-muted-gray">
                    Use the catalogue selector above to add items for bulk quotation.
                  </p>
                </div>
              ) : (
                <div className="border border-outline-subtle rounded-sm overflow-x-auto bg-pure-white shadow-xs">
                  <table className="w-full min-w-[620px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-outline-subtle bg-light-gray">
                        <th className="p-3.5 font-label text-xs font-semibold text-muted-gray">Product</th>
                        <th className="p-3.5 font-label text-xs font-semibold text-muted-gray">Retail Unit Price</th>
                        <th className="p-3.5 font-label text-xs font-semibold text-muted-gray">Requested Qty</th>
                        <th className="p-3.5 font-label text-xs font-semibold text-muted-gray">Est. Subtotal</th>
                        <th className="p-3.5 font-label text-xs font-semibold text-muted-gray text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-subtle font-body text-sm">
                      {items.map((item) => (
                        <tr key={item.productId} className="hover:bg-light-gray/40 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-light-gray rounded-sm p-1 border border-outline-subtle/50 shrink-0 flex items-center justify-center">
                                <img
                                  src={item.primaryImageUrl || DEFAULT_PRODUCT_FALLBACK_IMAGE}
                                  alt={item.productName || 'Product'}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK_IMAGE;
                                  }}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <span className="font-headline text-xs font-bold text-on-pure-white">
                                {item.productName}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 tabular-nums text-muted-gray">
                            {formatPaise(item.unitPricePaise || 0)}
                          </td>
                          <td className="p-3.5">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(item.productId, parseInt(e.target.value) || 1)
                              }
                              className="w-20 px-2.5 py-1 rounded-sm border border-outline-subtle bg-pure-white font-body text-xs text-on-pure-white tabular-nums focus:border-deep-black focus:outline-none"
                            />
                          </td>
                          <td className="p-3.5 font-semibold tabular-nums text-on-pure-white">
                            {formatPaise((item.unitPricePaise || 0) * item.quantity)}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="p-1 text-muted-gray hover:text-accent-orange-text transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Request Summary & Submission */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="bg-light-gray rounded-sm p-6 border border-outline-subtle flex flex-col gap-6">
              <h2 className="font-headline text-lg font-bold text-on-pure-white pb-3 border-b border-outline-subtle">
                Request Summary
              </h2>

              <div className="flex flex-col gap-2.5 pb-4 border-b border-outline-subtle font-body text-sm">
                <div className="flex items-center justify-between text-muted-gray">
                  <span>Line Items</span>
                  <span className="font-semibold text-on-pure-white tabular-nums">{items.length}</span>
                </div>
                <div className="flex items-center justify-between text-muted-gray">
                  <span>Total Units</span>
                  <span className="font-semibold text-on-pure-white tabular-nums">{totalUnits}</span>
                </div>
                {targetBudgetInr && (
                  <div className="flex items-center justify-between text-muted-gray">
                    <span>Target Budget</span>
                    <span className="font-semibold text-accent-orange-text tabular-nums">
                      ₹{parseFloat(targetBudgetInr).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between">
                  <span className="font-title text-sm font-semibold text-on-pure-white">Catalogue Estimate</span>
                  <span className="font-headline text-xl font-bold text-on-pure-white tabular-nums">
                    {formatPaise(estimatedSubtotalPaise)}
                  </span>
                </div>
                <p className="font-body text-xs text-muted-gray leading-relaxed">
                  Indicative estimate based on retail unit pricing. Final quotations from registered suppliers reflect volume discounting and delivery schedules.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className="w-full py-3.5 px-4 rounded-sm bg-primary-orange text-on-deep-black font-label text-sm font-semibold hover:bg-primary-orange-hover transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Initiating Sourcing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Start Supplier Negotiation</span>
                  </>
                )}
              </button>

              <div className="pt-2 flex items-start gap-2 text-xs text-muted-gray leading-relaxed">
                <HelpCircle className="w-4 h-4 text-muted-gray shrink-0 mt-0.5" />
                <span>
                  In demo mode, simulated suppliers respond with structured bids. No real suppliers are contacted.
                </span>
              </div>
            </div>
          </aside>
        </form>
      </Container>
    </div>
  );
};
