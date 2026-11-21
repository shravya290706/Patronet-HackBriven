import * as React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Scale, Layers } from "lucide-react";

export const AIFeatureSection: React.FC = () => {
  return (
    <section className="max-w-[1360px] mx-auto px-4 md:px-6 xl:px-12 pb-12 lg:pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Prominent Feature: AI Shopping (7 Columns, Deep Black) */}
        <article className="lg:col-span-7 bg-deep-black text-on-deep-black rounded-sm p-6 lg:p-12 flex flex-col justify-between gap-8">
          <div className="flex flex-col gap-4 max-w-lg">
            <Sparkles className="w-6 h-6 text-primary-orange" aria-hidden="true" />
            <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-deep-black text-balance">
              AI Shopping Assistant.
            </h2>
            <p className="font-body text-base lg:text-lg text-on-surface-dark-elevated text-pretty opacity-90">
              Skip endless spec filters. Describe your workload, display expectations, and budget in plain English to get exact hardware recommendations.
            </p>
          </div>
          <div>
            <Link
              to="/ai-shopping"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-primary-orange text-deep-black font-label text-base font-semibold hover:bg-primary-orange-hover transition-colors duration-150"
            >
              <span>Try AI Search</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </article>

        {/* Two Stacked Supporting Features (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Supporting Feature 1: Product Comparison */}
          <article className="flex-1 bg-light-gray text-deep-black rounded-sm p-6 lg:p-8 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Scale className="w-5 h-5 text-deep-black" aria-hidden="true" />
              <h3 className="font-headline text-xl font-bold text-on-pure-white">
                Product Comparison
              </h3>
              <p className="font-body text-sm md:text-base text-muted-gray text-pretty">
                Evaluate thermal headroom, color gamut, battery endurance, and I/O ports side-by-side before you buy.
              </p>
            </div>
            <Link
              to="/compare"
              className="inline-flex items-center gap-1 font-label text-base font-semibold text-deep-black hover:text-accent-orange-text transition-colors duration-150"
            >
              <span>Compare specifications</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </article>

          {/* Supporting Feature 2: Bulk Procurement */}
          <article className="flex-1 bg-pure-white text-on-pure-white border border-outline-subtle rounded-sm p-6 lg:p-8 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Layers className="w-5 h-5 text-deep-black" aria-hidden="true" />
              <h3 className="font-headline text-xl font-bold text-on-pure-white">
                Bulk Procurement
              </h3>
              <p className="font-body text-sm md:text-base text-muted-gray text-pretty">
                Request verified supplier quotations, GST-compliant invoicing, and scheduled pan-India fleet deployment.
              </p>
            </div>
            <Link
              to="/procurement"
              className="inline-flex items-center gap-1 font-label text-base font-semibold text-deep-black hover:text-accent-orange-text transition-colors duration-150"
            >
              <span>Request quotation</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
};
