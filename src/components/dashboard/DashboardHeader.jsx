import { RefreshCw } from 'lucide-react';

export default function DashboardHeader({ loading, lastUpdated, onRefresh }) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          Dashboard Admin
        </h1>
        <p className="text-xs text-slate-500">
          Pusat komando tanggap darurat dan pemantauan relawan real-time
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        {/* Tombol Refresh */}
        <button
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh data dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-1 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          <RefreshCw
            size={12}
            className={`text-slate-500 ${loading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>{loading ? 'Memuat...' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
}
