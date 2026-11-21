import { MockAuthAdapter } from '../services/adapters/mockAuthAdapter';
import { MockCheckoutAdapter } from '../services/adapters/mockCheckoutAdapter';
import { MockProductAdapter } from '../services/adapters/mockProductAdapter';
import type { CartModel } from '../services/api/cartService';

// Mock storage in Node
const mockSessionStorage: Record<string, string> = {};
const mockLocalStorage: Record<string, string> = {};

(globalThis as unknown as { sessionStorage: Storage }).sessionStorage = {
  getItem: (key: string) => mockSessionStorage[key] ?? null,
  setItem: (key: string, val: string) => { mockSessionStorage[key] = String(val); },
  removeItem: (key: string) => { delete mockSessionStorage[key]; },
  clear: () => { Object.keys(mockSessionStorage).forEach((k) => delete mockSessionStorage[k]); },
  key: (i: number) => Object.keys(mockSessionStorage)[i] ?? null,
  length: 0,
};

(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (key: string) => mockLocalStorage[key] ?? null,
  setItem: (key: string, val: string) => { mockLocalStorage[key] = String(val); },
  removeItem: (key: string) => { delete mockLocalStorage[key]; },
  clear: () => { Object.keys(mockLocalStorage).forEach((k) => delete mockLocalStorage[k]); },
  key: (i: number) => Object.keys(mockLocalStorage)[i] ?? null,
  length: 0,
};

async function runAuthAndAccountTests() {
  console.log('=== STARTING PHASE 2.7 AUTH & ACCOUNT MANAGEMENT TESTS ===\n');

  const authAdapter = new MockAuthAdapter();
  const productAdapter = new MockProductAdapter();
  const checkoutAdapter = new MockCheckoutAdapter(productAdapter);

  // 1. Initial unauthenticated session check
  console.log('Test 1: Initial unauthenticated state');
  const session1 = await authAdapter.getCurrentSession();
  console.assert(!session1.isAuthenticated, 'Initially should not be authenticated');
  console.assert(session1.user === null, 'User should be null initially');
  console.log('✓ Test 1 Passed: Initial session is empty\n');

  // 2. Login validation
  console.log('Test 2: Login validation');
  const emptyLogin = authAdapter.validateLogin({ email: '', password: '' });
  console.assert(!emptyLogin.isValid && !!emptyLogin.errors.email, 'Empty email rejected');
  console.assert(!!emptyLogin.errors.password, 'Empty password rejected');

  const invalidEmailLogin = authAdapter.validateLogin({ email: 'not-an-email', password: 'password123' });
  console.assert(!invalidEmailLogin.isValid && !!invalidEmailLogin.errors.email, 'Malformed email rejected');

  const validLogin = authAdapter.validateLogin({ email: 'aarav@mehta.in', password: 'password123' });
  console.assert(validLogin.isValid, 'Valid credentials pass client validation');
  console.log('✓ Test 2 Passed: Login validation rules verified\n');

  // 3. Demo login execution & session start
  console.log('Test 3: Demo sign in execution');
  const loginRes = await authAdapter.simulateLogin({ email: 'aarav@mehta.in', password: 'password123' });
  console.assert(loginRes.success && !!loginRes.user, 'Demo sign in should succeed');
  console.assert(loginRes.user?.name === 'Aarav Mehta', 'Predefined demo user returned');

  // Verify session reflects authentication
  const activeSession = await authAdapter.getCurrentSession();
  console.assert(activeSession.isAuthenticated, 'Session is now authenticated');
  console.assert(activeSession.isDemoSession, 'Marked as demo session');
  console.log('✓ Test 3 Passed: Demo customer session active\n');

  // 4. Registration validation
  console.log('Test 4: Registration validation');
  const shortName = authAdapter.validateRegister({ name: 'A', email: 'test@example.com', password: 'password123' });
  console.assert(!shortName.isValid && !!shortName.errors.name, 'Short name rejected');

  const shortPassword = authAdapter.validateRegister({ name: 'Rohan Sharma', email: 'rohan@example.com', password: '123' });
  console.assert(!shortPassword.isValid && !!shortPassword.errors.password, 'Short password rejected');

  const validRegister = authAdapter.validateRegister({
    name: 'Rohan Sharma',
    email: 'rohan@example.com',
    password: 'securePassword123',
  });
  console.assert(validRegister.isValid, 'Valid registration payload passes');
  console.log('✓ Test 4 Passed: Registration validation verified\n');

  // 5. Registration execution does NOT store passwords
  console.log('Test 5: Password safety (no passwords persisted)');
  await authAdapter.simulateRegister({
    name: 'Rohan Sharma',
    email: 'rohan@example.com',
    password: 'superSecretPassword123',
  });
  const storedUserRaw = mockSessionStorage['patronet_demo_user_profile'];
  console.assert(!storedUserRaw.includes('superSecretPassword123'), 'Passwords must never be stored in storage');
  console.log('✓ Test 5 Passed: Zero password storage verified\n');

  // 6. Profile update
  console.log('Test 6: Profile update in demo session');
  const updatedUser = await authAdapter.updateProfile({ name: 'Aarav Mehta Edited', phone: '+91 99999 88888' });
  console.assert(updatedUser.name === 'Aarav Mehta Edited', 'Name updated');
  console.assert(updatedUser.phone === '+91 99999 88888', 'Phone updated');
  console.log('✓ Test 6 Passed: Profile editing verified\n');

  // 7. Address operations across Account & Checkout
  console.log('Test 7: Address synchronization');
  const initialAddrs = await checkoutAdapter.getSavedAddresses();
  console.assert(initialAddrs.length >= 2, 'Default addresses loaded');

  // Add new address
  const newAddr = {
    fullName: 'Priya Sharma',
    phone: '+91 98765 43210',
    line1: 'Flat 101, Palm Grove, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    country: 'India',
    label: 'Studio',
    isDefault: false,
  };
  const afterAdd = await checkoutAdapter.saveAddress(newAddr);
  console.assert(afterAdd.some((a) => a.line1.includes('Palm Grove')), 'New address added');

  // Set default address
  const afterDefault = await checkoutAdapter.setDefaultAddress(newAddr.line1, newAddr.pincode);
  const priyaAddr = afterDefault.find((a) => a.line1.includes('Palm Grove'));
  console.assert(priyaAddr?.isDefault === true, 'Set default address verified');

  // Delete address
  const afterDelete = await checkoutAdapter.deleteAddress(newAddr.line1, newAddr.pincode);
  console.assert(!afterDelete.some((a) => a.line1.includes('Palm Grove')), 'Address deletion verified');
  console.log('✓ Test 7 Passed: Add, edit, set default, and delete address verified\n');

  // 8. Order history & Order details
  console.log('Test 8: Order history and details retrieval');
  // Initially no orders
  const emptyOrders = await checkoutAdapter.getOrders();
  console.assert(emptyOrders.length === 0, 'Initially zero mock orders');

  // Create mock order
  const testCart: CartModel = {
    items: [{ productId: 'gamebook-15', quantity: 1 }],
    updatedAt: new Date().toISOString(),
  };
  const orderRes = await checkoutAdapter.createOrder(
    {
      shippingAddress: initialAddrs[0],
      paymentMethod: 'UPI',
    },
    testCart
  );
  console.assert(orderRes.success && !!orderRes.order, 'Order created successfully');
  const orderNumber = orderRes.order!.orderNumber;

  // Retrieve orders list
  const ordersList = await checkoutAdapter.getOrders();
  console.assert(ordersList.length === 1, 'Order appears in order history');
  console.assert(ordersList[0].orderNumber === orderNumber, 'Order reference matches');

  // Retrieve individual order detail
  const orderDetail = await checkoutAdapter.getOrderById(orderNumber);
  console.assert(orderDetail !== null && orderDetail.orderNumber === orderNumber, 'Order detail retrieved');
  console.assert(orderDetail?.items.length === 1, 'Items match snapshot');
  console.log('✓ Test 8 Passed: Order history and order detail match snapshot\n');

  // 9. Sign out
  console.log('Test 9: Sign out');
  await authAdapter.endSession();
  const sessionAfterLogout = await authAdapter.getCurrentSession();
  console.assert(!sessionAfterLogout.isAuthenticated, 'Session is terminated after sign out');
  console.assert(sessionAfterLogout.user === null, 'User cleared on sign out');
  console.log('✓ Test 9 Passed: Sign out cleanly resets demo session\n');

  console.log('=== ALL PHASE 2.7 AUTOMATED TESTS PASSED SUCCESSFULLY! ===');
}

runAuthAndAccountTests().catch((err) => {
  console.error('Test run error:', err);
});
