import type {
  IAiComparisonService,
  AiComparisonRequest,
  AiComparisonResponse,
} from '../api/aiComparisonService';
import type { IProductService } from '../api/productService';
import type { Product } from '../../types';

export class MockAiComparisonAdapter implements IAiComparisonService {
  private productService: IProductService;

  constructor(productService: IProductService) {
    this.productService = productService;
  }

  async compareProducts(request: AiComparisonRequest): Promise<AiComparisonResponse> {
    // Simulate brief processing latency
    await new Promise((r) => setTimeout(r, 400));

    const productIds = request.productIds || [];
    const requirements = (request.requirements || '').trim().toLowerCase();

    if (productIds.length === 0) {
      return {
        summary: 'No products were selected for comparison. Please choose up to three products.',
        reasons: [],
        tradeoffs: [],
        missingInformation: ['No product IDs provided in request.'],
        mode: 'mock',
      };
    }

    if (productIds.length === 1) {
      const single = await this.productService.getProductById(productIds[0]);
      return {
        summary: single
          ? `Currently only 1 product (${single.name}) is selected. Add at least one more product to compare trade-offs.`
          : 'Selected product not found in catalogue.',
        recommendedProductId: single?.id,
        reasons: single ? [`Currently looking at ${single.name} priced at ₹${single.price.toLocaleString('en-IN')}`] : [],
        tradeoffs: ['Cannot compare trade-offs with only one product selected.'],
        missingInformation: ['Requires a second product to perform side-by-side analysis.'],
        mode: 'mock',
      };
    }

    // Retrieve genuine products
    const products: Product[] = [];
    for (const id of productIds) {
      const prod = await this.productService.getProductById(id);
      if (prod) {
        products.push(prod);
      }
    }

    if (products.length === 0) {
      return {
        summary: 'None of the selected products could be located in the catalogue.',
        reasons: [],
        tradeoffs: [],
        missingInformation: ['Selected product IDs do not match active catalogue items.'],
        mode: 'mock',
      };
    }

    // Check if products span different categories
    const categories = new Set(products.map((p) => p.category?.name || p.categoryId || (p.specifications && p.specifications['Category'])));
    const isCrossCategory = categories.size > 1;

    // Parse budget from requirements (e.g. "under ₹80,000", "below 70000", etc.)
    let maxBudget: number | undefined;
    const budgetMatch = requirements.match(/(?:under|below|budget of|less than|within)\s*₹?\s*(\d+[\d,]*)/i);
    if (budgetMatch && budgetMatch[1]) {
      const parsed = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) {
        maxBudget = parsed;
      }
    }

    // Detect priority keywords
    const wantsGaming = requirements.includes('game') || requirements.includes('gaming') || requirements.includes('gpu') || requirements.includes('graphics');
    const wantsBatteryOrPortability = requirements.includes('battery') || requirements.includes('portab') || requirements.includes('travel') || requirements.includes('light');
    const wantsCodingOrDev = requirements.includes('cod') || requirements.includes('program') || requirements.includes('dev') || requirements.includes('software') || requirements.includes('ml') || requirements.includes('machine learning');
    const wantsValue = requirements.includes('value') || requirements.includes('budget') || requirements.includes('cheap') || requirements.includes('affordable') || maxBudget !== undefined;
    const wantsDisplay = requirements.includes('display') || requirements.includes('screen') || requirements.includes('oled') || requirements.includes('creator') || requirements.includes('color');

    // Score products based strictly on verified catalogue data
    type ScoredProduct = {
      product: Product;
      score: number;
      reasons: string[];
      tradeoffs: string[];
    };

    const scored: ScoredProduct[] = products.map((product) => {
      let score = 0;
      const reasons: string[] = [];
      const tradeoffs: string[] = [];
      const specs = product.specifications || {};

      // 1. Budget check
      if (maxBudget !== undefined) {
        if (product.price <= maxBudget) {
          score += 30;
          reasons.push(`Priced at ₹${product.price.toLocaleString('en-IN')}, within your ₹${maxBudget.toLocaleString('en-IN')} budget`);
        } else {
          score -= 25;
          tradeoffs.push(`Priced at ₹${product.price.toLocaleString('en-IN')}, which exceeds your ₹${maxBudget.toLocaleString('en-IN')} budget`);
        }
      }

      // 2. Gaming / GPU
      if (wantsGaming) {
        const hasDedicatedGpu = specs['Graphics'] && String(specs['Graphics']).toLowerCase().includes('rtx');
        if (hasDedicatedGpu) {
          score += 25;
          reasons.push(`Includes dedicated GPU (${String(specs['Graphics'])}) suitable for gaming and GPU compute`);
        } else {
          tradeoffs.push('Lacks a high-performance dedicated RTX GPU for demanding 3D games');
        }
      }

      // 3. Coding / Performance
      if (wantsCodingOrDev) {
        const mem = specs['Memory'] ? String(specs['Memory']) : '';
        const proc = specs['Processor'] ? String(specs['Processor']) : '';
        if (mem.includes('32GB')) {
          score += 25;
          reasons.push('Features 32GB RAM, optimal for intensive compile times, Docker containers, and local models');
        } else if (mem.includes('16GB')) {
          score += 15;
          reasons.push('Features 16GB RAM, handling general programming and multitasking with ease');
        }
        if (proc) {
          reasons.push(`Powered by ${proc}`);
        }
      }

      // 4. Portability / Weight
      if (wantsBatteryOrPortability) {
        const weight = specs['Weight'] ? String(specs['Weight']) : '';
        const weightNum = parseFloat(weight);
        if (!isNaN(weightNum) && weightNum <= 1.5) {
          score += 20;
          reasons.push(`Ultra-portable chassis weighing only ${weight}`);
        } else if (!isNaN(weightNum) && weightNum > 1.9) {
          tradeoffs.push(`Heavier chassis (${weight}) compared to ultraportables`);
        }
      }

      // 5. Display
      if (wantsDisplay) {
        const display = specs['Display'] ? String(specs['Display']) : '';
        if (display.toLowerCase().includes('oled') || display.toLowerCase().includes('4k') || display.toLowerCase().includes('165hz') || display.toLowerCase().includes('ips')) {
          score += 15;
          reasons.push(`Equipped with high-grade ${display}`);
        }
      }

      // 6. Value for money (cheaper product gets mild points when user asks for value)
      if (wantsValue) {
        const lowestPrice = Math.min(...products.map((p) => p.price));
        if (product.price === lowestPrice) {
          score += 15;
          reasons.push(`Lowest initial cost in this comparison at ₹${product.price.toLocaleString('en-IN')}`);
        }
      }

      // Baseline score from price tier if no explicit keywords matched
      if (reasons.length === 0) {
        reasons.push(`Priced at ₹${product.price.toLocaleString('en-IN')}`);
      }

      return { product, score, reasons, tradeoffs };
    });

    // Check if we have enough distinct criteria to recommend a clear winner
    scored.sort((a, b) => b.score - a.score);
    const top = scored[0];
    const second = scored[1];

    const missingInformation: string[] = [];
    if (!requirements) {
      missingInformation.push('No specific requirements were provided; consider stating your use case (e.g. coding, gaming, budget).');
    }
    if (isCrossCategory) {
      missingInformation.push('Comparison includes products from different categories; direct technical comparison may be limited.');
    }

    // If no requirements given or exact tie with 0 score
    if (!requirements || (top.score === second?.score && top.score === 0)) {
      return {
        summary: `Comparing ${products.map((p) => p.name).join(' vs ')}. Specify your workflow priorities or target budget to receive an evidence-based recommendation.`,
        recommendedProductId: undefined,
        reasons: products.map((p) => `${p.name}: ₹${p.price.toLocaleString('en-IN')}`),
        tradeoffs: isCrossCategory ? ['Products belong to different hardware categories.'] : ['Specifications differ across price points.'],
        missingInformation: missingInformation.length > 0 ? missingInformation : undefined,
        mode: 'mock',
      };
    }

    // We have a winner
    const summary = `${top.product.name} is the best match for your priorities (${requirements}).`;

    return {
      summary,
      recommendedProductId: top.product.id,
      reasons: top.reasons.length > 0 ? top.reasons : [`Fulfills catalogue specifications under consideration.`],
      tradeoffs: top.tradeoffs.length > 0 ? top.tradeoffs : [`Price is ₹${top.product.price.toLocaleString('en-IN')}.`],
      missingInformation: missingInformation.length > 0 ? missingInformation : undefined,
      mode: 'mock',
    };
  }
}
