import { useState, useEffect } from 'react';
import { X, Shield, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { adminService } from '../../api/services/adminService';

// Sesuai backend: available_permissions dari GET /superadmin/admins
const AVAILABLE_PERMISSIONS = [
  {
    key: 'verifikasi_relawan',
    label: 'Verifikasi Relawan',
    description: 'Izin melihat daftar relawan pending dan memverifikasi atau menolak pendaftaran.',
  },
  {
    key: 'kelola_laporan',
    label: 'Kelola Laporan Darurat',
    description: 'Izin memantau seluruh laporan kasus SOS dan mengubah status penanganan laporan.',
  },
  {
    key: 'pantau_peta',
    label: 'Pantau Peta Kasus',
    description: 'Izin mengakses peta pemantauan sebaran kejadian kasus darurat dan lokasi relawan.',
  },
  {
    key: 'kelola_relawan',
    label: 'Kelola Data Relawan',
    description: 'Izin melihat direktori relawan dan mengaktifkan / menonaktifkan status relawan.',
  },
  {
    key: 'broadcast_sirene',
    label: 'Broadcast Sirene Posko',
    description: 'Izin memicu sirene alarm darurat di seluruh titik posko siaga.',
  },
  {
    key: 'kelola_admin',
    label: 'Kelola Administrator',
    description: 'Izin membuat akun admin baru serta mengonfigurasi hak akses administrator.',
  },
];

export default function AdminPermissionsModal({ admin, onClose, onSave }) {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sinkronisasi state saat admin berubah
  useEffect(() => {
    if (admin) {
      const perms = Array.isArray(admin.permissions) ? admin.permissions : [];
      setSelected(perms);
      setError('');
    }
  }, [admin]);

  if (!admin) return null;

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await adminService.updateAdminPermissions(admin.id, selected);
      onSave(selected);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Gagal memperbarui hak akses. Coba lagi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#eaedf1] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Shield size={16} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">Kelola Hak Akses</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{admin.name || admin.nama}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-700 text-[12px] font-semibold">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Permission List */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Hak Akses Tersedia
          </p>
          {AVAILABLE_PERMISSIONS.map((p) => {
            const isChecked = selected.includes(p.key);
            return (
              <label
                key={p.key}
                className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                  isChecked
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(p.key)}
                  className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0 cursor-pointer"
                  disabled={loading}
                />
                <div>
                  <p className={`text-[13px] font-semibold ${isChecked ? 'text-emerald-800' : 'text-slate-700'}`}>
                    {p.label}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{p.description}</p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Info nota */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-[11px] text-amber-700">
          Hak akses yang diberikan berlaku segera setelah disimpan. Admin yang hak aksesnya dikosongkan hanya dapat mengakses Beranda.
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 h-10 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 h-10 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /><span>Menyimpan...</span></>
            ) : (
              <><CheckCircle2 size={14} /><span>Simpan Perubahan</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
