import { Users, UserCheck, UserX, Clock, ArrowRight } from 'lucide-react';

export default function RelawanStats({ stats, onSelectPendingTab }) {
  const cards = [
    {
      label: 'Total Relawan',
      value: stats.totalRelawan ?? 0,
      description: 'Terdaftar di sistem',
      icon: Users,
      iconBg: 'bg-teal-50 text-[#0b6f61]',
      borderHover: 'hover:border-teal-200',
    },
    {
      label: 'Relawan Siaga',
      value: stats.relawanAktif ?? 0,
      description: 'Siap operasi darurat',
      icon: UserCheck,
      iconBg: 'bg-emerald-50 text-emerald-600',
      badge: 'Aktif',
      badgeClass: 'bg-emerald-100/80 text-emerald-800',
      borderHover: 'hover:border-emerald-200',
    },
    {
      label: 'Nonaktif',
      value: stats.relawanNonaktif ?? 0,
      description: 'Akun ditangguhkan',
      icon: UserX,
      iconBg: 'bg-slate-100 text-slate-600',
      borderHover: 'hover:border-slate-300',
    },
    {
      label: 'Pending',
      value: stats.totalPending ?? 0,
      description: stats.totalPending > 0 ? 'Perlu tinjauan' : 'Nihil pending',
      icon: Clock,
      iconBg: stats.totalPending > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400',
      isPendingCard: true,
      badge: stats.totalPending > 0 ? `${stats.totalPending} Baru` : null,
      badgeClass: 'bg-amber-100 text-amber-900 font-extrabold animate-pulse',
      borderHover: 'hover:border-amber-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isClickable = card.isPendingCard && stats.totalPending > 0 && typeof onSelectPendingTab === 'function';

        return (
          <div
            key={idx}
            onClick={isClickable ? onSelectPendingTab : undefined}
            className={`bg-white border border-[#eaedf1] rounded-xl p-3 shadow-2xs transition-all duration-150 ${card.borderHover} ${
              isClickable ? 'cursor-pointer hover:shadow-xs hover:border-amber-300' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {card.label}
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-[20px] sm:text-[22px] font-black tracking-tight text-slate-900 leading-none">
                    {card.value}
                  </span>
                  {card.badge && (
                    <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold leading-tight ${card.badgeClass}`}>
                      {card.badge}
                    </span>
                  )}
                </div>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${card.iconBg}`}>
                <Icon size={16} />
              </div>
            </div>

            <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] leading-tight">
              <span className="text-slate-600 truncate">{card.description}</span>
              {isClickable && (
                <span className="text-amber-700 font-bold inline-flex items-center gap-0.5 hover:underline ml-1 flex-shrink-0">
                  <span>Tinjau</span>
                  <ArrowRight size={10} />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
