import * as React from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Loader2, ShoppingBag } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { checkoutService } from '@/services';
import type { CheckoutOrderSnapshot } from '@/services/api/checkoutService';
import { formatPaise } from '@/lib/moneyUtils';
import { DEFAULT_PRODUCT_FALLBACK_IMAGE } from '@/lib/imageUtils';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = React.useState<CheckoutOrderSnapshot[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'active' | 'cancelled'>('all');

  React.useEffect(() => {
    let active = true;
    async function loadOrders() {
      try {
        setLoading(true);
        const list = await checkoutService.getOrders();
        if (active) {
          setOrders(list);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadOrders();
    return () => {
      active = false;
    };
  }, []);

  const filteredOrders = React.useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'active') {
      return orders.filter((o) => o.status !== 'processing'); // in mock all are active/order_received
    }
    return []; // No cancelled orders in demo mode
  }, [orders, filter]);

  return (
    <div className="bg-pure-white text-on-pure-white min-h-[calc(100vh-72px)]">
      <Container className="py-8 lg:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label text-sm text-muted-gray mb-6">
          <Link to="/" className="hover:text-on-pure-white transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/account" className="hover:text-on-pure-white transition-colors">
            My Account
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-on-pure-white font-semibold">Your Orders</span>
        </nav>

        {/* Page Header */}
        <div className="pb-6 border-b border-outline-subtle mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-pure-white">
              Your orders.
            </h1>
            <p className="font-body text-base text-muted-gray mt-1">
              Review past purchases, payment statuses, and order details.
            </p>
          </div>
        </div>

        {/* Account Layout: Sidebar + Orders Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left-Side Navigation */}
          <aside className="lg:col-span-3">
            <nav
              aria-label="Account sections"
              className="flex flex-col border border-outline-subtle rounded-sm divide-y divide-outline-subtle bg-pure-white overflow-hidden"
            >
              <Link
                to="/account"
                className="px-5 py-3.5 font-label text-sm text-muted-gray hover:text-on-pure-white hover:bg-light-gray transition-colors"
              >
                Profile &amp; Details
              </Link>
              <Link
                to="/orders"
                className="px-5 py-3.5 font-label text-sm font-semibold text-on-pure-white bg-light-gray border-l-2 border-primary-orange"
              >
                My Orders
              </Link>
              <Link
                to="/account#saved-addresses"
                className="px-5 py-3.5 font-label text-sm text-muted-gray hover:text-on-pure-white hover:bg-light-gray transition-colors"
              >
                Saved Addresses
              </Link>
              <Link
                to="/wishlist"
                className="px-5 py-3.5 font-label text-sm text-muted-gray hover:text-on-pure-white hover:bg-light-gray transition-colors"
              >
                Wishlist
              </Link>
            </nav>
          </aside>

          {/* Main Orders Column */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-outline-subtle pb-4" role="tablist">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-sm font-label text-sm font-semibold transition-colors ${
                  filter === 'all'
                    ? 'bg-deep-black text-on-deep-black'
                    : 'bg-light-gray text-on-light-gray hover:bg-outline-subtle'
                }`}
              >
                All orders ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-sm font-label text-sm font-semibold transition-colors ${
                  filter === 'active'
                    ? 'bg-deep-black text-on-deep-black'
                    : 'bg-light-gray text-on-light-gray hover:bg-outline-subtle'
                }`}
              >
                Active ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('cancelled')}
                className={`px-4 py-2 rounded-sm font-label text-sm font-semibold transition-colors ${
                  filter === 'cancelled'
                    ? 'bg-deep-black text-on-deep-black'
                    : 'bg-light-gray text-on-light-gray hover:bg-outline-subtle'
                }`}
              >
                Cancelled (0)
              </button>
            </div>

            {/* Orders Feed */}
            {loading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-orange mx-auto mb-3" />
                <p className="font-body text-sm text-muted-gray">Loading order history...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              /* Approved Empty State */
              <div className="p-12 text-center rounded-sm border border-outline-subtle bg-light-gray">
                <div className="w-12 h-12 bg-pure-white border border-outline-subtle rounded-full flex items-center justify-center mx-auto mb-4 text-muted-gray">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="font-headline text-xl font-bold text-on-pure-white">No orders found</h3>
                <p className="font-body text-sm text-muted-gray mt-1.5 mb-6 max-w-md mx-auto">
                  You haven't placed any demo orders yet. Items checked out in this browser session will appear here.
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-sm bg-primary-orange text-deep-black font-label text-sm font-bold hover:bg-primary-orange-hover transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Browse Products</span>
                </Link>
              </div>
            ) : (
              /* Orders List */
              <div className="flex flex-col gap-4">
                {filteredOrders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <article
                      key={order.orderNumber}
                      className="rounded-sm border border-outline-subtle bg-pure-white p-5 lg:p-6 flex flex-col gap-5 hover:border-muted-gray transition-colors"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-subtle">
                        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-label text-xs text-muted-gray">Order number</span>
                            <span className="font-headline text-base font-bold text-on-pure-white tabular-nums">
                              {order.orderNumber}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-label text-xs text-muted-gray">Date placed</span>
                            <span className="font-body text-sm text-on-pure-white tabular-nums">
                              {dateStr}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-label text-xs text-muted-gray">Total amount</span>
                            <span className="font-headline text-base font-bold text-on-pure-white tabular-nums">
                              {formatPaise(order.totalPaise)}
                            </span>
                          </div>
                        </div>

                        {/* Status Pills */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-light-gray font-label text-xs text-on-pure-white font-medium">
                            <span className="w-2 h-2 rounded-full bg-primary-orange shrink-0" aria-hidden="true" />
                            <span>Order received</span>
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-sm border border-outline-subtle bg-pure-white font-label text-xs text-muted-gray">
                            Payment: {order.paymentMethod === 'Cash on Delivery' ? 'Cash on Delivery' : 'Pending validation'}
                          </span>
                        </div>
                      </div>

                      {/* Items Row & Details Action */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                          {order.items.slice(0, 4).map((item, idx) => (
                            <div
                              key={idx}
                              title={`${item.productName} (Qty ${item.quantity})`}
                              className="w-14 h-14 bg-light-gray rounded-sm p-1 border border-outline-subtle flex items-center justify-center shrink-0 overflow-hidden"
                            >
                              <img
                                src={item.imageUrl || DEFAULT_PRODUCT_FALLBACK_IMAGE}
                                alt={item.productName}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK_IMAGE;
                                }}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ))}
                          {order.items.length > 4 && (
                            <span className="text-xs text-muted-gray font-medium pl-1">
                              +{order.items.length - 4} more
                            </span>
                          )}
                        </div>

                        <Link
                          to={`/orders/${order.orderNumber}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm border border-outline-subtle bg-pure-white font-label text-sm font-semibold text-on-pure-white hover:border-deep-black transition-colors shrink-0 self-start sm:self-center"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-4 h-4 text-primary-orange" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};
export default OrdersPage;
