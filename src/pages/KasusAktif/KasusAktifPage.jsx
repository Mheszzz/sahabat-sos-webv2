import {
  Search, RefreshCw, AlertTriangle, Filter, ArrowUpDown, Loader2,
  List, LayoutGrid, X
} from 'lucide-react';
import CustomSelect from '../../components/global/CustomSelect';
import PaginationBar from '../../components/global/PaginationBar';
import KasusTableView from '../../components/kasus-aktif/KasusTableView';
import KasusGridView from '../../components/kasus-aktif/KasusGridView';
import { useKasusAktif } from '../../hooks/kasus-aktif/useKasusAktif';

/**
 * KasusAktifPage
 * Halaman Pusat Komando Kasus Aktif (Emergency Incident Command Center).
 * Seluruh logika data & state terdelegasi ke useKasusAktif.
 */
export default function KasusAktifPage() {
  const {
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    filterKategori, setFilterKategori,
    viewMode, setViewMode,
    currentPage, setCurrentPage,
    loading, error,
    categoryOptions, sortOptions, filterTabs,
    paginatedCases, totalPages, totalCount, filteredCount,
    onOpenDetail, refetch, resetFilter, helpers,
  } = useKasusAktif();

  const paginationControl = (
    <PaginationBar
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      showingCount={paginatedCases.length}
      filteredCount={filteredCount}
      totalCount={totalCount}
      label="kasus aktif"
    />
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Panel Filter, Pencarian, & Aksi */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Segmented Filter Pills */}
          <div
            role="tablist"
            aria-label="Filter status kasus"
            className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto"
          >
            {filterTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                    isActive ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? (tab.isDanger ? 'bg-rose-500 text-white' : tab.isWarning ? 'bg-amber-500 text-white' : 'bg-[#0b6f61] text-white')
                      : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Actions: Refresh Data + View Mode Toggle */}
          <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0">
            <button
              onClick={refetch}
              disabled={loading}
              aria-label="Refresh data kasus aktif terbaru"
              className="flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 px-3 text-[12px] font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
              title="Refresh data kasus terbaru"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin text-[#0b6f61]' : ''} />
              <span>Refresh</span>
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-slate-600 mr-1 hidden sm:inline">Tampilan:</span>
              <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200" role="group" aria-label="Mode tampilan data">
                <button
                  type="button"
                  aria-pressed={viewMode === 'table'}
                  aria-label="Tampilan tabel data"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                    viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tampilan Tabel Data"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === 'grid'}
                  aria-label="Tampilan kartu papan grid"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                    viewMode === 'grid' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tampilan Kartu Papan"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Input Pencarian, Filter Kategori & Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Cari kasus berdasarkan ID, nama pelapor, atau alamat"
              placeholder="Cari ID, pelapor, kategori, disabilitas, atau alamat..."
              className="w-full h-9 pl-9 pr-8 text-[12px] bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0b6f61] focus-visible:ring-2 focus-visible:ring-[#0b6f61]/20 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus teks pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <CustomSelect
              value={filterKategori}
              onChange={setFilterKategori}
              options={categoryOptions}
              placeholder="Semua Kategori"
              icon={<Filter size={13} />}
              clearable={Boolean(filterKategori)}
              onClear={() => setFilterKategori('')}
              menuWidth="w-56"
              align="right"
            />

            <CustomSelect
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
              placeholder="Urutkan"
              icon={<ArrowUpDown size={13} />}
              menuWidth="w-48"
              align="right"
            />
          </div>
        </div>
      </div>

      {/* Tampilan Konten (Tabel / Grid) */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-14 gap-3 text-slate-500 shadow-xs">
          <Loader2 size={24} className="animate-spin text-[#0b6f61]" />
          <p className="text-[13px] font-semibold">Memuat data kasus dari sistem pusat...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-800 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-rose-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-bold">{error}</p>
              <p className="text-[11px] text-rose-700 mt-0.5">Silakan periksa koneksi atau coba muat ulang.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refetch}
            className="btn-base btn-danger text-[12px] h-8 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {!loading && !error && filteredCount === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-14 text-center text-slate-500 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
            <Search size={20} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-slate-800">Tidak ada kasus yang ditemukan</p>
            <p className="text-[12px] text-slate-600 mt-1">Coba sesuaikan kata kunci pencarian atau bersihkan filter.</p>
          </div>
          {(searchQuery || filterKategori || activeTab !== 'semua') && (
            <button
              type="button"
              onClick={resetFilter}
              className="btn-base btn-secondary text-[12px] h-8 mx-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      {!loading && !error && filteredCount > 0 && viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <KasusTableView cases={paginatedCases} onOpenDetail={onOpenDetail} helpers={helpers} />
          {paginationControl}
        </div>
      )}

      {!loading && !error && filteredCount > 0 && viewMode === 'grid' && (
        <div className="space-y-4">
          <KasusGridView cases={paginatedCases} onOpenDetail={onOpenDetail} helpers={helpers} />
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {paginationControl}
          </div>
        </div>
      )}
    </div>
  );
}
