/**
 * Core Data Contracts for PATRONET Frontend
 * Provisional frontend data contracts aligned with PostgreSQL schema concepts.
 * 
 * Important Rules:
 * - PostgreSQL UUID values are represented as strings.
 * - products.specifications is JSONB and supports dynamic category-specific attributes.
 * - Product images belong to a separate table/entity.
 * - Inventory is store/warehouse specific.
 * - Product availability must not be inferred solely from is_active.
 * - customers.password_hash must NEVER appear in frontend customer types.
 * - Prices and totals use standard number (INR) or formatted currency strings.
 */

export interface ProductImage {
  id: string; // UUID
  productId: string; // UUID
  url: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Category {
  id: string; // UUID
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  isActive: boolean;
}

export interface InventoryAvailability {
  storeId?: string;
  storeName?: string;
  warehouseCode?: string;
  quantityOnHand: number;
  quantityReserved: number;
  isAvailable: boolean; // Computed from stock & business rules, not just is_active
  leadTimeDays?: number;
}

export interface Product {
  id: string; // UUID
  sku: string;
  name: string;
  subtitle?: string;
  slug: string;
  brand: string;
  categoryId: string;
  category?: Category;
  description: string;
  shortDescription?: string;
  price: number; // INR numeric value
  compareAtPrice?: number | null;
  isActive: boolean;
  specifications: Record<string, string | number | boolean | string[]>; // JSONB flexible attributes
  images: ProductImage[];
  inventory?: InventoryAvailability[];
  primaryImage?: string;
  badge?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductSortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

export interface ProductQuery {
  search?: string;
  category?: string;
  categories?: string[];
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: ProductSortOption;
  page?: number;
  pageSize?: number;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Address {
  id: string; // UUID
  customerId?: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefaultBilling: boolean;
  isDefaultShipping: boolean;
  gstNumber?: string;
}

export interface CustomerProfile {
  id: string; // UUID
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
  gstin?: string; // For B2B / bulk procurement
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
  // NOTE: password_hash is strictly forbidden in frontend customer response contracts
}

export interface CartItem {
  id: string; // UUID
  cartId: string; // UUID
  productId: string; // UUID
  product?: Product;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
}

export interface Cart {
  id: string; // UUID
  customerId?: string | null;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  taxTotal: number;
  estimatedShipping: number;
  grandTotal: number;
  currency: string; // default "INR"
  updatedAt: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  id: string; // UUID
  orderId: string; // UUID
  productId: string; // UUID
  productTitle: string;
  productSku: string;
  productImageUrl?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string; // UUID
  orderNumber: string; // e.g. "PN-2026-8942"
  customerId: string; // UUID
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  subtotal: number;
  taxTotal: number;
  shippingCost: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'authorized' | 'paid' | 'failed';
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

// B2B Bulk Procurement Provisional Types
export interface ProcurementRequest {
  id: string; // UUID
  rfqNumber: string; // e.g. "PN-BULK-2026-4108"
  customerId: string;
  companyName: string;
  gstNumber: string;
  targetCategory: string;
  unitsRequested: number;
  targetBudgetPerUnit?: number;
  status: 'draft' | 'submitted' | 'matching_suppliers' | 'quotes_received' | 'accepted' | 'declined';
  notes?: string;
  createdAt: string;
}

export interface SupplierOffer {
  id: string; // UUID
  rfqId: string;
  supplierName: string;
  unitPrice: number;
  totalPrice: number;
  deliveryDays: number;
  gstIncluded: boolean;
  warrantyYears: number;
  score: number; // AI score or match %
  isRecommended?: boolean;
}
