import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { checkoutService } from '@/services';
import type { CheckoutOrderSnapshot } from '@/services/api/checkoutService';
import { formatPaise } from '@/lib/moneyUtils';
import { DEFAULT_PRODUCT_FALLBACK_IMAGE } from '@/lib/imageUtils';

export const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = React.useState<CheckoutOrderSnapshot | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showItemsBreakdown, setShowItemsBreakdown] = React.useState<boolean>(false);

  React.useEffect(() => {
    let active = true;

    async function loadOrder() {
      if (!id) {
        setError('No order reference provided in URL.');
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
            setError(`Order "${id}" could not be found. Please check your order reference.`);
          }
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to retrieve order confirmation details.');
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
          <Loader2 className="w-8 h-8 animate-spin text-primary-orange mx-auto mb-4" />
          <p className="font-body text-body-md text-muted-gray">Loading order confirmation...</p>
        </Container>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-pure-white text-on-pure-white min-h-[calc(100vh-72px)] flex items-center justify-center">
        <Container className="py-16">
          <div className="max-w-xl mx-auto p-8 rounded-sm border border-outline-subtle bg-light-gray text-center">
            <AlertCircle className="w-12 h-12 text-primary-orange mx-auto mb-4" />
            <h1 className="font-headline text-2xl font-bold text-on-pure-white">Order not found</h1>
            <p className="font-body text-body-md text-muted-gray mt-2 mb-6">
              {error || 'Unable to locate order snapshot for this reference.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/products"
                className="w-full sm:w-auto px-6 py-2.5 rounded-sm bg-primary-orange text-deep-black font-label text-label-md font-bold hover:bg-primary-orange-hover transition-colors"
              >
                Browse Catalogue
              </Link>
              <Link
                to="/cart"
                className="w-full sm:w-auto px-6 py-2.5 rounded-sm border border-outline-subtle bg-pure-white text-on-pure-white font-label text-label-md font-semibold hover:border-deep-black transition-colors"
              >
                Return to Cart
              </Link>
            </div>
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
  } = order;

  return (
    <div className="bg-pure-white text-on-pure-white min-h-[calc(100vh-72px)]">
      <main className="flex-1 flex items-center">
        <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-2xl mx-auto flex flex-col gap-8">
            {/* Confirmation Header */}
            <div className="flex flex-col gap-4 pb-6 border-b border-outline-subtle">
              <div className="w-12 h-12 rounded-sm bg-primary-orange-tint flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-accent-orange-text" />
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-pure-white">
                  Order placed successfully.
                </h1>
                <p className="font-body text-body-lg text-muted-gray text-pretty">
                  We have received your order request and will confirm item availability and dispatch details shortly.
                </p>
                <div className="mt-2 inline-flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-sm bg-light-gray border border-outline-subtle text-muted-gray">
                    Demo Order · No real payment charged
                  </span>
                </div>
              </div>
            </div>

            {/* Order Details Summary Box matching Stitch patronet_order_confirmation */}
            <section
              aria-label="Order confirmation details"
              className="bg-light-gray rounded-sm p-6 border border-outline-subtle flex flex-col gap-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-outline-subtle">
                <div className="flex flex-col gap-1">
                  <span className="font-label text-label-md text-muted-gray">Order number</span>
                  <span className="font-headline text-lg font-bold text-on-pure-white tabular-nums">
                    {orderNumber}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-label text-label-md text-muted-gray">Order total</span>
                  <span className="font-headline text-lg font-bold text-on-pure-white tabular-nums">
                    {formatPaise(totalPaise)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-label text-label-md text-muted-gray">Order status</span>
                  <span className="inline-flex items-center gap-2 font-headline text-base font-semibold text-on-pure-white">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-orange shrink-0" aria-hidden="true" />
                    <span>Order received</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <span className="font-label text-label-md text-muted-gray">Delivery address</span>
                  <p className="font-body text-body-md text-on-pure-white leading-relaxed">
                    {shippingAddress.fullName}
                    <br />
                    {shippingAddress.line1}
                    {shippingAddress.line2 ? `, ${shippingAddress.line2}` : ''}
                    <br />
                    {shippingAddress.city}, {shippingAddress.state} — {shippingAddress.pincode}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-label text-label-md text-muted-gray">Payment method</span>
                  <p className="font-body text-body-md text-on-pure-white leading-relaxed">
                    {paymentMethod}{' '}
                    <span className="text-muted-gray font-normal">
                      ({paymentMethod === 'Cash on Delivery' ? 'Pay at doorstep' : 'Pending payment validation'})
                    </span>
                  </p>
                </div>
              </div>

              {/* Collapsible / Inline Item Breakdown */}
              {showItemsBreakdown && (
                <div id="order-items-breakdown" className="pt-6 border-t border-outline-subtle">
                  <h2 className="font-headline text-base font-bold text-on-pure-white mb-4">
                    Items in this order ({items.length})
                  </h2>
                  <ul className="divide-y divide-outline-subtle">
                    {items.map((item, idx) => (
                      <li key={idx} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK_IMAGE;
                              }}
                              className="w-10 h-10 object-contain p-1 border border-outline-subtle rounded-sm bg-pure-white shrink-0"
                            />
                          )}
                          <span className="font-body text-body-md text-on-pure-white truncate">
                            {item.productName} × {item.quantity}
                          </span>
                        </div>
                        <span className="font-label text-label-md font-bold text-on-pure-white tabular-nums shrink-0">
                          {formatPaise(item.lineTotalPaise)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                type="button"
                onClick={() => setShowItemsBreakdown((prev) => !prev)}
                id="view-order-btn"
                className="px-8 py-3.5 rounded-sm bg-primary-orange text-deep-black font-label text-label-md font-bold hover:bg-primary-orange-hover transition-colors text-center"
              >
                {showItemsBreakdown ? 'Hide Order Items' : 'View Order Items'}
              </button>
              <Link
                to="/products"
                className="px-8 py-3.5 rounded-sm border border-outline-subtle bg-pure-white text-on-pure-white font-label text-label-md font-semibold hover:border-deep-black transition-colors text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default OrderConfirmationPage;
