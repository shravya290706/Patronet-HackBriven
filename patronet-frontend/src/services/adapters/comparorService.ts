import { apiClient } from '../api/client';

export interface ComparorProductAnalysis {
  id: string;
  name: string;
  target_persona: string;
  pros: string[];
  cons: string[];
  value_score: number;
  key_differentiator: string;
}

export interface ComparorAnalysisResponse {
  product_analyses: ComparorProductAnalysis[];
  verdict: string;
  tradeoffs: string[];
  recommended_for_persona: Record<string, string>;
  is_ai_powered: boolean;
  model_used?: string | null;
}

export interface ComparorAnalysisRequest {
  product_ids: string[];
  context?: string | null;
}

class ComparorService {
  async analyze(productIds: string[], context?: string): Promise<ComparorAnalysisResponse> {
    return apiClient<ComparorAnalysisResponse>('/comparor/analyze', {
      method: 'POST',
      body: JSON.stringify({
        product_ids: productIds,
        context: context || null,
      }),
    });
  }
}

export const comparorService = new ComparorService();
