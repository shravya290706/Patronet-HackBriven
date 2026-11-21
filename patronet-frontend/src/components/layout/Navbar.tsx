import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  MapPin,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Package,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { productService } from "@/services";
import { SearchSuggestionsDropdown } from "@/components/search/SearchSuggestionsDropdown";
import type { SearchSuggestions, SuggestProduct } from "@/types";

export interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isAccountOpen, setIsAccountOpen] = React.useState(false);
  const accountRef = React.useRef<HTMLDivElement>(null);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const requestIdRef = React.useRef(0);
  const navigate = useNavigate();

  // Search Autocomplete State
  const [suggestions, setSuggestions] = React.useState<SearchSuggestions | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = React.useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  const { itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user, isAuthenticated, endSession } = useAuth();

  // Debounced Search Suggestions with Race Condition Prevention
  React.useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions(null);
      setIsSuggestionsOpen(false);
      setIsSuggestionsLoading(false);
      setHighlightedIndex(-1);
      return;
    }

    const currentReqId = ++requestIdRef.current;
    setIsSuggestionsLoading(true);

    const timer = setTimeout(async () => {
      try {
        if (productService.getSuggestions) {
          const res = await productService.getSuggestions(trimmed, 5);
          // Guard against stale responses overwriting newer search results
          if (currentReqId === requestIdRef.current) {
            setSuggestions(res);
            setIsSuggestionsOpen(true);
            setIsSuggestionsLoading(false);
            setHighlightedIndex(-1);
          }
        }
      } catch {
        if (currentReqId === requestIdRef.current) {
          setIsSuggestionsLoading(false);
        }
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSuggestionsOpen(false);
    setHighlightedIndex(-1);
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/products");
    }
  };

  const handleSelectProduct = (product: SuggestProduct) => {
    setIsSuggestionsOpen(false);
    setHighlightedIndex(-1);
    navigate(`/products/${product.id}`);
  };

  const handleSelectCategory = (categoryName: string) => {
    setIsSuggestionsOpen(false);
    setHighlightedIndex(-1);
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  const handleSelectBrand = (brandName: string) => {
    setIsSuggestionsOpen(false);
    setHighlightedIndex(-1);
    navigate(`/products?brand=${encodeURIComponent(brandName)}`);
  };

  const handleSelectCorrection = (correctionText: string) => {
    setSearchQuery(correctionText);
    setIsSuggestionsOpen(false);
    setHighlightedIndex(-1);
    navigate(`/products?q=${encodeURIComponent(correctionText)}`);
  };

  const handleSelectQuery = (queryText: string) => {
    setIsSuggestionsOpen(false);
    setHighlightedIndex(-1);
    if (queryText.trim()) {
      navigate(`/products?q=${encodeURIComponent(queryText.trim())}`);
    } else {
      navigate("/products");
    }
  };

  // Keyboard navigation through suggestions
  const corrections = suggestions?.corrections || [];
  const products = suggestions?.products || [];
  const categories = suggestions?.categories || [];
  const brands = suggestions?.brands || [];
  const totalNavItems =
    corrections.length + products.length + categories.length + brands.length + 1;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionsOpen || totalNavItems === 0) {
      if (e.key === "Enter") {
        handleSearchSubmit(e);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalNavItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? totalNavItems - 1 : prev - 1));
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsSuggestionsOpen(false);
      setHighlightedIndex(-1);
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0) {
        e.preventDefault();
        let curr = 0;
        // Corrections
        if (highlightedIndex < curr + corrections.length) {
          handleSelectCorrection(corrections[highlightedIndex - curr]);
          return;
        }
        curr += corrections.length;
        // Products
        if (highlightedIndex < curr + products.length) {
          handleSelectProduct(products[highlightedIndex - curr]);
          return;
        }
        curr += products.length;
        // Categories
        if (highlightedIndex < curr + categories.length) {
          handleSelectCategory(categories[highlightedIndex - curr].name);
          return;
        }
        curr += categories.length;
        // Brands
        if (highlightedIndex < curr + brands.length) {
          handleSelectBrand(brands[highlightedIndex - curr]);
          return;
        }
        // Query item
        handleSelectQuery(searchQuery);
        return;
      }
      handleSearchSubmit(e);
    }
  };

  const handleSignOut = async () => {
    setIsAccountOpen(false);
    await endSession();
    navigate("/");
  };

  const departmentLinks = [
    { id: "all", label: "All Departments", href: "/products" },
    { id: "deals", label: "Today's Deals", href: "/products?deals=true" },
    { id: "customer-service", label: "Customer Service", href: "#customer-service" },
    { id: "registry", label: "Registry", href: "#registry" },
    { id: "gift-cards", label: "Gift Cards", href: "#gift-cards" },
    { id: "sell", label: "Sell on Patronet", href: "#sell" },
  ];

  return (
    <header className="sticky top-0 left-0 w-full z-50 bg-surface-container-lowest shadow-header">
      {/* Top Header Row (h-20) */}
      <div className="w-full max-w-7xl mx-auto px-gutter h-20 flex items-center justify-between gap-space-md sm:gap-gutter">
        {/* Left: Hamburger (mobile) + PATRONET Logo */}
        <div className="flex items-center gap-space-sm flex-shrink-0">
          <button
            type="button"
            className="md:hidden p-1.5 -ml-1 text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer"
            aria-label="Toggle navigation menu"
            onClick={onToggleMobileSidebar}
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link
            to="/"
            className="flex items-center group rounded-xl bg-[#042373] px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-xs hover:bg-[#243b8a] transition-colors"
            aria-label="PATRONET Home"
          >
            <img
              src="/patronet-logo.png"
              alt="PATRONET - Unified Retail Marketplace"
              className="h-8 sm:h-9 md:h-10 w-auto max-w-[140px] sm:max-w-[170px] md:max-w-[215px] object-contain"
            />
          </Link>
        </div>

        {/* Center: Search Bar with Autocomplete Dropdown */}
        <div ref={searchContainerRef} className="flex-1 max-w-2xl hidden md:flex items-center relative">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center w-full bg-surface-container-low transition-colors border border-transparent focus-within:border-outline-variant rounded-2xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary"
          >
            <div className="flex items-center text-on-surface-variant pl-space-md">
              <Search className="text-primary w-5 h-5" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) {
                  setIsSuggestionsOpen(true);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search over 1,000,000 products, brands and categories..."
              aria-label="Search catalog"
              aria-expanded={isSuggestionsOpen}
              aria-autocomplete="list"
              className="w-full bg-transparent text-on-surface placeholder:text-outline focus:outline-none py-space-sm px-space-md font-body-md text-body-md"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsSuggestionsOpen(false);
                  setSuggestions(null);
                }}
                aria-label="Clear query text"
                className="p-1 text-outline hover:text-on-surface transition-colors rounded-full hover:bg-surface-container flex items-center justify-center mr-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              aria-label="Submit search"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary-container text-on-secondary hover:bg-secondary transition-all font-label-md text-label-md font-bold shadow-xs cursor-pointer shrink-0 h-10 px-space-md sm:px-space-lg"
            >
              <span>Search</span>
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          <SearchSuggestionsDropdown
            query={searchQuery}
            suggestions={suggestions}
            isLoading={isSuggestionsLoading}
            isOpen={isSuggestionsOpen}
            onClose={() => setIsSuggestionsOpen(false)}
            onSelectProduct={handleSelectProduct}
            onSelectCategory={handleSelectCategory}
            onSelectBrand={handleSelectBrand}
            onSelectCorrection={handleSelectCorrection}
            onSelectQuery={handleSelectQuery}
            highlightedIndex={highlightedIndex}
            dropdownRef={searchContainerRef}
          />
        </div>

        {/* Right: Wishlist, Cart, Account */}
        <div className="flex items-center gap-space-xs sm:gap-space-sm md:gap-space-md flex-shrink-0">
          {/* Wishlist Link */}
          <Link
            to="/wishlist"
            aria-label={wishlistCount > 0 ? `Wishlist (${wishlistCount} items)` : "Wishlist"}
            className="relative p-2 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors rounded-full"
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 text-on-primary">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Link */}
          <Link
            to="/cart"
            aria-label={`Shopping Cart with ${cartCount} items`}
            className="relative p-2 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors rounded-full"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] leading-4 text-on-primary">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* Account Dropdown */}
          <div ref={accountRef} className="relative">
            <button
              type="button"
              onClick={() => setIsAccountOpen((prev) => !prev)}
              className="flex items-center gap-1.5 cursor-pointer pl-space-xs text-on-surface-variant hover:text-on-surface select-none group"
              aria-label="User Account"
              aria-expanded={isAccountOpen}
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline group-hover:text-primary transition-colors overflow-hidden">
                  <User className="h-4 w-4" />
                </div>
                {isAuthenticated && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-secondary-container ring-1 ring-surface-container-lowest" />
                )}
              </div>
              <span className="hidden max-w-24 truncate text-label-sm sm:inline font-medium">
                {isAuthenticated ? user?.name || "Account" : "Sign in"}
              </span>
              <ChevronDown className="h-4 w-4 text-outline group-hover:text-on-surface transition-colors hidden sm:inline" />
            </button>

            {/* Dropdown Menu */}
            {isAccountOpen && (
              <div className="absolute right-0 top-full z-[60] mt-2 w-52 rounded-xl border border-surface-container bg-surface-container-lowest p-2 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                {isAuthenticated ? (
                  <>
                    <div className="px-3 py-2 border-b border-surface-container mb-1">
                      <p className="text-xs font-bold text-on-surface truncate">{user?.name}</p>
                      <p className="text-[11px] text-outline truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/orders"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm hover:bg-surface-container-low text-on-surface transition-colors"
                    >
                      <Package className="h-4 w-4 text-primary" />
                      <span>Your Orders</span>
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm hover:bg-surface-container-low text-on-surface transition-colors"
                    >
                      <Heart className="h-4 w-4 text-primary" />
                      <span>Wishlist</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm text-error hover:bg-error-container/20 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsAccountOpen(false)}
                      className="block w-full text-center rounded-lg bg-primary py-2 px-3 text-label-md font-bold text-on-primary hover:bg-primary-container transition-colors mb-1.5"
                    >
                      Sign In
                    </Link>
                    <p className="text-center text-xs text-outline py-1">
                      New customer?{" "}
                      <Link
                        to="/register"
                        onClick={() => setIsAccountOpen(false)}
                        className="text-primary font-semibold hover:underline"
                      >
                        Start here.
                      </Link>
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subnav Row (h-10 bg-surface-container-low border-t) */}
      <div className="h-10 bg-surface-container-low border-t border-surface-container/60">
        <div className="w-full max-w-7xl mx-auto px-gutter h-full flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant overflow-x-auto no-scrollbar whitespace-nowrap">
          {/* Location Delivery Selector */}
          <button
            type="button"
            className="flex items-center gap-space-xs flex-shrink-0 mr-space-lg select-none cursor-pointer hover:text-primary transition-colors"
            aria-label="Delivery location"
          >
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-label-md text-label-md text-on-surface">
              Select delivery location
            </span>
          </button>

          {/* Department navigation links */}
          <nav aria-label="Department navigation" className="flex items-center gap-space-lg">
            {departmentLinks.map((link) => (
              <Link
                key={link.id}
                to={link.href}
                className="text-on-surface-variant hover:text-primary font-body-sm text-body-sm transition-colors cursor-pointer py-1"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};
