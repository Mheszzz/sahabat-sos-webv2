import { User, Phone, MessageSquare, ShieldAlert } from 'lucide-react';
import InitialsAvatar from '../global/InitialsAvatar';

/**
 * ProfilKorbanCard
 * Menampilkan profil korban/pelapor, kebutuhan aksesibilitas,
 * catatan medis darurat, serta tombol panggilan telepon dan WhatsApp langsung.
 */
export default function ProfilKorbanCard({
  pengguna,
  onLogAksi,
}) {
  const waUrl = pengguna?.whatsapp_url || (
    pengguna?.no_telp_wa || pengguna?.no_telp
      ? `https://wa.me/${String(pengguna.no_telp_wa || pengguna.no_telp).replace(/[^0-9]/g, '').replace(/^0/, '62')}`
      : null
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs shrink-0 space-y-3">
      {/* Header Kartu */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <User size={13} className="text-[#0b6f61]" />
          Profil Pelapor / Korban
        </span>
        {pengguna?.kategori_user && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
            {pengguna.kategori_user}
          </span>
        )}
      </div>

      {/* Info Identitas Pokok */}
      <div className="flex items-center gap-3">
        <InitialsAvatar name={pengguna?.name || 'Korban'} src={pengguna?.foto_url} size={42} />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-black text-slate-900 truncate">{pengguna?.name || 'Anonim'}</p>
          <p className="text-[11px] text-slate-500 truncate">{pengguna?.email || 'Tidak ada email terdaftar'}</p>
          <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{pengguna?.no_telp || 'No HP tidak tersedia'}</p>
        </div>
      </div>

      {/* Tombol Interaksi Langsung Korban/Pelapor (Telepon & WhatsApp) */}
      {pengguna?.no_telp && (
        <div className="flex items-center gap-1.5 pt-0.5 no-print">
          <a
            href={`tel:${pengguna.no_telp}`}
            onClick={() => onLogAksi?.(`Panggilan Telepon ke Korban/Pelapor (${pengguna.name || 'Korban'})`)}
            aria-label={`Panggil telepon ke ${pengguna?.name || 'korban'}`}
            className="btn-base btn-secondary text-[11px] h-7.5 px-2.5 flex-1 justify-center text-rose-700 border-rose-200 hover:bg-rose-50 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            title="Hubungi korban via telepon langsung"
          >
            <Phone size={12} className="text-rose-600" />
            <span>Telepon</span>
          </a>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onLogAksi?.(`WhatsApp ke Korban/Pelapor (${pengguna.name || 'Korban'})`)}
              aria-label={`Buka WhatsApp ke ${pengguna?.name || 'korban'}`}
              className="btn-base btn-secondary text-[11px] h-7.5 px-2.5 flex-1 justify-center text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              title="Buka percakapan WhatsApp dengan korban"
            >
              <MessageSquare size={12} className="text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      )}

      {/* Rincian Kebutuhan Difabel / Khusus */}
      <div className="space-y-1.5 pt-1 text-[11px]">
        {pengguna?.kebutuhan_aksesibilitas && (
          <div className="flex justify-between items-start gap-2 py-1 border-t border-slate-100">
            <span className="text-slate-600 font-semibold shrink-0">Kebutuhan Khusus:</span>
            <span className="text-slate-800 font-bold text-right">{pengguna.kebutuhan_aksesibilitas}</span>
          </div>
        )}
        {pengguna?.metode_komunikasi && (
          <div className="flex justify-between items-center gap-2 py-1 border-t border-slate-100">
            <span className="text-slate-600 font-semibold shrink-0">Metode Komunikasi:</span>
            <span className="text-slate-800 font-bold capitalize">{pengguna.metode_komunikasi}</span>
          </div>
        )}
        {pengguna?.keterangan_medis && (
          <div className="p-2 bg-rose-50/80 border border-rose-200 rounded-xl mt-1 text-[11px]">
            <span className="font-bold text-rose-800 flex items-center gap-1 text-[10px] uppercase">
              <ShieldAlert size={12} />
              Catatan Medis Khusus:
            </span>
            <p className="text-rose-900 font-semibold mt-0.5 leading-snug">
              {pengguna.keterangan_medis}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
