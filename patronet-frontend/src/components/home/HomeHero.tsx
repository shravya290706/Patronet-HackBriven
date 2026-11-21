import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Truck,
  RotateCcw,
  ShieldCheck,
  Store,
} from "lucide-react";

export interface HeroSlide {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaPrimaryText: string;
  ctaSecondaryText: string;
  targetCategory?: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    tag: "Seasonal Selection",
    title: "Living & Tech Essentials",
    subtitle: "Explore Curated Home & Personal Electronics",
    description:
      "Discover verified electronics, computing accessories, and everyday essentials delivered across supported regions.",
    imageUrl:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=700&q=80",
    ctaPrimaryText: "Explore Catalog",
    ctaSecondaryText: "View Categories",
    targetCategory: "electronics",
  },
  {
    id: "slide-2",
    tag: "Audio Collection",
    title: "Studio Audio & Sound",
    subtitle: "Acoustic Hardware & Headphones",
    description:
      "Explore wireless noise-cancelling headphones and studio monitoring equipment from featured audio brands.",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",
    ctaPrimaryText: "View Details",
    ctaSecondaryText: "Audio Collection",
    targetCategory: "electronics",
  },
];

export const HomeHero: React.FC = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState(0);
  const navigate = useNavigate();
  const currentSlide = HERO_SLIDES[currentSlideIndex];

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
  };

  const handleScrollToCategories = () => {
    const el = document.getElementById("popular-categories");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/products");
    }
  };

  return (
    <div className="space-y-space-md">
      {/* Hero Carousel Banner Card */}
      <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#EBF2FA] via-[#F4F7FB] to-[#FAF7F2] p-space-lg sm:p-space-xl overflow-hidden min-h-[380px] flex flex-col justify-between border border-surface-container/70 shadow-sm">
        {/* Ambient Glow */}
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-primary-fixed/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Text Block */}
          <div className="lg:col-span-7 max-w-xl space-y-space-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-semibold shadow-xs">
              <span>{currentSlide.tag}</span>
            </div>
            <h1 className="font-display-sm sm:font-display-lg text-display-sm sm:text-display-lg text-primary font-bold tracking-tight pt-1">
              {currentSlide.title}
            </h1>
            <p className="font-headline-sm text-headline-sm text-secondary-container font-semibold">
              {currentSlide.subtitle}
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md pt-1">
              {currentSlide.description}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-space-sm sm:gap-space-md pt-space-md">
              <Link
                to="/products"
                className="inline-flex items-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary font-label-md text-label-md font-bold transition-all shadow-sm cursor-pointer"
              >
                <span>{currentSlide.ctaPrimaryText}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={handleScrollToCategories}
                className="inline-flex items-center gap-space-xs px-space-lg py-2.5 rounded-lg border border-surface-container/80 bg-surface-container-lowest/80 hover:bg-surface-container-lowest text-primary font-label-md text-label-md font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>{currentSlide.ctaSecondaryText}</span>
              </button>
            </div>
          </div>

          {/* Right Product Plinth Card with Carousel Controls */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[340px] aspect-[4/3] sm:aspect-square bg-surface-container-lowest/90 rounded-2xl p-4 shadow-md border border-surface-container/60 flex items-center justify-center overflow-hidden">
              <img
                src={currentSlide.imageUrl}
                alt={currentSlide.title}
                className="w-full h-full object-contain p-2 rounded-xl transition-all duration-300"
              />

              {/* Navigation Arrows */}
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous slide"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface-container-lowest/90 border border-surface-container shadow-sm flex items-center justify-center text-primary hover:bg-surface-container transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next slide"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface-container-lowest/90 border border-surface-container shadow-sm flex items-center justify-center text-primary hover:bg-surface-container transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="relative z-10 flex items-center gap-1.5 pt-space-md">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrentSlideIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                idx === currentSlideIndex
                  ? "w-6 bg-primary"
                  : "w-2 bg-surface-container-highest hover:bg-outline"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 4 Feature Badges in a Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm sm:gap-space-md">
        {/* Badge 1 */}
        <div className="flex items-center gap-space-sm p-space-md rounded-xl bg-surface-container-lowest border border-surface-container/60 shadow-xs">
          <Truck className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="font-label-md text-label-md font-bold text-on-surface truncate">
              Order Delivery
            </h4>
            <p className="font-body-sm text-body-sm text-outline truncate">
              Standard shipping
            </p>
          </div>
        </div>

        {/* Badge 2 */}
        <div className="flex items-center gap-space-sm p-space-md rounded-xl bg-surface-container-lowest border border-surface-container/60 shadow-xs">
          <RotateCcw className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="font-label-md text-label-md font-bold text-on-surface truncate">
              Return Policy
            </h4>
            <p className="font-body-sm text-body-sm text-outline truncate">
              Eligible product returns
            </p>
          </div>
        </div>

        {/* Badge 3 */}
        <div className="flex items-center gap-space-sm p-space-md rounded-xl bg-surface-container-lowest border border-surface-container/60 shadow-xs">
          <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="font-label-md text-label-md font-bold text-on-surface truncate">
              Direct Brands
            </h4>
            <p className="font-body-sm text-body-sm text-outline truncate">
              Catalog products
            </p>
          </div>
        </div>

        {/* Badge 4 */}
        <div className="flex items-center gap-space-sm p-space-md rounded-xl bg-surface-container-lowest border border-surface-container/60 shadow-xs">
          <Store className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="font-label-md text-label-md font-bold text-on-surface truncate">
              Store Partners
            </h4>
            <p className="font-body-sm text-body-sm text-outline truncate">
              Registered sellers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
