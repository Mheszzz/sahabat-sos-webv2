export default function DashboardKpiCard({ stats, urgensiSummary, loading }) {
  const kasusHariIni = stats?.kasusHariIni ?? 0;
  const kasusMingguLalu = stats?.kasusMingguLalu ?? 0;
  const kasusBulanLalu = stats?.kasusBulanLalu ?? 0;
  const daruratSosAktif = stats?.daruratSosAktif ?? urgensiSummary?.level_kritis?.jumlah ?? 0;
  const relawanAktif = stats?.relawanAktif ?? 0;
  const kasusSedang = urgensiSummary?.level_sedang?.jumlah ?? 0;
  const tingkatKeberhasilan = urgensiSummary?.tingkat_keberhasilan_bantuan ?? '100.0%';

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold tracking-tight text-slate-900">
            Statistik &amp; Urgensi Kasus
          </h2>
          <p className="text-[11px] text-slate-500">
            Panggilan darurat SOS, antrean laporan, &amp; personel
          </p>
        </div>
        {urgensiSummary?.tingkat_keberhasilan_bantuan && (
          <span className="rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-bold text-emerald-700" title="Tingkat keberhasilan resolusi bantuan">
            {tingkatKeberhasilan} Resolusi
          </span>
        )}
      </div>

      {/* 3 Metric Columns: Hari Ini, Minggu Lalu, Bulan Lalu */}
      <div className="my-2">
        {loading && !stats ? (
          <div className="grid grid-cols-3 gap-2 border-y border-slate-100 py-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="h-3 w-12 rounded bg-slate-100 animate-pulse" />
                <div className="h-6 w-10 rounded bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 divide-x divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/50 py-2">
            {/* Kolom 1: Hari Ini */}
            <div className="flex flex-col items-center px-1 text-center">
              <span className="text-[11px] font-medium text-slate-500">
                Hari Ini
              </span>
              <span className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 tabular-nums">
                {kasusHariIni}
              </span>
            </div>

            {/* Kolom 2: Minggu Lalu */}
            <div className="flex flex-col items-center px-1 text-center">
              <span className="text-[11px] font-medium text-slate-500">
                Minggu Lalu
              </span>
              <span className="mt-0.5 text-xl font-semibold tracking-tight text-slate-700 tabular-nums">
                {kasusMingguLalu}
              </span>
            </div>

            {/* Kolom 3: Bulan Lalu */}
            <div className="flex flex-col items-center px-1 text-center">
              <span className="text-[11px] font-medium text-slate-500">
                Bulan Lalu
              </span>
              <span className="mt-0.5 text-xl font-semibold tracking-tight text-slate-700 tabular-nums">
                {kasusBulanLalu}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Operational Status Indicators (Grid 3 Kolom) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 border-t border-slate-100 pt-2 text-[11px]">
        {/* Status SOS Aktif */}
        <div className="flex items-center justify-between rounded-lg bg-red-50/60 border border-red-100/60 px-2.5 py-1">
          <span className="text-red-700 font-medium truncate">SOS Aktif:</span>
          <span className="font-bold text-red-600 tabular-nums shrink-0 ml-1">
            {daruratSosAktif} Kasus
          </span>
        </div>

        {/* Status Relawan Siaga */}
        <div className="flex items-center justify-between rounded-lg bg-emerald-50/60 border border-emerald-100/60 px-2.5 py-1">
          <span className="text-emerald-800 font-medium truncate">Relawan Siaga:</span>
          <span className="font-bold text-emerald-700 tabular-nums shrink-0 ml-1">
            {relawanAktif} Personel
          </span>
        </div>

        {/* Laporan Menunggu */}
        <div className="flex items-center justify-between rounded-lg bg-amber-50/60 border border-amber-100/60 px-2.5 py-1">
          <span className="text-amber-800 font-medium truncate">Laporan Menunggu:</span>
          <span className="font-bold text-amber-700 tabular-nums shrink-0 ml-1">
            {kasusSedang} Kasus
          </span>
        </div>
      </div>
    </div>
  );
}
