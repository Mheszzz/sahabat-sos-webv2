import { Search, Filter, Shield, ArrowUpDown } from 'lucide-react';
import CustomSelect from '../global/CustomSelect';

export default function AdminFilters({
  searchQuery, setSearchQuery,
  statusFilter, setStatusFilter,
  roleFilter, setRoleFilter,
  sortBy, setSortBy,
}) {
  return (
    <div className="bg-white border border-[#eaedf1] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama, email, atau ID admin..."
          className="w-full pl-10 pr-4 h-10 rounded-xl bg-slate-50 border border-slate-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Filter: Hak Akses / Status */}
        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'Semua', label: 'Semua Status' },
            { value: 'Aktif', label: 'Akun Aktif' },
            { value: 'Nonaktif', label: 'Akun Nonaktif' },
            { value: 'Punya Akses', label: 'Punya Hak Akses' },
            { value: 'Tanpa Akses', label: 'Belum Ada Akses' },
          ]}
          placeholder="Status Akun & Izin"
          icon={<Filter size={13} />}
          menuWidth="w-48"
        />

        {/* Filter: Role */}
        <CustomSelect
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: 'Semua', label: 'Semua Role' },
            { value: 'admin', label: 'Admin' },
            { value: 'superadmin', label: 'Super Admin' },
          ]}
          placeholder="Role Admin"
          icon={<Shield size={13} />}
          menuWidth="w-44"
        />

        {/* Sort */}
        <CustomSelect
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: 'terbaru', label: 'Terbaru' },
            { value: 'nama', label: 'Nama (A - Z)' },
          ]}
          placeholder="Urutkan"
          icon={<ArrowUpDown size={13} />}
          menuWidth="w-40"
        />
      </div>
    </div>
  );
}
