import { useMemo } from 'react';

export default function DashboardWeeklyChart({ data, loading, maxWeeklyCount }) {
  const chartDays = useMemo(() => {
    if (data?.harian?.length) return data.harian;
    return [
      { day: 'Min', count: 0, isPeak: false },
      { day: 'Sen', count: 0, isPeak: false },
      { day: 'Sel', count: 0, isPeak: false },
      { day: 'Rab', count: 0, isPeak: false },
      { day: 'Kam', count: 0, isPeak: false },
      { day: 'Jum', count: 0, isPeak: false },
      { day: 'Sab', count: 0, isPeak: false },
    ];
  }, [data]);

  const totalKasus = data?.totalKasus ?? 0;
  const puncak = data?.puncakInsiden;
  const rataRata = data?.rataRataHarian ?? 0;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
      {/* Header Card */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold tracking-tight text-slate-900">
            Grafik SOS Pekan Ini
          </h2>
          <p className="text-[11px] text-slate-500">
            Sebaran panggilan darurat 7 hari terakhir
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-red-200/80 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
          <span className="tabular-nums font-mono">{totalKasus}</span>
          <span>Kasus</span>
        </span>
      </div>

      {/* Bar Chart Area */}
      <div className="my-2.5 flex flex-col justify-end">
        {loading && !data ? (
          <div className="flex h-24 items-end justify-between gap-1.5 px-1">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="w-full max-w-7 rounded-t-sm bg-slate-100 animate-pulse"
                  style={{ height: `${20 + (i % 4) * 20}%` }}
                />
                <div className="h-3 w-6 rounded bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-24 items-end justify-between gap-1 px-1">
            {chartDays.map((item, idx) => {
              const heightPercent = maxWeeklyCount > 0
                ? Math.round((item.count / maxWeeklyCount) * 100)
                : 0;

              const isPeak = item.isPeak || (item.count > 0 && item.count === maxWeeklyCount);

              return (
                <div
                  key={idx}
                  className="group relative flex flex-1 flex-col items-center justify-end"
                >
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute -top-7 z-10 hidden rounded bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white shadow-xs transition-opacity group-hover:block whitespace-nowrap">
                    {item.day}: <span className="tabular-nums font-mono">{item.count}</span> kasus
                  </div>

                  {/* Angka di atas Bar */}
                  <span
                    className={`mb-1 text-[11px] tabular-nums transition-colors ${
                      isPeak && item.count > 0
                        ? 'font-bold text-red-600'
                        : item.count > 0
                        ? 'font-semibold text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>

                  {/* Batang Bar Container Track */}
                  <div className="relative flex h-14 w-full max-w-7 items-end justify-center rounded-t-sm bg-slate-100">
                    <div
                      style={{ height: item.count > 0 ? `${Math.max(16, heightPercent)}%` : '0%' }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isPeak && item.count > 0
                          ? 'bg-red-500 group-hover:bg-red-600'
                          : item.count > 0
                          ? 'bg-[#0b6f61] group-hover:bg-[#095c52]'
                          : 'bg-transparent'
                      }`}
                    />
                  </div>

                  {/* Label Hari */}
                  <span className="mt-1 text-[11px] font-medium text-slate-500 group-hover:text-slate-800">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Insight */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1">
          <span>Puncak:</span>
          <strong className="font-semibold text-slate-700">
            {puncak?.hari && puncak.hari !== '-' ? `${puncak.hari} (${puncak.total} kasus)` : 'Nihil'}
          </strong>
        </div>
        <div className="flex items-center gap-1">
          <span>Rata-rata:</span>
          <span className="font-semibold text-slate-700 tabular-nums">
            {rataRata}
          </span>
          <span>/ hari</span>
        </div>
      </div>
    </div>
  );
}
