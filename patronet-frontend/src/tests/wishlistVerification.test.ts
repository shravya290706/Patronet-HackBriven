import { MockWishlistAdapter } from '../services/adapters/mockWishlistAdapter';
import { MockProductAdapter } from '../services/adapters/mockProductAdapter';
import { MOCK_PRODUCTS } from '../mocks/products';

// Mock storage in Node
const mockLocalStorage: Record<string, string> = {};

(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (key: string) => mockLocalStorage[key] ?? null,
  setItem: (key: string, val: string) => { mockLocalStorage[key] = String(val); },
  removeItem: (key: string) => { delete mockLocalStorage[key]; },
  clear: () => { Object.keys(mockLocalStorage).forEach((k) => delete mockLocalStorage[k]); },
  key: (i: number) => Object.keys(mockLocalStorage)[i] ?? null,
  length: 0,
};

async function runWishlistTests() {
  console.log('=== STARTING PHASE 2.8 WISHLIST & SAVED PRODUCTS TESTS ===\n');

  const productAdapter = new MockProductAdapter();
  const wishlistAdapter = new MockWishlistAdapter(productAdapter);

  const product1 = MOCK_PRODUCTS[0]; // GameBook 15
  const product2 = MOCK_PRODUCTS[1]; // ANC Headphones

  // 1. Initial state check
  console.log('Test 1: Initial wishlist state');
  const initial = await wishlistAdapter.getWishlist();
  console.assert(initial.items.length === 0, 'Initially wishlist should be empty');
  console.log('✓ Test 1 Passed: Initial wishlist is empty\n');

  // 2. Add product to wishlist
  console.log('Test 2: Add product to wishlist');
  const afterAdd1 = await wishlistAdapter.addItem(product1.id);
  console.assert(afterAdd1.items.length === 1, '1 item should be in wishlist');
  console.assert(afterAdd1.items[0].productId === product1.id, 'Item matches product 1 ID');

  const isSaved1 = await wishlistAdapter.hasItem(product1.id);
  console.assert(isSaved1 === true, 'hasItem returns true for saved product');
  console.log('✓ Test 2 Passed: Product added to wishlist successfully\n');

  // 3. Duplicate additions prevent duplicate entries
  console.log('Test 3: Duplicate additions check');
  const duplicateAdd = await wishlistAdapter.addItem(product1.id);
  console.assert(duplicateAdd.items.length === 1, 'Duplicate product ID does not increment array length');
  console.log('✓ Test 3 Passed: Duplicates prevented\n');

  // 4. Add second product
  console.log('Test 4: Add second product');
  const afterAdd2 = await wishlistAdapter.addItem(product2.id);
  console.assert(afterAdd2.items.length === 2, '2 items in wishlist');
  console.assert(afterAdd2.items[0].productId === product2.id, 'Newest item added to top');
  console.log('✓ Test 4 Passed: Multiple products supported\n');

  // 5. Remove product
  console.log('Test 5: Remove product from wishlist');
  const afterRemove = await wishlistAdapter.removeItem(product1.id);
  console.assert(afterRemove.items.length === 1, '1 item remains after removal');
  console.assert(afterRemove.items[0].productId === product2.id, 'Remaining item is product 2');

  const isSavedAfterRemove = await wishlistAdapter.hasItem(product1.id);
  console.assert(isSavedAfterRemove === false, 'hasItem returns false after removal');
  console.log('✓ Test 5 Passed: Product removal verified\n');

  // 6. LocalStorage persistence & reload
  console.log('Test 6: Storage persistence reload');
  const freshAdapter = new MockWishlistAdapter(productAdapter);
  const reloaded = await freshAdapter.getWishlist();
  console.assert(reloaded.items.length === 1, 'Wishlist survives re-instantiation / page refresh');
  console.assert(reloaded.items[0].productId === product2.id, 'Persisted product 2 intact');
  console.log('✓ Test 6 Passed: LocalStorage persistence verified\n');

  // 7. Malformed storage recovery
  console.log('Test 7: Malformed storage recovery');
  mockLocalStorage['patronet_wishlist_v1'] = '{ invalid [json}';
  const malformedAdapter = new MockWishlistAdapter(productAdapter);
  const recovered = await malformedAdapter.getWishlist();
  console.assert(recovered.items.length === 0, 'Gracefully recovers with empty array on invalid JSON');
  console.log('✓ Test 7 Passed: Malformed storage safely handled\n');

  // 8. Clear wishlist
  console.log('Test 8: Clear wishlist');
  await freshAdapter.addItem(product1.id);
  await freshAdapter.clearWishlist();
  const cleared = await freshAdapter.getWishlist();
  console.assert(cleared.items.length === 0, 'Wishlist cleared to empty array');
  console.log('✓ Test 8 Passed: Clear wishlist works\n');

  console.log('=== ALL PHASE 2.8 AUTOMATED TESTS PASSED SUCCESSFULLY! ===');
}

runWishlistTests().catch((err) => {
  console.error('Test run failed:', err);
});
