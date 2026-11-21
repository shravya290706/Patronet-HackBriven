import type {
  IProcurementService,
  CreateProcurementRequest,
  ProcurementDetails,
  SupplierOffer,
  OfferSelectionResult,
} from '../api/procurementService';
import { apiClient } from '../api/client';

/**
 * RealProcurementAdapter
 * Explicit integration boundary for FastAPI Bulk Procurement & Negotiation backend.
 *
 * PROPOSED ENDPOINTS — REQUIRES BACKEND IMPLEMENTATION:
 * - POST /api/v1/procurement/requests
 * - GET /api/v1/procurement/requests/:id
 * - GET /api/v1/procurement/requests/:id/progress
 * - GET /api/v1/procurement/requests/:id/offers
 * - POST /api/v1/procurement/requests/:id/offers/:offerId/select
 */
export class RealProcurementAdapter implements IProcurementService {
  async createRequest(request: CreateProcurementRequest): Promise<ProcurementDetails> {
    try {
      return await apiClient<ProcurementDetails>('/procurement/requests', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit procurement request to backend.';
      throw new Error(`RealProcurementAdapter Error: ${msg}`, { cause: err });
    }
  }

  async getRequest(id: string): Promise<ProcurementDetails | null> {
    try {
      return await apiClient<ProcurementDetails>(`/procurement/requests/${id}`);
    } catch (err) {
      console.warn('RealProcurementAdapter getRequest failed:', err);
      return null;
    }
  }

  async getProgress(id: string): Promise<ProcurementDetails | null> {
    try {
      return await apiClient<ProcurementDetails>(`/procurement/requests/${id}/progress`);
    } catch (err) {
      console.warn('RealProcurementAdapter getProgress failed:', err);
      return null;
    }
  }

  async getOffers(id: string): Promise<SupplierOffer[]> {
    try {
      return await apiClient<SupplierOffer[]>(`/procurement/requests/${id}/offers`);
    } catch (err) {
      console.warn('RealProcurementAdapter getOffers failed:', err);
      return [];
    }
  }

  async selectOffer(procurementId: string, offerId: string): Promise<OfferSelectionResult> {
    try {
      return await apiClient<OfferSelectionResult>(
        `/procurement/requests/${procurementId}/offers/${offerId}/select`,
        {
          method: 'POST',
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to select offer on backend.';
      throw new Error(`RealProcurementAdapter Error: ${msg}`, { cause: err });
    }
  }
}
