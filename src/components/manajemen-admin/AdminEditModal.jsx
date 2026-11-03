import { useState, useEffect } from 'react';
import { UserCheck, X, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { adminService } from '../../api/services/adminService';

export default function AdminEditModal({ admin, isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    no_telp: '',
    alamat: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (admin) {
      setForm({
        name: admin.name || admin.nama || '',
        email: admin.email || admin.accounts?.[0]?.email || '',
        password: '',
        no_telp: admin.no_telp || '',
        alamat: admin.alamat || '',
      });
      setError('');
    }
  }, [admin]);

  if (!isOpen || !admin) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const payload = {
        name: form.name,
        email: form.email,
        no_telp: form.no_telp || null,
        alamat: form.alamat || null,
      };
      if (form.password && form.password.trim().length > 0) {
        payload.password = form.password;
      }

      await adminService.updateAdmin(admin.id, payload);
      onSave();
    } catch (err) {
      const msg = err?.response?.data?.message
        || (err?.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(', ') : '')
        || 'Gagal memperbarui data admin. Coba lagi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#eaedf1] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <UserCheck size={16} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">Edit Data Administrator</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{admin.name || admin.nama}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-700 text-[12px] font-semibold">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
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
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-blue-500"
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
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-[12px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Kata Sandi Baru <span className="normal-case text-slate-400 font-normal">(Kosongkan jika tidak ingin mengubah)</span>
            </label>
            <input
              type="password"
              minLength={6}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-blue-500"
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
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-blue-500"
              placeholder="08123456789"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-[12px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Alamat Posko / Kantor</label>
            <input
              type="text"
              value={form.alamat}
              onChange={e => setForm({ ...form, alamat: e.target.value })}
              className="w-full h-10 rounded-xl border border-slate-200 px-3 text-[13px] focus:outline-none focus:border-blue-500"
              placeholder="Alamat penugasan posko"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 h-10 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 h-10 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <><Loader2 size={14} className="animate-spin" /><span>Menyimpan...</span></>
              ) : (
                <><CheckCircle2 size={14} /><span>Simpan Perubahan</span></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
