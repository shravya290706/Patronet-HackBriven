import * as React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";

export const PartnerBanner: React.FC = () => {
  return (
    <section className="w-full rounded-2xl bg-gradient-to-r from-primary via-primary-container to-[#1a2d6b] p-space-md sm:p-space-lg text-on-primary shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md border border-primary-container">
      <div className="flex items-center gap-space-md">
        <div className="h-12 w-12 rounded-xl bg-surface-container-lowest/15 backdrop-blur-xs flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-6 w-6 text-secondary-container" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary-fixed font-label-sm text-label-sm font-semibold mb-1">
            <span>Partner Highlight</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-primary">
            Payment Partner Offers
          </h3>
          <p className="font-body-sm text-body-sm text-on-primary-container mt-0.5">
            Explore available discount perks and financing programs at checkout
          </p>
        </div>
      </div>

      <Link
        to="/products"
        className="inline-flex items-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary font-label-md text-label-md font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0"
      >
        <span>Learn More</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
};
