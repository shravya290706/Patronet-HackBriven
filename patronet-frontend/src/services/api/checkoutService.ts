import type { CartModel } from './cartService';

export interface ShippingAddressInput {
  fullName: string;
  phone: string;
  email?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  label?: string;
  isDefault?: boolean;
}

export type PaymentMethodType = 'UPI' | 'Cash on Delivery' | 'Credit/Debit Card' | 'Net Banking';

export interface CheckoutInput {
  shippingAddress: ShippingAddressInput;
  paymentMethod: PaymentMethodType;
  billingAddress?: ShippingAddressInput;
  orderNotes?: string;
}

export interface CheckoutOrderItem {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  unitPricePaise: number;
  quantity: number;
  lineTotal: number;
  lineTotalPaise: number;
  imageUrl?: string;
}

export interface CheckoutOrderSnapshot {
  id: string; // Order UUID or mock identifier e.g. "PN-2026-84921"
  orderNumber: string; // e.g. "PN-2026-84921"
  status: 'order_received' | 'pending' | 'confirmed' | 'processing';
  createdAt: string;
  items: CheckoutOrderItem[];
  itemCount: number;
  subtotal: number;
  subtotalPaise: number;
  estimatedShipping: number;
  estimatedShippingPaise: number;
  total: number;
  totalPaise: number;
  shippingAddress: ShippingAddressInput;
  paymentMethod: PaymentMethodType;
  paymentStatus: 'simulated_pending' | 'simulated_paid' | 'simulated_cod';
  isMock: boolean;
}

export interface CheckoutValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface CheckoutResult {
  success: boolean;
  order?: CheckoutOrderSnapshot;
  error?: string;
}

export interface ICheckoutService {
  validateShippingAddress(address: Partial<ShippingAddressInput>): CheckoutValidationResult;
  createOrder(input: CheckoutInput, cartSnapshot: CartModel): Promise<CheckoutResult>;
  getOrderById(orderId: string): Promise<CheckoutOrderSnapshot | null>;
  getOrders(): Promise<CheckoutOrderSnapshot[]>;
  getSavedAddresses?(): Promise<ShippingAddressInput[]>;
  saveAddress?(address: ShippingAddressInput): Promise<ShippingAddressInput[]>;
  deleteAddress?(line1: string, pincode: string): Promise<ShippingAddressInput[]>;
  setDefaultAddress?(line1: string, pincode: string): Promise<ShippingAddressInput[]>;
}
