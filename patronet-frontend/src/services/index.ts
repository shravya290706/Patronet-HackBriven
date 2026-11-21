import type { IProductService } from './api/productService';
import type { ICartService } from './api/cartService';
import type { ICheckoutService } from './api/checkoutService';
import type { IAuthService } from './api/authService';
import type { IWishlistService } from './api/wishlistService';
import { MockProductAdapter } from './adapters/mockProductAdapter';
import { RealProductAdapter } from './adapters/realProductAdapter';
import { MockCartAdapter } from './adapters/mockCartAdapter';
import { RealCartAdapter } from './adapters/realCartAdapter';
import { MockCheckoutAdapter } from './adapters/mockCheckoutAdapter';
import { RealCheckoutAdapter } from './adapters/realCheckoutAdapter';
import { MockAuthAdapter } from './adapters/mockAuthAdapter';
import { RealAuthAdapter } from './adapters/realAuthAdapter';
import { MockWishlistAdapter } from './adapters/mockWishlistAdapter';
import { RealWishlistAdapter } from './adapters/realWishlistAdapter';

const useMock = import.meta.env.VITE_USE_MOCK_API === 'true';

export const productService: IProductService = useMock
  ? new MockProductAdapter()
  : new RealProductAdapter();

export const cartService: ICartService = useMock
  ? new MockCartAdapter()
  : new RealCartAdapter();

export const checkoutService: ICheckoutService = useMock
  ? new MockCheckoutAdapter(productService)
  : new RealCheckoutAdapter();

export const authService: IAuthService = useMock
  ? new MockAuthAdapter()
  : new RealAuthAdapter();

export const wishlistService: IWishlistService = useMock
  ? new MockWishlistAdapter(productService)
  : new RealWishlistAdapter();

export * from './api/client';
export * from './api/productService';
export * from './api/cartService';
export * from './api/checkoutService';
export * from './api/authService';
export * from './api/wishlistService';
export * from './adapters/mockProductAdapter';
export * from './adapters/realProductAdapter';
export * from './adapters/mockCartAdapter';
export * from './adapters/realCartAdapter';
export * from './adapters/mockCheckoutAdapter';
export * from './adapters/realCheckoutAdapter';
export * from './adapters/mockAuthAdapter';
export * from './adapters/realAuthAdapter';
export * from './adapters/mockWishlistAdapter';
export * from './adapters/realWishlistAdapter';
