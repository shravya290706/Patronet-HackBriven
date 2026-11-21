import { inrToPaise, paiseToInr, calculateLineTotalPaise, calculateSubtotalPaise, formatPaise } from '../lib/moneyUtils';
import { MockCartAdapter } from '../services/adapters/mockCartAdapter';
import { MOCK_PRODUCTS } from '../mocks/products';

// Mock localStorage in Node
const storage: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => { storage[key] = String(val); },
  removeItem: (key: string) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
  length: 0,
  key: () => null,
};

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

export async function runCartTests() {
  console.log("=== PATRONET Cart Verification & Monetary Calculations Suite ===\n");

  // 1. Monetary Calculations
  console.log("1. Testing Paise-Based Monetary Calculations:");
  assert("inrToPaise(94990) === 9499000", inrToPaise(94990) === 9499000);
  assert("inrToPaise(999.50) === 99950", inrToPaise(999.50) === 99950);
  assert("inrToPaise(1299.99) === 129999", inrToPaise(1299.99) === 129999);
  assert("inrToPaise(0.01) === 1", inrToPaise(0.01) === 1);
  assert("paiseToInr(129999) === 1299.99", paiseToInr(129999) === 1299.99);

  const line1 = calculateLineTotalPaise(999.50, 3);
  assert("calculateLineTotalPaise(999.50, 3) === 299850", line1 === 299850);
  assert("formatPaise(299850) contains ₹2,998.50", formatPaise(line1).replace(/\u00a0/g, ' ').includes("2,998.50"));

  const line2 = calculateLineTotalPaise(1299.99, 2);
  assert("calculateLineTotalPaise(1299.99, 2) === 259998", line2 === 259998);

  const subtotal = calculateSubtotalPaise([
    { unitPrice: 999.50, quantity: 3 },
    { unitPrice: 1299.99, quantity: 2 },
    { unitPrice: 94990, quantity: 1 }
  ]);
  // 299850 + 259998 + 9499000 = 10058848 paise = 100588.48 INR
  assert("Sum of lines in paise === 10058848", subtotal === 10058848);
  assert("formatPaise(subtotal) formatted to ₹1,00,588.48", formatPaise(subtotal).replace(/\u00a0/g, ' ').includes("1,00,588.48"));

  // 2. Mock Cart Adapter Operations
  console.log("\n2. Testing MockCartAdapter Operations & Persistence:");
  const cartAdapter = new MockCartAdapter();
  (globalThis as unknown as { localStorage: Storage }).localStorage.clear();

  // Test 2.1: Empty Cart
  let c = await cartAdapter.getCart();
  assert("Initial cart is empty", c.items.length === 0);

  // Test 2.2: Add item (GameBook 15)
  const p1 = MOCK_PRODUCTS[0];
  c = await cartAdapter.addItem(p1.id, 1);
  assert("Cart has 1 item after add", c.items.length === 1 && c.items[0].productId === p1.id && c.items[0].quantity === 1);

  // Test 2.3: Duplicate add merges quantity
  c = await cartAdapter.addItem(p1.id, 2);
  assert("Duplicate addition merges quantity to 3", c.items.length === 1 && c.items[0].quantity === 3);

  // Test 2.4: Add second item (AirBook 14)
  const p2 = MOCK_PRODUCTS[1];
  c = await cartAdapter.addItem(p2.id, 1);
  assert("Cart has 2 distinct product lines", c.items.length === 2);

  // Test 2.5: Total item count
  const count = c.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
  assert("Total item count is 4 (3 + 1)", count === 4);

  // Test 2.6: Update quantity
  c = await cartAdapter.updateQuantity(p1.id, 5);
  assert("Update quantity sets quantity to 5", c.items.find((i: { productId: string }) => i.productId === p1.id)?.quantity === 5);

  // Test 2.7: Decrease quantity below 1 removes item
  c = await cartAdapter.updateQuantity(p2.id, 0);
  assert("Setting quantity to 0 removes the item", c.items.length === 1 && c.items[0].productId === p1.id);

  // Test 2.8: Remove item directly
  c = await cartAdapter.removeItem(p1.id);
  assert("removeItem removes the item", c.items.length === 0);

  // Test 2.9: Clear cart
  await cartAdapter.addItem(p1.id, 1);
  await cartAdapter.addItem(p2.id, 2);
  c = await cartAdapter.clearCart();
  assert("clearCart resets cart to 0 items", c.items.length === 0);

  // Test 2.10: Persistence across new adapter instance
  await cartAdapter.addItem(p1.id, 2);
  const newAdapterInstance = new MockCartAdapter();
  c = await newAdapterInstance.getCart();
  assert("Cart survives and loads in new adapter instance", c.items.length === 1 && c.items[0].quantity === 2);

  // Test 2.11: Graceful recovery from malformed localStorage
  (globalThis as unknown as { localStorage: Storage }).localStorage.setItem('patronet_cart_v1', '{ invalid JSON !!');
  c = await newAdapterInstance.getCart();
  assert("Recovers gracefully from corrupted JSON", c.items.length === 0);

  (globalThis as unknown as { localStorage: Storage }).localStorage.setItem('patronet_cart_v1', JSON.stringify({
    items: [
      { productId: "", quantity: 1 },
      { productId: "valid-1", quantity: -5 },
      { productId: "valid-2", quantity: 2.5 },
      { productId: "valid-3", quantity: 3 }
    ]
  }));
  c = await newAdapterInstance.getCart();
  assert("Sanitizes invalid items and preserves only valid positive integer items", c.items.length === 1 && c.items[0].productId === 'valid-3' && c.items[0].quantity === 3);

  // 3. Concurrency / Rapid repeated interactions
  console.log("\n3. Testing Rapid Concurrent Updates:");
  (globalThis as unknown as { localStorage: Storage }).localStorage.clear();
  const rapidAdapter = new MockCartAdapter();
  await Promise.all([
    rapidAdapter.addItem("prod-concurrent", 1),
    rapidAdapter.addItem("prod-concurrent", 1),
    rapidAdapter.addItem("prod-concurrent", 1),
    rapidAdapter.addItem("prod-concurrent", 1),
    rapidAdapter.addItem("prod-concurrent", 1),
  ]);
  const rapidCart = await rapidAdapter.getCart();
  assert("Concurrent additions successfully processed", rapidCart.items.length === 1 && rapidCart.items[0].quantity > 0);

  console.log(`\n=== Verification Complete: ${passed} Passed, ${failed} Failed ===`);
  return { passed, failed };
}

runCartTests();
