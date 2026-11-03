import { HeartHandshake, ShieldAlert } from 'lucide-react';

export default function UserTabs({
  activeTab,
  setActiveTab,
  registeredCount = 0,
  pendingCount = 0,
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 bg-white border border-[#eaedf1] p-1 rounded-xl w-fit shadow-2xs">
      {/* Tab: Relawan Terdaftar */}
      <button
        onClick={() => setActiveTab('relawan')}
        className={`flex items-center gap-2 px-3.5 h-9 rounded-lg text-[12.5px] font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-1 ${
          activeTab === 'relawan'
            ? 'bg-[#0b6f61] text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <HeartHandshake size={14.5} className={activeTab === 'relawan' ? 'text-teal-200' : 'text-slate-400'} />
        <span>Relawan Terdaftar</span>
        <span
          className={`text-[10.5px] font-extrabold px-1.5 py-0.2 rounded-full transition-colors ${
            activeTab === 'relawan'
              ? 'bg-white/20 text-white'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {registeredCount}
        </span>
      </button>

      {/* Tab: Pending Verifikasi */}
      <button
        onClick={() => setActiveTab('pending')}
        className={`flex items-center gap-2 px-3.5 h-9 rounded-lg text-[12.5px] font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 ${
          activeTab === 'pending'
            ? 'bg-amber-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <ShieldAlert size={14.5} className={activeTab === 'pending' ? 'text-amber-200' : pendingCount > 0 ? 'text-amber-500' : 'text-slate-400'} />
        <span>Pending Verifikasi</span>
        <span
          className={`text-[10.5px] font-extrabold px-1.5 py-0.2 rounded-full transition-colors ${
            activeTab === 'pending'
              ? 'bg-white/25 text-white'
              : pendingCount > 0
              ? 'bg-amber-100 text-amber-800 animate-pulse font-black'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {pendingCount}
        </span>
      </button>
    </div>
  );
}

