import type {
  IProcurementService,
  CreateProcurementRequest,
  ProcurementDetails,
  SupplierOffer,
  OfferSelectionResult,
  SupplierSummary,
} from '../api/procurementService';
import type { IProductService } from '../api/productService';
import { inrToPaise } from '../../lib/moneyUtils';
import { getProductPrimaryImageUrl } from '../../lib/imageUtils';

const STORAGE_KEY = 'patronet_procurement_requests_v1';

// Initial pre-seeded demo procurement request for default routes e.g. /procurement/PN-BULK-2026-4108/progress
const INITIAL_DEMO_REQUEST_ID = 'PN-BULK-2026-4108';

export class MockProcurementAdapter implements IProcurementService {
  private productService: IProductService;
  private submissionInFlight = false;

  constructor(productService: IProductService) {
    this.productService = productService;
    this.ensureInitialSeed();
  }

  private getStoredRequests(): Record<string, ProcurementDetails> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse stored procurement requests:', e);
    }
    return {};
  }

  private saveRequests(data: Record<string, ProcurementDetails>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save procurement requests:', e);
    }
  }

  private async ensureInitialSeed(): Promise<void> {
    const existing = this.getStoredRequests();
    if (!existing[INITIAL_DEMO_REQUEST_ID]) {
      // Seed initial Stitch mock request
      const demoDetails: ProcurementDetails = {
        id: INITIAL_DEMO_REQUEST_ID,
        title: 'Developer Fleet & Creative Workstations',
        customerType: 'business',
        organizationName: 'Acme Technologies Pvt Ltd',
        deliveryLocation: 'Mumbai Logistics Hub, Bandra Kurla Complex',
        preferredDeliveryDate: '2026-12-05',
        targetBudgetPaise: inrToPaise(1000000), // ₹10,00,000 target
        notes: 'Require GST tax invoice and delivery to Mumbai within 10 business days.',
        status: 'offers_received',
        items: [
          {
            productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // GameBook 15
            quantity: 10,
            productName: 'GameBook 15 (RTX 4050)',
            unitPricePaise: inrToPaise(94990),
            primaryImageUrl: '/images/products/gamebook-15.svg',
          },
          {
            productId: 'a12bc34d-56ef-7890-abcd-ef1234567890', // Studio ANC Headphones
            quantity: 10,
            productName: 'Studio ANC Headphones',
            unitPricePaise: inrToPaise(13999),
            primaryImageUrl: '/images/products/studio-headphones.svg',
          },
        ],
        catalogueSubtotalPaise: inrToPaise(94990 * 10 + 13999 * 10), // ₹10,89,890
        suppliers: [
          {
            id: 'sup-01',
            name: 'Apex Tech Distribution (Demo)',
            isVerified: true,
            status: 'offer_received',
            lastActivity: 'Today, 02:04 PM',
            notes: 'Verified OEM tier-1 authorized distributor',
          },
          {
            id: 'sup-02',
            name: 'Vanguard IT Solutions (Demo)',
            isVerified: true,
            status: 'counteroffer',
            lastActivity: 'Today, 02:08 PM',
            notes: 'Counteroffer on rapid 3-4 days dispatch',
          },
          {
            id: 'sup-03',
            name: 'Horizon Enterprise Systems (Demo)',
            isVerified: true,
            status: 'offer_received',
            lastActivity: 'Today, 01:52 PM',
            notes: 'Partial batch allocation (18 units available)',
          },
          {
            id: 'sup-04',
            name: 'Zenith Hardware Direct (Demo)',
            isVerified: true,
            status: 'in_negotiation',
            lastActivity: 'Today, 01:30 PM',
            notes: 'Awaiting supplier response',
          },
          {
            id: 'sup-05',
            name: 'Metro Commercial Electronics (Demo)',
            isVerified: false,
            status: 'no_response',
            lastActivity: 'Today, 01:30 PM',
            notes: 'No response received within timeout',
          },
        ],
        offers: [
          {
            id: 'off-apex-01',
            procurementId: INITIAL_DEMO_REQUEST_ID,
            supplierId: 'sup-01',
            supplierName: 'Apex Tech Distribution (Demo)',
            status: 'confirmed',
            offeredTotalPaise: inrToPaise(944000), // ₹9,44,000
            subtotalPaise: inrToPaise(800000),
            shippingPaise: inrToPaise(0), // Free delivery
            taxPaise: inrToPaise(144000), // 18% GST included
            isPriceComplete: true,
            totalUnitsOffered: 20,
            requestedUnits: 20,
            deliveryDaysEstimate: '5–7 business days',
            validUntil: '2026-12-01',
            paymentTerms: 'Net 30 with approved credit',
            warranty: '3-year onsite enterprise OEM warranty',
            badge: 'Lowest confirmed full-qty price',
            notes: 'Full quota allocated from primary warehouse.',
            lineItems: [
              {
                productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                productName: 'GameBook 15 (RTX 4050)',
                quantity: 10,
                quotedUnitPricePaise: inrToPaise(82500),
                quotedLineTotalPaise: inrToPaise(825000),
              },
              {
                productId: 'a12bc34d-56ef-7890-abcd-ef1234567890',
                productName: 'Studio ANC Headphones',
                quantity: 10,
                quotedUnitPricePaise: inrToPaise(11900),
                quotedLineTotalPaise: inrToPaise(119000),
              },
            ],
          },
          {
            id: 'off-vanguard-02',
            procurementId: INITIAL_DEMO_REQUEST_ID,
            supplierId: 'sup-02',
            supplierName: 'Vanguard IT Solutions (Demo)',
            status: 'counteroffer',
            offeredTotalPaise: inrToPaise(962000), // ₹9,62,000
            subtotalPaise: inrToPaise(815254),
            shippingPaise: inrToPaise(0),
            taxPaise: inrToPaise(146746),
            isPriceComplete: true,
            totalUnitsOffered: 20,
            requestedUnits: 20,
            deliveryDaysEstimate: '3–4 business days (Fast track)',
            validUntil: '2026-11-28',
            paymentTerms: '50% advance, 50% on delivery',
            warranty: '3-year standard enterprise warranty',
            badge: 'Fastest delivery option',
            notes: 'Priority air courier included for expedited deployment.',
            lineItems: [
              {
                productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                productName: 'GameBook 15 (RTX 4050)',
                quantity: 10,
                quotedUnitPricePaise: inrToPaise(84000),
                quotedLineTotalPaise: inrToPaise(840000),
              },
              {
                productId: 'a12bc34d-56ef-7890-abcd-ef1234567890',
                productName: 'Studio ANC Headphones',
                quantity: 10,
                quotedUnitPricePaise: inrToPaise(12200),
                quotedLineTotalPaise: inrToPaise(122000),
              },
            ],
          },
          {
            id: 'off-horizon-03',
            procurementId: INITIAL_DEMO_REQUEST_ID,
            supplierId: 'sup-03',
            supplierName: 'Horizon Enterprise Systems (Demo)',
            status: 'partial',
            offeredTotalPaise: inrToPaise(880200), // Partial: 18 units only
            subtotalPaise: inrToPaise(880200),
            shippingPaise: undefined, // Shipping not provided
            taxPaise: undefined, // Tax terms pending
            isPriceComplete: false,
            totalUnitsOffered: 18,
            requestedUnits: 20,
            deliveryDaysEstimate: 'Not provided',
            validUntil: '2026-11-30',
            paymentTerms: '100% advance wire transfer',
            warranty: '1-year dealer warranty',
            badge: 'Partial quantity quote',
            notes: 'Can only supply 8 units of GameBook 15. Shipping extra at actuals.',
            lineItems: [
              {
                productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
                productName: 'GameBook 15 (RTX 4050)',
                quantity: 8,
                quotedUnitPricePaise: inrToPaise(89000),
                quotedLineTotalPaise: inrToPaise(712000),
              },
              {
                productId: 'a12bc34d-56ef-7890-abcd-ef1234567890',
                productName: 'Studio ANC Headphones',
                quantity: 10,
                quotedUnitPricePaise: inrToPaise(16820),
                quotedLineTotalPaise: inrToPaise(168200),
              },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSimulatedDemo: true,
      };

      existing[INITIAL_DEMO_REQUEST_ID] = demoDetails;
      this.saveRequests(existing);
    }
  }

  async createRequest(request: CreateProcurementRequest): Promise<ProcurementDetails> {
    if (this.submissionInFlight) {
      throw new Error('Procurement submission is already in flight.');
    }
    this.submissionInFlight = true;

    try {
      await new Promise((r) => setTimeout(r, 300));

      // Validation
      if (!request.title || !request.title.trim()) {
        throw new Error('Please enter a procurement request title.');
      }
      if (!request.deliveryLocation || !request.deliveryLocation.trim()) {
        throw new Error('Please provide a delivery location.');
      }
      if (!request.items || request.items.length === 0) {
        throw new Error('Please add at least one catalogue product to your bulk request.');
      }

      // Check duplicates and validate quantities
      const seenProductIds = new Set<string>();
      let totalCataloguePaise = 0;
      const validatedItems = [];

      for (const item of request.items) {
        if (seenProductIds.has(item.productId)) {
          throw new Error('Duplicate products found in procurement items list.');
        }
        seenProductIds.add(item.productId);

        if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new Error(`Quantity for product must be a positive integer.`);
        }

        const product = await this.productService.getProductById(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} does not exist in catalogue.`);
        }

        const unitPaise = inrToPaise(product.price);
        totalCataloguePaise += unitPaise * item.quantity;

        validatedItems.push({
          productId: product.id,
          quantity: item.quantity,
          productName: product.name,
          unitPricePaise: unitPaise,
          primaryImageUrl: getProductPrimaryImageUrl(product),
        });
      }

      // Generate ID
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const newId = `PN-BULK-2026-${randomSuffix}`;

      // Build simulated suppliers & offers
      const suppliers: SupplierSummary[] = [
        {
          id: `sup-${randomSuffix}-1`,
          name: 'Apex Tech Distribution (Demo)',
          isVerified: true,
          status: 'offer_received',
          lastActivity: 'Just now',
          notes: 'Competitive full-volume tier quote',
        },
        {
          id: `sup-${randomSuffix}-2`,
          name: 'Vanguard IT Solutions (Demo)',
          isVerified: true,
          status: 'counteroffer',
          lastActivity: 'Just now',
          notes: 'Fast-track logistics quote',
        },
        {
          id: `sup-${randomSuffix}-3`,
          name: 'Horizon Enterprise Systems (Demo)',
          isVerified: true,
          status: 'offer_received',
          lastActivity: 'Just now',
          notes: 'Standard volume allotment',
        },
      ];

      const totalRequestedUnits = validatedItems.reduce((acc, it) => acc + it.quantity, 0);

      // Offer 1: 12% discount, full qty, complete price
      const offer1LineItems = validatedItems.map((v) => ({
        productId: v.productId,
        productName: v.productName,
        quantity: v.quantity,
        quotedUnitPricePaise: Math.round(v.unitPricePaise * 0.88),
        quotedLineTotalPaise: Math.round(v.unitPricePaise * 0.88) * v.quantity,
      }));
      const offer1SubtotalPaise = offer1LineItems.reduce((acc, it) => acc + it.quotedLineTotalPaise, 0);
      const offer1TaxPaise = Math.round(offer1SubtotalPaise * 0.18);
      const offer1TotalPaise = offer1SubtotalPaise + offer1TaxPaise;

      // Offer 2: 8% discount, fast delivery, full qty
      const offer2LineItems = validatedItems.map((v) => ({
        productId: v.productId,
        productName: v.productName,
        quantity: v.quantity,
        quotedUnitPricePaise: Math.round(v.unitPricePaise * 0.92),
        quotedLineTotalPaise: Math.round(v.unitPricePaise * 0.92) * v.quantity,
      }));
      const offer2SubtotalPaise = offer2LineItems.reduce((acc, it) => acc + it.quotedLineTotalPaise, 0);
      const offer2TaxPaise = Math.round(offer2SubtotalPaise * 0.18);
      const offer2TotalPaise = offer2SubtotalPaise + offer2TaxPaise;

      const offers: SupplierOffer[] = [
        {
          id: `off-${randomSuffix}-1`,
          procurementId: newId,
          supplierId: suppliers[0].id,
          supplierName: suppliers[0].name,
          status: 'confirmed',
          offeredTotalPaise: offer1TotalPaise,
          subtotalPaise: offer1SubtotalPaise,
          shippingPaise: 0,
          taxPaise: offer1TaxPaise,
          isPriceComplete: true,
          totalUnitsOffered: totalRequestedUnits,
          requestedUnits: totalRequestedUnits,
          deliveryDaysEstimate: '5–7 business days',
          validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          paymentTerms: 'Net 30 with approved credit',
          warranty: '3-year onsite enterprise OEM warranty',
          badge: 'Lowest confirmed full-qty price',
          notes: 'Includes pan-India logistics and GST input credit invoice.',
          lineItems: offer1LineItems,
        },
        {
          id: `off-${randomSuffix}-2`,
          procurementId: newId,
          supplierId: suppliers[1].id,
          supplierName: suppliers[1].name,
          status: 'counteroffer',
          offeredTotalPaise: offer2TotalPaise,
          subtotalPaise: offer2SubtotalPaise,
          shippingPaise: 0,
          taxPaise: offer2TaxPaise,
          isPriceComplete: true,
          totalUnitsOffered: totalRequestedUnits,
          requestedUnits: totalRequestedUnits,
          deliveryDaysEstimate: '2–3 business days (Express dispatch)',
          validUntil: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          paymentTerms: '50% advance, 50% upon delivery',
          warranty: '3-year standard manufacturer warranty',
          badge: 'Fastest delivery option',
          notes: 'Direct courier deployment via regional hub.',
          lineItems: offer2LineItems,
        },
      ];

      const newDetails: ProcurementDetails = {
        id: newId,
        title: request.title.trim(),
        customerType: request.customerType,
        organizationName: request.organizationName?.trim(),
        deliveryLocation: request.deliveryLocation.trim(),
        preferredDeliveryDate: request.preferredDeliveryDate,
        targetBudgetPaise: request.targetBudgetPaise,
        notes: request.notes?.trim(),
        status: 'offers_received',
        items: validatedItems,
        catalogueSubtotalPaise: totalCataloguePaise,
        suppliers,
        offers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSimulatedDemo: true,
      };

      const existing = this.getStoredRequests();
      existing[newId] = newDetails;
      this.saveRequests(existing);

      return newDetails;
    } finally {
      this.submissionInFlight = false;
    }
  }

  async getRequest(id: string): Promise<ProcurementDetails | null> {
    await this.ensureInitialSeed();
    const existing = this.getStoredRequests();
    return existing[id] || null;
  }

  async getProgress(id: string): Promise<ProcurementDetails | null> {
    return this.getRequest(id);
  }

  async getOffers(id: string): Promise<SupplierOffer[]> {
    const details = await this.getRequest(id);
    return details ? details.offers : [];
  }

  async selectOffer(procurementId: string, offerId: string): Promise<OfferSelectionResult> {
    await new Promise((r) => setTimeout(r, 250));
    const details = await this.getRequest(procurementId);
    if (!details) {
      throw new Error(`Procurement request ${procurementId} not found.`);
    }

    const offer = details.offers.find((o) => o.id === offerId);
    if (!offer) {
      throw new Error(`Offer ${offerId} not found under request ${procurementId}.`);
    }

    if (offer.status === 'expired') {
      throw new Error(`Offer ${offerId} has expired and cannot be selected.`);
    }

    details.selectedOfferId = offerId;
    details.status = 'completed';
    details.updatedAt = new Date().toISOString();

    const existing = this.getStoredRequests();
    existing[procurementId] = details;
    this.saveRequests(existing);

    return {
      success: true,
      procurementId,
      selectedOfferId: offerId,
      message: `Selected offer from ${offer.supplierName}. Proceeding to order review.`,
    };
  }
}
