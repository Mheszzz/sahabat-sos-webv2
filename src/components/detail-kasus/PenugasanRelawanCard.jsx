import {
  Shield, Phone, ChevronDown, ChevronUp, UserCheck, Loader2, X, Navigation
} from 'lucide-react';
import Badge from '../global/Badge';
import InitialsAvatar from '../global/InitialsAvatar';

/**
 * QuickDispatchInline
 * Panel daftar relawan untuk memilih & menugaskan relawan secara cepat.
 */
function QuickDispatchInline({
  relawanList = [],
  loadingRelawan,
  selectedRelawanId,
  setSelectedRelawanId,
  loadingDispatch,
  onConfirm,
  onClose,
}) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 animate-fade-in">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
        <span>Pilih Relawan Terdekat:</span>
        <button
          type="button"
          aria-label="Tutup panel pilih relawan"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-800 p-0.5 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
        >
          <X size={12} />
        </button>
      </div>

      {loadingRelawan ? (
        <div className="flex items-center gap-2 py-3 text-slate-500 text-[11px]">
          <Loader2 size={13} className="animate-spin text-[#0b6f61]" />
          <span>Mencari relawan di sekitar lokasi...</span>
        </div>
      ) : relawanList.length === 0 ? (
        <p className="text-[11px] text-slate-500 italic py-1">Tidak ada relawan yang terdeteksi di radius tugas.</p>
      ) : (
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {relawanList.map((vol) => {
            const isSelected = selectedRelawanId === vol.id;
            const name = vol.name || vol.nama || `Relawan #${vol.id}`;
            const jarak = vol.jarak_text && vol.jarak_text !== '-'
              ? vol.jarak_text
              : (vol.jarak_km ? `${vol.jarak_km} km` : 'Area Siaga');

            return (
              <button
                key={vol.id}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Pilih relawan ${name}, jarak ${jarak}`}
                onClick={() => setSelectedRelawanId(vol.id)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                  isSelected
                    ? 'border-[#0b6f61] bg-emerald-50/80 ring-1 ring-[#0b6f61]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <InitialsAvatar name={name} src={vol.foto_profile || vol.foto_url} size={24} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{name}</p>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{vol.kompetensi || 'Relawan Siaga'} &middot; {jarak}</p>
                </div>
                <Badge
                  variant={vol.status === 'sedang_bertugas' || vol.status === 'bertugas' ? 'Sedang Bertugas' : 'Online'}
                  isPill
                  className="scale-90"
                />
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        aria-label="Konfirmasi penugasan relawan terpilih"
        onClick={onConfirm}
        disabled={!selectedRelawanId || loadingDispatch}
        className="btn-base btn-primary text-[11px] h-7.5 w-full justify-center disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
      >
        {loadingDispatch ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
        <span>{loadingDispatch ? 'Menugaskan...' : 'Konfirmasi Penugasan'}</span>
      </button>
    </div>
  );
}

/**
 * PenugasanRelawanCard
 * Menampilkan status relawan penangan, jarak tempuh ke korban,
 * tombol kontak relawan, serta modal/drawer dispatch penugasan relawan.
 */
export default function PenugasanRelawanCard({
  relawanBertugas,
  relawanDistanceText,
  isSelesai,
  showDispatchPanel,
  setShowDispatchPanel,
  relawanList = [],
  loadingRelawan,
  selectedRelawanId,
  setSelectedRelawanId,
  loadingDispatch,
  onDispatch,
  onOpenDispatchPanel,
  onLogAksi,
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs shrink-0 space-y-2.5">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Shield size={13} className="text-[#0b6f61]" />
          Penugasan Relawan
        </span>
        {relawanBertugas && (
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            Sedang Menuju Lokasi
          </span>
        )}
      </div>

      {relawanBertugas ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <InitialsAvatar name={relawanBertugas.name} src={relawanBertugas.foto_url} size={36} bgClass="bg-emerald-700" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-slate-900 truncate">{relawanBertugas.name}</p>
              <p className="text-[11px] text-slate-600 truncate">{relawanBertugas.kompetensi || relawanBertugas.role_title || 'Relawan Tanggap Darurat'}</p>
              {relawanDistanceText && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-900 bg-emerald-100/90 px-1.5 py-0.5 rounded-md mt-1">
                  <Navigation size={9} className="text-emerald-700" />
                  Jarak ke Korban: {relawanDistanceText}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 no-print">
            {relawanBertugas.no_telp && (
              <a
                href={`tel:${relawanBertugas.no_telp}`}
                aria-label={`Hubungi relawan ${relawanBertugas.name} via telepon`}
                onClick={() => onLogAksi?.(`Telepon Relawan (${relawanBertugas.name})`)}
                className="btn-base btn-primary text-[11px] h-7.5 flex-1 justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
              >
                <Phone size={12} />
                <span>Hubungi Relawan</span>
              </a>
            )}
            {!isSelesai && (
              <button
                type="button"
                aria-label="Ganti relawan yang ditugaskan"
                aria-expanded={showDispatchPanel}
                onClick={() => setShowDispatchPanel?.(!showDispatchPanel)}
                className="btn-base btn-secondary text-[11px] h-7.5 px-2.5 justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
                title="Ganti relawan yang ditugaskan"
              >
                {showDispatchPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                <span>Ganti</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[11.5px] text-amber-900 flex items-center justify-between">
            <span>Belum ada relawan ditugaskan</span>
            {!isSelesai && (
              <button
                type="button"
                aria-label="Tugaskan relawan untuk kasus ini"
                onClick={onOpenDispatchPanel}
                className="btn-base btn-primary text-[10.5px] h-6 px-2 no-print focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
              >
                <UserCheck size={11} />
                Tugaskan
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Dispatch Panel Drawer */}
      {showDispatchPanel && !isSelesai && (
        <div className="no-print">
          <QuickDispatchInline
            relawanList={relawanList}
            loadingRelawan={loadingRelawan}
            selectedRelawanId={selectedRelawanId}
            setSelectedRelawanId={setSelectedRelawanId}
            loadingDispatch={loadingDispatch}
            onConfirm={onDispatch}
            onClose={() => {
              setShowDispatchPanel?.(false);
              setSelectedRelawanId?.(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
