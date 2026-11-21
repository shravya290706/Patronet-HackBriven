import type {
  IAiShoppingService,
  AiShoppingRequest,
  AiShoppingResponse,
  AiShoppingRecommendation,
} from '../api/aiShoppingService';
import type { IProductService } from '../api/productService';
import type { Product } from '../../types';

export class MockAiShoppingAdapter implements IAiShoppingService {
  private productService: IProductService;

  constructor(productService: IProductService) {
    this.productService = productService;
  }

  async sendMessage(request: AiShoppingRequest): Promise<AiShoppingResponse> {
    // Simulate natural processing delay
    await new Promise((r) => setTimeout(r, 450));

    const rawQuery = request.message || '';
    const query = rawQuery.trim().toLowerCase();

    // Check for empty or whitespace query
    if (!query) {
      return {
        message: 'Please tell me what electronic devices, specifications, or budget you are looking for, and I will recommend the best options for you.',
        recommendations: [],
        understoodCriteria: [],
        suggestedFollowUps: [
          'Looking for a coding laptop under ₹80,000',
          'Best wireless headphones with ANC',
          'Mechanical keyboard for typing',
          '4K monitor for creator setup',
        ],
        mode: 'mock',
      };
    }

    const historyText = (request.history || []).map((h) => h.content.toLowerCase()).join(' ');
    const combinedContext = `${historyText} ${query}`;

    // 1. Parse Budget / Max Price
    let maxPrice = request.filters?.maxPrice;
    const pricePatterns = [
      /under\s*₹?\s*(\d+[\d,]*)/i,
      /below\s*₹?\s*(\d+[\d,]*)/i,
      /budget\s*of\s*₹?\s*(\d+[\d,]*)/i,
      /less\s*than\s*₹?\s*(\d+[\d,]*)/i,
      /₹\s*(\d+[\d,]*)/i,
    ];

    for (const pat of pricePatterns) {
      const match = query.match(pat);
      if (match && match[1]) {
        const val = parseInt(match[1].replace(/,/g, ''), 10);
        if (!isNaN(val) && val > 0) {
          maxPrice = val;
          break;
        }
      }
    }

    // 2. Detect Category / Modality
    let targetCategory = request.filters?.category?.toLowerCase();
    if (!targetCategory) {
      if (combinedContext.includes('laptop') || combinedContext.includes('macbook') || combinedContext.includes('notebook')) {
        targetCategory = 'laptops';
      } else if (combinedContext.includes('headphone') || combinedContext.includes('earphone') || combinedContext.includes('audio') || combinedContext.includes('music')) {
        targetCategory = 'audio';
      } else if (combinedContext.includes('monitor') || combinedContext.includes('display') || combinedContext.includes('screen')) {
        targetCategory = 'monitors';
      } else if (combinedContext.includes('watch') || combinedContext.includes('wearable') || combinedContext.includes('fitness')) {
        targetCategory = 'wearables';
      } else if (combinedContext.includes('keyboard') || combinedContext.includes('mouse') || combinedContext.includes('accessories') || combinedContext.includes('desk')) {
        targetCategory = 'accessories';
      } else if (combinedContext.includes('game') || combinedContext.includes('controller') || combinedContext.includes('gaming')) {
        targetCategory = 'gaming';
      }
    }

    // 3. Fetch products from catalogue
    const allProducts = await this.productService.getProducts();

    // 4. Score and filter products
    interface ScoredProduct {
      product: Product;
      score: number;
      highlights: string[];
      reason: string;
    }

    const scored: ScoredProduct[] = [];

    for (const p of allProducts) {
      const pCat = String(p.category?.name || p.specifications?.Category || '').toLowerCase();
      const pName = p.name.toLowerCase();
      const pDesc = (p.description + ' ' + (p.shortDescription || '')).toLowerCase();
      const pSpecs = Object.entries(p.specifications || {}).map(([k, v]) => `${k}: ${v}`.toLowerCase()).join(' ');

      // Filter by category if one was detected
      if (targetCategory && !pCat.includes(targetCategory) && !pName.includes(targetCategory)) {
        // Exception: Gaming laptops match both laptops & gaming queries
        if (targetCategory === 'gaming' && pCat.includes('laptop') && (pName.includes('game') || pSpecs.includes('rtx'))) {
          // Allow gaming laptops
        } else {
          continue;
        }
      }

      // Check max price
      if (maxPrice !== undefined && p.price > maxPrice) {
        continue;
      }

      let score = 10;
      const highlights: string[] = [];

      // Keyword bonuses
      if (query.includes('battery') || query.includes('all-day')) {
        if (p.subtitle?.toLowerCase().includes('battery') || pName.includes('airbook') || pSpecs.includes('oled')) {
          score += 15;
          highlights.push('Exceptional battery endurance for extended sessions');
        }
      }

      if (query.includes('game') || query.includes('gaming') || query.includes('rtx')) {
        if (pSpecs.includes('rtx') || pSpecs.includes('geforce') || pName.includes('gamebook') || pCat.includes('gaming')) {
          score += 20;
          highlights.push('Dedicated GPU & high-refresh display tuned for gaming');
        }
      }

      if (query.includes('code') || query.includes('program') || query.includes('develop') || query.includes('ml') || query.includes('machine learning')) {
        if (pSpecs.includes('32gb') || pSpecs.includes('16gb') || pSpecs.includes('core i7') || pSpecs.includes('ultra 7')) {
          score += 15;
          highlights.push('High-capacity RAM & multi-threaded CPU for compiler and container workloads');
        }
      }

      if (query.includes('anc') || query.includes('noise') || query.includes('meeting') || query.includes('call')) {
        if (pName.includes('anc') || pDesc.includes('noise')) {
          score += 25;
          highlights.push('Active Noise Cancellation for distraction-free focus');
        }
      }

      if (query.includes('cheap') || query.includes('budget') || query.includes('affordable')) {
        score += Math.max(0, Math.floor((100000 - p.price) / 5000));
        highlights.push(`Competitive value at ₹${p.price.toLocaleString('en-IN')}`);
      }

      if (highlights.length === 0) {
        if (p.specifications?.Processor) {
          highlights.push(`${p.specifications.Processor} with ${p.specifications.Memory || 'fast memory'}`);
        }
        if (p.specifications?.Display) {
          highlights.push(`${p.specifications.Display}`);
        }
        highlights.push(maxPrice ? `Within your ₹${maxPrice.toLocaleString('en-IN')} budget` : 'Available in stock with Pan-India dispatch');
      }

      let reason = `Recommended based on your requirements for ${targetCategory || 'computing hardware'}.`;
      if (highlights[0]) {
        reason = highlights[0];
      }

      scored.push({
        product: p,
        score,
        highlights: highlights.slice(0, 3),
        reason,
      });
    }

    // Sort by score descending, then by price
    scored.sort((a, b) => b.score - a.score || a.product.price - b.product.price);
    const topMatches = scored.slice(0, 3);

    // 5. Construct understood criteria chips
    const understoodCriteria: Array<{ label: string; value: string }> = [];
    if (targetCategory) {
      understoodCriteria.push({
        label: 'Category',
        value: targetCategory.charAt(0).toUpperCase() + targetCategory.slice(1),
      });
    }
    if (maxPrice !== undefined) {
      understoodCriteria.push({
        label: 'Budget',
        value: `Under ₹${maxPrice.toLocaleString('en-IN')}`,
      });
    }
    if (query.includes('battery')) {
      understoodCriteria.push({ label: 'Priority', value: 'Battery life' });
    }
    if (query.includes('gaming') || query.includes('game')) {
      understoodCriteria.push({ label: 'Usage', value: 'Gaming' });
    }
    if (query.includes('program') || query.includes('coding') || query.includes('ml')) {
      understoodCriteria.push({ label: 'Primary use', value: 'Programming & Work' });
    }
    if (query.includes('noise') || query.includes('anc')) {
      understoodCriteria.push({ label: 'Feature', value: 'Active Noise Cancellation' });
    }

    // 6. Handle no match scenario
    if (topMatches.length === 0) {
      return {
        message: maxPrice
          ? `We could not find any products in our catalogue under ₹${maxPrice.toLocaleString('en-IN')}. Please try increasing your budget or adjusting your specifications.`
          : 'We could not find any products in our catalogue matching your exact criteria. Please try broadening your request or adjusting your requirements.',
        recommendations: [],
        understoodCriteria,
        suggestedFollowUps: [
          'Show all laptops',
          'Show audio gear under ₹15,000',
          'Explore gaming controllers',
          'Reset requirements',
        ],
        mode: 'mock',
      };
    }

    // 7. Dynamic follow-up prompts
    const followUps: string[] = [];
    if (targetCategory === 'laptops') {
      followUps.push('Show options with better battery life.');
      followUps.push('Show budget options under ₹70,000.');
      followUps.push('Which is best for gaming vs coding?');
    } else if (targetCategory === 'audio') {
      followUps.push('How long is the battery playback?');
      followUps.push('Does it support multi-device pairing?');
    } else {
      followUps.push('Show cheaper alternatives.');
      followUps.push('What are the key technical specifications?');
    }

    const recommendations: AiShoppingRecommendation[] = topMatches.map((item) => ({
      productId: item.product.id,
      reason: item.reason,
      highlights: item.highlights,
      matchScore: Math.min(99, Math.max(70, Math.round(item.score * 2.5))),
    }));

    const responseMessage = `Here are ${recommendations.length} curated options from our catalogue matching your preferences:`;

    return {
      message: responseMessage,
      recommendations,
      understoodCriteria,
      suggestedFollowUps: followUps,
      mode: 'mock',
    };
  }
}
