import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CategoryTile } from "./CategoryTile";

export const CategoryGrid: React.FC = () => {
  return (
    <section id="categories" className="max-w-[1360px] mx-auto px-4 md:px-6 xl:px-12 py-12 lg:py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-outline-subtle mb-8">
        <div>
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-pure-white">
            Hardware departments.
          </h2>
          <p className="font-body text-sm md:text-base text-muted-gray mt-1">
            Engineered systems across computing, sound, and desk architecture.
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1 font-label text-base font-semibold text-on-pure-white hover:text-accent-orange-text transition-colors duration-150 shrink-0"
        >
          <span>View full catalog</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Row 1: Asymmetric 7 / 5 Split */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        <CategoryTile
          to="/products?category=laptops"
          title="Laptops"
          subtitle="Ultrabooks & creator workstations"
          imageUrl="/images/categories/laptops.svg"
          imageAlt="PATRONET Laptops"
          aspectClass="aspect-[16/10]"
          className="md:col-span-7"
          isLargeTitle={true}
        />

        <CategoryTile
          to="/products?category=audio"
          title="Audio"
          subtitle="Studio ANC & reference sound"
          imageUrl="/images/categories/audio.svg"
          imageAlt="PATRONET Studio Audio"
          aspectClass="aspect-[16/10] md:aspect-[4/3]"
          className="md:col-span-5"
          isLargeTitle={true}
        />
      </div>

      {/* Row 2: Structured 3-Column Studio Grid (4 / 4 / 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <CategoryTile
          to="/products?category=monitors"
          title="Monitors"
          subtitle="QHD & 4K IPS"
          imageUrl="/images/categories/monitors.svg"
          imageAlt="PATRONET QHD Monitors"
          aspectClass="aspect-square"
        />

        <CategoryTile
          to="/products?category=wearables"
          title="Wearables"
          subtitle="AMOLED watches"
          imageUrl="/images/categories/wearables.svg"
          imageAlt="PATRONET Wearables"
          aspectClass="aspect-square"
        />

        <CategoryTile
          to="/products?category=accessories"
          title="Accessories"
          subtitle="Keyboards & docks"
          imageUrl="/images/categories/accessories.svg"
          imageAlt="PATRONET Desk Accessories"
          aspectClass="aspect-square"
        />
      </div>

      {/* Row 3: Dark Editorial Gaming Feature Band */}
      <Link
        to="/products?category=gaming"
        className="group grid grid-cols-1 lg:grid-cols-12 items-center bg-deep-black text-on-deep-black rounded-sm overflow-hidden"
      >
        <div className="lg:col-span-5 p-6 lg:p-12 flex flex-col justify-center gap-4">
          <h3 className="font-headline text-2xl lg:text-3xl font-bold text-on-deep-black text-balance">
            Gaming hardware.
          </h3>
          <p className="font-body text-base lg:text-lg text-on-surface-dark-elevated max-w-md text-pretty opacity-90">
            Low-latency wireless controllers, mechanical switches, and high-refresh displays tuned for competitive play.
          </p>
          <span className="inline-flex items-center gap-1.5 font-label text-base font-semibold text-primary-orange pt-2">
            <span>Explore Gaming</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </span>
        </div>
        <div className="lg:col-span-7 aspect-[16/9] w-full bg-surface-dark-elevated overflow-hidden">
          <img
            src="/images/categories/gaming.svg"
            alt="PATRONET Pro Wireless Gaming Controller"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
            loading="lazy"
          />
        </div>
      </Link>
    </section>
  );
};
