import type {
  IAiComparisonService,
  AiComparisonRequest,
  AiComparisonResponse,
} from '../api/aiComparisonService';
import { apiClient } from '../api/client';

/**
 * RealAiComparisonAdapter
 * Explicit integration boundary for FastAPI AI Product Comparison endpoint.
 * Proposed endpoint: POST /api/v1/ai/comparison/recommend
 *
 * NOTE: The backend route is not yet connected. When the backend team implements
 * the Gemini orchestration service, this adapter will issue real requests.
 */
export class RealAiComparisonAdapter implements IAiComparisonService {
  async compareProducts(request: AiComparisonRequest): Promise<AiComparisonResponse> {
    try {
      const response = await apiClient<AiComparisonResponse>(
        '/ai/comparison/recommend',
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      // Validate response structure and ensure recommendedProductId is among requested products
      if (response.recommendedProductId && !request.productIds.includes(response.recommendedProductId)) {
        throw new Error('Backend returned a recommended product ID that was not in the comparison set.');
      }

      return {
        ...response,
        mode: 'live',
      };
    } catch (err) {
      // Do not silently fallback to mock mode; propagate explicit error with cause
      const message = err instanceof Error ? err.message : 'Backend AI comparison service is unreachable.';
      throw new Error(`RealAiComparisonAdapter Error: ${message}`, { cause: err });
    }
  }
}
