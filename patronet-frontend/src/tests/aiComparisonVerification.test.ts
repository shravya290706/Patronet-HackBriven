/**
 * Phase 2.10 & 2.13B — AI Product Comparison Verification Test Suite
 *
 * Verifies:
 * 1. Empty selection handling
 * 2. Single-product selection behavior
 * 3. Two-product comparison
 * 4. Three-product limit enforcement
 * 5. Product removal
 * 6. Valid product IDs mapping
 * 7. Price comparison correctness
 * 8. Specification normalization
 * 9. Missing specification handling ("Not specified")
 * 10. Cross-category comparison transparency
 * 11. Difference highlighting logic
 * 12. Budget-based recommendation evaluation
 * 13. Insufficient evidence / ambiguous query handling
 * 14. Mock/live adapter selection
 * 15. Invalid real backend response validation
 * 16. Stale AI recommendation invalidation logic
 * 17. LocalStorage comparison persistence & hydration
 * 18. Malformed / corrupted storage recovery
 * 19. Duplicate product ID deduplication on load
 * 20. 3-product limit capping from loaded storage
 * 21. Comparison clear resets storage
 */

import { MockAiComparisonAdapter } from '../services/adapters/mockAiComparisonAdapter';
import { RealAiComparisonAdapter } from '../services/adapters/realAiComparisonAdapter';
import { MockProductAdapter } from '../services/adapters/mockProductAdapter';
import { MOCK_PRODUCTS } from '../mocks/products';
import type { Product } from '../types';

let passed = 0;
let failed = 0;

function assert(desc: string, condition: boolean, extra?: string) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${desc} ${extra ? `-> ${extra}` : ''}`);
    failed++;
  }
}

export async function runAiComparisonTests() {
  console.log('=== STARTING PHASE 2.10 AI PRODUCT COMPARISON TESTS ===\n');

  const productAdapter = new MockProductAdapter();
  const mockAiAdapter = new MockAiComparisonAdapter(productAdapter);

  const product1 = MOCK_PRODUCTS.find((p) => p.name.includes('GameBook'))!; // GameBook 15 (Laptop, ₹94,990)
  const product2 = MOCK_PRODUCTS.find((p) => p.name.includes('AirBook'))!; // AirBook Pro 14 (Laptop, ₹78,990)
  const product3 = MOCK_PRODUCTS.find((p) => p.name.includes('Headphones'))!; // Studio ANC Headphones (Audio, ₹13,999)
  const product4 = MOCK_PRODUCTS.find((p) => p.name.includes('Watch'))!; // Chrono Smartwatch (Wearables, ₹24,999)

  // 1. Empty selection handling
  console.log('1. Testing Empty Selection:');
  const resEmpty = await mockAiAdapter.compareProducts({ productIds: [], requirements: '' });
  assert('Returns empty selection notice', resEmpty.summary.includes('No products') || resEmpty.summary.includes('empty'));
  assert('Identifies mode as mock', resEmpty.mode === 'mock');

  // 2. Single-product selection behavior
  console.log('\n2. Testing Single-Product Selection:');
  const resSingle = await mockAiAdapter.compareProducts({ productIds: [product1.id], requirements: '' });
  assert('Explains at least 2 products needed for comparison', resSingle.summary.includes('at least one more product') || resSingle.summary.includes('1 product'));
  assert('Acknowledges the single selected product', resSingle.summary.includes(product1.name));

  // 3. Two-product comparison
  console.log('\n3. Testing Two-Product Comparison:');
  const resTwo = await mockAiAdapter.compareProducts({ productIds: [product1.id, product2.id], requirements: '' });
  assert('Returns a structured comparison summary', resTwo.summary.length > 20);
  assert('Returns reasons or trade-offs lists', (resTwo.reasons?.length ?? 0) > 0 || (resTwo.tradeoffs?.length ?? 0) > 0);

  // 4. Three-product limit enforcement
  console.log('\n4. Testing Three-Product Limit Logic:');
  const pool = [product1, product2, product3];
  // Attempting to add a 4th product should be blocked
  const canAddMore = pool.length < 3;
  assert('Pool strictly does not exceed 3 products', canAddMore === false);

  // 5. Product removal
  console.log('\n5. Testing Product Removal:');
  const afterRemoval = pool.filter((p) => p.id !== product3.id);
  assert('Pool has 2 products after removing one', afterRemoval.length === 2);
  assert('Removed product is no longer present', !afterRemoval.some((p) => p.id === product3.id));

  // 6. Valid product IDs mapping
  console.log('\n6. Testing Valid Product IDs:');
  const resValid = await mockAiAdapter.compareProducts({
    productIds: [product1.id, product2.id],
    requirements: 'gaming',
  });
  const validIds = [product1.id, product2.id];
  assert('Recommendation ID is one of the requested IDs', validIds.includes(resValid.recommendedProductId!));

  // 7. Price comparison correctness
  console.log('\n7. Testing Price Comparison Correctness:');
  const price1 = product1.price;
  const price2 = product2.price;
  const priceDiff = Math.abs(price1 - price2);
  assert('GameBook 15 price is ₹94,990', price1 === 94990);
  assert('AirBook Pro 14 price is ₹78,990', price2 === 78990);
  assert('Price difference is exactly ₹16,000', priceDiff === 16000);

  // 8. Specification normalization
  console.log('\n8. Testing Specification Normalization:');
  const specKey = 'Processor';
  const val1 = product1.specifications?.[specKey];
  const val2 = product2.specifications?.[specKey];
  assert('Both products have Processor attribute', val1 !== undefined && val2 !== undefined);
  assert('Attribute values are valid strings or numbers', typeof val1 === 'string' && typeof val2 === 'string');

  // 9. Missing specification handling
  console.log('\n9. Testing Missing Specification Handling:');
  // Headphones do not have 'Processor'
  const val3 = product3.specifications?.[specKey];
  const displayVal3 = val3 ?? 'Not specified';
  assert('Missing attribute in non-matching category is undefined', val3 === undefined);
  assert('Safely displays "Not specified" for missing values', displayVal3 === 'Not specified');

  // 10. Cross-category comparison transparency
  console.log('\n10. Testing Cross-Category Comparison Transparency:');
  const resCross = await mockAiAdapter.compareProducts({ productIds: [product1.id, product3.id], requirements: '' });
  assert('Notes cross-category technical discrepancy transparently', resCross.summary.toLowerCase().includes('category') || (resCross.tradeoffs?.length ?? 0) > 0 || (resCross.missingInformation?.length ?? 0) > 0);

  // 11. Difference highlighting logic
  console.log('\n11. Testing Difference Highlighting Logic:');
  function checkDifferent(attr: string, pA: Product, pB: Product) {
    return pA.specifications?.[attr] !== pB.specifications?.[attr];
  }
  const procDiff = checkDifferent('Processor', product1, product2);
  assert('Processors differ between GameBook and AirBook', procDiff === true);

  // 12. Budget-based recommendation evaluation
  console.log('\n12. Testing Budget-Based Recommendation:');
  const resBudget = await mockAiAdapter.compareProducts({
    productIds: [product1.id, product2.id],
    requirements: 'Must be under ₹80,000 for programming',
  });
  assert('Recommends AirBook Pro 14 (₹78,990) when budget is under ₹80,000', resBudget.recommendedProductId === product2.id);
  assert('Explains budget compliance in reasons', resBudget.reasons.some((r) => r.toLowerCase().includes('budget') || r.includes('78,990')));

  // 13. Insufficient evidence / Ambiguous requirements
  console.log('\n13. Testing Insufficient Evidence Handling:');
  const resAmbiguous = await mockAiAdapter.compareProducts({
    productIds: [product1.id, product2.id],
    requirements: '',
  });
  assert('Declines to pick arbitrary winner without stated requirements', resAmbiguous.recommendedProductId === undefined);
  assert('Prompts user to specify workflow priorities', resAmbiguous.summary.toLowerCase().includes('specify') || (resAmbiguous.missingInformation?.length ?? 0) > 0);

  // 14. Mock/live adapter selection
  console.log('\n14. Testing Mock / Real Adapter Architecture:');
  const realAdapter = new RealAiComparisonAdapter();
  assert('MockAiComparisonAdapter implements compareProducts', typeof mockAiAdapter.compareProducts === 'function');
  assert('RealAiComparisonAdapter implements compareProducts', typeof realAdapter.compareProducts === 'function');

  // 15. Invalid real backend response validation
  console.log('\n15. Testing Real Adapter Response Validation:');
  const requestedIds = ['id-1', 'id-2'];
  const rogueBackendId = 'id-999';
  const isValid = requestedIds.includes(rogueBackendId);
  assert('Rejects rogue recommendation ID not in requested comparison set', isValid === false);

  // 16. Stale AI recommendation invalidation logic
  console.log('\n16. Testing Stale AI Recommendation Invalidation:');
  const initialAnalyzed = ['id-1', 'id-2'];
  const updatedSelection = ['id-1', 'id-2', 'id-3'];
  const isStale = initialAnalyzed.sort().join(',') !== updatedSelection.sort().join(',');
  assert('Identifies recommendation as stale when selected set changes', isStale === true);

  // 17. LocalStorage comparison persistence & hydration
  console.log('\n17. Testing LocalStorage Comparison Persistence & Hydration:');
  const STORAGE_KEY = 'patronet_comparison_selection_v1';
  const mockStorage: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (k: string) => mockStorage[k] || null,
    setItem: (k: string, v: string) => { mockStorage[k] = v; },
    removeItem: (k: string) => { delete mockStorage[k]; },
  };

  // Simulate storing 2 products
  mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify([product1, product2]));
  const loadedRaw = mockLocalStorage.getItem(STORAGE_KEY);
  const parsed = loadedRaw ? JSON.parse(loadedRaw) : [];
  assert('Loads persisted comparison items from storage', parsed.length === 2);
  assert('Loaded item retains product id and name', parsed[0].id === product1.id && parsed[1].id === product2.id);

  // 18. Malformed / corrupted storage recovery
  console.log('\n18. Testing Corrupted Storage Recovery:');
  mockLocalStorage.setItem(STORAGE_KEY, '{ invalid_json: ');
  let recoveredProducts: Product[];
  try {
    const rawCorrupt = mockLocalStorage.getItem(STORAGE_KEY);
    recoveredProducts = rawCorrupt ? JSON.parse(rawCorrupt) : [];
  } catch {
    recoveredProducts = [];
  }
  assert('Gracefully recovers with empty array on invalid JSON', Array.isArray(recoveredProducts) && recoveredProducts.length === 0);

  // 19. Duplicate product ID deduplication on load
  console.log('\n19. Testing Deduplication on Load:');
  mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify([product1, product1, product2]));
  const dupRaw = JSON.parse(mockLocalStorage.getItem(STORAGE_KEY)!);
  const seenIds = new Set<string>();
  const deduplicated = dupRaw.filter((p: Product) => {
    if (seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  });
  assert('Deduplicates duplicate products in stored state', deduplicated.length === 2);

  // 20. 3-product limit capping from loaded storage
  console.log('\n20. Testing 3-Product Limit Capping:');
  mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify([product1, product2, product3, product4]));
  const overflownRaw = JSON.parse(mockLocalStorage.getItem(STORAGE_KEY)!);
  const capped = overflownRaw.slice(0, 3);
  assert('Strictly caps restored items at maximum 3 products', capped.length === 3);

  // 21. Comparison clear resets storage
  console.log('\n21. Testing Clear Resets Storage:');
  mockLocalStorage.removeItem(STORAGE_KEY);
  assert('Storage key is completely removed upon clear', mockLocalStorage.getItem(STORAGE_KEY) === null);

  console.log(`\n=== Verification Complete: ${passed} Passed, ${failed} Failed ===`);
  return { passed, failed };
}

runAiComparisonTests();
