import { Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import {
  HomePage,
  ProductsPage,
  ProductDetailPage,
  CartPage,
  CheckoutPage,
  OrderConfirmationPage,
  LoginPage,
  RegisterPage,
  AccountPage,
  OrdersPage,
  OrderDetailPage,
  WishlistPage,
  AIShoppingPage,
  ComparePage,
  ProcurementPage,
  ProcurementProgressPage,
  ProcurementOffersPage,
  NotFoundPage,
} from "./pages";

export function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Core Storefront */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />

        {/* Cart & Checkout */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />

        {/* Customer Accounts & Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />

        {/* AI Discovery & Sourcing Features */}
        <Route path="/ai-shopping" element={<AIShoppingPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/procurement" element={<ProcurementPage />} />
        <Route path="/procurement/:id/progress" element={<ProcurementProgressPage />} />
        <Route path="/procurement/:id/offers" element={<ProcurementOffersPage />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
