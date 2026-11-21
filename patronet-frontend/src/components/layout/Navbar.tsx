import * as React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, User, Heart, ShoppingCart, Menu, X, LogOut } from "lucide-react";
import { Container } from "./Container";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user, isAuthenticated, endSession } = useAuth();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await endSession();
    navigate('/');
  };

  const navLinks = [
    { label: "Shop All", href: "/products" },
    { label: "Electronics", href: "/products?category=electronics" },
    { label: "Computers", href: "/products?category=computers" },
    { label: "Audio", href: "/products?category=audio" },
    { label: "Deals", href: "/products?category=deals", isDeal: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-pure-white border-b border-outline-subtle">
      <Container>
        <div className="h-[64px] flex items-center justify-between gap-4 md:gap-6">
          {/* Left: Mobile hamburger & Bold PATRONET Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden inline-flex items-center justify-center w-8 h-8 text-on-pure-white hover:text-muted-gray focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-orange rounded-sm cursor-pointer"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link
              to="/"
              className="font-headline text-lg md:text-xl font-bold tracking-tight text-on-pure-white hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-orange rounded-xs"
            >
              PATRONET
            </Link>
          </div>

          {/* Center: Carefully Spaced Category Navigation (Desktop) */}
          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.href}
                className={({ isActive }) =>
                  `font-label text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-orange rounded-xs ${
                    link.isDeal
                      ? "text-accent-orange-text hover:text-primary-orange-hover"
                      : isActive
                      ? "text-on-pure-white border-b-2 border-primary-orange pb-0.5"
                      : "text-on-pure-white hover:text-muted-gray"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Search Input + Account, Wishlist, Cart */}
          <div className="flex items-center gap-3 shrink-0">
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-sm bg-light-gray border border-outline-subtle focus-within:border-deep-black focus-within:ring-2 focus-within:ring-primary-orange/20 w-48 lg:w-56 transition-colors duration-150"
              role="search"
            >
              <Search className="w-3.5 h-3.5 text-muted-gray shrink-0" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog"
                aria-label="Search PATRONET catalog"
                className="w-full bg-transparent border-0 p-0 font-body text-sm text-on-pure-white placeholder:text-muted-gray focus:outline-none"
              />
            </form>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Account Link / Indicator */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Link
                    to="/account"
                    aria-label="My Account"
                    className="inline-flex items-center gap-1.5 h-8 px-2 rounded-sm text-on-pure-white hover:bg-light-gray border border-outline-subtle transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-orange"
                  >
                    <User className="w-4 h-4 text-primary-orange shrink-0" aria-hidden="true" />
                    <span className="font-label text-xs font-semibold max-w-[80px] sm:max-w-[110px] truncate hidden sm:inline">
                      {user.name.split(' ')[0]}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    aria-label="Sign out"
                    title="Sign out of demo session"
                    className="inline-flex items-center justify-center w-8 h-8 text-muted-gray hover:text-accent-orange-text transition-colors duration-150 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-orange cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  aria-label="Sign In"
                  className="inline-flex items-center justify-center w-8 h-8 text-on-pure-white hover:text-muted-gray transition-colors duration-150 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-orange"
                >
                  <User className="w-4.5 h-4.5" aria-hidden="true" />
                </Link>
              )}

              {/* Wishlist Link with pill count badge */}
              <Link
                to="/wishlist"
                aria-label="Wishlist"
                className="inline-flex items-center justify-center w-8 h-8 text-on-pure-white hover:text-muted-gray transition-colors duration-150 rounded-sm relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-orange"
              >
                <Heart className="w-4.5 h-4.5" aria-hidden="true" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 px-1 bg-primary-orange text-deep-black text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums shadow-xs leading-none">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Link with pill count badge */}
              <Link
                to="/cart"
                aria-label="Shopping cart"
                className="inline-flex items-center justify-center w-8 h-8 text-on-pure-white hover:text-muted-gray transition-colors duration-150 rounded-sm relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-orange"
              >
                <ShoppingCart className="w-4.5 h-4.5" aria-hidden="true" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4.5 px-1 bg-primary-orange text-deep-black text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums shadow-xs leading-none">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-outline-subtle py-3 px-2 space-y-3 bg-pure-white animate-in slide-in-from-top-2 duration-150">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-light-gray border border-outline-subtle focus-within:ring-2 focus-within:ring-primary-orange">
              <Search className="w-4 h-4 text-muted-gray shrink-0" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog"
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </form>
            <nav className="flex flex-col space-y-1.5">
              {navLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-sm font-label text-sm font-medium transition-colors ${
                      link.isDeal
                        ? "text-accent-orange-text font-semibold"
                        : isActive
                        ? "bg-light-gray text-on-pure-white font-semibold"
                        : "text-on-pure-white hover:bg-light-gray"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="pt-2 border-t border-outline-subtle flex flex-col space-y-1">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/account"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-1.5 rounded-sm font-label text-sm text-on-pure-white hover:bg-light-gray flex items-center justify-between"
                    >
                      <span>My Account ({user?.name})</span>
                      <User className="w-4 h-4 text-primary-orange" />
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-3 py-1.5 rounded-sm font-label text-sm text-on-pure-white hover:bg-light-gray"
                    >
                      Your Orders
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-left px-3 py-1.5 rounded-sm font-label text-sm text-accent-orange-text hover:bg-light-gray"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-1.5 rounded-sm font-label text-sm text-on-pure-white hover:bg-light-gray"
                  >
                    Sign In / Register
                  </Link>
                )}
                <Link
                  to="/ai-shopping"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-sm font-label text-sm text-on-pure-white hover:bg-light-gray"
                >
                  AI Shopping Assistant
                </Link>
                <Link
                  to="/compare"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-sm font-label text-sm text-on-pure-white hover:bg-light-gray"
                >
                  AI Comparison Studio
                </Link>
                <Link
                  to="/procurement"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-sm font-label text-sm text-on-pure-white hover:bg-light-gray"
                >
                  Bulk Procurement
                </Link>
              </div>
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
};
