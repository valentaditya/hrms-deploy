"use client";

import React from "react";

export interface PaginationProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageSize?: PageSize;
  onPageSizeChange?: (pageSize: PageSize) => void;
  className?: string;
}

export type PageSize = number | "all";

export const Pagination: React.FC<PaginationProps> = ({
  currentPage = 1,
  totalPages = 24,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  className = "",
}) => {
  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange?.(page);
    }
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPageSize: PageSize = event.target.value === "all" ? "all" : Number(event.target.value);
    onPageSizeChange?.(nextPageSize);
    onPageChange?.(1);
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
        <span className="sr-only">Jumlah data per halaman</span>
        <select
          aria-label="Jumlah data per halaman"
          value={pageSize}
          onChange={handlePageSizeChange}
          className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value="all">Semua</option>
        </select>
        per halaman
      </label>
      <nav
        aria-label="Pagination Navigation"
        className="inline-flex items-center gap-2 font-sans select-none"
      >
      {/* Previous Button */}
      <button
        type="button"
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`h-10 rounded-lg border-2 px-3 text-sm font-medium transition-colors ${
          currentPage <= 1
            ? "border-slate-100 bg-white text-slate-300 cursor-not-allowed"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
        }`}
        aria-label="Previous Page"
      >
        Previous
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {(() => {
          if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => handlePageClick(page)}
                className={`h-10 w-10 rounded-lg border-2 text-sm font-semibold flex items-center justify-center transition-colors ${
                  currentPage === page
                    ? "border-[#4b6df0] bg-[#4b6df0] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
                }`}
              >
                {page}
              </button>
            ));
          }

          const pages: (number | string)[] = [];
          if (currentPage <= 4) {
            pages.push(1, 2, 3, 4, 5, "...", totalPages);
          } else if (currentPage >= totalPages - 3) {
            pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
          } else {
            pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
          }

          return pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="h-10 w-8 flex items-center justify-center text-slate-400 font-bold text-sm select-none"
                >
                  ...
                </span>
              );
            }
            const pageNum = Number(p);
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => handlePageClick(pageNum)}
                className={`h-10 w-10 rounded-lg border-2 text-sm font-semibold flex items-center justify-center transition-colors ${
                  currentPage === pageNum
                    ? "border-[#4b6df0] bg-[#4b6df0] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
                }`}
              >
                {pageNum}
              </button>
            );
          });
        })()}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`h-10 rounded-lg border-2 px-3 text-sm font-medium transition-colors ${
          currentPage >= totalPages
            ? "border-slate-100 bg-white text-slate-300 cursor-not-allowed"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
        }`}
        aria-label="Next Page"
      >
        Next
      </button>
      </nav>
    </div>
  );
};

export default Pagination;
