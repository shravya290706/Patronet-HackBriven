import { apiClient } from '../api/client';

export interface ProductRecommendationItem {
  id: string;
  name: string;
  description?: string | null;
  brand?: string | null;
  sku: string;
  price: number;
  is_active: boolean;
  category?: { id: string; name: string } | null;
  primary_image_url?: string | null;
  match_reason?: string | null;
  key_specs?: Record<string, unknown> | null;
}

export interface AssistantChatResponse {
  reply: string;
  recommendations: ProductRecommendationItem[];
  suggested_queries: string[];
  intent?: string | null;
  detected_category?: string | null;
  detected_budget?: number | null;
  is_ai_powered?: boolean;
  model_used?: string | null;
}

export class AssistantService {
  async chat(
    message: string,
    history: { role: string; content: string }[] = []
  ): Promise<AssistantChatResponse> {
    return apiClient<AssistantChatResponse>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  }

  async getSuggestions(): Promise<string[]> {
    return apiClient<string[]>('/assistant/suggestions');
  }
}

export const assistantService = new AssistantService();
