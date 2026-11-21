import { apiClient } from '../api/client';

export interface NegotiationMessage {
  sender: 'customer' | 'seller' | string;
  offer?: number | null;
  counter_offer?: number | null;
  message: string;
  timestamp: string;
}

export interface NegotiationSessionModel {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image_url?: string | null;
  original_price: number;
  current_offer?: number | null;
  counter_offer?: number | null;
  agreed_price?: number | null;
  status: 'active' | 'counteroffer' | 'accepted' | 'rejected' | 'expired' | string;
  round_number: number;
  max_rounds: number;
  history: NegotiationMessage[];
  reasoning?: string | null;
  is_ai_powered?: boolean;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export class NegotiationService {
  /**
   * Start a new price negotiation session for a product.
   */
  async startNegotiation(productId: string, initialOffer?: number): Promise<NegotiationSessionModel> {
    const payload: Record<string, unknown> = { product_id: productId };
    if (initialOffer !== undefined) {
      payload.initial_offer = initialOffer;
    }
    return apiClient<NegotiationSessionModel>('/negotiations/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Fetch an existing negotiation session state and history.
   */
  async getNegotiation(sessionId: string): Promise<NegotiationSessionModel> {
    return apiClient<NegotiationSessionModel>(`/negotiations/${sessionId}`);
  }

  /**
   * Submit a customer's offer.
   */
  async submitOffer(sessionId: string, offer: number): Promise<NegotiationSessionModel> {
    return apiClient<NegotiationSessionModel>(`/negotiations/${sessionId}/offer`, {
      method: 'POST',
      body: JSON.stringify({ offer }),
    });
  }

  /**
   * Accept the seller's counteroffer.
   */
  async acceptCounteroffer(sessionId: string): Promise<NegotiationSessionModel> {
    return apiClient<NegotiationSessionModel>(`/negotiations/${sessionId}/accept-counter`, {
      method: 'POST',
    });
  }
}

export const negotiationService = new NegotiationService();
