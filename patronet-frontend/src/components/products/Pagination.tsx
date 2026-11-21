import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  const pages = (() => {
    const list: (number | string)[] = [];
    for (let r = 1; r <= totalPages; r++) {
      if (r === 1 || r === totalPages || (r >= currentPage - 1 && r <= currentPage + 1)) {
        list.push(r);
      } else if (list[list.length - 1] !== "ellipsis") {
        list.push("ellipsis");
      }
    }
    return list;
  })();

  return (
    <nav
      aria-label="Pagination Navigation"
      className={`flex items-center justify-center gap-1.5 py-space-md ${className}`}
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-variant text-on-surface disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-label-md text-label-md transition-colors cursor-pointer"
        aria-label="Previous Page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {pages.map((p, idx) => {
        if (p === "ellipsis") {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 text-outline font-label-md select-none"
            >
              ...
            </span>
          );
        }
        const isActive = p === currentPage;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p as number)}
            aria-current={isActive ? "page" : undefined}
            className={`w-9 h-9 rounded-lg font-label-md text-label-md transition-colors cursor-pointer flex items-center justify-center ${
              isActive
                ? "bg-primary text-on-primary font-bold shadow-xs"
                : "bg-surface-container-low hover:bg-surface-variant text-on-surface"
            }`}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-variant text-on-surface disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-label-md text-label-md transition-colors cursor-pointer"
        aria-label="Next Page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
};
