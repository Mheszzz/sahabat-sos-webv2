import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPaginationRange } from '../../utils/paginationHelper';

/**
 * PaginationBar
 * Komponen pagination responsif terpadu dengan deret elipsis ('...').
 */
export default function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
  showingCount,
  filteredCount,
  totalCount,
  label = 'kasus',
  className = '',
}) {
  const pageRange = getPaginationRange(currentPage, totalPages);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 px-5 py-3 text-[12px] text-slate-500 gap-3 ${className}`}>
      <span>
        Menampilkan <strong>{showingCount}</strong> dari <strong>{filteredCount}</strong> {label}
        {totalCount !== undefined && totalCount !== filteredCount && (
          <span> (Total: {totalCount})</span>
        )}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex min-w-[38px] min-h-[38px] h-9.5 w-9.5 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-1 transition-colors"
            title="Halaman Sebelumnya"
            aria-label="Halaman Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
          {pageRange.map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`dots-${idx}`}
                  className="flex min-w-[38px] min-h-[38px] h-9.5 w-9.5 items-center justify-center text-slate-500 font-bold select-none text-[13px]"
                >
                  &hellip;
                </span>
              );
            }
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`flex min-w-[38px] min-h-[38px] h-9.5 w-9.5 items-center justify-center rounded-lg text-[13px] font-bold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-1 ${
                  currentPage === page
                    ? 'bg-[#0b6f61] text-white shadow-xs'
                    : 'border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
                aria-label={`Halaman ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex min-w-[38px] min-h-[38px] h-9.5 w-9.5 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-1 transition-colors"
            title="Halaman Selanjutnya"
            aria-label="Halaman Selanjutnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
