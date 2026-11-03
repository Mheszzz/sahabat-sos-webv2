import { useEffect } from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';

/**
 * SelesaiKasusModal
 * Modal konfirmasi penyelesaian kasus darurat/laporan.
 * Memungkinkan petugas admin memasukkan catatan hasil penanganan sebelum menandai status selesai.
 */
export default function SelesaiKasusModal({
  kasus,
  catatanSelesai,
  setCatatanSelesai,
  loadingSelesai,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="selesai-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4 animate-scale-up">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 id="selesai-modal-title" className="text-[15px] font-black text-slate-900">Selesaikan Kasus?</h3>
            <p className="text-[11.5px] text-slate-600 mt-0.5">
              Tindakan ini akan menandai kasus tuntas dan mencatat hasil penanganan ke riwayat.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal konfirmasi"
            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
            title="Tutup Modal"
          >
            <X size={14} />
          </button>
        </div>

        {/* Ringkasan Kasus */}
        <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-[11.5px] border border-slate-100">
          <p className="font-bold text-slate-800">
            Kasus #{kasus?.id} &middot; {kasus?.kategori_laporan || 'Darurat'}
          </p>
          <p className="text-slate-600">
            Pelapor: <span className="font-semibold text-slate-800">{kasus?.pengguna?.name || 'Anonim'}</span>
          </p>
          <p className="text-slate-600">
            Relawan: <span className="font-semibold text-slate-800">{kasus?.relawan?.name || 'Admin Langsung'}</span>
          </p>
        </div>

        {/* Catatan Selesai */}
        <div>
          <label htmlFor="catatan-selesai-input" className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
            Catatan Penanganan Petugas
          </label>
          <textarea
            id="catatan-selesai-input"
            rows={3}
            value={catatanSelesai}
            onChange={(e) => setCatatanSelesai(e.target.value)}
            placeholder="Contoh: Korban berhasil dievakuasi ke RSUD terdekat dalam kondisi stabil."
            className="w-full text-[12px] p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0b6f61] focus-visible:ring-2 focus-visible:ring-[#0b6f61]/20 outline-none resize-none transition-colors"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-base btn-secondary text-[12px] h-8.5 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loadingSelesai}
            className="btn-base btn-primary text-[12px] h-8.5 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
          >
            {loadingSelesai ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            <span>{loadingSelesai ? 'Menyimpan...' : 'Tandai Selesai'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
