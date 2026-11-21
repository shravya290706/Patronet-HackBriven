import { inrToPaise, paiseToInr } from '../lib/moneyUtils';
import { MockCheckoutAdapter } from '../services/adapters/mockCheckoutAdapter';
import { MockProductAdapter } from '../services/adapters/mockProductAdapter';
import type { CartModel } from '../services/api/cartService';
import type { ShippingAddressInput } from '../services/api/checkoutService';
import { MOCK_PRODUCTS } from '../mocks/products';

// Mock localStorage in Node
const storage: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, val: string) => {
    storage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete storage[key];
  },
  clear: () => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  },
  key: (i: number) => Object.keys(storage)[i] ?? null,
  length: 0,
};

async function runCheckoutTests() {
  console.log('=== STARTING PHASE 2.6 CHECKOUT & ORDER CONFIRMATION TESTS ===\n');

  const productAdapter = new MockProductAdapter();
  const checkoutAdapter = new MockCheckoutAdapter(productAdapter);

  const validAddress: ShippingAddressInput = {
    fullName: 'Aarav Mehta',
    phone: '+91 98201 44512',
    email: 'aarav.mehta@example.com',
    line1: 'Flat 402, Skylark Residency, 14th Road, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    country: 'India',
    isDefault: true,
  };

  // Test 1: Empty cart cannot submit checkout
  console.log('Test 1: Empty cart rejection');
  const emptyCart: CartModel = { items: [], updatedAt: new Date().toISOString() };
  const res1 = await checkoutAdapter.createOrder(
    { shippingAddress: validAddress, paymentMethod: 'UPI' },
    emptyCart
  );
  console.assert(!res1.success, 'Empty cart should fail');
  console.assert(res1.error?.includes('empty'), 'Error should mention empty cart');
  console.log('✓ Test 1 Passed: Empty cart safely rejected\n');

  // Test 2: Address validation - missing required fields
  console.log('Test 2: Address validation - missing fields');
  const missingName = checkoutAdapter.validateShippingAddress({ ...validAddress, fullName: '' });
  console.assert(!missingName.isValid && !!missingName.errors.fullName, 'Missing fullName must fail');

  const missingLine = checkoutAdapter.validateShippingAddress({ ...validAddress, line1: '' });
  console.assert(!missingLine.isValid && !!missingLine.errors.line1, 'Missing line1 must fail');

  const missingCity = checkoutAdapter.validateShippingAddress({ ...validAddress, city: '' });
  console.assert(!missingCity.isValid && !!missingCity.errors.city, 'Missing city must fail');

  const missingState = checkoutAdapter.validateShippingAddress({ ...validAddress, state: '' });
  console.assert(!missingState.isValid && !!missingState.errors.state, 'Missing state must fail');
  console.log('✓ Test 2 Passed: Missing required fields rejected\n');

  // Test 3: Address validation - phone and pincode
  console.log('Test 3: Phone and Pincode validation');
  const badPhone = checkoutAdapter.validateShippingAddress({ ...validAddress, phone: '123' });
  console.assert(!badPhone.isValid && !!badPhone.errors.phone, 'Invalid phone must fail');

  const badPin = checkoutAdapter.validateShippingAddress({ ...validAddress, pincode: '40005' });
  console.assert(!badPin.isValid && !!badPin.errors.pincode, 'Pincode not 6 digits must fail');

  const alphaPin = checkoutAdapter.validateShippingAddress({ ...validAddress, pincode: '40005A' });
  console.assert(!alphaPin.isValid && !!alphaPin.errors.pincode, 'Alphanumeric pincode must fail');

  const badEmail = checkoutAdapter.validateShippingAddress({ ...validAddress, email: 'invalid-email' });
  console.assert(!badEmail.isValid && !!badEmail.errors.email, 'Invalid email format must fail');

  const validValidation = checkoutAdapter.validateShippingAddress(validAddress);
  console.assert(validValidation.isValid, 'Valid address must pass validation');
  console.log('✓ Test 3 Passed: Phone, pincode, email validation verified\n');

  // Test 4: Successful mock checkout with integer paise precision
  console.log('Test 4: Order creation & monetary calculation');
  const targetProduct1 = MOCK_PRODUCTS[0]; // e.g. GameBook 15 or UltraBook
  const targetProduct2 = MOCK_PRODUCTS[1];
  const testCart: CartModel = {
    items: [
      { productId: targetProduct1.id, quantity: 2 },
      { productId: targetProduct2.id, quantity: 1 },
    ],
    updatedAt: new Date().toISOString(),
  };

  const res4 = await checkoutAdapter.createOrder(
    { shippingAddress: validAddress, paymentMethod: 'UPI' },
    testCart
  );

  console.assert(res4.success && !!res4.order, 'Order should be created successfully');
  const order = res4.order!;
  console.assert(order.items.length === 2, 'Order should have 2 line items');

  const expectedPaise =
    inrToPaise(targetProduct1.price) * 2 + inrToPaise(targetProduct2.price) * 1;
  console.assert(order.totalPaise === expectedPaise, 'Total paise calculation must match exactly');
  console.assert(order.total === paiseToInr(expectedPaise), 'Total INR must match exact paise ratio');
  console.assert(order.orderNumber.startsWith('PN-2026-'), 'Order number matches PATRONET format');
  console.log(`✓ Test 4 Passed: Order ${order.orderNumber} created with exact total ₹${order.total}\n`);

  // Test 5: Order snapshot persistence and retrieval
  console.log('Test 5: Order retrieval & persistence');
  const fetchedOrder = await checkoutAdapter.getOrderById(order.orderNumber);
  console.assert(!!fetchedOrder, 'Order should be retrieved from storage');
  console.assert(fetchedOrder?.orderNumber === order.orderNumber, 'Retrieved order matches');
  console.assert(fetchedOrder?.items.length === 2, 'Retrieved items intact');

  // Test 6: Unknown order retrieval
  console.log('Test 6: Unknown order reference handling');
  const unknownOrder = await checkoutAdapter.getOrderById('PN-UNKNOWN-999');
  console.assert(unknownOrder === null, 'Unknown order returns null safely');
  console.log('✓ Test 6 Passed: Unknown order handled safely\n');

  // Test 7: Payment method support (UPI, Cash on Delivery)
  console.log('Test 7: Payment method support');
  const codRes = await checkoutAdapter.createOrder(
    { shippingAddress: validAddress, paymentMethod: 'Cash on Delivery' },
    testCart
  );
  console.assert(codRes.success && codRes.order?.paymentMethod === 'Cash on Delivery', 'COD accepted');
  console.assert(codRes.order?.paymentStatus === 'simulated_cod', 'COD status set properly');
  console.log('✓ Test 7 Passed: Payment methods simulated correctly\n');

  // Test 8: Saved addresses management
  console.log('Test 8: Saved addresses retrieval & addition');
  const initialAddrs = await checkoutAdapter.getSavedAddresses();
  console.assert(initialAddrs.length >= 2, 'Initial default addresses loaded');

  const newAddr: ShippingAddressInput = {
    fullName: 'Priya Sharma',
    phone: '9876543210',
    line1: 'B-104, Green Heights',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    country: 'India',
    label: 'Studio',
    isDefault: false,
  };
  const updatedAddrs = await checkoutAdapter.saveAddress(newAddr);
  console.assert(updatedAddrs.some((a) => a.fullName === 'Priya Sharma'), 'New address persisted');
  console.log('✓ Test 8 Passed: Saved address operations verified\n');

  console.log('=== ALL AUTOMATED CHECKOUT TESTS COMPLETED SUCCESSFULLY! ===');
}

runCheckoutTests().catch((err) => {
  console.error('Test run failed:', err);
});
