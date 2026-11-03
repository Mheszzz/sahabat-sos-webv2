import { X, Shield, ShieldCheck, Mail, Phone, MapPin, Calendar, CheckCircle2, User } from 'lucide-react';
import InitialsAvatar from '../global/InitialsAvatar';

const PERMISSION_CONFIG = {
  kelola_laporan: 'Kelola Laporan Darurat',
  verifikasi_relawan: 'Verifikasi Relawan',
  pantau_peta: 'Pantau Peta Kasus',
  kelola_relawan: 'Kelola Relawan',
  broadcast_sirene: 'Broadcast Sirene Posko',
  kelola_admin: 'Kelola Administrator',
};

function formatTanggal(isoString) {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export default function AdminDetailModal({ admin, isOpen, onClose }) {
  if (!isOpen || !admin) return null;

  const nama = admin.name || admin.nama || 'Administrator';
  const email = admin.email || admin.accounts?.[0]?.email || '-';
  const permissions = Array.isArray(admin.permissions) ? admin.permissions : [];
  const isSuperAdmin = (admin.role || '').toLowerCase() === 'superadmin';
  const isActive = admin.is_active !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#eaedf1] space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <InitialsAvatar name={nama} src={admin.foto_profile || admin.foto_url} size={44} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-bold text-slate-900">{nama}</h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                }`}>
                  {isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <p className="text-[12px] text-slate-500">{email}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 text-[13px]">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Peran (Role)</p>
              <p className="font-bold text-slate-800 capitalize mt-0.5 flex items-center gap-1.5">
                {isSuperAdmin ? <ShieldCheck size={14} className="text-purple-600" /> : <Shield size={14} className="text-slate-500" />}
                {isSuperAdmin ? 'Super Admin' : 'Admin Posko'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">No. Telepon</p>
              <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                <Phone size={14} className="text-slate-400" />
                {admin.no_telp || '-'}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Alamat Posko</p>
              <p className="font-medium text-slate-700 mt-0.5 flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                {admin.alamat || 'Belum diisi'}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-[12px]">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5"><Calendar size={13} className="text-slate-400" /> Tanggal Terdaftar:</span>
              <span className="font-semibold text-slate-800">{formatTanggal(admin.created_at)}</span>
            </div>
            {!isSuperAdmin && admin.permissions_granted_at && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5"><Shield size={13} className="text-slate-400" /> Izin Diberikan:</span>
                <span className="font-semibold text-slate-800">
                  {formatTanggal(admin.permissions_granted_at)}
                  {admin.granted_by?.name && <span className="text-slate-500"> (oleh {admin.granted_by.name})</span>}
                </span>
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Hak Akses Modul Aktif</p>
            {isSuperAdmin ? (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-800 font-semibold text-[12px]">
                Super Admin memiliki akses penuh tanpa batas ke seluruh modul sistem.
              </div>
            ) : permissions.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {permissions.map(perm => (
                  <div key={perm} className="flex items-center gap-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[12px] font-medium">
                    <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />
                    <span>{PERMISSION_CONFIG[perm] || perm}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic text-[12px]">Hanya dapat mengakses Beranda Dashboard (belum ada izin modul khusus).</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 h-10 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
