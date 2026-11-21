export interface AiShoppingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recommendations?: Array<{
    productId: string;
    reason: string;
    highlights?: string[];
    matchScore?: number;
  }>;
  understoodCriteria?: Array<{
    label: string;
    value: string;
  }>;
  suggestedFollowUps?: string[];
}

export interface AiShoppingRequest {
  message: string;
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  filters?: {
    category?: string;
    maxPrice?: number;
    minPrice?: number;
  };
}

export interface AiShoppingRecommendation {
  productId: string;
  reason: string;
  highlights?: string[];
  matchScore?: number;
}

export interface AiShoppingResponse {
  message: string;
  recommendations: AiShoppingRecommendation[];
  understoodCriteria?: Array<{
    label: string;
    value: string;
  }>;
  suggestedFollowUps?: string[];
  mode: 'mock' | 'live';
}

export interface IAiShoppingService {
  sendMessage(request: AiShoppingRequest): Promise<AiShoppingResponse>;
}
