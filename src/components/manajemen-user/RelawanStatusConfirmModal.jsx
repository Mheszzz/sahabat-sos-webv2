import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';

export default function RelawanStatusConfirmModal({
  isOpen,
  onClose,
  relawan,
  targetStatus, // boolean: true (to activate) or false (to deactivate)
  onConfirm,
  isLoading,
}) {
  if (!isOpen || !relawan) return null;

  const isActivating = targetStatus === true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#eaedf1] space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isActivating ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {isActivating ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-900 leading-tight">
                {isActivating ? 'Aktifkan Akun Relawan?' : 'Nonaktifkan Akun Relawan?'}
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5">Konfirmasi perubahan status operasional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="text-[13px] text-slate-600 space-y-2 leading-relaxed">
          <p>
            Apakah Anda yakin ingin {isActivating ? 'mengaktifkan' : 'menonaktifkan'} akun relawan{' '}
            <strong className="text-slate-900 font-bold">{relawan.name || relawan.nama || 'ini'}</strong>
            {relawan.email ? ` (${relawan.email})` : ''}?
          </p>
          <div
            className={`p-3 rounded-xl border text-[12px] leading-relaxed ${
              isActivating
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            {isActivating ? (
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  Relawan akan kembali siaga dan dapat menerima tawaran tugas pertolongan darurat (SOS) serta laporan posko.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  Relawan tidak akan menerima notifikasi dispatch darurat baru sampai akun diaktifkan kembali oleh pengelola.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 h-10 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(relawan.id, isActivating)}
            disabled={isLoading}
            className={`px-4 h-10 rounded-xl text-white text-[13px] font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer ${
              isActivating
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : isActivating ? (
              <span>Ya, Aktifkan Relawan</span>
            ) : (
              <span>Ya, Nonaktifkan Akun</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
