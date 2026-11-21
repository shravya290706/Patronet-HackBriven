import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Search, ArrowRight } from "lucide-react";

export const AIShoppingSearch: React.FC = () => {
  const [query, setQuery] = React.useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/ai-shopping?q=${encodeURIComponent(trimmed)}`, {
        state: { prompt: trimmed },
      });
    } else {
      navigate("/ai-shopping");
    }
  };

  const handleChipClick = (suggestion: string) => {
    setQuery(suggestion);
    navigate(`/ai-shopping?q=${encodeURIComponent(suggestion)}`, {
      state: { prompt: suggestion },
    });
  };

  const suggestions = [
    { label: "Coding laptops", prompt: "Coding laptops with 16GB RAM and all-day battery" },
    { label: "Gaming setups", prompt: "Gaming setups with RTX graphics and QHD monitor" },
    { label: "Work from home", prompt: "Work from home monitor, ANC headphones, and desk lamp" },
    { label: "Under ₹20,000", prompt: "Wireless audio and smartwatches under ₹20,000" },
  ];

  return (
    <section id="ai-discovery" className="w-full bg-pure-white border-b border-outline-subtle">
      <div className="max-w-[1360px] mx-auto px-4 md:px-6 xl:px-12 py-7 md:py-8 lg:py-9 grid grid-cols-1 lg:grid-cols-12 items-start lg:items-center gap-5">
        <div className="lg:col-span-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-accent-orange-text shrink-0" aria-hidden="true" />
            <h2 className="font-headline text-lg md:text-xl font-bold text-on-pure-white">
              Tell us what you're looking for.
            </h2>
          </div>
          <p className="font-body text-xs md:text-sm text-muted-gray">
            Describe your requirements in plain language for calibrated hardware matches.
          </p>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-2">
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-sm bg-light-gray border border-outline-subtle focus-within:border-deep-black focus-within:bg-pure-white transition-colors duration-150">
              <Search className="w-4 h-4 text-muted-gray shrink-0" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="A lightweight laptop for programming under ₹80,000"
                aria-label="Describe what electronics you are looking for"
                className="w-full bg-transparent border-0 p-0 font-body text-sm md:text-base text-on-pure-white placeholder:text-muted-gray focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-sm bg-primary-orange text-deep-black font-label text-sm md:text-base font-semibold hover:bg-primary-orange-hover active:scale-[0.99] transition-all duration-150 shrink-0 cursor-pointer"
            >
              <span>AI Find</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          {/* Understated Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="font-label text-xs font-medium text-muted-gray">Suggestions:</span>
            {suggestions.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleChipClick(item.prompt)}
                className="px-2.5 py-1 rounded-sm bg-light-gray text-deep-black font-label text-xs hover:bg-outline-subtle transition-colors duration-150 cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
