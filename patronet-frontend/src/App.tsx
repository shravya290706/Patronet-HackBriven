import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";

// Eagerly load primary storefront entry pages
import { HomePage } from "./pages/HomePage";
import { ProductsPage } from "./pages/ProductsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

// Route-level code-splitting for secondary, transactional, and AI discovery routes
const ProductDetailPage = lazy(() =>
  import("./pages/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage }))
);
const CartPage = lazy(() =>
  import("./pages/CartPage").then((m) => ({ default: m.CartPage }))
);
const CheckoutPage = lazy(() =>
  import("./pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage }))
);
const OrderConfirmationPage = lazy(() =>
  import("./pages/OrderConfirmationPage").then((m) => ({ default: m.OrderConfirmationPage }))
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const AccountPage = lazy(() =>
  import("./pages/AccountPage").then((m) => ({ default: m.AccountPage }))
);
const OrdersPage = lazy(() =>
  import("./pages/OrdersPage").then((m) => ({ default: m.OrdersPage }))
);
const OrderDetailPage = lazy(() =>
  import("./pages/OrderDetailPage").then((m) => ({ default: m.OrderDetailPage }))
);
const WishlistPage = lazy(() =>
  import("./pages/WishlistPage").then((m) => ({ default: m.WishlistPage }))
);
const AIShoppingPage = lazy(() =>
  import("./pages/AIShoppingPage").then((m) => ({ default: m.AIShoppingPage }))
);
const ComparePage = lazy(() =>
  import("./pages/ComparePage").then((m) => ({ default: m.ComparePage }))
);
const ProcurementPage = lazy(() =>
  import("./pages/ProcurementPage").then((m) => ({ default: m.ProcurementPage }))
);
const ProcurementProgressPage = lazy(() =>
  import("./pages/ProcurementProgressPage").then((m) => ({ default: m.ProcurementProgressPage }))
);
const ProcurementOffersPage = lazy(() =>
  import("./pages/ProcurementOffersPage").then((m) => ({ default: m.ProcurementOffersPage }))
);

/**
 * Branded route suspense fallback loader following Stitch minimal guidelines
 */
const RouteLoadingFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    className="min-h-[50vh] w-full flex flex-col items-center justify-center gap-3"
  >
    <div className="w-8 h-8 rounded-full border-2 border-outline-subtle border-t-primary-orange animate-spin" />
    <span className="font-label text-xs uppercase tracking-widest text-muted-gray">
      Loading PATRONET...
    </span>
  </div>
);

export function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Core Storefront (Eager) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />

        {/* Product Detail (Lazy) */}
        <Route
          path="/products/:id"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <ProductDetailPage />
            </Suspense>
          }
        />

        {/* Cart & Checkout (Lazy) */}
        <Route
          path="/cart"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <CartPage />
            </Suspense>
          }
        />
        <Route
          path="/checkout"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <CheckoutPage />
            </Suspense>
          }
        />
        <Route
          path="/order-confirmation/:id"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <OrderConfirmationPage />
            </Suspense>
          }
        />

        {/* Customer Accounts & Auth (Lazy) */}
        <Route
          path="/login"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="/register"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <RegisterPage />
            </Suspense>
          }
        />
        <Route
          path="/account"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AccountPage />
            </Suspense>
          }
        />
        <Route
          path="/orders"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <OrdersPage />
            </Suspense>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <OrderDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/wishlist"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <WishlistPage />
            </Suspense>
          }
        />

        {/* AI Discovery & Sourcing Features (Lazy) */}
        <Route
          path="/ai-shopping"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <AIShoppingPage />
            </Suspense>
          }
        />
        <Route
          path="/compare"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <ComparePage />
            </Suspense>
          }
        />
        <Route
          path="/procurement"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <ProcurementPage />
            </Suspense>
          }
        />
        <Route
          path="/procurement/:id/progress"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <ProcurementProgressPage />
            </Suspense>
          }
        />
        <Route
          path="/procurement/:id/offers"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <ProcurementOffersPage />
            </Suspense>
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
