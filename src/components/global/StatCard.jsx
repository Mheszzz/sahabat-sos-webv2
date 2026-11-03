import { TrendingUp, TrendingDown, Phone, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

const iconMap = { Phone, FileText, AlertTriangle, ShieldCheck };

export default function StatCard({ card }) {
  const Icon = iconMap[card.icon] || FileText;

  return (
    <div className="card flex flex-col justify-between gap-3 p-5">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-semibold text-slate-500">{card.label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg} flex-shrink-0`}>
          <Icon size={17} className={card.iconColor} />
        </div>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-[28px] font-extrabold leading-none tracking-tight text-slate-900">
          {card.value}
        </span>
        {card.valueSuffix && (
          <span className="pb-0.5 text-[13px] font-medium text-slate-400">{card.valueSuffix}</span>
        )}
      </div>

      <p className={`text-[12px] ${card.isAlert ? 'font-semibold text-red-500' : 'text-slate-400'}`}>
        {card.trendLabel}
      </p>
    </div>
  );
}
