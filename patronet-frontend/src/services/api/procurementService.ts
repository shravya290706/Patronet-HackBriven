export type CustomerType = 'individual' | 'business';

export type ProcurementStatus =
  | 'draft'
  | 'submitted'
  | 'negotiating'
  | 'offers_received'
  | 'completed'
  | 'cancelled';

export interface ProcurementLineItem {
  productId: string;
  quantity: number;
  productName?: string;
  unitPricePaise?: number;
  primaryImageUrl?: string;
}

export interface CreateProcurementRequest {
  title: string;
  customerType: CustomerType;
  organizationName?: string;
  deliveryLocation: string;
  preferredDeliveryDate?: string;
  targetBudgetPaise?: number;
  notes?: string;
  items: ProcurementLineItem[];
}

export interface SupplierSummary {
  id: string;
  name: string;
  isVerified: boolean;
  status: 'pending' | 'in_negotiation' | 'offer_received' | 'counteroffer' | 'declined' | 'no_response';
  lastActivity: string;
  notes?: string;
}

export interface OfferLineItem {
  productId: string;
  productName: string;
  quantity: number;
  quotedUnitPricePaise: number;
  quotedLineTotalPaise: number;
}

export interface SupplierOffer {
  id: string;
  procurementId: string;
  supplierId: string;
  supplierName: string;
  status: 'confirmed' | 'counteroffer' | 'partial' | 'expired';
  offeredTotalPaise: number;
  subtotalPaise: number;
  shippingPaise?: number; // undefined if not disclosed
  taxPaise?: number; // undefined if not disclosed
  isPriceComplete: boolean;
  totalUnitsOffered: number;
  requestedUnits: number;
  deliveryDaysEstimate: string;
  validUntil: string;
  paymentTerms: string;
  warranty: string;
  badge?: string;
  notes?: string;
  lineItems: OfferLineItem[];
}

export interface ProcurementDetails {
  id: string;
  title: string;
  customerType: CustomerType;
  organizationName?: string;
  deliveryLocation: string;
  preferredDeliveryDate?: string;
  targetBudgetPaise?: number;
  notes?: string;
  status: ProcurementStatus;
  items: ProcurementLineItem[];
  catalogueSubtotalPaise: number;
  suppliers: SupplierSummary[];
  offers: SupplierOffer[];
  selectedOfferId?: string;
  createdAt: string;
  updatedAt: string;
  isSimulatedDemo: boolean;
}

export interface OfferSelectionResult {
  success: boolean;
  procurementId: string;
  selectedOfferId: string;
  message: string;
}

export interface IProcurementService {
  createRequest(request: CreateProcurementRequest): Promise<ProcurementDetails>;
  getRequest(id: string): Promise<ProcurementDetails | null>;
  getProgress(id: string): Promise<ProcurementDetails | null>;
  getOffers(id: string): Promise<SupplierOffer[]>;
  selectOffer(procurementId: string, offerId: string): Promise<OfferSelectionResult>;
}
