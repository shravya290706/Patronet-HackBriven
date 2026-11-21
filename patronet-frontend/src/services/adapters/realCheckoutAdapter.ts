import type {
  ICheckoutService,
  CheckoutInput,
  CheckoutResult,
  CheckoutOrderSnapshot,
  CheckoutValidationResult,
  ShippingAddressInput,
} from '../api/checkoutService';
import type { CartModel } from '../api/cartService';

/**
 * RealCheckoutAdapter
 * Explicit integration boundary for FastAPI backend checkout endpoints.
 * In production, this calls POST /api/v1/checkout or /orders endpoints.
 */
export class RealCheckoutAdapter implements ICheckoutService {
  validateShippingAddress(address: Partial<ShippingAddressInput>): CheckoutValidationResult {
    const errors: Record<string, string> = {};
    if (!address.fullName?.trim()) errors.fullName = 'Full name is required.';
    if (!address.phone?.trim()) errors.phone = 'Phone number is required.';
    if (!address.line1?.trim()) errors.line1 = 'Address line is required.';
    if (!address.city?.trim()) errors.city = 'City is required.';
    if (!address.state?.trim()) errors.state = 'State is required.';
    if (!address.pincode?.trim()) errors.pincode = 'Pincode is required.';

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  async createOrder(_input: CheckoutInput, _cartSnapshot: CartModel): Promise<CheckoutResult> {
    throw new Error('RealCheckoutAdapter: Backend checkout endpoint not yet connected.');
  }

  async getOrderById(_orderId: string): Promise<CheckoutOrderSnapshot | null> {
    throw new Error('RealCheckoutAdapter: Backend order endpoint not yet connected.');
  }

  async getOrders(): Promise<CheckoutOrderSnapshot[]> {
    throw new Error('RealCheckoutAdapter: Backend orders endpoint not yet connected.');
  }
}
