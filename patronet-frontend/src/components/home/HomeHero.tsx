import * as React from "react";
import { ArrowRight } from "lucide-react";

export const HomeHero: React.FC = () => {
  const [heroSrc, setHeroSrc] = React.useState<string>("/images/hero/hero.png");

  const handleScrollToBestsellers = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById("bestsellers");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScrollToAiDiscovery = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById("ai-discovery");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="w-full bg-deep-black text-on-deep-black">
      <div className="max-w-[1360px] mx-auto px-4 md:px-6 xl:px-12 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 lg:gap-8 py-6 md:py-8 lg:py-12">
        {/* Left 5 Columns: Confident Display Typography & CTAs */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-3xl md:text-5xl lg:text-[56px] lg:leading-[60px] font-bold text-on-deep-black tracking-tight text-balance">
              Built for your <span className="text-primary-orange">next upgrade.</span>
            </h1>
            <p className="font-body text-base lg:text-lg text-on-surface-dark-elevated max-w-md text-pretty opacity-90">
              Precision-engineered laptops, studio audio, and desktop hardware for work, play, and everything in between.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 pt-1">
            {/* Primary Orange CTA */}
            <a
              href="#bestsellers"
              onClick={handleScrollToBestsellers}
              className="inline-flex items-center justify-center px-7 py-3 rounded-sm bg-primary-orange text-deep-black font-label text-base font-semibold hover:bg-primary-orange-hover active:scale-[0.99] transition-all duration-150 cursor-pointer"
            >
              Shop Now
            </a>

            {/* Understated Secondary CTA */}
            <a
              href="#ai-discovery"
              onClick={handleScrollToAiDiscovery}
              className="inline-flex items-center gap-1.5 font-label text-base font-medium text-on-deep-black border-b border-outline-dark pb-0.5 hover:border-on-deep-black transition-colors duration-150 cursor-pointer"
            >
              <span>Explore AI Shopping</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Right 7 Columns: Studio Campaign Photography */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="aspect-[16/10] max-h-[420px] w-full overflow-hidden bg-deep-black rounded-sm flex items-center justify-center">
            <img
              src={heroSrc}
              onError={() => setHeroSrc("/images/categories/laptops.svg")}
              alt="PATRONET matte-black aluminum laptop and studio headphones photographed on dark charcoal plinth with subtle orange rim reflection"
              className="w-full h-full object-cover object-center mix-blend-lighten"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
