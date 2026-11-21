import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { checkoutService } from '@/services';
import type { CheckoutOrderSnapshot } from '@/services/api/checkoutService';
import { formatPaise } from '@/lib/moneyUtils';
import { DEFAULT_PRODUCT_FALLBACK_IMAGE } from '@/lib/imageUtils';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = React.useState<CheckoutOrderSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    async function loadOrder() {
      if (!id) {
        setError('No order reference provided.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const found = await checkoutService.getOrderById(id);
        if (active) {
          if (found) {
            setOrder(found);
          } else {
            setError(`Order "${id}" could not be found.`);
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to retrieve order details.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrder();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="bg-pure-white text-on-pure-white min-h-[calc(100vh-72px)] flex items-center justify-center">
        <Container className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-orange mx-auto mb-3" />
          <p className="font-body text-sm text-muted-gray">Loading order details...</p>
        </Container>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-pure-white text-on-pure-white min-h-[calc(100vh-72px)]">
        <Container className="py-16">
          <div className="max-w-md mx-auto p-8 rounded-sm border border-outline-subtle bg-light-gray text-center">
            <AlertCircle className="w-10 h-10 text-primary-orange mx-auto mb-3" />
            <h1 className="font-headline text-xl font-bold text-on-pure-white">Order Not Found</h1>
            <p className="font-body text-sm text-muted-gray mt-1.5 mb-6">
              {error || `Unable to locate order "${id}".`}
            </p>
            <Link
              to="/orders"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-sm bg-deep-black text-on-deep-black font-label text-sm font-semibold hover:bg-surface-dark-elevated transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Orders</span>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const {
    orderNumber,
    items,
    totalPaise,
    shippingAddress,
    paymentMethod,
    createdAt,
  } = order;

  const dateStr = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-pure-white text-on-pure-white min-h-[calc(100vh-72px)]">
      <Container className="py-8 lg:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label text-sm text-muted-gray mb-6">
          <Link to="/" className="hover:text-on-pure-white transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/orders" className="hover:text-on-pure-white transition-colors">
            Your Orders
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-on-pure-white font-semibold">{orderNumber}</span>
        </nav>

        {/* Page Header */}
        <div className="pb-6 border-b border-outline-subtle mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-headline text-3xl font-bold text-on-pure-white">
                Order {orderNumber}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-primary-orange-tint text-accent-orange-text font-label text-xs font-semibold">
                Order received
              </span>
            </div>
            <p className="font-body text-sm text-muted-gray mt-1">
              Placed on {dateStr} · {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 font-label text-sm font-semibold text-on-pure-white hover:text-accent-orange-text transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to orders</span>
          </Link>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Items Breakdown */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="border border-outline-subtle rounded-sm bg-pure-white overflow-hidden">
              <div className="px-6 py-4 bg-light-gray border-b border-outline-subtle">
                <h2 className="font-headline text-lg font-bold text-on-pure-white">
                  Items Ordered ({items.length})
                </h2>
              </div>
              <ul className="divide-y divide-outline-subtle px-6">
                {items.map((item, idx) => (
                  <li key={idx} className="py-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 bg-light-gray rounded-sm p-1 border border-outline-subtle shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={item.imageUrl || DEFAULT_PRODUCT_FALLBACK_IMAGE}
                          alt={item.productName}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK_IMAGE;
                          }}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-label text-sm font-semibold text-on-pure-white truncate">
                          {item.productName}
                        </p>
                        <p className="font-body text-xs text-muted-gray mt-0.5">
                          SKU: {item.sku || 'N/A'}
                        </p>
                        <p className="font-body text-xs text-muted-gray tabular-nums">
                          Qty {item.quantity} · {formatPaise(item.unitPricePaise)} each
                        </p>
                      </div>
                    </div>
                    <span className="font-label text-sm font-bold text-on-pure-white tabular-nums shrink-0">
                      {formatPaise(item.lineTotalPaise)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Order Summary & Delivery Address */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            {/* Payment & Totals Box */}
            <div className="bg-light-gray rounded-sm p-6 border border-outline-subtle flex flex-col gap-4">
              <h2 className="font-headline text-lg font-bold text-on-pure-white pb-3 border-b border-outline-subtle">
                Order Summary
              </h2>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-gray">Subtotal</span>
                <span className="font-semibold text-on-pure-white tabular-nums">
                  {formatPaise(totalPaise)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-gray">Shipping</span>
                <span className="text-muted-gray">Calculated at confirmation</span>
              </div>
              <div className="flex items-center justify-between text-base font-bold text-on-pure-white pt-3 border-t border-outline-subtle">
                <span>Total</span>
                <span className="tabular-nums">{formatPaise(totalPaise)}</span>
              </div>
              <div className="pt-2 text-xs text-muted-gray">
                Payment method:{' '}
                <span className="font-semibold text-on-pure-white">
                  {paymentMethod} ({paymentMethod === 'Cash on Delivery' ? 'Pay at doorstep' : 'Simulated pending validation'})
                </span>
              </div>
            </div>

            {/* Delivery Address Box */}
            <div className="bg-light-gray rounded-sm p-6 border border-outline-subtle flex flex-col gap-3">
              <h2 className="font-headline text-base font-bold text-on-pure-white pb-2 border-b border-outline-subtle">
                Delivery Address
              </h2>
              <p className="font-body text-sm text-on-pure-white leading-relaxed">
                <span className="font-semibold">{shippingAddress.fullName}</span>
                <br />
                {shippingAddress.line1}
                {shippingAddress.line2 ? `, ${shippingAddress.line2}` : ''}
                <br />
                {shippingAddress.city}, {shippingAddress.state} — {shippingAddress.pincode}
              </p>
              <p className="text-xs text-muted-gray mt-1">Phone: {shippingAddress.phone}</p>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
};
export default OrderDetailPage;
