import * as React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ShieldCheck } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface-container-low shadow-header mt-12 border-t border-outline-variant/30">
      <div className="w-full max-w-7xl mx-auto px-gutter py-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-gutter pb-space-lg">
          {/* Column 1: Brand & About */}
          <div className="space-y-space-md lg:col-span-1">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">
                PATRONET
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Unified Retail E-Commerce Marketplace connecting customers with verified sellers and nationwide fulfillment.
            </p>
            <div className="flex items-center gap-space-sm pt-space-xs text-on-surface-variant">
              <ShieldCheck className="h-4 w-4 text-outline" aria-hidden="true" />
              <span className="font-label-sm text-label-sm text-outline">Verified Platform</span>
            </div>
            <p className="font-label-sm text-label-sm text-outline">
              © {new Date().getFullYear()} PATRONET. All rights reserved.
            </p>
          </div>

          {/* Column 2: About Patronet */}
          <div className="space-y-space-sm">
            <h3 className="font-title-md text-title-md text-on-surface font-semibold">
              About Patronet
            </h3>
            <ul className="space-y-space-xs font-body-md text-body-md text-on-surface-variant">
              <li>
                <Link to="/products" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-primary transition-colors">
                  Press & Media
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-primary transition-colors">
                  Patronet Science
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-primary transition-colors">
                  Investor Relations
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Support */}
          <div className="space-y-space-sm">
            <h3 className="font-title-md text-title-md text-on-surface font-semibold">
              Customer Support
            </h3>
            <ul className="space-y-space-xs font-body-md text-body-md text-on-surface-variant">
              <li>
                <Link to="/products" className="hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-primary transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-primary transition-colors">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-primary transition-colors">
                  Returns & Replacements
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-primary transition-colors">
                  Order Cancellation
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div className="space-y-space-sm">
            <h3 className="font-title-md text-title-md text-on-surface font-semibold">
              Contact Info
            </h3>
            <ul className="space-y-space-xs font-body-md text-body-md text-on-surface-variant">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-outline flex-shrink-0" />
                <span>support@patronet.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-outline flex-shrink-0" />
                <span>1800-PATRONET (Toll-Free)</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-outline flex-shrink-0 mt-0.5" />
                <span>Nationwide Hub, India</span>
              </li>
            </ul>
          </div>

          {/* Column 5: Make Money with Us */}
          <div className="space-y-space-sm">
            <h3 className="font-title-md text-title-md text-on-surface font-semibold">
              Make Money with Us
            </h3>
            <ul className="space-y-space-xs font-body-md text-body-md text-on-surface-variant">
              <li>
                <Link to="/procurement" className="hover:text-primary transition-colors font-medium text-primary">
                  Sell on Patronet
                </Link>
              </li>
              <li>
                <Link to="/procurement" className="hover:text-primary transition-colors">
                  Supply in Bulk
                </Link>
              </li>
              <li>
                <Link to="/procurement" className="hover:text-primary transition-colors">
                  Fulfillment Partners
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
