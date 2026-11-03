import { PhoneCall, MessageSquare, Phone, ShieldAlert } from 'lucide-react';

/**
 * KontakDaruratList
 * Menampilkan daftar kontak darurat keluarga korban dengan aksi WhatsApp & Telepon,
 * serta tombol eskalasi cepat ke hotline darurat (Medis 119 & Ambulans 118).
 */
export default function KontakDaruratList({
  kontakDarurat = [],
  onLogAksi,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex-1 min-h-0 flex flex-col justify-between">
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Header Kontak Darurat */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <PhoneCall size={13} className="text-emerald-600" />
            Kontak Darurat Keluarga ({kontakDarurat.length})
          </span>
        </div>

        {/* Scrollable List Kontak Keluarga */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 py-2">
          {kontakDarurat.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic py-2">
              Tidak ada kontak darurat keluarga yang didaftarkan korban.
            </p>
          ) : (
            kontakDarurat.map((k, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 truncate">{k.nama || 'Keluarga'}</span>
                    {k.is_utama && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                        Utama
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{k.hubungan || 'Kerabat'} &middot; {k.no_telp || '-'}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0 no-print">
                  {k.whatsapp_url && (
                    <a
                      href={k.whatsapp_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Chat WhatsApp ke ${k.nama || 'keluarga'}`}
                      onClick={() => onLogAksi?.(`WhatsApp Kontak Darurat (${k.nama})`)}
                      className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      title={`Chat WhatsApp ke ${k.nama}`}
                    >
                      <MessageSquare size={12} />
                    </a>
                  )}
                  {k.no_telp && (
                    <a
                      href={`tel:${k.no_telp}`}
                      aria-label={`Panggil telepon ke ${k.nama || 'keluarga'}`}
                      onClick={() => onLogAksi?.(`Telepon Kontak Darurat (${k.nama})`)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
                      title={`Panggil Telepon ${k.nama}`}
                    >
                      <Phone size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Eskalasi Cepat ke Medis/Ambulans */}
      <div className="pt-2 border-t border-slate-100 shrink-0 no-print">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
          Eskalasi Hotline Darurat:
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            aria-label="Panggil hotline darurat medis 119"
            onClick={() => {
              onLogAksi?.('Eskalasi Medis (119)');
              window.location.href = 'tel:119';
            }}
            className="btn-base btn-danger text-[11px] h-7.5 justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
          >
            <ShieldAlert size={12} />
            <span>Medis (119)</span>
          </button>
          <button
            type="button"
            aria-label="Panggil ambulans 118"
            onClick={() => {
              onLogAksi?.('Ambulans (118)');
              window.location.href = 'tel:118';
            }}
            className="btn-base btn-secondary text-[11px] h-7.5 justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
          >
            <PhoneCall size={12} />
            <span>Ambulans (118)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
