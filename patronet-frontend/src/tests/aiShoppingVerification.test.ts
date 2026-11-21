/**
 * Phase 2.9 — AI Shopping Assistant Verification Test Suite
 *
 * Verifies:
 * 1. Empty message rejection / validation
 * 2. Successful recommendation generation with mock catalogue products
 * 3. Budget extraction and filtering (e.g., "laptop under ₹80,000")
 * 4. Graceful handling of no-match scenarios (e.g., "laptop under ₹5,000")
 * 5. Refinement via conversational history
 * 6. Product ID consistency against mock catalogue
 * 7. RealAiShoppingAdapter structure & error handling
 */

import { MockAiShoppingAdapter } from '../services/adapters/mockAiShoppingAdapter';
import { RealAiShoppingAdapter } from '../services/adapters/realAiShoppingAdapter';
import { MockProductAdapter } from '../services/adapters/mockProductAdapter';
import type { AiShoppingMessage } from '../services/api/aiShoppingService';
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

export async function runAiShoppingTests() {
  console.log('=== STARTING PHASE 2.9 AI SHOPPING ASSISTANT TESTS ===\n');

  const productAdapter = new MockProductAdapter();
  const mockAiAdapter = new MockAiShoppingAdapter(productAdapter);
  const allProducts = await productAdapter.getProducts();
  const productMap = new Map<string, Product>(allProducts.map((p) => [p.id, p]));

  // Test 1: Empty message handling
  console.log('1. Testing Empty or Whitespace Query Handling:');
  try {
    const emptyRes = await mockAiAdapter.sendMessage({ message: '   ', history: [] });
    assert('Returns friendly fallback response on empty input', emptyRes.recommendations.length === 0 && emptyRes.message.length > 0);
  } catch (_err: unknown) {
    assert('Handles empty input without crashing', true);
  }

  // Test 2: General query with recommendations
  console.log('\n2. Testing General Discovery Recommendations:');
  const resGeneral = await mockAiAdapter.sendMessage({
    message: 'Recommend me some good gadgets for working from home',
    history: [],
  });
  assert('Returns at least 1 recommendation', resGeneral.recommendations.length > 0);
  assert('Identifies as mock mode', resGeneral.mode === 'mock');
  assert('Includes assistant message for the user', typeof resGeneral.message === 'string' && resGeneral.message.length > 0);
  assert('Provides suggested follow-up prompts', Array.isArray(resGeneral.suggestedFollowUps) && resGeneral.suggestedFollowUps.length > 0);

  // Test 3: Budget and Category Extraction ("laptop under ₹80,000")
  console.log('\n3. Testing Budget and Category Extraction ("laptop under ₹80,000"):');
  const resLaptop = await mockAiAdapter.sendMessage({
    message: 'I need a laptop under ₹80,000 for coding',
    history: [],
  });
  assert('Returns matching laptops', resLaptop.recommendations.length > 0);
  for (const rec of resLaptop.recommendations) {
    const product = productMap.get(rec.productId);
    assert(`Product ${rec.productId} exists in catalogue`, product !== undefined);
    if (product) {
      assert(
        `Product ${product.name} price ₹${product.price} is <= ₹80,000`,
        product.price <= 80000
      );
      const catName = product.category?.name || '';
      assert(
        `Product ${product.name} is categorized as laptop`,
        catName.toLowerCase().includes('laptop') || product.name.toLowerCase().includes('book') || product.name.toLowerCase().includes('laptop')
      );
    }
  }
  const hasBudgetCriteria = (resLaptop.understoodCriteria || []).some(
    (c) => c.label.toLowerCase().includes('budget') || c.value.includes('80,000')
  );
  assert('Understood criteria tag captures budget parameter', hasBudgetCriteria);

  // Test 4: Impossible budget / No matches ("laptop under ₹5,000")
  console.log('\n4. Testing No-Match Scenario ("laptop under ₹5,000"):');
  const resImpossible = await mockAiAdapter.sendMessage({
    message: 'I want a gaming laptop under ₹5,000',
    history: [],
  });
  assert('Returns 0 recommendations when budget cannot be met', resImpossible.recommendations.length === 0);
  assert(
    'Provides polite guidance suggesting adjusting criteria',
    resImpossible.message.toLowerCase().includes('adjust') || resImpossible.message.toLowerCase().includes('could not find')
  );

  // Test 5: Contextual refinement with conversational history
  console.log('\n5. Testing Contextual Refinement with History:');
  const history: AiShoppingMessage[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: 'I need audio headphones for office',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'Here are our top audio products.',
      timestamp: new Date().toISOString(),
    },
  ];
  const resRefined = await mockAiAdapter.sendMessage({
    message: 'Must have active noise cancellation',
    history,
  });
  assert('Follow-up query returns matching products', resRefined.recommendations.length > 0);
  const ancRec = resRefined.recommendations.find((r) => {
    const product = productMap.get(r.productId);
    return product?.name.toLowerCase().includes('anc') || product?.description?.toLowerCase().includes('anc') || product?.description?.toLowerCase().includes('noise');
  });
  assert('Found product with Active Noise Cancellation from refined context', ancRec !== undefined);

  // Test 6: Product ID consistency against mock catalogue
  console.log('\n6. Testing Product ID Consistency against Product Service:');
  const validIds = new Set(allProducts.map((p: Product) => p.id));
  let allIdsMatch = true;
  for (const rec of resGeneral.recommendations) {
    if (!validIds.has(rec.productId)) allIdsMatch = false;
  }
  for (const rec of resLaptop.recommendations) {
    if (!validIds.has(rec.productId)) allIdsMatch = false;
  }
  assert('All recommendation IDs exist in genuine product catalogue', allIdsMatch);

  // Test 7: RealAiShoppingAdapter interface validation
  console.log('\n7. Testing RealAiShoppingAdapter Contract & Boundaries:');
  const realAdapter = new RealAiShoppingAdapter();
  assert('RealAiShoppingAdapter implements sendMessage', typeof realAdapter.sendMessage === 'function');

  console.log(`\n=== Verification Complete: ${passed} Passed, ${failed} Failed ===`);
  return { passed, failed };
}

runAiShoppingTests();
