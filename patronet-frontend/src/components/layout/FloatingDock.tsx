import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Sparkles, Handshake } from "lucide-react";
import { useComparison } from "@/context/ComparisonContext";

export const FloatingDock: React.FC = () => {
  const navigate = useNavigate();
  const { comparisonList } = useComparison();
  const compareCount = comparisonList.length;

  return (
    <aside
      aria-label="PATRONET Smart Shopping Assistants"
      className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-40 flex flex-col items-end gap-2.5 pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 rounded-2xl sm:rounded-full border border-surface-container-high/80 bg-surface-container-lowest/95 p-2 sm:p-2.5 shadow-2xl backdrop-blur-md transition-all hover:shadow-primary/10 hover:border-primary/30">
        {/* Compare Pill */}
        <button
          type="button"
          onClick={() => navigate("/compare")}
          aria-label={`Open Compare (${compareCount} products selected)`}
          title="Compare up to 4 products side by side"
          className={`group relative flex h-11 sm:h-12 items-center gap-2 sm:gap-2.5 rounded-xl sm:rounded-full px-3.5 sm:px-4 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 active:translate-y-0 ${
            compareCount > 0
              ? "bg-primary text-on-primary shadow-md shadow-primary/20 hover:bg-primary/90"
              : "bg-primary/10 text-primary border border-primary/25 hover:bg-primary hover:text-on-primary"
          }`}
        >
          <Scale className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
          <div className="flex flex-col items-start leading-tight">
            <span>Compare</span>
            <span className="text-[10px] font-normal opacity-85 hidden sm:inline">
              Side-by-side
            </span>
          </div>
          {compareCount > 0 ? (
            <span className="flex h-5 items-center justify-center rounded-full bg-secondary-container px-1.5 text-[11px] font-black text-on-secondary shadow-xs">
              {compareCount}/4
            </span>
          ) : (
            <span className="hidden sm:inline-block rounded-full bg-primary/20 group-hover:bg-on-primary/20 px-1.5 py-0.2 text-[10px] font-bold">
              4 max
            </span>
          )}
        </button>

        {/* Shopping Buddy Pill */}
        <button
          type="button"
          onClick={() => navigate("/ai-shopping")}
          aria-label="Open Shopping Buddy conversational assistant"
          title="Open Shopping Buddy (Natural language product recommendations)"
          className="group flex h-11 sm:h-12 items-center gap-2 sm:gap-2.5 rounded-xl sm:rounded-full bg-emerald-50 px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-emerald-800 border border-emerald-300 hover:bg-emerald-600 hover:text-white transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="relative">
            <Sparkles className="h-5 w-5 shrink-0 text-emerald-700 group-hover:text-white transition-transform group-hover:scale-110" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="flex items-center gap-1">
              <span>Shopping Buddy</span>
              <Sparkles className="h-3.5 w-3.5 text-amber-500 group-hover:text-amber-200" />
            </span>
            <span className="text-[10px] font-normal opacity-85 hidden sm:inline">
              AI Discovery
            </span>
          </div>
        </button>

        {/* Negotiator Pill */}
        <button
          type="button"
          onClick={() => navigate("/procurement")}
          aria-label="Open PATRONET Price Negotiator"
          title="Open Price Negotiator (Interactive conversational price bargaining demo)"
          className="group flex h-11 sm:h-12 items-center gap-2 sm:gap-2.5 rounded-xl sm:rounded-full bg-amber-50 px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-amber-900 border border-amber-300 hover:bg-amber-600 hover:text-white transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 active:translate-y-0"
        >
          <Handshake className="h-5 w-5 shrink-0 text-amber-700 group-hover:text-white transition-transform group-hover:scale-110" />
          <div className="flex flex-col items-start leading-tight">
            <span>Negotiator</span>
            <span className="text-[10px] font-normal opacity-85 hidden sm:inline">
              Bargain Demo
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
};
