import { MapPin, Clock, ChevronRight, AlertTriangle, Ambulance } from 'lucide-react';
import Badge from './Badge';

export default function SOSCard({ kasus, onOpenDetail }) {
  const isDarurat = kasus.type === 'darurat';
  const accentBorder = isDarurat ? 'border-l-red-500' : 'border-l-blue-500';

  return (
    <div className={`card border-l-[3px] ${accentBorder} p-4 space-y-3`}>
      {/* Header: ID + Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[12px] font-bold text-[#0b6f61]">
            {kasus.id_kasus || kasus.nomor_kasus || `#${kasus.id}`}
          </span>
          <Badge
            variant={isDarurat ? 'DARURAT SOS' : 'LAPORAN PENGGUNA'}
            className="text-[11px]"
          />
        </div>
        <Badge variant={kasus.status} className="text-[11px] shrink-0" />
      </div>

      {/* Kategori */}
      <h3 className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-2">
        {kasus.kategori}
      </h3>

      {/* Lokasi */}
      <div className="flex items-start gap-2 text-[12px] text-slate-500">
        <MapPin size={13} className="mt-0.5 shrink-0 text-slate-400" />
        <span className="line-clamp-1">{kasus.lokasi}</span>
      </div>

      {/* Footer: Waktu + Action */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
          <Clock size={12} />
          <span>{kasus.waktu}</span>
        </div>

        <button
          onClick={() => onOpenDetail?.(kasus.id)}
          className="btn-base btn-primary text-[12px] h-8 px-3"
        >
          <span>Lihat Detail</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
