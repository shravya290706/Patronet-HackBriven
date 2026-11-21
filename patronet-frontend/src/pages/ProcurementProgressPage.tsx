import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Building,
  RotateCw,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '@/components/layout/Container';
import { procurementService } from '@/services';
import type { ProcurementDetails, SupplierSummary } from '@/services/api/procurementService';
import { formatPaise } from '@/lib/moneyUtils';
import { DEFAULT_PRODUCT_FALLBACK_IMAGE } from '@/lib/imageUtils';

export const ProcurementProgressPage: React.FC = () => {
  const { id = 'PN-BULK-2026-4108' } = useParams<{ id: string }>();
  const [details, setDetails] = React.useState<ProcurementDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchProgress = React.useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const data = await procurementService.getProgress(id);
      setDetails(data);
      if (showToast) toast.success('Negotiation status refreshed');
    } catch (err) {
      console.error('Failed to load procurement progress:', err);
      toast.error('Unable to fetch procurement progress.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchProgress(false);
  }, [fetchProgress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-pure-white flex items-center justify-center">
        <div className="flex items-center gap-3 font-label text-sm text-muted-gray">
          <RotateCw className="w-5 h-5 animate-spin text-primary-orange" />
          <span>Loading negotiation status...</span>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-pure-white text-on-pure-white">
        <Container className="py-16 text-center flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-primary-orange" />
          <h1 className="font-headline text-2xl font-bold">Procurement Request Not Found</h1>
          <p className="font-body text-sm text-muted-gray max-w-md">
            No procurement request matching ID <span className="font-mono">{id}</span> could be located.
          </p>
          <Link
            to="/procurement"
            className="mt-2 px-6 py-2.5 rounded-sm bg-deep-black text-on-deep-black font-label text-sm font-semibold hover:bg-surface-dark-elevated transition-colors"
          >
            Back to Procurement
          </Link>
        </Container>
      </div>
    );
  }

  const totalRequestedUnits = details.items.reduce((acc, it) => acc + it.quantity, 0);
  const quotationsReceived = details.suppliers.filter(
    (s) => s.status === 'offer_received' || s.status === 'counteroffer'
  ).length;

  const getStatusBadge = (status: SupplierSummary['status']) => {
    switch (status) {
      case 'offer_received':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-deep-black text-pure-white font-label text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary-orange" />
            <span>Quotation received</span>
          </span>
        );
      case 'counteroffer':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-primary-orange-tint text-accent-orange-text border border-primary-orange font-label text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Counteroffer proposed</span>
          </span>
        );
      case 'in_negotiation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-light-gray text-on-pure-white border border-outline-subtle font-label text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-primary-orange animate-pulse" />
            <span>In negotiation</span>
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-light-gray text-muted-gray font-label text-xs">
            Declined
          </span>
        );
      case 'no_response':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-sm bg-light-gray text-muted-gray font-label text-xs">
            Awaiting response
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-pure-white text-on-pure-white">
      <Container className="py-8 md:py-12 flex flex-col gap-8 md:gap-10">
        {/* Navigation Breadcrumb */}
        <div>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label text-sm text-muted-gray mb-3">
            <Link to="/" className="hover:text-on-pure-white transition-colors">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/procurement" className="hover:text-on-pure-white transition-colors">
              Bulk Procurement
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-on-pure-white font-mono">{details.id}</span>
          </nav>

          <div className="pb-6 border-b border-outline-subtle flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-label text-xs tracking-wider uppercase text-accent-orange-text font-semibold">
                  AI Negotiation Progress
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-light-gray text-xs font-label text-muted-gray border border-outline-subtle">
                  Simulated Demo
                </span>
              </div>
              <h1 className="font-headline text-3xl md:text-4xl font-bold text-on-pure-white">
                Your request is in progress.
              </h1>
              <p className="font-body text-base text-muted-gray">
                Supplier responses and quotation updates are tracked below as they arrive.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => fetchProgress(true)}
                disabled={refreshing}
                className="px-4 py-2.5 rounded-sm border border-outline-subtle bg-pure-white font-label text-xs font-semibold text-on-pure-white hover:border-deep-black transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <Link
                to={`/procurement/${details.id}/offers`}
                className="px-6 py-2.5 rounded-sm bg-primary-orange text-on-deep-black font-label text-sm font-semibold hover:bg-primary-orange-hover transition-colors inline-flex items-center gap-2"
              >
                <span>Compare {details.offers.length} Received Offers</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Request Metadata Summary Strip */}
        <section
          aria-label="Procurement request status summary"
          className="p-5 md:p-6 rounded-sm border border-outline-subtle bg-light-gray grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <div className="flex flex-col gap-1">
            <span className="font-label text-xs text-muted-gray">Request reference</span>
            <span className="font-title text-sm md:text-base font-bold text-on-pure-white font-mono">
              {details.id}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-label text-xs text-muted-gray">Suppliers contacted</span>
            <span className="font-title text-sm md:text-base font-bold text-on-pure-white tabular-nums">
              {details.suppliers.length} (Simulated)
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-label text-xs text-muted-gray">Quotations received</span>
            <span className="font-title text-sm md:text-base font-bold text-on-pure-white tabular-nums">
              {quotationsReceived}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-label text-xs text-muted-gray">Negotiation status</span>
            <div className="inline-flex items-center gap-1.5 font-title text-sm font-bold text-on-pure-white">
              <span className="w-2 h-2 rounded-full bg-primary-orange shrink-0 animate-ping" />
              <span>In progress</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-label text-xs text-muted-gray">Catalogue Subtotal</span>
            <span className="font-title text-sm md:text-base font-bold text-on-pure-white tabular-nums">
              {formatPaise(details.catalogueSubtotalPaise)}
            </span>
          </div>
        </section>

        {/* Requested Products & Activity Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Requested Products List */}
          <section
            aria-labelledby="requested-items-heading"
            className="lg:col-span-5 p-6 rounded-sm border border-outline-subtle bg-pure-white flex flex-col gap-4 shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-subtle">
              <h2 id="requested-items-heading" className="font-headline text-lg font-bold text-on-pure-white">
                Requested Products
              </h2>
              <span className="font-label text-xs text-muted-gray tabular-nums">
                {totalRequestedUnits} units total
              </span>
            </div>

            <ul className="divide-y divide-outline-subtle">
              {details.items.map((it) => (
                <li key={it.productId} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-light-gray rounded-sm p-1 border border-outline-subtle/50 shrink-0 flex items-center justify-center">
                      <img
                        src={it.primaryImageUrl || DEFAULT_PRODUCT_FALLBACK_IMAGE}
                        alt={it.productName || 'Product'}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK_IMAGE;
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="font-headline text-xs font-bold text-on-pure-white">
                      {it.productName}
                    </span>
                  </div>
                  <span className="font-label text-xs text-muted-gray tabular-nums shrink-0 font-semibold">
                    Qty {it.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Activity & AI Sourcing Summary */}
          <section
            aria-labelledby="ai-activity-heading"
            className="lg:col-span-7 p-6 rounded-sm border border-outline-subtle bg-pure-white flex flex-col gap-4 shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-subtle">
              <h2 id="ai-activity-heading" className="font-headline text-lg font-bold text-on-pure-white">
                Activity Summary
              </h2>
              <span className="font-label text-xs text-primary-orange font-semibold">
                Autonomous Negotiation Engine
              </span>
            </div>

            <p className="font-body text-sm text-on-pure-white leading-relaxed">
              Your specification request for <strong className="text-on-pure-white">{details.title}</strong> was simulated to {details.suppliers.length} registered hardware distributors. {quotationsReceived} suppliers have submitted bids, including volume discounts and dispatch schedules.
            </p>

            <div className="p-3.5 rounded-sm bg-light-gray border border-outline-subtle flex items-start gap-2.5 text-xs text-muted-gray">
              <HelpCircle className="w-4 h-4 text-primary-orange shrink-0 mt-0.5" />
              <span>
                No purchase order is placed automatically. You have full discretion to compare and approve final supplier offers.
              </span>
            </div>
          </section>
        </div>

        {/* Supplier Status Table & Mobile Cards */}
        <section aria-labelledby="supplier-status-heading" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 id="supplier-status-heading" className="font-headline text-xl font-bold text-on-pure-white">
              Supplier Status ({details.suppliers.length})
            </h2>
            <Link
              to={`/procurement/${details.id}/offers`}
              className="font-label text-xs font-semibold text-accent-orange-text hover:underline"
            >
              Compare Offers &rarr;
            </Link>
          </div>

          {/* Mobile Supplier Cards (< md) */}
          <div className="md:hidden flex flex-col gap-3">
            {details.suppliers.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-sm border border-outline-subtle bg-pure-white flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-muted-gray" />
                    <span className="font-headline text-xs font-bold text-on-pure-white">
                      {s.name}
                    </span>
                  </div>
                  <div className="mt-1">{getStatusBadge(s.status)}</div>
                </div>

                {(s.status === 'offer_received' || s.status === 'counteroffer') && (
                  <Link
                    to={`/procurement/${details.id}/offers`}
                    className="px-3 py-1.5 rounded-sm bg-deep-black text-on-deep-black font-label text-xs font-semibold shrink-0"
                  >
                    View
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block border border-outline-subtle rounded-sm overflow-x-auto bg-pure-white shadow-xs">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-subtle bg-light-gray">
                  <th className="p-4 font-label text-xs font-semibold text-muted-gray">Supplier</th>
                  <th className="p-4 font-label text-xs font-semibold text-muted-gray">Status</th>
                  <th className="p-4 font-label text-xs font-semibold text-muted-gray">Last Activity</th>
                  <th className="p-4 font-label text-xs font-semibold text-muted-gray text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-subtle font-body text-sm">
                {details.suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-light-gray/40 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-headline text-xs font-bold text-on-pure-white">
                          {s.name}
                        </span>
                        {s.notes && <span className="font-body text-xs text-muted-gray">{s.notes}</span>}
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(s.status)}</td>
                    <td className="p-4 text-xs text-muted-gray tabular-nums">{s.lastActivity}</td>
                    <td className="p-4 text-right">
                      {s.status === 'offer_received' || s.status === 'counteroffer' ? (
                        <Link
                          to={`/procurement/${details.id}/offers`}
                          className="px-3.5 py-1.5 rounded-sm bg-primary-orange text-on-deep-black font-label text-xs font-semibold hover:bg-primary-orange-hover transition-colors inline-block"
                        >
                          View Offer
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-gray italic">Pending reply</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </Container>
    </div>
  );
};
