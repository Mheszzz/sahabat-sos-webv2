import {
  Activity, Siren, Navigation, CheckCircle2, PhoneCall, X,
  Clock, Loader2, FileText
} from 'lucide-react';
import InitialsAvatar from '../global/InitialsAvatar';
import { formatDateTime, formatRelativeTime } from '../../utils/dateHelper';

/**
 * Helper penentu icon, warna node, dan style card berdasarkan isi deskripsi event
 */
function getActivityMeta(log) {
  const action = String(log?.action || log?.jenis || '').toLowerCase();
  const desc = String(log?.description || log?.deskripsi || '').toLowerCase();

  // 1. Pemicu SOS / Status Darurat
  if (
    action.includes('sos_dipicu') ||
    action.includes('sos_triggered') ||
    action.includes('eskalasi') ||
    desc.includes('sinyal darurat sos') ||
    desc.includes('tombol darurat') ||
    desc.includes('darurat sos')
  ) {
    return {
      type: 'sos',
      nodeColor: 'bg-rose-500 text-white ring-4 ring-rose-100 shadow-xs shadow-rose-500/20',
      lineColor: 'bg-rose-200',
      cardClass: 'border-rose-200 bg-rose-50/30 hover:border-rose-300',
      headerClass: 'border-rose-100',
      icon: <Siren size={13} />,
    };
  }

  // 2. Relawan Bertugas / Respon Lapangan
  if (
    action.includes('relawan') ||
    action.includes('dispatch') ||
    action.includes('tangani') ||
    desc.includes('menerima tugas') ||
    desc.includes('menuju lokasi') ||
    desc.includes('relawan')
  ) {
    return {
      type: 'relawan',
      nodeColor: 'bg-amber-500 text-white ring-4 ring-amber-100 shadow-xs shadow-amber-500/20',
      lineColor: 'bg-amber-200',
      cardClass: 'border-amber-200 bg-amber-50/30 hover:border-amber-300',
      headerClass: 'border-amber-100',
      icon: <Navigation size={12} className="fill-white" />,
    };
  }

  // 3. Selesai / Tuntas
  if (
    action.includes('selesai') ||
    action.includes('tuntas') ||
    desc.includes('selesai') ||
    desc.includes('tuntas') ||
    desc.includes('dievakuasi')
  ) {
    return {
      type: 'selesai',
      nodeColor: 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs shadow-emerald-600/20',
      lineColor: 'bg-emerald-200',
      cardClass: 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300',
      headerClass: 'border-emerald-100',
      icon: <CheckCircle2 size={13} />,
    };
  }

  // 4. Panggilan Suara / Hubungi
  if (
    action.includes('telepon') ||
    action.includes('wa') ||
    action.includes('chat') ||
    desc.includes('telepon') ||
    desc.includes('whatsapp') ||
    desc.includes('hubungi')
  ) {
    return {
      type: 'kontak',
      nodeColor: 'bg-sky-500 text-white ring-4 ring-sky-100 shadow-xs shadow-sky-500/20',
      lineColor: 'bg-sky-200',
      cardClass: 'border-sky-200 bg-sky-50/30 hover:border-sky-300',
      headerClass: 'border-sky-100',
      icon: <PhoneCall size={12} />,
    };
  }

  // 5. Pembatalan
  if (action.includes('batal') || desc.includes('batal')) {
    return {
      type: 'batal',
      nodeColor: 'bg-slate-500 text-white ring-4 ring-slate-100',
      lineColor: 'bg-slate-200',
      cardClass: 'border-slate-200 bg-slate-50/60 hover:border-slate-300',
      headerClass: 'border-slate-200/60',
      icon: <X size={13} />,
    };
  }

  // 6. Default Aktivitas Sistem / Operasional
  return {
    type: 'default',
    nodeColor: 'bg-[#0b6f61] text-white ring-4 ring-emerald-100 shadow-xs shadow-[#0b6f61]/20',
    lineColor: 'bg-slate-200',
    cardClass: 'border-slate-200 bg-white hover:border-slate-300',
    headerClass: 'border-slate-100',
    icon: <Activity size={12} />,
  };
}

/**
 * Helper role badge visual
 */
function getRoleMeta(role, actorName) {
  const r = String(role || '').toLowerCase().trim();
  const a = String(actorName || '').toLowerCase().trim();

  if (r.includes('relawan') || a.includes('relawan')) {
    return {
      label: 'Relawan',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      avatarBg: 'bg-emerald-700',
    };
  }

  if (r.includes('pengguna') || r.includes('user') || r.includes('korban') || r.includes('pelapor')) {
    return {
      label: 'Pengguna',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
      avatarBg: 'bg-sky-600',
    };
  }

  if (r.includes('admin') || a.includes('admin') || r.includes('petugas')) {
    return {
      label: 'Admin',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
      avatarBg: 'bg-purple-600',
    };
  }

  return {
    label: role ? (String(role).charAt(0).toUpperCase() + String(role).slice(1)) : 'Sistem',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    avatarBg: 'bg-slate-500',
  };
}

/**
 * AktivitasConsoleTab
 * Tabbed Console Panel untuk Linimasa Log Aktivitas & Catatan Penanganan Tim Petugas.
 */
export default function AktivitasConsoleTab({
  activities = [],
  loadingActivities = false,
  catatanPenanganan = [],
  rightTab = 'log',
  setRightTab,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Tab Header Selector */}
      <div
        role="tablist"
        aria-label="Pilihan konsol aktivitas atau catatan penanganan"
        className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0 mb-2 no-print"
      >
        <button
          type="button"
          role="tab"
          aria-selected={rightTab === 'log'}
          onClick={() => setRightTab?.('log')}
          className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
            rightTab === 'log' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Log Aktivitas ({activities.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={rightTab === 'catatan'}
          onClick={() => setRightTab?.('catatan')}
          className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
            rightTab === 'catatan' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Catatan Tim ({catatanPenanganan.length})
        </button>
      </div>

      {/* Print-only Section Title */}
      <div className="hidden print:block pb-1.5 mb-2 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-700">
        {rightTab === 'log' ? `Linimasa Aktivitas Kasus (${activities.length})` : `Catatan Penanganan Tim (${catatanPenanganan.length})`}
      </div>

      {/* Tab 1: Activity Log Timeline (Internal Scroll) */}
      {rightTab === 'log' && (
        <div className="flex-1 min-h-0 overflow-y-auto pl-2 pr-1.5 py-1.5 space-y-0">
          {loadingActivities ? (
            <div className="flex items-center gap-2 py-8 text-slate-500 text-[11px] justify-center">
              <Loader2 size={14} className="animate-spin text-[#0b6f61]" />
              <span>Memuat linimasa aktivitas...</span>
            </div>
          ) : activities.length === 0 ? (
            <div className="py-8 text-center space-y-1">
              <Activity size={20} className="mx-auto text-slate-400" />
              <p className="text-[11px] text-slate-500 italic">
                Belum ada riwayat aktivitas yang tercatat untuk kasus ini.
              </p>
            </div>
          ) : (
            activities.map((log, idx) => {
              const actor = log.actor || log.aktor || 'Sistem';
              const role = log.role || log.role_aktor;
              const description = log.description || log.deskripsi || log.action || log.jenis;
              const timestamp = log.created_at || log.waktu;
              const meta = getActivityMeta(log);
              const roleMeta = getRoleMeta(role, actor);
              const relativeTime = formatRelativeTime(timestamp);
              const isLast = idx === activities.length - 1;

              return (
                <div key={idx} className="relative flex items-start gap-2.5 text-[11px] group">
                  {/* Timeline Left Track: Node + Vertical Connector */}
                  <div className="w-8 flex flex-col items-center shrink-0 self-stretch pt-0.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${meta.nodeColor}`}>
                      {meta.icon}
                    </div>
                    {!isLast && (
                      <div className="w-0.5 bg-slate-200 flex-1 my-1" style={{ minHeight: 18 }} />
                    )}
                  </div>

                  {/* Timeline Right: Event Card */}
                  <div className={`flex-1 min-w-0 rounded-xl p-2.5 border shadow-2xs transition-all hover:shadow-xs mb-2.5 ${meta.cardClass}`}>
                    <div className={`flex items-center justify-between gap-1.5 pb-1.5 border-b ${meta.headerClass}`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <InitialsAvatar
                          name={actor}
                          size={18}
                          bgClass={roleMeta.avatarBg}
                        />
                        <span className="font-bold text-slate-800 text-[11.5px] truncate" title={actor}>
                          {actor}
                        </span>
                        <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap leading-none ${roleMeta.badgeClass}`}>
                          {roleMeta.label}
                        </span>
                      </div>

                      {relativeTime && (
                        <span className="text-[9.5px] font-medium text-slate-500 whitespace-nowrap shrink-0">
                          {relativeTime}
                        </span>
                      )}
                    </div>

                    <p className="text-slate-800 text-[11px] font-medium leading-relaxed mt-1.5">
                      {description}
                    </p>

                    <div className="flex items-center gap-1 text-[9.5px] text-slate-500 mt-2 pt-1 border-t border-slate-100/80">
                      <Clock size={10} className="text-slate-500 shrink-0" />
                      <span>{formatDateTime(timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Catatan Penanganan Tim Petugas (Internal Scroll) */}
      {rightTab === 'catatan' && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2 py-1">
          {catatanPenanganan.length === 0 ? (
            <div className="py-8 text-center space-y-1">
              <FileText size={20} className="mx-auto text-slate-400" />
              <p className="text-[11px] text-slate-500 italic">
                Belum ada catatan penanganan yang ditulis petugas.
              </p>
            </div>
          ) : (
            catatanPenanganan.map((catatan, i) => (
              <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                  <span className="font-bold text-slate-800">{catatan.penulis || 'Petugas'}</span>
                  <span>{formatDateTime(catatan.created_at || catatan.waktu)}</span>
                </div>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {catatan.catatan || catatan.isi || catatan.pesan}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
