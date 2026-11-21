import * as React from "react";
import { Link } from "react-router-dom";
import { Container } from "./Container";

export const Footer: React.FC = () => {
  return (
    <footer id="footer" className="bg-deep-black text-on-deep-black mt-auto">
      <Container className="py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-outline-dark">
          {/* Brand Column */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <span className="font-headline text-2xl font-bold tracking-tight text-on-deep-black">
              PATRONET
            </span>
            <p className="font-body text-body-md text-on-surface-dark-elevated max-w-xs text-pretty opacity-80">
              Precision electronics and AI-assisted hardware discovery for creators, gamers, and teams across India.
            </p>
          </div>

          {/* Shop */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <h3 className="font-label text-label-md font-semibold text-on-deep-black tracking-wide uppercase">
              Shop
            </h3>
            <ul className="flex flex-col gap-2 font-body text-body-md text-on-surface-dark-elevated opacity-80">
              <li>
                <Link to="/products?category=laptops" className="hover:text-primary-orange transition-colors duration-150">
                  Laptops
                </Link>
              </li>
              <li>
                <Link to="/products?category=audio" className="hover:text-primary-orange transition-colors duration-150">
                  Audio
                </Link>
              </li>
              <li>
                <Link to="/products?category=monitors" className="hover:text-primary-orange transition-colors duration-150">
                  Monitors
                </Link>
              </li>
              <li>
                <Link to="/products?category=wearables" className="hover:text-primary-orange transition-colors duration-150">
                  Wearables
                </Link>
              </li>
              <li>
                <Link to="/products?category=gaming" className="hover:text-primary-orange transition-colors duration-150">
                  Gaming
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <h3 className="font-label text-label-md font-semibold text-on-deep-black tracking-wide uppercase">
              Support
            </h3>
            <ul className="flex flex-col gap-2 font-body text-body-md text-on-surface-dark-elevated opacity-80">
              <li>
                <a href="#help" className="hover:text-primary-orange transition-colors duration-150">
                  Help Center
                </a>
              </li>
              <li>
                <Link to="/orders" className="hover:text-primary-orange transition-colors duration-150">
                  Track Order
                </Link>
              </li>
              <li>
                <a href="#warranty" className="hover:text-primary-orange transition-colors duration-150">
                  Warranty &amp; Service
                </a>
              </li>
              <li>
                <Link to="/procurement" className="hover:text-primary-orange transition-colors duration-150">
                  Bulk Procurement
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <h3 className="font-label text-label-md font-semibold text-on-deep-black tracking-wide uppercase">
              Account
            </h3>
            <ul className="flex flex-col gap-2 font-body text-body-md text-on-surface-dark-elevated opacity-80">
              <li>
                <Link to="/account" className="hover:text-primary-orange transition-colors duration-150">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-primary-orange transition-colors duration-150">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-primary-orange transition-colors duration-150">
                  Compare Studio
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-primary-orange transition-colors duration-150">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <h3 className="font-label text-label-md font-semibold text-on-deep-black tracking-wide uppercase">
              Policies
            </h3>
            <ul className="flex flex-col gap-2 font-body text-body-md text-on-surface-dark-elevated opacity-80">
              <li>
                <a href="#privacy" className="hover:text-primary-orange transition-colors duration-150">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-primary-orange transition-colors duration-150">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#shipping" className="hover:text-primary-orange transition-colors duration-150">
                  Shipping Policy
                </a>
              </li>
              <li>
                <a href="#returns" className="hover:text-primary-orange transition-colors duration-150">
                  Returns &amp; Refunds
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-label text-label-sm text-on-surface-dark-elevated opacity-70">
          <span>&copy; 2026 PATRONET. All rights reserved.</span>
          <span>Precision Electronics &middot; India</span>
        </div>
      </Container>
    </footer>
  );
};
