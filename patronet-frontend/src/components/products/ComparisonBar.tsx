import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Scale } from "lucide-react";
import { useComparison } from "@/context/ComparisonContext";

export const ComparisonBar: React.FC = () => {
  const { selectedProducts, clearSelection } = useComparison();

  if (selectedProducts.length === 0) {
    return null;
  }

  const canCompare = selectedProducts.length >= 2;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 p-4 animate-in slide-in-from-bottom-4 duration-200 pointer-events-none">
      <div className="max-w-[1360px] mx-auto pointer-events-auto">
        <div className="bg-deep-black text-on-deep-black rounded-sm px-4 md:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-outline-dark shadow-2xl">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-primary-orange shrink-0" aria-hidden="true" />
            <span className="font-label text-sm md:text-base text-on-deep-black tabular-nums font-medium">
              {selectedProducts.length} product{selectedProducts.length > 1 ? "s" : ""} selected
              <span className="text-muted-gray text-xs ml-2 font-normal hidden md:inline">
                ({selectedProducts.map((p) => p.name).join(", ")})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={clearSelection}
              className="font-label text-sm text-on-surface-dark-elevated hover:text-primary-orange transition-colors duration-150 cursor-pointer"
            >
              Clear selection
            </button>

            {canCompare ? (
              <Link
                to={`/compare?ids=${selectedProducts.map((p) => p.id).join(",")}`}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-sm bg-primary-orange text-deep-black font-label text-sm font-semibold hover:bg-primary-orange-hover active:scale-[0.99] transition-all duration-150"
              >
                <span>Compare now</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            ) : (
              <button
                type="button"
                disabled
                title="Select at least 2 products to compare"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-sm bg-outline-dark text-muted-gray font-label text-sm font-semibold opacity-60 cursor-not-allowed"
              >
                <span>Compare now (select 2+)</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
