import type { IProductService } from './api/productService';
import type { ICartService } from './api/cartService';
import type { ICheckoutService } from './api/checkoutService';
import type { IAuthService } from './api/authService';
import type { IWishlistService } from './api/wishlistService';
import type { IAiShoppingService } from './api/aiShoppingService';
import type { IAiComparisonService } from './api/aiComparisonService';
import type { IProcurementService } from './api/procurementService';
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
import { MockAiShoppingAdapter } from './adapters/mockAiShoppingAdapter';
import { RealAiShoppingAdapter } from './adapters/realAiShoppingAdapter';
import { MockAiComparisonAdapter } from './adapters/mockAiComparisonAdapter';
import { RealAiComparisonAdapter } from './adapters/realAiComparisonAdapter';
import { MockProcurementAdapter } from './adapters/mockProcurementAdapter';
import { RealProcurementAdapter } from './adapters/realProcurementAdapter';

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

export const aiShoppingService: IAiShoppingService = useMock
  ? new MockAiShoppingAdapter(productService)
  : new RealAiShoppingAdapter();

export const aiComparisonService: IAiComparisonService = useMock
  ? new MockAiComparisonAdapter(productService)
  : new RealAiComparisonAdapter();

export const procurementService: IProcurementService = useMock
  ? new MockProcurementAdapter(productService)
  : new RealProcurementAdapter();

export * from './api/client';
export * from './api/productService';
export * from './api/cartService';
export * from './api/checkoutService';
export * from './api/authService';
export * from './api/wishlistService';
export * from './api/aiShoppingService';
export * from './api/aiComparisonService';
export * from './api/procurementService';
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
export * from './adapters/mockAiShoppingAdapter';
export * from './adapters/realAiShoppingAdapter';
export * from './adapters/mockAiComparisonAdapter';
export * from './adapters/realAiComparisonAdapter';
export * from './adapters/mockProcurementAdapter';
export * from './adapters/realProcurementAdapter';
