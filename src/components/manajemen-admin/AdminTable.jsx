import { Eye, Shield, Power, Clock, CheckCircle2, XCircle, AlertCircle, ShieldCheck, Sparkles, Edit2 } from 'lucide-react';
import InitialsAvatar from '../global/InitialsAvatar';

/**
 * Pemetaan izin (permissions) ke label Bahasa Indonesia dan tema visual
 */
const PERMISSION_CONFIG = {
  kelola_laporan: {
    label: 'Kelola Laporan Darurat',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  verifikasi_relawan: {
    label: 'Verifikasi Relawan',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  pantau_peta: {
    label: 'Pantau Peta Kasus',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  kelola_relawan: {
    label: 'Kelola Relawan',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  broadcast_sirene: {
    label: 'Broadcast Sirene Posko',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  kelola_admin: {
    label: 'Kelola Administrator',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
};

/**
 * Komponen untuk menampilkan badge permission secara rapi dengan bahasa Indonesia.
 */
function PermissionChip({ perm }) {
  const config = PERMISSION_CONFIG[perm] || {
    label: perm
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 border text-[11px] font-semibold px-2 py-0.5 rounded-md ${config.badgeClass}`}
    >
      <CheckCircle2 size={11} className="flex-shrink-0" />
      <span>{config.label}</span>
    </span>
  );
}

/**
 * Memformat tanggal dari ISO string ke format lokal Indonesia.
 * Mengembalikan null jika tanggal tidak valid.
 */
function formatTanggal(isoString) {
  if (!isoString) return null;
  try {
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

// ─── Loading Skeleton Row ─────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-[#eaedf1]">
      {[1, 2, 3, 4].map((i) => (
        <td key={i} className="p-4">
          <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-3/4" />
          <div className="h-3 bg-slate-100 rounded-lg animate-pulse w-1/2 mt-2" />
        </td>
      ))}
    </tr>
  );
}

export default function AdminTable({ admins, isLoading, error, onDetail, onEdit, onPermissions, onToggleStatus }) {
  // ── Loading State ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-white border border-[#eaedf1] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-[#eaedf1]">
                <th className="p-4 text-[12px] font-bold text-slate-900 uppercase tracking-wider w-[280px]">Profil Admin</th>
                <th className="p-4 text-[12px] font-bold text-slate-900 uppercase tracking-wider">Hak Akses</th>
                <th className="p-4 text-[12px] font-bold text-slate-900 uppercase tracking-wider">Info Akun</th>
                <th className="p-4 text-[12px] font-bold text-slate-900 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaedf1]">
              {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-white border border-red-100 rounded-2xl p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
          <XCircle size={24} className="text-red-500" />
        </div>
        <p className="text-[14px] font-bold text-red-600">{error}</p>
        <p className="text-[12px] text-slate-400 mt-1">Periksa koneksi jaringan atau coba muat ulang halaman.</p>
      </div>
    );
  }

  // ── Empty State ──────────────────────────────────────────────────────────────
  if (!Array.isArray(admins) || admins.length === 0) {
    return (
      <div className="bg-white border border-[#eaedf1] rounded-2xl p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
          <AlertCircle size={24} className="text-slate-400" />
        </div>
        <p className="text-[14px] font-bold text-slate-700">Tidak ada admin ditemukan</p>
        <p className="text-[12px] text-slate-400 mt-1">Coba ubah kata kunci pencarian atau filter yang aktif.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#eaedf1] rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-[#eaedf1]">
              {/* Kolom 1: Profil */}
              <th className="p-4 text-[12px] font-bold text-slate-900 uppercase tracking-wider w-[280px]">
                Profil Administrator
              </th>
              {/* Kolom 2: Hak Akses */}
              <th className="p-4 text-[12px] font-bold text-slate-900 uppercase tracking-wider">
                Hak Akses Modul
              </th>
              {/* Kolom 3: Info Akun */}
              <th className="p-4 text-[12px] font-bold text-slate-900 uppercase tracking-wider">
                Info Akun & Izin
              </th>
              {/* Kolom 4: Aksi */}
              <th className="p-4 text-[12px] font-bold text-slate-900 uppercase tracking-wider text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaedf1]">
            {admins.map((admin) => {
              const nama = admin.name || admin.nama || 'Admin';
              const permissions = Array.isArray(admin.permissions) ? admin.permissions : [];
              const hasPermissions = permissions.length > 0;
              const terdaftar = formatTanggal(admin.created_at);
              const aksesDisetujui = formatTanggal(admin.permissions_granted_at);
              const isSuperAdmin = (admin.role || '').toLowerCase() === 'superadmin';

              return (
                <tr
                  key={admin.id}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  {/* ── Kolom 1: Profil ── */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={nama} src={admin.foto_profile || admin.foto_url} size={40} />
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                          {nama}
                        </p>
                        <p className="text-[12px] text-slate-500 truncate">
                          {admin.email || admin.accounts?.[0]?.email || '-'}
                        </p>
                        {/* Role & Status Badge */}
                        <div className="flex items-center gap-1.5 mt-1">
                          {isSuperAdmin ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                              <ShieldCheck size={11} className="text-purple-600" />
                              Super Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              <Shield size={11} className="text-slate-500" />
                              Admin
                            </span>
                          )}

                          {admin.is_active === false ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              Nonaktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Aktif
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ── Kolom 2: Hak Akses ── */}
                  <td className="p-4">
                    {isSuperAdmin ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-800 border border-purple-200 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                          <Sparkles size={12} className="text-purple-600" />
                          Akses Penuh (Seluruh Modul)
                        </span>
                      </div>
                    ) : hasPermissions ? (
                      <div className="flex flex-wrap gap-1.5 max-w-[360px]">
                        {permissions.map((perm) => (
                          <PermissionChip key={perm} perm={perm} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                        <span className="text-[12px] text-slate-500 font-medium">Hanya Akses Beranda (Belum Ada Izin)</span>
                      </div>
                    )}
                  </td>

                  {/* ── Kolom 3: Info Akun ── */}
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5">
                      {terdaftar && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Clock size={11} className="text-slate-400 flex-shrink-0" />
                          <span>Terdaftar: <span className="font-semibold text-slate-700">{terdaftar}</span></span>
                        </div>
                      )}
                      {isSuperAdmin ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-purple-700">
                          <ShieldCheck size={11} className="text-purple-500 flex-shrink-0" />
                          <span className="font-semibold">Hak akses penuh permanen</span>
                        </div>
                      ) : aksesDisetujui ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Shield size={11} className="text-blue-500 flex-shrink-0" />
                          <span>
                            Diberikan:{' '}
                            <span className="font-semibold text-slate-700">{aksesDisetujui}</span>
                            {admin.granted_by?.name && (
                              <span className="text-slate-400"> oleh {admin.granted_by.name}</span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Shield size={11} className="text-slate-300 flex-shrink-0" />
                          <span className="italic">Belum ada izin modul khusus</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* ── Kolom 4: Aksi ── */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Lihat Detail Admin */}
                      <button
                        onClick={() => onDetail(admin)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 flex items-center justify-center transition-all cursor-pointer"
                        title="Lihat Detail Profil & Izin"
                      >
                        <Eye size={14} />
                      </button>

                      {/* Edit Akun Admin */}
                      {isSuperAdmin ? (
                        <button
                          disabled
                          className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-300 flex items-center justify-center cursor-not-allowed"
                          title="Data Super Admin dikelola melalui halaman Pengaturan Profil Pribadi"
                        >
                          <Edit2 size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onEdit(admin)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 flex items-center justify-center transition-all cursor-pointer"
                          title="Edit Data Admin"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}

                      {/* Kelola Hak Akses */}
                      {isSuperAdmin ? (
                        <button
                          disabled
                          className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-300 flex items-center justify-center cursor-not-allowed"
                          title="Super Admin memiliki akses penuh tanpa perlu pengaturan izin per modul"
                        >
                          <Shield size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onPermissions(admin)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 flex items-center justify-center transition-all cursor-pointer"
                          title="Kelola Hak Akses Modul"
                        >
                          <Shield size={14} />
                        </button>
                      )}

                      {/* Aktifkan / Nonaktifkan Akun (Power Toggle) */}
                      {isSuperAdmin ? (
                        <button
                          disabled
                          className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-300 flex items-center justify-center cursor-not-allowed"
                          title="Akun Super Admin bersifat permanen dan tidak dapat dinonaktifkan"
                        >
                          <Power size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleStatus(admin)}
                          className={`w-8 h-8 rounded-lg bg-white border flex items-center justify-center transition-all cursor-pointer ${
                            admin.is_active === false
                              ? 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300'
                              : 'border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50'
                          }`}
                          title={admin.is_active === false ? 'Aktifkan Kembali Akun Admin' : 'Nonaktifkan Akun Admin'}
                        >
                          <Power size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: info jumlah data */}
      <div className="px-5 py-3 bg-slate-50/60 border-t border-[#eaedf1] flex items-center justify-between">
        <p className="text-[12px] text-slate-500">
          Menampilkan <span className="font-bold text-slate-700">{admins.length}</span> admin
        </p>
      </div>
    </div>
  );
}
