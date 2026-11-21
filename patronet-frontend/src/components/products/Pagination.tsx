import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Catalogue pagination" className={`flex items-center justify-between pt-6 border-t border-outline-subtle ${className}`}>
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="inline-flex items-center gap-1.5 font-label text-sm text-on-pure-white hover:text-accent-orange-text disabled:text-muted-gray disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Previous</span>
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-sm font-label text-sm tabular-nums transition-colors duration-150 cursor-pointer ${
                isActive
                  ? "bg-deep-black text-on-deep-black font-semibold"
                  : "text-on-pure-white hover:bg-light-gray"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="inline-flex items-center gap-1.5 font-label text-sm text-on-pure-white hover:text-accent-orange-text disabled:text-muted-gray disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
      >
        <span>Next</span>
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </nav>
  );
};
