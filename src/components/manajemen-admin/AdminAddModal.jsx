import { useState } from 'react';
import { UserPlus, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { adminService } from '../../api/services/adminService';

export default function AdminAddModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', no_telp: '', alamat: '' });
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setForm({ name: '', email: '', password: '', no_telp: '', alamat: '' });
    setIsConfirming(false);
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }
    try {
      setLoading(true);
      setError('');
      await adminService.createAdmin({
        name: form.name,
        email: form.email,
        password: form.password,
        no_telp: form.no_telp || undefined,
        alamat: form.alamat || undefined,
      });
      handleClose();
      onSave(); // trigger refresh tabel
    } catch (err) {
      const msg = err?.response?.data?.message
        || (err?.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : '')
        || 'Gagal membuat akun admin. Coba lagi.';
      setError(msg);
      setIsConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#eaedf1] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <UserPlus size={16} />
            </div>
            <h2 className="text-[17px] font-bold text-slate-900">Tambah Admin Baru</h2>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-700 text-[12px] font-semibold">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isConfirming && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-amber-800 text-[12px] font-semibold">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>Konfirmasi: Buat akun admin untuk <strong>{form.email}</strong>?</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[12px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-emerald-500"
              placeholder="Contoh: Budi Santoso"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-[12px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-emerald-500"
              placeholder="admin@sahabatsos.id"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-[12px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Kata Sandi *</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-emerald-500"
              placeholder="Minimal 6 karakter"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-[12px] font-bold uppercase tracking-wider text-slate-500 block mb-1">No. Telepon</label>
            <input
              type="text"
              value={form.no_telp}
              onChange={e => setForm({ ...form, no_telp: e.target.value })}
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-emerald-500"
              placeholder="08123456789 (Opsional)"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-[12px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Alamat Posko / Kantor</label>
            <input
              type="text"
              value={form.alamat}
              onChange={e => setForm({ ...form, alamat: e.target.value })}
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-emerald-500"
              placeholder="Contoh: Posko Pusat Yogyakarta (Opsional)"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 h-10 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 h-10 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /><span>Menyimpan...</span></>
              ) : isConfirming ? (
                <><CheckCircle2 size={14} /><span>Ya, Buat Akun</span></>
              ) : (
                <span>Lanjutkan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
