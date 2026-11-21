import type {
  ICheckoutService,
  CheckoutInput,
  CheckoutResult,
  CheckoutOrderSnapshot,
  CheckoutValidationResult,
  ShippingAddressInput,
  CheckoutOrderItem,
} from '../api/checkoutService';
import type { CartModel } from '../api/cartService';
import type { IProductService } from '../api/productService';
import { inrToPaise, paiseToInr } from '../../lib/moneyUtils';
import { getProductPrimaryImageUrl } from '../../lib/imageUtils';

const ORDERS_STORAGE_KEY = 'patronet_mock_orders_v1';
const ADDRESSES_STORAGE_KEY = 'patronet_mock_addresses_v1';

// Initial preloaded default address matching Stitch design reference
const DEFAULT_INITIAL_ADDRESSES: ShippingAddressInput[] = [
  {
    fullName: 'Aarav Mehta',
    phone: '+91 98201 44512',
    email: 'aarav.mehta@example.com',
    line1: 'Flat 402, Skylark Residency, 14th Road, Bandra West',
    line2: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    country: 'India',
    label: 'Home',
    isDefault: true,
  },
  {
    fullName: 'Aarav Mehta',
    phone: '+91 98201 44512',
    email: 'aarav.mehta@example.com',
    line1: 'Unit 7B, Horizon Tech Park, Mindspace, Malad West',
    line2: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400064',
    country: 'India',
    label: 'Work',
    isDefault: false,
  },
];

export class MockCheckoutAdapter implements ICheckoutService {
  private productService: IProductService;
  private submissionInFlight = false;

  constructor(productService: IProductService) {
    this.productService = productService;
  }

  private readOrders(): Record<string, CheckoutOrderSnapshot> {
    try {
      const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }

  private writeOrders(orders: Record<string, CheckoutOrderSnapshot>): void {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (err) {
      console.warn('Unable to persist mock order to localStorage:', err);
    }
  }

  validateShippingAddress(address: Partial<ShippingAddressInput>): CheckoutValidationResult {
    const errors: Record<string, string> = {};

    const fullName = (address.fullName || '').trim();
    if (!fullName) {
      errors.fullName = "Please enter the recipient's full name.";
    } else if (fullName.length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    }

    const phone = (address.phone || '').trim();
    // Normalize phone by removing spaces, hyphens, and +91
    const cleanPhone = phone.replace(/[\s\-()]/g, '').replace(/^\+91/, '');
    if (!phone) {
      errors.phone = 'Please enter a valid phone number.';
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid 10-digit Indian phone number.';
    }

    if (address.email && address.email.trim()) {
      const email = address.email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    const line1 = (address.line1 || '').trim();
    if (!line1) {
      errors.line1 = 'Please enter your street address or building details.';
    } else if (line1.length < 5) {
      errors.line1 = 'Address must be at least 5 characters.';
    }

    const city = (address.city || '').trim();
    if (!city) {
      errors.city = 'Please enter a city.';
    }

    const state = (address.state || '').trim();
    if (!state) {
      errors.state = 'Please enter a state.';
    }

    const pincode = (address.pincode || '').trim();
    if (!pincode) {
      errors.pincode = 'Please enter a valid 6-digit pincode.';
    } else if (!/^\d{6}$/.test(pincode)) {
      errors.pincode = 'Please enter a valid 6-digit Indian pincode.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  async getSavedAddresses(): Promise<ShippingAddressInput[]> {
    await new Promise((r) => setTimeout(r, 40));
    try {
      const raw = localStorage.getItem(ADDRESSES_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_ADDRESSES));
        return [...DEFAULT_INITIAL_ADDRESSES];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return [...DEFAULT_INITIAL_ADDRESSES];
    } catch {
      return [...DEFAULT_INITIAL_ADDRESSES];
    }
  }

  async saveAddress(address: ShippingAddressInput): Promise<ShippingAddressInput[]> {
    await new Promise((r) => setTimeout(r, 50));
    const validation = this.validateShippingAddress(address);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0] || 'Invalid address');
    }

    const existing = await this.getSavedAddresses();
    let updatedList: ShippingAddressInput[];

    if (address.isDefault) {
      updatedList = existing.map((a) => ({ ...a, isDefault: false }));
    } else {
      updatedList = [...existing];
    }

    const matchIdx = updatedList.findIndex(
      (a) => a.line1.trim().toLowerCase() === address.line1.trim().toLowerCase() && a.pincode.trim() === address.pincode.trim()
    );

    if (matchIdx >= 0) {
      updatedList[matchIdx] = { ...address };
    } else {
      updatedList.unshift({ ...address });
    }

    try {
      localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (err) {
      console.warn('Unable to save address to localStorage:', err);
    }

    return updatedList;
  }

  async deleteAddress(line1: string, pincode: string): Promise<ShippingAddressInput[]> {
    await new Promise((r) => setTimeout(r, 40));
    const existing = await this.getSavedAddresses();
    const filtered = existing.filter(
      (a) => !(a.line1.trim().toLowerCase() === line1.trim().toLowerCase() && a.pincode.trim() === pincode.trim())
    );
    // If the default address was removed and items remain, make the first one default
    if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
      filtered[0].isDefault = true;
    }
    try {
      localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.warn('Unable to delete address from localStorage:', err);
    }
    return filtered;
  }

  async setDefaultAddress(line1: string, pincode: string): Promise<ShippingAddressInput[]> {
    await new Promise((r) => setTimeout(r, 40));
    const existing = await this.getSavedAddresses();
    const updated = existing.map((a) => ({
      ...a,
      isDefault: a.line1.trim().toLowerCase() === line1.trim().toLowerCase() && a.pincode.trim() === pincode.trim(),
    }));
    try {
      localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Unable to update default address:', err);
    }
    return updated;
  }

  async createOrder(input: CheckoutInput, cartSnapshot: CartModel): Promise<CheckoutResult> {
    // Synchronous in-flight submission guard against rapid double-clicks
    if (this.submissionInFlight) {
      return {
        success: false,
        error: 'Order submission is already processing. Please wait.',
      };
    }

    this.submissionInFlight = true;

    try {
      await new Promise((r) => setTimeout(r, 200));

      // 1. Validate shipping address
      const addressValidation = this.validateShippingAddress(input.shippingAddress);
      if (!addressValidation.isValid) {
        const firstError = Object.values(addressValidation.errors)[0];
        return {
          success: false,
          error: firstError || 'Please provide a valid shipping address.',
        };
      }

      // 2. Validate cart items exist
      if (!cartSnapshot || !cartSnapshot.items || cartSnapshot.items.length === 0) {
        return {
          success: false,
          error: 'Your cart is empty. Please add items before checking out.',
        };
      }

      // 3. Resolve products & validate stock/pricing
      const orderItems: CheckoutOrderItem[] = [];
      let subtotalPaise = 0;

      for (const item of cartSnapshot.items) {
        if (!item.quantity || item.quantity <= 0) {
          return {
            success: false,
            error: `Invalid quantity for product ID ${item.productId}.`,
          };
        }

        const product = await this.productService.getProductById(item.productId);
        if (!product) {
          return {
            success: false,
            error: `Product "${item.productId}" is no longer available in the catalogue.`,
          };
        }

        if (!product.isActive) {
          return {
            success: false,
            error: `Product "${product.name}" is currently inactive.`,
          };
        }

        // Check stock constraints if inventory available
        if (product.inventory && product.inventory.length > 0) {
          const availableStock = product.inventory.reduce((sum, inv) => sum + (inv.quantityOnHand || 0), 0);
          if (availableStock < item.quantity) {
            return {
              success: false,
              error: `Insufficient stock for "${product.name}". Available: ${availableStock}, Requested: ${item.quantity}.`,
            };
          }
        }

        const unitPricePaise = inrToPaise(product.price);
        const lineTotalPaise = unitPricePaise * item.quantity;
        subtotalPaise += lineTotalPaise;

        orderItems.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitPrice: product.price,
          unitPricePaise,
          quantity: item.quantity,
          lineTotal: paiseToInr(lineTotalPaise),
          lineTotalPaise,
          imageUrl: getProductPrimaryImageUrl(product),
        });
      }

      // 4. Generate collision-resistant unique mock order reference e.g. "PN-2026-84921"
      const existingOrders = this.readOrders();
      const currentYear = new Date().getFullYear();
      let orderNumber = '';
      let attempts = 0;

      do {
        const randomSuffix = Math.floor(10000 + Math.random() * 90000);
        orderNumber = `PN-${currentYear}-${randomSuffix}`;
        attempts++;
      } while (existingOrders[orderNumber] && attempts < 20);

      const orderId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `order-${Date.now()}-${Math.random()}`;
      const totalPaise = subtotalPaise;

      const orderSnapshot: CheckoutOrderSnapshot = {
        id: orderNumber,
        orderNumber,
        status: 'order_received',
        createdAt: new Date().toISOString(),
        items: orderItems,
        itemCount: orderItems.reduce((acc, i) => acc + i.quantity, 0),
        subtotal: paiseToInr(subtotalPaise),
        subtotalPaise,
        estimatedShipping: 0,
        estimatedShippingPaise: 0,
        total: paiseToInr(totalPaise),
        totalPaise,
        shippingAddress: { ...input.shippingAddress },
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentMethod === 'Cash on Delivery' ? 'simulated_cod' : 'simulated_pending',
        isMock: true,
      };

      // 5. Persist immutable order snapshot into localStorage (separate from cart)
      existingOrders[orderNumber] = orderSnapshot;
      existingOrders[orderId] = orderSnapshot;
      this.writeOrders(existingOrders);

      return {
        success: true,
        order: orderSnapshot,
      };
    } finally {
      this.submissionInFlight = false;
    }
  }

  async getOrderById(orderId: string): Promise<CheckoutOrderSnapshot | null> {
    await new Promise((r) => setTimeout(r, 30));
    if (!orderId) return null;
    const orders = this.readOrders();
    return orders[orderId] || null;
  }

  async getOrders(): Promise<CheckoutOrderSnapshot[]> {
    await new Promise((r) => setTimeout(r, 40));
    const ordersObj = this.readOrders();
    // Unique orders (filter out UUID alias duplicates, keep primary orderNumber keys)
    const list: CheckoutOrderSnapshot[] = [];
    const seen = new Set<string>();

    for (const order of Object.values(ordersObj)) {
      if (order && order.orderNumber && !seen.has(order.orderNumber)) {
        seen.add(order.orderNumber);
        list.push(order);
      }
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }
}
