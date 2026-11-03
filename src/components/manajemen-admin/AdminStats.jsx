import { Users, Shield, CheckCircle2, Calendar } from 'lucide-react';

/**
 * AdminStats: Card statistik ringkas.
 * Hanya menampilkan data yang tersedia dari endpoint GET /superadmin/admins:
 *   - total admin
 *   - admin yang sudah punya minimal 1 permission
 *   - admin yang belum punya permission sama sekali
 *   - admin terdaftar bulan ini (berdasarkan created_at)
 */
export default function AdminStats({ totalAdmin, adminDenganAkses, adminTanpaAkses }) {
  const stats = [
    {
      label: 'Total Admin & Superadmin',
      value: totalAdmin,
      icon: Users,
      iconBg: 'bg-slate-50',
      iconColor: 'text-slate-600',
    },
    {
      label: 'Punya Hak Akses Khusus',
      value: adminDenganAkses,
      icon: Shield,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Belum Ada Akses Modul',
      value: adminTanpaAkses,
      icon: CheckCircle2,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white border border-[#eaedf1] rounded-2xl p-5 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-[12px] font-semibold text-slate-500 leading-none">{s.label}</p>
            <p className="text-[30px] font-black text-slate-900 leading-none mt-2">{s.value ?? '-'}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.iconBg}`}>
            <s.icon size={22} className={s.iconColor} />
          </div>
        </div>
      ))}
    </div>
  );
}
