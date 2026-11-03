import { ChevronDown, Check } from 'lucide-react';

const TIME_FILTER_OPTIONS = [
  'Semua Waktu',
  'Hari Ini',
  'Minggu Ini',
  'Bulan Ini',
];

export default function DashboardCategoryCard({
  categoryStats = [],
  maxCategoryCount = 1,
  totalLaporan = 0,
  topCategory = null,
  activeFilter = 'Semua Waktu',
  isDropdownOpen = false,
  setIsDropdownOpen,
  dropdownRef,
  onFilterChange,
  loading = false,
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
      {/* Header with Filter Dropdown */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold tracking-tight text-slate-900">
            Sebaran Kategori Laporan
          </h2>
          <p className="text-[11px] text-slate-500">
            Statistik masuk berdasarkan jenis kasus
          </p>
        </div>

        {/* Dropdown Waktu */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-1 transition-colors"
          >
            <span>{activeFilter}</span>
            <ChevronDown
              size={11}
              className={`text-slate-400 transition-transform ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {isDropdownOpen && (
            <div
              role="listbox"
              className="absolute right-0 top-full mt-1 z-30 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg animate-in fade-in zoom-in-95 duration-150"
            >
              {TIME_FILTER_OPTIONS.map((opt) => {
                const isSelected = activeFilter === opt;
                return (
                  <button
                    key={opt}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => onFilterChange(opt)}
                    className={`flex w-full items-center justify-between px-2.5 py-1 text-left text-[11px] transition-colors ${
                      isSelected
                        ? 'bg-slate-50 font-semibold text-emerald-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check size={11} className="text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category List with Progress Bars */}
      <div className="my-2 space-y-1.5">
        {loading && categoryStats.length === 0 ? (
          <div className="space-y-2 pt-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <div className="h-2.5 w-20 rounded bg-slate-100 animate-pulse" />
                  <div className="h-2.5 w-8 rounded bg-slate-100 animate-pulse" />
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : categoryStats.length === 0 ? (
          <div className="flex h-20 flex-col items-center justify-center text-center">
            <p className="text-[11px] text-slate-400">
              Belum ada data kategori untuk periode ini
            </p>
          </div>
        ) : (
          categoryStats.slice(0, 5).map((item, idx) => {
            const count = item.count || 0;
            const percent = totalLaporan > 0
              ? Math.round((count / totalLaporan) * 100)
              : 0;
            const barWidth = count > 0 && maxCategoryCount > 0
              ? Math.max(4, Math.round((count / maxCategoryCount) * 100))
              : 0;

            return (
              <div key={idx} className="group">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors truncate max-w-42.5">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1.5 tabular-nums">
                    <span className="font-semibold text-slate-900">
                      {count}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({percent}%)
                    </span>
                  </div>
                </div>

                {/* Bar Track */}
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: item.color || '#0b6f61',
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Sub-stats */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1">
          <span>Total:</span>
          <strong className="font-semibold text-slate-700 tabular-nums">
            {totalLaporan}
          </strong>
          <span>laporan</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Terbanyak:</span>
          <span className="font-semibold text-slate-700 truncate max-w-32.5">
            {topCategory ? `${topCategory.label} (${topCategory.count})` : 'Nihil'}
          </span>
        </div>
      </div>
    </div>
  );
}
