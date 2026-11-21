export interface AiComparisonRequest {
  productIds: string[];
  requirements: string;
}

export interface AiComparisonResponse {
  summary: string;
  recommendedProductId?: string;
  reasons: string[];
  tradeoffs: string[];
  missingInformation?: string[];
  mode: 'mock' | 'live';
}

export interface IAiComparisonService {
  compareProducts(request: AiComparisonRequest): Promise<AiComparisonResponse>;
}
