import type {
  IAiShoppingService,
  AiShoppingRequest,
  AiShoppingResponse,
} from '../api/aiShoppingService';
import { apiClient } from '../api/client';

/**
 * RealAiShoppingAdapter
 * Explicit integration boundary for FastAPI AI recommendations backend.
 * Proposed endpoint: POST /api/v1/ai/shopping/recommend
 *
 * NOTE: The backend route is not yet connected. When the teammate implements
 * Gemini orchestration and PostgreSQL/OpenSearch retrieval, this adapter
 * will issue real requests.
 */
export class RealAiShoppingAdapter implements IAiShoppingService {
  async sendMessage(request: AiShoppingRequest): Promise<AiShoppingResponse> {
    try {
      const response = await apiClient<AiShoppingResponse>(
        '/ai/shopping/recommend',
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
      return {
        ...response,
        mode: 'live',
      };
    } catch (err) {
      // Do not silently fallback to mock mode; propagate explicit backend error with cause
      const message = err instanceof Error ? err.message : 'Backend AI recommendation service is unreachable.';
      throw new Error(`RealAiShoppingAdapter Error: ${message}`, { cause: err });
    }
  }
}
