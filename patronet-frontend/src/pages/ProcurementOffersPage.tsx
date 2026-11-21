import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '@/components/layout/Container';
import { procurementService } from '@/services';
import type { ProcurementDetails, SupplierOffer } from '@/services/api/procurementService';
import { formatPaise } from '@/lib/moneyUtils';

export const ProcurementOffersPage: React.FC = () => {
  const { id = 'PN-BULK-2026-4108' } = useParams<{ id: string }>();
  const [details, setDetails] = React.useState<ProcurementDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedOffer, setSelectedOffer] = React.useState<SupplierOffer | null>(null);
  const [expandedOfferId, setExpandedOfferId] = React.useState<string | null>(null);
  const [selectingId, setSelectingId] = React.useState<string | null>(null);

  const fetchOffers = React.useCallback(async () => {
    try {
      const data = await procurementService.getRequest(id);
      setDetails(data);
      if (data && data.selectedOfferId) {
        const found = data.offers.find((o) => o.id === data.selectedOfferId);
        if (found) setSelectedOffer(found);
      }
    } catch (err) {
      console.error('Failed to load offers:', err);
      toast.error('Unable to fetch supplier offers.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleSelectOffer = async (offer: SupplierOffer) => {
    setSelectingId(offer.id);
    try {
      await procurementService.selectOffer(id, offer.id);
      setSelectedOffer(offer);
      toast.success(`Selected offer from ${offer.supplierName}!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to select offer.';
      toast.error(msg);
    } finally {
      setSelectingId(null);
    }
  };

  const toggleDetails = (offerId: string) => {
    setExpandedOfferId((prev) => (prev === offerId ? null : offerId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pure-white flex items-center justify-center">
        <div className="flex items-center gap-3 font-label text-sm text-muted-gray">
          <RotateCw className="w-5 h-5 animate-spin text-primary-orange" />
          <span>Loading supplier offers...</span>
        </div>
      </div>
    );
  }

  if (!details || details.offers.length === 0) {
    return (
      <div className="min-h-screen bg-pure-white text-on-pure-white">
        <Container className="py-16 text-center flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-primary-orange" />
          <h1 className="font-headline text-2xl font-bold">No Quotations Available Yet</h1>
          <p className="font-body text-sm text-muted-gray max-w-md">
            Suppliers are still compiling volume quotations for request <span className="font-mono">{id}</span>.
          </p>
          <Link
            to={`/procurement/${id}/progress`}
            className="mt-2 px-6 py-2.5 rounded-sm bg-deep-black text-on-deep-black font-label text-sm font-semibold hover:bg-surface-dark-elevated transition-colors"
          >
            Check Negotiation Progress
          </Link>
        </Container>
      </div>
    );
  }

  // Recommendation evaluation
  const completedOffers = details.offers.filter((o) => o.isPriceComplete && o.totalUnitsOffered === o.requestedUnits);
  const lowestCompleteOffer = completedOffers.slice().sort((a, b) => a.offeredTotalPaise - b.offeredTotalPaise)[0];
  const fastestOffer = details.offers.slice().sort((a, b) => {
    const getDays = (s: string) => parseInt(s) || 99;
    return getDays(a.deliveryDaysEstimate) - getDays(b.deliveryDaysEstimate);
  })[0];

  return (
    <div className="min-h-screen bg-pure-white text-on-pure-white">
      <Container className="py-8 md:py-12 flex flex-col gap-8 md:gap-10">
        {/* Breadcrumb & Header */}
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label text-sm text-muted-gray mb-3">
            <Link to="/" className="hover:text-on-pure-white transition-colors">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link to={`/procurement/${details.id}/progress`} className="hover:text-on-pure-white transition-colors font-mono">
              {details.id}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-on-pure-white">Offers</span>
          </nav>

          <div className="pb-6 border-b border-outline-subtle flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-label text-xs tracking-wider uppercase text-accent-orange-text font-semibold">
                  Supplier Quotations
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-light-gray text-xs font-label text-muted-gray border border-outline-subtle">
                  Demo Offer Analysis
                </span>
              </div>
              <h1 className="font-headline text-3xl md:text-4xl font-bold text-on-pure-white">
                Compare your offers.
              </h1>
              <p className="font-body text-base text-muted-gray">
                Review supplier quotations and choose the option that works best for your team.
              </p>
            </div>

            <Link
              to={`/procurement/${details.id}/progress`}
              className="inline-flex items-center gap-2 font-label text-sm font-semibold text-on-pure-white hover:text-accent-orange-text transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to negotiation status</span>
            </Link>
          </div>
        </div>

        {/* Selected Offer Banner */}
        {selectedOffer && (
          <div
            role="status"
            className="p-6 rounded-sm border-2 border-primary-orange bg-pure-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex flex-col gap-1">
              <span className="font-label text-xs uppercase tracking-wider text-accent-orange-text font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary-orange" />
                Offer Selected For Review
              </span>
              <p className="font-headline text-xl font-bold text-on-pure-white">
                {selectedOffer.supplierName} — {formatPaise(selectedOffer.offeredTotalPaise)}
              </p>
              <p className="font-body text-xs text-muted-gray">
                No purchase order has been placed yet. This selection marks your intended distributor choice. Proceed to checkout to review delivery milestones and finalize your order.
              </p>
            </div>

            <Link
              to="/checkout"
              className="px-6 py-3 rounded-sm bg-primary-orange text-on-deep-black font-label text-sm font-bold hover:bg-primary-orange-hover transition-colors shrink-0 text-center cursor-pointer"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}

        {/* AI Offer Recommendation / Comparative Summary */}
        <section
          aria-label="Demo Offer Analysis"
          className="p-6 rounded-sm border border-outline-subtle bg-light-gray flex flex-col gap-4 shadow-xs"
        >
          <div className="flex items-center justify-between pb-3 border-b border-outline-subtle">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-orange" />
              <h2 className="font-headline text-base font-bold text-on-pure-white">
                Autonomous Sourcing Recommendation
              </h2>
            </div>
            <span className="font-label text-xs text-muted-gray">
              Catalogue Estimate: {formatPaise(details.catalogueSubtotalPaise)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-body text-xs md:text-sm">
            {lowestCompleteOffer && (
              <div className="p-4 rounded-sm bg-pure-white border border-outline-subtle flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label text-xs uppercase text-accent-orange-text font-bold">
                    Best Value Full Order
                  </span>
                  <span className="font-headline text-base font-bold tabular-nums">
                    {formatPaise(lowestCompleteOffer.offeredTotalPaise)}
                  </span>
                </div>
                <p className="text-on-pure-white font-semibold">{lowestCompleteOffer.supplierName}</p>
                <p className="text-muted-gray leading-relaxed">
                  Offers complete quantity allocation ({lowestCompleteOffer.totalUnitsOffered}/{lowestCompleteOffer.requestedUnits} units) with GST tax disclosure and 3-year enterprise warranty.
                </p>
              </div>
            )}

            {fastestOffer && (
              <div className="p-4 rounded-sm bg-pure-white border border-outline-subtle flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-label text-xs uppercase text-muted-gray font-bold">
                    Fastest Turnaround
                  </span>
                  <span className="font-headline text-base font-bold tabular-nums">
                    {fastestOffer.deliveryDaysEstimate}
                  </span>
                </div>
                <p className="text-on-pure-white font-semibold">{fastestOffer.supplierName}</p>
                <p className="text-muted-gray leading-relaxed">
                  Quoted at {formatPaise(fastestOffer.offeredTotalPaise)}. Best suited if team onboarding requires immediate hardware deployment.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Mobile Offers View (< md) */}
        <section aria-label="Supplier quotations mobile list" className="md:hidden flex flex-col gap-4">
          {details.offers.map((offer) => {
            const isSelected = selectedOffer?.id === offer.id;
            return (
              <article
                key={offer.id}
                className={`p-5 rounded-sm bg-pure-white flex flex-col gap-4 transition-colors ${
                  isSelected ? 'border-2 border-primary-orange' : 'border border-outline-subtle'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-headline text-base font-bold text-on-pure-white">
                      {offer.supplierName}
                    </span>
                    {offer.badge && (
                      <span className="font-label text-xs text-accent-orange-text font-semibold">
                        {offer.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-sm font-label text-xs font-semibold ${
                      offer.status === 'confirmed'
                        ? 'bg-deep-black text-on-deep-black'
                        : offer.status === 'counteroffer'
                        ? 'bg-primary-orange-tint text-accent-orange-text'
                        : 'bg-light-gray text-muted-gray'
                    }`}
                  >
                    {offer.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 border-y border-outline-subtle font-body text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label text-muted-gray">Total Quoted</span>
                    <span className="font-headline text-lg font-bold text-on-pure-white tabular-nums">
                      {formatPaise(offer.offeredTotalPaise)}
                    </span>
                    {!offer.isPriceComplete && (
                      <span className="text-[10px] text-accent-orange-text font-medium">Taxes/shipping extra</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="font-label text-muted-gray">Fulfillment & Delivery</span>
                    <span className="font-semibold text-on-pure-white">
                      {offer.totalUnitsOffered}/{offer.requestedUnits} units
                    </span>
                    <span className="text-muted-gray flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      {offer.deliveryDaysEstimate}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectOffer(offer)}
                    disabled={selectingId === offer.id || isSelected}
                    className={`w-full py-2.5 rounded-sm font-label text-xs font-semibold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary-orange text-on-deep-black'
                        : 'bg-deep-black text-on-deep-black hover:bg-surface-dark-elevated'
                    }`}
                  >
                    {selectingId === offer.id ? (
                      <span className="inline-flex items-center gap-1.5">
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Selecting...</span>
                      </span>
                    ) : isSelected ? (
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Selected Offer</span>
                      </span>
                    ) : (
                      'Select this offer'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleDetails(offer.id)}
                    className="w-full py-1.5 text-center font-label text-xs text-muted-gray hover:text-on-pure-white transition-colors"
                  >
                    {expandedOfferId === offer.id ? 'Hide breakdown' : 'View line item breakdown'}
                  </button>

                  {expandedOfferId === offer.id && (
                    <div className="p-3 bg-light-gray rounded-sm text-xs font-body flex flex-col gap-2">
                      <div className="font-semibold text-on-pure-white pb-1 border-b border-outline-subtle">
                        Itemized breakdown:
                      </div>
                      {offer.lineItems.map((li, i) => (
                        <div key={i} className="flex justify-between text-muted-gray">
                          <span>
                            {li.productName} (×{li.quantity})
                          </span>
                          <span className="font-semibold text-on-pure-white tabular-nums">
                            {formatPaise(li.quotedLineTotalPaise)}
                          </span>
                        </div>
                      ))}
                      <div className="pt-1 border-t border-outline-subtle text-[11px] text-muted-gray">
                        Warranty: {offer.warranty} · Terms: {offer.paymentTerms}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {/* Desktop Offers Table (>= md) */}
        <section aria-label="Supplier quotation comparison table" className="hidden md:block flex flex-col gap-4">
          <div className="border border-outline-subtle rounded-sm overflow-x-auto bg-pure-white shadow-xs">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-subtle bg-light-gray">
                  <th className="p-4 font-label text-xs font-semibold text-muted-gray">Supplier</th>
                  <th className="p-4 font-label text-xs font-semibold text-muted-gray">Offered Qty</th>
                  <th className="p-4 font-label text-xs font-semibold text-muted-gray">Estimated Total</th>
                  <th className="p-4 font-label text-xs font-semibold text-muted-gray">Delivery Estimate</th>
                  <th className="p-4 font-label text-xs font-semibold text-muted-gray">Status</th>
                  <th className="p-4 font-label text-xs font-semibold text-muted-gray text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-subtle font-body text-sm">
                {details.offers.map((offer) => {
                  const isSelected = selectedOffer?.id === offer.id;
                  const isExpanded = expandedOfferId === offer.id;

                  return (
                    <React.Fragment key={offer.id}>
                      <tr className={`hover:bg-light-gray/40 transition-colors ${isSelected ? 'bg-primary-orange-tint/20' : ''}`}>
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-headline text-xs font-bold text-on-pure-white">
                              {offer.supplierName}
                            </span>
                            {offer.badge && (
                              <span className="font-label text-xs text-accent-orange-text font-semibold">
                                {offer.badge}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4 tabular-nums">
                          <span className="font-medium text-on-pure-white">
                            {offer.totalUnitsOffered} units
                          </span>
                          {offer.totalUnitsOffered < offer.requestedUnits && (
                            <span className="block text-xs text-accent-orange-text">
                              (Partial: {offer.requestedUnits - offer.totalUnitsOffered} short)
                            </span>
                          )}
                        </td>

                        <td className="p-4 tabular-nums">
                          <div className="flex flex-col">
                            <span className="font-headline text-base font-bold text-on-pure-white">
                              {formatPaise(offer.offeredTotalPaise)}
                            </span>
                            {!offer.isPriceComplete ? (
                              <span className="text-xs text-accent-orange-text font-medium">
                                *Incomplete (Taxes/shipping pending)
                              </span>
                            ) : (
                              <span className="text-xs text-muted-gray">All inclusive</span>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-xs tabular-nums text-on-pure-white">
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-muted-gray" />
                            <span>{offer.deliveryDaysEstimate}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-sm font-label text-xs font-semibold ${
                              offer.status === 'confirmed'
                                ? 'bg-deep-black text-on-deep-black'
                                : offer.status === 'counteroffer'
                                ? 'bg-primary-orange-tint text-accent-orange-text'
                                : 'bg-light-gray text-muted-gray'
                            }`}
                          >
                            {offer.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleDetails(offer.id)}
                              className="px-3 py-1.5 rounded-sm border border-outline-subtle bg-pure-white font-label text-xs font-semibold text-on-pure-white hover:border-deep-black transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? 'Less' : 'Details'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSelectOffer(offer)}
                              disabled={selectingId === offer.id || isSelected}
                              className={`px-3.5 py-1.5 rounded-sm font-label text-xs font-semibold transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-primary-orange text-on-deep-black'
                                  : 'bg-deep-black text-on-deep-black hover:bg-surface-dark-elevated'
                              }`}
                            >
                              {isSelected ? 'Selected' : 'Select this offer'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Line Items Row */}
                      {isExpanded && (
                        <tr className="bg-light-gray/60">
                          <td colSpan={6} className="p-4 pl-8">
                            <div className="flex flex-col gap-2 max-w-3xl">
                              <span className="font-label text-xs uppercase tracking-wider text-muted-gray font-semibold">
                                Quoted Line Items & Commercial Terms:
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-body">
                                <div className="flex flex-col gap-1 p-3 bg-pure-white rounded-sm border border-outline-subtle">
                                  {offer.lineItems.map((li, idx) => (
                                    <div key={idx} className="flex justify-between py-1 border-b last:border-b-0 border-outline-subtle">
                                      <span className="text-on-pure-white font-medium">{li.productName} (×{li.quantity})</span>
                                      <span className="font-mono text-muted-gray">{formatPaise(li.quotedLineTotalPaise)}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex flex-col gap-1.5 p-3 bg-pure-white rounded-sm border border-outline-subtle text-muted-gray">
                                  <div><strong className="text-on-pure-white">Payment Terms:</strong> {offer.paymentTerms}</div>
                                  <div><strong className="text-on-pure-white">Warranty:</strong> {offer.warranty}</div>
                                  <div><strong className="text-on-pure-white">Validity:</strong> Until {offer.validUntil}</div>
                                  {offer.notes && <div><strong className="text-on-pure-white">Distributor Note:</strong> {offer.notes}</div>}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </Container>
    </div>
  );
};
