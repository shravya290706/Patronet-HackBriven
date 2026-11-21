import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Package,
  Search,
  Layers,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Heart,
  User,
  LogOut,
  X,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { categoryService, type CategoryItem } from "@/services/api/categoryService";

export interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onCloseMobile }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = React.useState(true);
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  const { itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user, isAuthenticated, endSession } = useAuth();

  React.useEffect(() => {
    let active = true;
    categoryService
      .getCategories()
      .then((cats) => {
        if (active && cats.length > 0) {
          setCategories(cats);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const searchParams = new URLSearchParams(location.search);
  const activeCategory = searchParams.get("category");

  const isHomeActive = location.pathname === "/";
  const isProductsActive = location.pathname === "/products" && !activeCategory;
  const isCartActive = location.pathname === "/cart";
  const isWishlistActive = location.pathname === "/wishlist";

  const handleCategoryClick = (catName: string) => {
    navigate(`/products?category=${encodeURIComponent(catName.toLowerCase())}`);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (collapsed: boolean) => (
    <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
      {/* Group 1: BROWSE */}
      <div className="space-y-1">
        {!collapsed && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-outline px-3 pb-1">
            Browse
          </p>
        )}

        {/* Home */}
        <Link
          to="/"
          onClick={onCloseMobile}
          title={collapsed ? "Home" : undefined}
          className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 cursor-pointer select-none ${
            collapsed ? "justify-center p-2.5" : "px-3.5 py-2.5"
          } ${
            isHomeActive
              ? "bg-primary text-on-primary font-bold shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium"
          }`}
        >
          <Home className={`flex-shrink-0 ${collapsed ? "h-5 w-5" : "h-4 w-4"}`} />
          {!collapsed && <span className="flex-1 truncate text-label-md">Home</span>}
        </Link>

        {/* Products */}
        <Link
          to="/products"
          onClick={onCloseMobile}
          title={collapsed ? "Products" : undefined}
          className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 cursor-pointer select-none ${
            collapsed ? "justify-center p-2.5" : "px-3.5 py-2.5"
          } ${
            isProductsActive
              ? "bg-primary text-on-primary font-bold shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium"
          }`}
        >
          <Package className={`flex-shrink-0 ${collapsed ? "h-5 w-5" : "h-4 w-4"}`} />
          {!collapsed && <span className="flex-1 truncate text-label-md">Products</span>}
        </Link>

        {/* Search */}
        <Link
          to="/products"
          onClick={onCloseMobile}
          title={collapsed ? "Search" : undefined}
          className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 cursor-pointer select-none ${
            collapsed ? "justify-center p-2.5" : "px-3.5 py-2.5"
          } text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium`}
        >
          <Search className={`flex-shrink-0 ${collapsed ? "h-5 w-5" : "h-4 w-4"}`} />
          {!collapsed && <span className="flex-1 truncate text-label-md">Search</span>}
        </Link>

        {/* Categories Collapsible */}
        {collapsed ? (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              title="Categories"
              className="w-full flex items-center justify-center p-2.5 rounded-xl transition-all duration-150 cursor-pointer select-none text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium"
            >
              <Layers className="h-5 w-5 flex-shrink-0" />
            </button>
          </div>
        ) : (
          <div className="space-y-1 pt-1">
            <button
              type="button"
              onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer group"
              aria-expanded={isCategoriesExpanded}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Layers className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="text-label-md font-semibold text-on-surface truncate">
                  Categories
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {categories.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant leading-none">
                    {categories.length}
                  </span>
                )}
                {isCategoriesExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-outline group-hover:text-on-surface transition-transform" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-outline group-hover:text-on-surface transition-transform" />
                )}
              </div>
            </button>

            {isCategoriesExpanded && (
              <div className="pl-3 pr-1 space-y-0.5 max-h-56 overflow-y-auto no-scrollbar py-0.5">
                {categories.map((cat) => {
                  const isCatSelected =
                    activeCategory &&
                    activeCategory.toLowerCase() === cat.name.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryClick(cat.name)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer text-left select-none min-w-0 ${
                        isCatSelected
                          ? "bg-primary text-on-primary font-bold shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium"
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Group 2: ACTIVITY */}
      <div className="space-y-1 border-t border-surface-container/60 pt-3">
        {!collapsed && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-outline px-3 pb-1">
            Activity
          </p>
        )}

        {/* Cart */}
        <Link
          to="/cart"
          onClick={onCloseMobile}
          title={collapsed ? `Cart (${cartCount})` : undefined}
          className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 cursor-pointer select-none ${
            collapsed ? "justify-center p-2.5" : "px-3.5 py-2.5"
          } ${
            isCartActive
              ? "bg-primary text-on-primary font-bold shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium"
          }`}
        >
          <ShoppingCart className={`flex-shrink-0 ${collapsed ? "h-5 w-5" : "h-4 w-4"}`} />
          {!collapsed && <span className="flex-1 truncate text-label-md">Cart</span>}
          {cartCount > 0 && !collapsed && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center leading-none ${
                isCartActive ? "bg-on-primary text-primary" : "bg-primary text-on-primary"
              }`}
            >
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>

        {/* Wishlist */}
        <Link
          to="/wishlist"
          onClick={onCloseMobile}
          title={collapsed ? `Wishlist (${wishlistCount})` : undefined}
          className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 cursor-pointer select-none ${
            collapsed ? "justify-center p-2.5" : "px-3.5 py-2.5"
          } ${
            isWishlistActive
              ? "bg-primary text-on-primary font-bold shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium"
          }`}
        >
          <Heart className={`flex-shrink-0 ${collapsed ? "h-5 w-5" : "h-4 w-4"}`} />
          {!collapsed && <span className="flex-1 truncate text-label-md">Wishlist</span>}
          {wishlistCount > 0 && !collapsed && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center leading-none ${
                isWishlistActive ? "bg-on-primary text-primary" : "bg-primary text-on-primary"
              }`}
            >
              {wishlistCount > 99 ? "99+" : wishlistCount}
            </span>
          )}
        </Link>
      </div>

      {/* Group 3: ACCOUNT */}
      <div className="space-y-1 border-t border-surface-container/60 pt-3">
        {!collapsed && (
          <p className="text-[10px] font-bold uppercase tracking-wider text-outline px-3 pb-1">
            Account
          </p>
        )}

        {isAuthenticated ? (
          <div>
            {!collapsed && (
              <div className="px-3 py-2 rounded-xl bg-surface-container-low/60 flex items-center gap-2.5 mb-1 border border-surface-container/60">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">{user?.name || "Customer"}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Signed In</p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={endSession}
              title={collapsed ? "Sign Out" : undefined}
              className={`w-full flex items-center gap-3 rounded-xl text-error hover:bg-error-container/20 transition-colors font-medium text-left cursor-pointer ${
                collapsed ? "justify-center p-2.5" : "px-3.5 py-2"
              }`}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="text-label-md">Sign Out</span>}
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            onClick={onCloseMobile}
            title={collapsed ? "Sign In" : undefined}
            className={`w-full flex items-center gap-3 rounded-xl transition-colors font-medium text-left cursor-pointer select-none ${
              collapsed ? "justify-center p-2.5" : "px-3.5 py-2"
            } text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low`}
          >
            <User className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="text-label-md">Sign In</span>}
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 border-r border-surface-container bg-surface-container-lowest sticky top-20 h-[calc(100vh-5rem)] z-30 transition-all duration-200 select-none ${
          isCollapsed ? "w-18 px-2 py-4" : "w-60 lg:w-64 px-3.5 py-4"
        }`}
        aria-label="Application sidebar"
      >
        {/* Header: MENU + Collapse Toggle */}
        <div
          className={`flex items-center pb-3 border-b border-surface-container/70 mb-3 ${
            isCollapsed ? "justify-center" : "justify-between px-1"
          }`}
        >
          {!isCollapsed && (
            <span className="text-xs font-bold uppercase tracking-wider text-outline">
              Menu
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Groups */}
        {navContent(isCollapsed)}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] bg-surface-container-lowest h-full shadow-2xl flex flex-col p-4 z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-3">
              <span className="font-bold text-on-surface text-title-md">Navigation</span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navContent(false)}
          </div>
        </div>
      )}
    </>
  );
};
