import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { useCart } from '@/context/CartContext';
import { checkoutService, productService } from '@/services';
import type { ShippingAddressInput, PaymentMethodType } from '@/services/api/checkoutService';
import { inrToPaise, formatPaise } from '@/lib/moneyUtils';
import { getProductPrimaryImageUrl, DEFAULT_PRODUCT_FALLBACK_IMAGE } from '@/lib/imageUtils';
import type { Product } from '@/types';

interface PopulatedCheckoutLine {
  productId: string;
  quantity: number;
  product: Product | null;
  unitPricePaise: number;
  lineTotalPaise: number;
}

export const CheckoutPage: React.FC = () => {
  const { cart, itemCount, loading: cartLoading, clearCart } = useCart();
  const navigate = useNavigate();

  // Saved addresses list & active selection
  const [addresses, setAddresses] = React.useState<ShippingAddressInput[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = React.useState<number>(0);
  const [isAddressFormOpen, setIsAddressFormOpen] = React.useState<boolean>(false);
  const [addressFormData, setAddressFormData] = React.useState<ShippingAddressInput>({
    fullName: '',
    phone: '',
    email: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    label: '',
    isDefault: false,
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  // Payment method selection
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethodType>('UPI');

  // Product resolution for order review
  const [lines, setLines] = React.useState<PopulatedCheckoutLine[]>([]);
  const [loadingLines, setLoadingLines] = React.useState<boolean>(true);

  // In-flight submission guard & error state
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Load saved addresses on mount
  React.useEffect(() => {
    let active = true;
    async function loadAddresses() {
      if (checkoutService.getSavedAddresses) {
        try {
          const list = await checkoutService.getSavedAddresses();
          if (active) {
            setAddresses(list);
            const defaultIdx = list.findIndex((a) => a.isDefault);
            setSelectedAddressIndex(defaultIdx >= 0 ? defaultIdx : 0);
          }
        } catch (err) {
          console.warn('Failed to load saved addresses:', err);
        }
      }
    }
    loadAddresses();
    return () => {
      active = false;
    };
  }, []);

  // Enrich cart items with product details & calculate integer paise
  React.useEffect(() => {
    let active = true;
    async function loadProducts() {
      if (!cart.items || cart.items.length === 0) {
        setLines([]);
        setLoadingLines(false);
        return;
      }

      setLoadingLines(true);
      try {
        const enriched: PopulatedCheckoutLine[] = await Promise.all(
          cart.items.map(async (item) => {
            const product = await productService.getProductById(item.productId);
            const price = product ? product.price : 0;
            const unitPricePaise = inrToPaise(price);
            const lineTotalPaise = unitPricePaise * item.quantity;
            return {
              productId: item.productId,
              quantity: item.quantity,
              product,
              unitPricePaise,
              lineTotalPaise,
            };
          })
        );
        if (active) {
          setLines(enriched);
        }
      } catch (err) {
        console.error('Error resolving checkout items:', err);
      } finally {
        if (active) setLoadingLines(false);
      }
    }
    loadProducts();
    return () => {
      active = false;
    };
  }, [cart.items]);

  // Subtotal and Total in integer paise
  const subtotalPaise = React.useMemo(() => {
    return lines.reduce((sum, line) => sum + line.lineTotalPaise, 0);
  }, [lines]);

  const totalPaise = subtotalPaise; // Shipping charges pending confirmation / free in mock

  // Handle address form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setAddressFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear field-level error on change
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Open address form
  const handleOpenAddressForm = () => {
    setAddressFormData({
      fullName: '',
      phone: '',
      email: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      label: '',
      isDefault: addresses.length === 0,
    });
    setFormErrors({});
    setIsAddressFormOpen(true);
  };

  // Close address form
  const handleCloseAddressForm = () => {
    setIsAddressFormOpen(false);
    setFormErrors({});
  };

  // Save new address
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = checkoutService.validateShippingAddress(addressFormData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      if (checkoutService.saveAddress) {
        const updated = await checkoutService.saveAddress(addressFormData);
        setAddresses(updated);
        setSelectedAddressIndex(0); // newly added or edited is at index 0 or selected
      } else {
        setAddresses((prev) => [addressFormData, ...prev]);
        setSelectedAddressIndex(0);
      }
      setIsAddressFormOpen(false);
      setFormErrors({});
      setSubmitError(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save address.');
    }
  };

  // Submit checkout order
  const handlePlaceOrder = async () => {
    if (isSubmitting) return;

    // Cart validation
    if (!cart.items || cart.items.length === 0) {
      setSubmitError('Your cart is empty. Please add items before placing an order.');
      return;
    }

    // Selected address validation
    const activeAddress = addresses[selectedAddressIndex];
    if (!activeAddress) {
      setSubmitError('Please select or add a delivery address before continuing.');
      return;
    }

    const addressValidation = checkoutService.validateShippingAddress(activeAddress);
    if (!addressValidation.isValid) {
      setSubmitError(Object.values(addressValidation.errors)[0] || 'Selected delivery address is invalid.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Create order via checkout service
      const result = await checkoutService.createOrder(
        {
          shippingAddress: activeAddress,
          paymentMethod,
        },
        cart
      );

      if (!result.success || !result.order) {
        setSubmitError(result.error || 'Failed to place order. Your cart has been preserved.');
        setIsSubmitting(false);
        return;
      }

      // ONLY after immutable order snapshot is securely stored in localStorage, clear the cart
      await clearCart();

      // Navigate to order confirmation
      navigate(`/order-confirmation/${result.order.orderNumber || result.order.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred. Cart preserved.');
      setIsSubmitting(false);
    }
  };

  const isCartEmpty = !cart.items || cart.items.length === 0;

  return (
    <div className="bg-pure-white text-on-pure-white min-h-[calc(100vh-72px)]">
      <Container className="py-8 lg:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label text-label-md text-muted-gray mb-6">
          <Link to="/cart" className="hover:text-on-pure-white transition-colors duration-150">
            Shopping Cart
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-on-pure-white font-semibold">Checkout</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-outline-subtle mb-8">
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-on-pure-white">
              Checkout.
            </h1>
            <p className="font-body text-body-lg text-muted-gray mt-1">
              Review your details and complete your order.
            </p>
          </div>
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 font-label text-label-md font-semibold text-on-pure-white hover:text-accent-orange-text transition-colors duration-150 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to cart</span>
          </Link>
        </div>

        {/* Error Banner */}
        {submitError && (
          <div
            id="checkout-error-banner"
            className="mb-8 p-4 sm:p-5 rounded-sm border border-primary-orange bg-primary-orange-tint flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent-orange-text shrink-0 mt-0.5" />
              <div>
                <p className="font-label text-label-md font-bold text-on-pure-white">Unable to place order</p>
                <p className="font-body text-body-md text-on-pure-white mt-0.5">{submitError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              className="px-4 py-1.5 rounded-sm bg-deep-black text-on-deep-black font-label text-label-sm font-semibold hover:bg-surface-dark-elevated transition-colors duration-150 shrink-0 self-start sm:self-center"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Demo Mode Notice */}
        <div className="mb-8 px-4 py-3 rounded-sm bg-light-gray border border-outline-subtle flex items-center justify-between text-body-md text-muted-gray">
          <span>Demo checkout — no real payment or card details will be processed.</span>
          <span className="font-label text-label-sm font-semibold uppercase tracking-wider text-accent-orange-text bg-primary-orange-tint px-2 py-0.5 rounded-sm">
            Mock Mode
          </span>
        </div>

        {isCartEmpty && !cartLoading && (
          <div className="p-12 text-center border border-outline-subtle rounded-sm bg-light-gray mb-8">
            <h2 className="font-headline text-2xl font-bold text-on-pure-white">Your cart is empty</h2>
            <p className="font-body text-body-md text-muted-gray mt-2 mb-6">
              You need items in your cart to proceed with checkout.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 rounded-sm bg-primary-orange text-deep-black font-label text-label-md font-semibold hover:bg-primary-orange-hover transition-colors"
            >
              Browse Catalogue
            </Link>
          </div>
        )}

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: Shipping Address & Payment Selection */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            {/* 1. Delivery Address Section */}
            <section aria-labelledby="delivery-address-heading" className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 id="delivery-address-heading" className="font-headline text-2xl font-bold text-on-pure-white">
                  Delivery address
                </h2>
                {!isAddressFormOpen && (
                  <button
                    type="button"
                    onClick={handleOpenAddressForm}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm border border-outline-subtle bg-pure-white text-on-pure-white font-label text-label-md font-semibold hover:border-deep-black transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add new address</span>
                  </button>
                )}
              </div>

              {/* Saved Addresses Radio Group */}
              {!isAddressFormOpen && addresses.length > 0 && (
                <div className="grid grid-cols-1 gap-4" role="radiogroup" aria-label="Saved delivery addresses">
                  {addresses.map((addr, idx) => {
                    const isSelected = selectedAddressIndex === idx;
                    return (
                      <label
                        key={idx}
                        className={`flex items-start gap-4 p-5 rounded-sm border-2 cursor-pointer transition-colors duration-150 ${
                          isSelected
                            ? 'border-primary-orange bg-pure-white'
                            : 'border-outline-subtle bg-pure-white hover:border-deep-black'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selected_address"
                          checked={isSelected}
                          onChange={() => setSelectedAddressIndex(idx)}
                          className="mt-1 text-primary-orange focus:ring-primary-orange"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-label text-label-md font-bold text-on-pure-white">
                              {addr.fullName}
                            </span>
                            {addr.label && (
                              <span className="text-xs px-2 py-0.5 rounded-sm bg-light-gray border border-outline-subtle font-semibold text-muted-gray">
                                {addr.label}
                              </span>
                            )}
                            {addr.isDefault && (
                              <span className="text-xs px-2 py-0.5 rounded-sm bg-primary-orange-tint text-accent-orange-text font-semibold">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="font-body text-body-md text-muted-gray">
                            {addr.line1}
                            {addr.line2 ? `, ${addr.line2}` : ''}
                          </p>
                          <p className="font-body text-body-md text-muted-gray">
                            {addr.city}, {addr.state} — {addr.pincode}
                          </p>
                          <p className="font-body text-body-sm text-muted-gray mt-1">Phone: {addr.phone}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* No Addresses State */}
              {!isAddressFormOpen && addresses.length === 0 && (
                <div className="p-8 rounded-sm border border-outline-subtle bg-light-gray flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-headline text-lg font-bold text-on-pure-white">No saved addresses</p>
                    <p className="font-body text-body-md text-muted-gray">Add a delivery address to proceed with your order.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddressForm}
                    className="px-6 py-2.5 rounded-sm bg-deep-black text-on-deep-black font-label text-label-md font-semibold hover:bg-surface-dark-elevated transition-colors shrink-0"
                  >
                    Add delivery address
                  </button>
                </div>
              )}

              {/* Address Form (Add / Edit) */}
              {isAddressFormOpen && (
                <form
                  onSubmit={handleSaveAddress}
                  className="p-6 rounded-sm border border-outline-subtle bg-pure-white flex flex-col gap-5"
                  noValidate
                >
                  <div className="flex items-center justify-between pb-4 border-b border-outline-subtle">
                    <h3 className="font-headline text-xl font-bold text-on-pure-white">Add new address</h3>
                    <button
                      type="button"
                      onClick={handleCloseAddressForm}
                      className="font-label text-label-md text-muted-gray hover:text-on-pure-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="fullName" className="font-label text-label-md font-medium text-on-pure-white">
                        Full name *
                      </label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        placeholder="Aarav Mehta"
                        value={addressFormData.fullName}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2.5 rounded-sm border bg-pure-white font-body text-body-md text-on-pure-white placeholder:text-muted-gray focus:outline-none ${
                          formErrors.fullName ? 'border-red-600 focus:ring-1 focus:ring-red-600' : 'border-outline-subtle focus:border-deep-black'
                        }`}
                      />
                      {formErrors.fullName && (
                        <span className="font-label text-label-sm text-red-600">{formErrors.fullName}</span>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="phone" className="font-label text-label-md font-medium text-on-pure-white">
                        Phone number *
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+91 98201 44512"
                        value={addressFormData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2.5 rounded-sm border bg-pure-white font-body text-body-md text-on-pure-white placeholder:text-muted-gray tabular-nums focus:outline-none ${
                          formErrors.phone ? 'border-red-600 focus:ring-1 focus:ring-red-600' : 'border-outline-subtle focus:border-deep-black'
                        }`}
                      />
                      {formErrors.phone && (
                        <span className="font-label text-label-sm text-red-600">{formErrors.phone}</span>
                      )}
                    </div>

                    {/* Email (Optional) */}
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label htmlFor="email" className="font-label text-label-md font-medium text-on-pure-white">
                        Email address <span className="text-muted-gray font-normal">(optional, for order updates)</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="aarav.mehta@example.com"
                        value={addressFormData.email || ''}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2.5 rounded-sm border bg-pure-white font-body text-body-md text-on-pure-white placeholder:text-muted-gray focus:outline-none ${
                          formErrors.email ? 'border-red-600 focus:ring-1 focus:ring-red-600' : 'border-outline-subtle focus:border-deep-black'
                        }`}
                      />
                      {formErrors.email && (
                        <span className="font-label text-label-sm text-red-600">{formErrors.email}</span>
                      )}
                    </div>

                    {/* Address Line 1 */}
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label htmlFor="line1" className="font-label text-label-md font-medium text-on-pure-white">
                        Address line 1 *
                      </label>
                      <input
                        id="line1"
                        name="line1"
                        type="text"
                        placeholder="Flat / House no., Building, Street"
                        value={addressFormData.line1}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2.5 rounded-sm border bg-pure-white font-body text-body-md text-on-pure-white placeholder:text-muted-gray focus:outline-none ${
                          formErrors.line1 ? 'border-red-600 focus:ring-1 focus:ring-red-600' : 'border-outline-subtle focus:border-deep-black'
                        }`}
                      />
                      {formErrors.line1 && (
                        <span className="font-label text-label-sm text-red-600">{formErrors.line1}</span>
                      )}
                    </div>

                    {/* Address Line 2 */}
                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label htmlFor="line2" className="font-label text-label-md font-medium text-on-pure-white">
                        Address line 2 <span className="text-muted-gray font-normal">(optional)</span>
                      </label>
                      <input
                        id="line2"
                        name="line2"
                        type="text"
                        placeholder="Landmark, Sector, or Area"
                        value={addressFormData.line2 || ''}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white font-body text-body-md text-on-pure-white placeholder:text-muted-gray focus:outline-none focus:border-deep-black"
                      />
                    </div>

                    {/* City */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="city" className="font-label text-label-md font-medium text-on-pure-white">
                        City *
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        placeholder="Mumbai"
                        value={addressFormData.city}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2.5 rounded-sm border bg-pure-white font-body text-body-md text-on-pure-white placeholder:text-muted-gray focus:outline-none ${
                          formErrors.city ? 'border-red-600 focus:ring-1 focus:ring-red-600' : 'border-outline-subtle focus:border-deep-black'
                        }`}
                      />
                      {formErrors.city && (
                        <span className="font-label text-label-sm text-red-600">{formErrors.city}</span>
                      )}
                    </div>

                    {/* State */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="state" className="font-label text-label-md font-medium text-on-pure-white">
                        State *
                      </label>
                      <input
                        id="state"
                        name="state"
                        type="text"
                        placeholder="Maharashtra"
                        value={addressFormData.state}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2.5 rounded-sm border bg-pure-white font-body text-body-md text-on-pure-white placeholder:text-muted-gray focus:outline-none ${
                          formErrors.state ? 'border-red-600 focus:ring-1 focus:ring-red-600' : 'border-outline-subtle focus:border-deep-black'
                        }`}
                      />
                      {formErrors.state && (
                        <span className="font-label text-label-sm text-red-600">{formErrors.state}</span>
                      )}
                    </div>

                    {/* Pincode */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="pincode" className="font-label text-label-md font-medium text-on-pure-white">
                        Pincode *
                      </label>
                      <input
                        id="pincode"
                        name="pincode"
                        type="text"
                        maxLength={6}
                        placeholder="400050"
                        value={addressFormData.pincode}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2.5 rounded-sm border bg-pure-white font-body text-body-md text-on-pure-white placeholder:text-muted-gray tabular-nums focus:outline-none ${
                          formErrors.pincode ? 'border-red-600 focus:ring-1 focus:ring-red-600' : 'border-outline-subtle focus:border-deep-black'
                        }`}
                      />
                      {formErrors.pincode && (
                        <span className="font-label text-label-sm text-red-600">{formErrors.pincode}</span>
                      )}
                    </div>

                    {/* Address Label */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="label" className="font-label text-label-md font-medium text-on-pure-white">
                        Address label <span className="text-muted-gray font-normal">(optional)</span>
                      </label>
                      <input
                        id="label"
                        name="label"
                        type="text"
                        placeholder="Home, Work, or Studio"
                        value={addressFormData.label || ''}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 rounded-sm border border-outline-subtle bg-pure-white font-body text-body-md text-on-pure-white placeholder:text-muted-gray focus:outline-none focus:border-deep-black"
                      />
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      name="isDefault"
                      type="checkbox"
                      checked={addressFormData.isDefault}
                      onChange={handleInputChange}
                      className="rounded-sm border-outline-subtle text-primary-orange focus:ring-primary-orange"
                    />
                    <span className="font-body text-body-md text-on-pure-white">
                      Set as default delivery address
                    </span>
                  </label>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-subtle">
                    <button
                      type="button"
                      onClick={handleCloseAddressForm}
                      className="px-5 py-2 rounded-sm border border-outline-subtle bg-pure-white text-on-pure-white font-label text-label-md font-semibold hover:border-deep-black transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-sm bg-deep-black text-on-deep-black font-label text-label-md font-semibold hover:bg-surface-dark-elevated transition-colors"
                    >
                      Save address
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* 2. Payment Method Section */}
            <section aria-labelledby="payment-method-heading" className="pt-8 border-t border-outline-subtle flex flex-col gap-5">
              <div>
                <h2 id="payment-method-heading" className="font-headline text-2xl font-bold text-on-pure-white">
                  Payment method
                </h2>
                <p className="font-body text-body-md text-muted-gray mt-1">
                  Select how you would like to complete payment once your order is validated.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Payment method">
                {/* UPI Option */}
                <label
                  className={`flex items-start gap-4 p-5 rounded-sm border-2 cursor-pointer transition-colors duration-150 ${
                    paymentMethod === 'UPI'
                      ? 'border-primary-orange bg-pure-white'
                      : 'border-outline-subtle bg-pure-white hover:border-deep-black'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                    className="mt-1 text-primary-orange focus:ring-primary-orange"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="font-headline text-lg font-bold text-on-pure-white">UPI</span>
                    <span className="font-body text-body-md text-muted-gray">
                      Pay via UPI ID or app after order confirmation
                    </span>
                  </div>
                </label>

                {/* Cash on Delivery Option */}
                <label
                  className={`flex items-start gap-4 p-5 rounded-sm border-2 cursor-pointer transition-colors duration-150 ${
                    paymentMethod === 'Cash on Delivery'
                      ? 'border-primary-orange bg-pure-white'
                      : 'border-outline-subtle bg-pure-white hover:border-deep-black'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="Cash on Delivery"
                    checked={paymentMethod === 'Cash on Delivery'}
                    onChange={() => setPaymentMethod('Cash on Delivery')}
                    className="mt-1 text-primary-orange focus:ring-primary-orange"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="font-headline text-lg font-bold text-on-pure-white">Cash on Delivery</span>
                    <span className="font-body text-body-md text-muted-gray">
                      Pay at your doorstep when your order arrives
                    </span>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Sticky Order Summary */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="bg-light-gray rounded-sm p-6 border border-outline-subtle flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-outline-subtle">
                <h2 className="font-headline text-xl font-bold text-on-pure-white">
                  Order summary
                </h2>
                <span className="font-label text-label-md text-muted-gray tabular-nums">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Order Items List */}
              {loadingLines ? (
                <div className="py-8 flex justify-center items-center text-muted-gray">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-orange" />
                </div>
              ) : (
                <ul className="divide-y divide-outline-subtle max-h-80 overflow-y-auto pr-1">
                  {lines.map((line) => {
                    const imgUrl = line.product
                      ? getProductPrimaryImageUrl(line.product)
                      : DEFAULT_PRODUCT_FALLBACK_IMAGE;

                    return (
                      <li key={line.productId} className="py-4 first:pt-0 last:pb-0 flex items-start gap-3">
                        <div className="w-14 h-14 bg-pure-white rounded-sm p-1 border border-outline-subtle shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={imgUrl}
                            alt={line.product?.name || 'Product'}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK_IMAGE;
                            }}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-label text-label-md font-semibold text-on-pure-white truncate">
                            {line.product?.name || 'Product Item'}
                          </p>
                          <p className="font-body text-body-sm text-muted-gray tabular-nums">
                            Qty {line.quantity} · {formatPaise(line.unitPricePaise)} each
                          </p>
                        </div>
                        <span className="font-label text-label-md font-bold text-on-pure-white tabular-nums shrink-0">
                          {formatPaise(line.lineTotalPaise)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Price Calculations */}
              <div className="flex flex-col gap-3 py-4 border-y border-outline-subtle">
                <div className="flex items-center justify-between">
                  <span className="font-body text-body-md text-muted-gray">Subtotal</span>
                  <span className="font-label text-label-md font-bold text-on-pure-white tabular-nums">
                    {formatPaise(subtotalPaise)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body text-body-md text-muted-gray">Shipping charges</span>
                  <span className="font-body text-body-md text-muted-gray">Calculated at confirmation</span>
                </div>
              </div>

              {/* Total Payable */}
              <div className="flex items-baseline justify-between">
                <span className="font-headline text-lg font-bold text-on-pure-white">Total payable</span>
                <span className="font-headline text-2xl font-bold text-on-pure-white tabular-nums">
                  {formatPaise(totalPaise)}
                </span>
              </div>

              {/* Place Order CTA */}
              <button
                id="place-order-btn"
                type="button"
                disabled={isSubmitting || isCartEmpty || addresses.length === 0}
                onClick={handlePlaceOrder}
                className="w-full py-3.5 px-6 rounded-sm bg-primary-orange text-deep-black font-label text-label-md font-bold hover:bg-primary-orange-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 inline-flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing order...</span>
                  </>
                ) : (
                  <span>Place Order</span>
                )}
              </button>

              <p className="font-body text-body-xs text-muted-gray text-center">
                Your order will be confirmed after availability and payment validation.
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
};
export default CheckoutPage;
