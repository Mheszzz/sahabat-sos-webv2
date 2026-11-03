import { useState } from 'react';
import {
  UserPlus, X, Loader2, CheckCircle2, AlertTriangle, Info,
  User, Mail, Phone, MapPin, Briefcase
} from 'lucide-react';
import { adminService } from '../../api/services/adminService';

const SUGGESTED_JOBS = [
  'Tim Medis / Nakes',
  'SAR & Evakuasi',
  'Distribusi Logistik',
  'Komunikasi & Radio',
  'Relawan Umum',
];

export default function RelawanAddModal({ isOpen, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    no_telp: '',
    alamat: '',
    pekerjaan: '',
  });
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setForm({ name: '', email: '', no_telp: '', alamat: '', pekerjaan: '' });
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
      await adminService.registerRelawan({
        name: form.name.trim(),
        email: form.email.trim(),
        no_telp: form.no_telp.trim(),
        alamat: form.alamat.trim(),
        pekerjaan: form.pekerjaan.trim(),
      });
      handleClose();
      onSave();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : '') ||
        'Gagal mendaftarkan relawan. Silakan coba lagi.';
      setError(msg);
      setIsConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#eaedf1] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#0b6f61]">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900 leading-tight">Tambah Relawan Baru</h2>
              <p className="text-[12px] text-slate-500">Pendaftaran mandiri personil relawan oleh admin</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Info Google SSO */}
          <div className="flex items-start gap-2.5 bg-sky-50/70 border border-sky-200 rounded-xl p-3 text-sky-900 text-[12px] leading-relaxed">
            <Info size={16} className="flex-shrink-0 mt-0.5 text-sky-600" />
            <div>
              <p className="font-bold text-sky-900">Autentikasi Google SSO</p>
              <p className="text-sky-800 text-[11.5px] mt-0.5">
                Relawan akan login di aplikasi mobile menggunakan tombol <strong>Masuk dengan Google</strong> dengan email terdaftar. Kata sandi dibuat otomatis oleh sistem.
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-700 text-[12px] font-semibold">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Confirmation Notice */}
          {isConfirming && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-[12px]">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold">Konfirmasi Penambahan Relawan</p>
                <p className="mt-0.5 text-amber-800">
                  Daftarkan <strong>{form.name}</strong> ({form.email})? Akun akan langsung aktif dan terverifikasi di sistem.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form id="relawan-form" onSubmit={handleSubmit} className="space-y-3.5">
            {/* Nama Lengkap */}
            <div>
              <label className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Nama Lengkap Relawan <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-200 pl-10 pr-3 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0b6f61]/15 focus:border-[#0b6f61]"
                  placeholder="Contoh: Siti Rahayu, S.Kep"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Google */}
            <div>
              <label className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Email Akun Google <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-200 pl-10 pr-3 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0b6f61]/15 focus:border-[#0b6f61]"
                  placeholder="relawan@gmail.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Nomor Telepon */}
            <div>
              <label className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Nomor WhatsApp / Telepon <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={form.no_telp}
                  onChange={(e) => setForm({ ...form, no_telp: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-200 pl-10 pr-3 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0b6f61]/15 focus:border-[#0b6f61]"
                  placeholder="08xxxxxxxxxx"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Pekerjaan / Keahlian */}
            <div>
              <label className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Pekerjaan / Bidang Keahlian
              </label>
              <div className="relative">
                <Briefcase size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={form.pekerjaan}
                  onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })}
                  className="w-full h-10 rounded-xl border border-slate-200 pl-10 pr-3 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0b6f61]/15 focus:border-[#0b6f61]"
                  placeholder="Contoh: Tenaga Medis, Relawan SAR"
                  disabled={loading}
                />
              </div>
              {/* Quick suggestion pills */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400">Pilih cepat:</span>
                {SUGGESTED_JOBS.map((job) => (
                  <button
                    key={job}
                    type="button"
                    onClick={() => setForm({ ...form, pekerjaan: job })}
                    className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-[#0b6f61] text-slate-600 transition-colors cursor-pointer"
                  >
                    {job}
                  </button>
                ))}
              </div>
            </div>

            {/* Alamat Domisili */}
            <div>
              <label className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Alamat Domisili Relawan <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-3 text-slate-400" />
                <textarea
                  required
                  rows={2}
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0b6f61]/15 focus:border-[#0b6f61] resize-none"
                  placeholder="Jl. Pahlawan No. 45, RT 02/RW 04, Kota"
                  disabled={loading}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form="relawan-form"
            disabled={loading}
            className="px-5 h-10 rounded-xl bg-[#0b6f61] hover:bg-[#085d52] text-white text-[13px] font-semibold transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Mendaftarkan...</span>
              </>
            ) : isConfirming ? (
              <>
                <CheckCircle2 size={14} />
                <span>Ya, Daftarkan Sekarang</span>
              </>
            ) : (
              <span>Lanjutkan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
