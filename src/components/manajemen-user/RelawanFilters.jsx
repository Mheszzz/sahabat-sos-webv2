import { Search, X, Filter, ArrowUpDown, RotateCcw } from 'lucide-react';
import CustomSelect from '../global/CustomSelect';

export default function RelawanFilters({
  activeTab,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  hasActiveFilters,
  onResetFilters,
  totalResults,
}) {
  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'aktif', label: 'Hanya Aktif' },
    { value: 'nonaktif', label: 'Hanya Nonaktif' },
  ];

  const sortOptions = [
    { value: 'terbaru', label: 'Terbaru Mendaftar' },
    { value: 'terlama', label: 'Terlama Mendaftar' },
    { value: 'nama_asc', label: 'Nama (A - Z)' },
    { value: 'nama_desc', label: 'Nama (Z - A)' },
  ];

  return (
    <div className="bg-white border border-[#eaedf1] rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[260px] max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            activeTab === 'relawan'
              ? 'Cari nama, email, nomor telepon, alamat, atau keahlian...'
              : 'Cari pendaftar baru berdasarkan nama, kontak...'
          }
          className="w-full pl-9 pr-8 h-9 rounded-xl bg-slate-50 border border-slate-200 text-[12.5px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0b6f61]/15 focus:border-[#0b6f61] transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
            title="Hapus pencarian"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Controls & Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter (hanya tab relawan terdaftar) */}
        {activeTab === 'relawan' && (
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            placeholder="Status Keaktifan"
            icon={<Filter size={13} />}
            menuWidth="w-44"
          />
        )}

        {/* Sort Dropdown */}
        <CustomSelect
          value={sortBy}
          onChange={setSortBy}
          options={sortOptions}
          placeholder="Urutkan"
          icon={<ArrowUpDown size={13} />}
          menuWidth="w-48"
        />

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-700 hover:bg-rose-100 text-[12px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1"
            title="Reset semua filter dan pencarian"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}

        {/* Result Count Indicator */}
        <div className="hidden lg:flex items-center pl-2 border-l border-slate-200 text-[11.5px] text-slate-400">
          <span>{totalResults} relawan</span>
        </div>
      </div>
    </div>
  );
}
