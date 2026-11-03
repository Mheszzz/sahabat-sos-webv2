import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, RefreshCw, Eye, ArrowUpDown, Loader2, AlertTriangle,
  Filter, ChevronLeft, ChevronRight, LayoutGrid, List,
  MapPin, X, Calendar, ShieldCheck
} from 'lucide-react';
import Badge from '../../components/global/Badge';
import InitialsAvatar from '../../components/global/InitialsAvatar';
import CustomSelect from '../../components/global/CustomSelect';
import PaginationBar from '../../components/global/PaginationBar';
import { kasusAktifService } from '../../api/services/kasusAktifService';
import { formatKasusTime, getSafeTimestamp } from '../../utils/dateHelper';

const ITEMS_PER_PAGE = 10;

/**
 * Helper format tanggal dan jam lokal Indonesia
 */
function formatDateRow(dt) {
  return formatKasusTime(dt);
}

/**
 * RiwayatKasusPage
 * Halaman Audit & Arsip Kasus Selesai / Dibatalkan (Emergency History & Audit Trail).
 * Mengusung UI & UX terpadu yang setema dengan halaman Kasus Aktif.
 */
export default function RiwayatKasusPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('terbaru');
  const [filterKategori, setFilterKategori] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // '' | '7' | '30' | '90'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Navigasi ke detail kasus (mendukung tipe 'sos' dan 'laporan')
  const onOpenDetail = (id, tipeKategori) => {
    const tipe = tipeKategori === 'SOS' ? 'sos' : 'laporan';
    navigate(`/detail-kasus/${id}?tipe=${tipe}`);
  };

  const fetchRiwayat = async () => {
    try {
      setLoading(true);
      setError('');
      // Meminta per_page besar ke backend agar seluruh riwayat terambil untuk audit
      const res = await kasusAktifService.getRiwayatAdmin({ per_page: 100 });
      const d = res?.data ?? {};

      const laporanItems = d.laporan?.data ?? (Array.isArray(d.laporan) ? d.laporan : []);
      const sosItems     = d.sos?.data     ?? (Array.isArray(d.sos)     ? d.sos     : []);

      const merged = [
        ...sosItems.map(i => ({ ...i, _tipeKategori: 'SOS' })),
        ...laporanItems.map(i => ({ ...i, _tipeKategori: 'Laporan' })),
      ];

      setCases(merged);
    } catch (err) {
      setError('Gagal memuat riwayat kasus. Pastikan server backend Sahabat SOS aktif.');
      console.error('[fetchRiwayat] error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, []);

  // ─── Helpers Data Parsing ──────────────────────────────────────────────────
  const getPelapor = (c) =>
    c.pelapor?.name ?? c.pengguna?.name ?? c.korban ?? 'Anonim';

  const getFotoPelapor = (c) => {
    const p = c.pelapor ?? c.pengguna;
    return p?.foto_profile ?? p?.foto_profile_url ?? p?.foto_url ?? null;
  };

  const getFotoRelawan = (r) => {
    return r?.foto_profile ?? r?.foto_profile_url ?? r?.foto_url ?? null;
  };

  const getDisabilitas = (c) => {
    const user = c.pelapor ?? c.pengguna;
    const kat = user?.kategori_user ?? user?.jenis_disabilitas;
    return kat && kat !== 'umum' ? kat : null;
  };

  const getStatusRaw = (c) => {
    const s = (c.status_raw ?? c.status ?? '').toLowerCase().trim();
    if (['selesai', 'resolved', 'tuntas'].includes(s)) return 'selesai';
    if (['batal', 'dibatalkan', 'cancelled'].includes(s)) return 'batal';
    return s || 'selesai';
  };

  const getKategori = (c) => {
    if (c.jenis_laporan) return c.jenis_laporan;
    if (c.sub_judul) return c.sub_judul;
    if (c.kategori_laporan) {
      return c.kategori_laporan.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return c._tipeKategori === 'SOS' ? 'Panggilan Darurat SOS' : 'Laporan';
  };

  const getRawTimestamp = (c) => {
    const raw = c.waktu ?? c.waktu_laporan ?? c.waktu_sos ?? c.updated_at ?? c.created_at;
    return getSafeTimestamp(raw);
  };

  // Kategori unik untuk dropdown filter
  const availableCategories = useMemo(() => {
    return Array.from(new Set(cases.map(c => getKategori(c)).filter(Boolean)));
  }, [cases]);

  const categoryOptions = useMemo(() => {
    return [
      { value: '', label: 'Semua Kategori', badge: cases.length },
      ...availableCategories.map(cat => ({
        value: cat,
        label: cat,
        badge: cases.filter(c => getKategori(c) === cat).length,
      })),
    ];
  }, [availableCategories, cases]);

  // Opsi dropdown rentang tanggal
  const dateFilterOptions = [
    { value: '', label: 'Semua Waktu' },
    { value: '7', label: '7 Hari Terakhir' },
    { value: '30', label: '30 Hari Terakhir' },
    { value: '90', label: '3 Bulan Terakhir' },
  ];

  // Opsi dropdown pengurutan
  const sortOptions = [
    { value: 'terbaru', label: 'Waktu Terbaru' },
    { value: 'terlama', label: 'Waktu Terlama' },
    { value: 'prioritas', label: 'Prioritas SOS' },
  ];

  // Statistik Ringkasan KPI
  const stats = useMemo(() => {
    const total = cases.length;
    const sosCount = cases.filter(c => c._tipeKategori === 'SOS').length;
    const laporanCount = cases.filter(c => c._tipeKategori !== 'SOS').length;
    const selesaiCount = cases.filter(c => getStatusRaw(c) === 'selesai').length;
    const batalCount = cases.filter(c => getStatusRaw(c) === 'batal').length;
    return { total, sosCount, laporanCount, selesaiCount, batalCount };
  }, [cases]);

  // Tab filter items
  const filterTabs = [
    { id: 'semua',   label: 'Semua Riwayat', count: stats.total },
    { id: 'sos',     label: 'Darurat SOS',   count: stats.sosCount, isDanger: true },
    { id: 'laporan', label: 'Laporan',       count: stats.laporanCount },
    { id: 'selesai', label: 'Selesai',       count: stats.selesaiCount },
    { id: 'batal',   label: 'Dibatalkan',    count: stats.batalCount, isDanger: true },
  ];

  // Filtering data
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Filter Tab
      if (activeTab === 'sos' && c._tipeKategori !== 'SOS') return false;
      if (activeTab === 'laporan' && c._tipeKategori === 'SOS') return false;
      if (activeTab === 'selesai' && getStatusRaw(c) !== 'selesai') return false;
      if (activeTab === 'batal' && getStatusRaw(c) !== 'batal') return false;

      // Filter Kategori
      if (filterKategori && getKategori(c).toLowerCase() !== filterKategori.toLowerCase()) return false;

      // Filter Rentang Tanggal Aktif
      if (dateFilter) {
        const days = parseInt(dateFilter, 10);
        if (!isNaN(days) && days > 0) {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - days);
          const t = getRawTimestamp(c);
          if (t > 0 && t < cutoff.getTime()) return false;
        }
      }

      // Filter Pencarian Teks
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const lokasiStr = c.lokasi?.alamat ?? c.lokasi_laporan ?? '';
      const relawanStr = c.relawan?.name ?? '';
      const pelaporStr = getPelapor(c);
      const disabilitasStr = getDisabilitas(c) ?? '';
      const idKasusStr = String(c.id_kasus ?? c.nomor_kasus ?? (c._tipeKategori === 'SOS' ? `SOS-${c.id}` : `LP-${c.id}`)).toLowerCase();

      return (
        String(c.id).toLowerCase().includes(q) ||
        idKasusStr.includes(q) ||
        getKategori(c).toLowerCase().includes(q) ||
        pelaporStr.toLowerCase().includes(q) ||
        disabilitasStr.toLowerCase().includes(q) ||
        lokasiStr.toLowerCase().includes(q) ||
        relawanStr.toLowerCase().includes(q)
      );
    });
  }, [cases, activeTab, filterKategori, dateFilter, searchQuery]);

  // Sorting data kronologis secara benar
  const sortedCases = useMemo(() => {
    return [...filteredCases].sort((a, b) => {
      const timeA = getRawTimestamp(a);
      const timeB = getRawTimestamp(b);

      if (sortBy === 'terlama') {
        return timeA - timeB;
      }
      if (sortBy === 'prioritas') {
        if (a._tipeKategori === 'SOS' && b._tipeKategori !== 'SOS') return -1;
        if (a._tipeKategori !== 'SOS' && b._tipeKategori === 'SOS') return 1;
        return timeB - timeA;
      }
      // Default: 'terbaru'
      return timeB - timeA;
    });
  }, [filteredCases, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedCases.length / ITEMS_PER_PAGE));
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedCases.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedCases, currentPage]);


  return (
    <div className="space-y-4 animate-fade-in">
      {/* Control Bar: Tabs, Search, Filters & Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl overflow-x-auto">
            {filterTabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap transition-all cursor-pointer
                    ${isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? (tab.isDanger ? 'bg-rose-500 text-white' : 'bg-[#0b6f61] text-white')
                      : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Actions: Refresh Data & View Mode */}
          <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0">
            <button
              onClick={fetchRiwayat}
              disabled={loading}
              className="flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 px-3 text-[12px] font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
              title="Refresh seluruh data riwayat"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin text-[#0b6f61]' : ''} />
              <span>Refresh</span>
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Tampilan:</span>
              <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Tampilan Tabel Data"
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Tampilan Kartu Papan"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Input Pencarian, Rentang Waktu, Kategori & Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari ID, pelapor, kategori, disabilitas, atau alamat..."
              className="w-full h-9 pl-9 pr-8 text-[12px] bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0b6f61] outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Filter Rentang Tanggal */}
            <CustomSelect
              value={dateFilter}
              onChange={(val) => {
                setDateFilter(val);
                setCurrentPage(1);
              }}
              options={dateFilterOptions}
              placeholder="Rentang Waktu"
              icon={<Calendar size={13} />}
              clearable={Boolean(dateFilter)}
              onClear={() => {
                setDateFilter('');
                setCurrentPage(1);
              }}
              menuWidth="w-48"
              align="right"
            />

            {/* Filter Kategori */}
            <CustomSelect
              value={filterKategori}
              onChange={(val) => {
                setFilterKategori(val);
                setCurrentPage(1);
              }}
              options={categoryOptions}
              placeholder="Semua Kategori"
              icon={<Filter size={13} />}
              clearable={Boolean(filterKategori)}
              onClear={() => {
                setFilterKategori('');
                setCurrentPage(1);
              }}
              menuWidth="w-56"
              align="right"
            />

            {/* Urutkan / Sort */}
            <CustomSelect
              value={sortBy}
              onChange={(val) => {
                setSortBy(val);
                setCurrentPage(1);
              }}
              options={sortOptions}
              placeholder="Urutkan"
              icon={<ArrowUpDown size={13} />}
              menuWidth="w-48"
              align="right"
            />
          </div>
        </div>
      </div>

      {/* Content View (Table / Grid) */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-14 gap-3 text-slate-500 shadow-xs">
          <Loader2 size={24} className="animate-spin text-[#0b6f61]" />
          <p className="text-[13px] font-semibold">Memuat riwayat kasus dari sistem...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-800 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-rose-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-bold">{error}</p>
              <p className="text-[11px] text-rose-600/80 mt-0.5">Silakan periksa jaringan atau coba muat ulang data.</p>
            </div>
          </div>
          <button onClick={fetchRiwayat} className="btn-base btn-danger text-[12px] h-8 px-3">
            Coba Lagi
          </button>
        </div>
      )}

      {!loading && !error && sortedCases.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-14 text-center text-slate-500 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
            <Search size={20} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-slate-800">Tidak ada riwayat kasus yang ditemukan</p>
            <p className="text-[12px] text-slate-600 mt-1">Coba sesuaikan kata kunci pencarian, rentang tanggal, atau bersihkan filter.</p>
          </div>
          {(searchQuery || filterKategori || dateFilter || activeTab !== 'semua') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterKategori('');
                setDateFilter('');
                setActiveTab('semua');
                setCurrentPage(1);
              }}
              className="btn-base btn-secondary text-[12px] h-8 mx-auto"
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      {!loading && !error && sortedCases.length > 0 && viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px] border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-12 text-center">Tipe</th>
                  <th className="py-3 px-4">Kasus / ID Kasus</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Korban / Pelapor</th>
                  <th className="py-3 px-4">Lokasi Kejadian</th>
                  <th className="py-3 px-4">Relawan</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCases.map((kasus, idx) => {
                  const isSos = kasus._tipeKategori === 'SOS';
                  const statusRaw = getStatusRaw(kasus);
                  const disabilitas = getDisabilitas(kasus);
                  const relawan = kasus.relawan;
                  const alamat = kasus.lokasi?.alamat ?? kasus.lokasi_laporan ?? 'Lokasi Kejadian';
                  const idKasusDisplay = kasus.id_kasus || kasus.nomor_kasus || (isSos ? `SOS-${kasus.id}` : `LP-${kasus.id}`);

                  // Highlight baris subtle
                  const rowBgClass = statusRaw === 'batal'
                    ? 'hover:bg-rose-50/40 bg-rose-50/15'
                    : 'hover:bg-slate-50/80';

                  return (
                    <tr
                      key={`${kasus._tipeKategori}-${kasus.id}`}
                      onClick={() => onOpenDetail(kasus.id, kasus._tipeKategori)}
                      className={`transition-colors cursor-pointer group ${rowBgClass}`}
                    >
                      {/* Tipe Beacon */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-bold text-[10px] ${
                          isSos
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-sky-100 text-sky-700 border border-sky-200'
                        }`}>
                          {isSos ? 'SOS' : 'LAP'}
                        </span>
                      </td>

                      {/* Kasus & ID Kasus */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg border shadow-2xs ${
                            isSos
                              ? 'bg-rose-100/90 text-rose-800 border-rose-300/80'
                              : 'bg-sky-100/90 text-sky-800 border-sky-300/80'
                          }`}>
                            {idKasusDisplay}
                          </span>
                          <span className="font-bold text-slate-900 group-hover:text-[#0b6f61] transition-colors line-clamp-1">
                            {getKategori(kasus)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant={statusRaw} showDot isPill />
                      </td>

                      {/* Pelapor & Difabel Tag */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <InitialsAvatar name={getPelapor(kasus)} src={getFotoPelapor(kasus)} size={28} />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{getPelapor(kasus)}</p>
                            {disabilitas && (
                              <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded mt-0.5 capitalize">
                                {disabilitas}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Lokasi */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate text-[12px]">{alamat}</span>
                        </div>
                      </td>

                      {/* Relawan / Petugas */}
                      <td className="py-3.5 px-4">
                        {relawan ? (
                          <div className="flex items-center gap-2">
                            <InitialsAvatar name={relawan.name} src={getFotoRelawan(relawan)} size={24} bgClass="bg-emerald-700" />
                            <span className="font-semibold text-slate-800 text-[12px] whitespace-nowrap">{relawan.name}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            <ShieldCheck size={11} className="text-slate-400" />
                            Admin Langsung
                          </span>
                        )}
                      </td>

                      {/* Waktu */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11.5px]">
                        {formatDateRow(kasus.waktu ?? kasus.waktu_laporan ?? kasus.waktu_sos ?? kasus.created_at)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); onOpenDetail(kasus.id, kasus._tipeKategori); }}
                          className="btn-base btn-primary text-[11px] h-7 px-3 inline-flex items-center justify-center gap-1.5 group-hover:scale-105 transition-transform"
                        >
                          <Eye size={12} />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showingCount={paginatedCases.length}
            filteredCount={sortedCases.length}
            totalCount={cases.length}
            label="riwayat kasus"
          />
        </div>
      )}

      {/* Content View: Incident Cards Grid */}
      {!loading && !error && sortedCases.length > 0 && viewMode === 'grid' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {paginatedCases.map((kasus, idx) => {
              const isSos = kasus._tipeKategori === 'SOS';
              const disabilitas = getDisabilitas(kasus);
              const relawan = kasus.relawan;
              const alamat = kasus.lokasi?.alamat ?? kasus.lokasi_laporan ?? 'Lokasi Kejadian';
              const statusRaw = getStatusRaw(kasus);
              const idKasusDisplay = kasus.id_kasus || kasus.nomor_kasus || (isSos ? `SOS-${kasus.id}` : `LP-${kasus.id}`);

              const cardBgBorder = statusRaw === 'batal'
                ? 'bg-rose-50/25 border-rose-200 hover:border-rose-300 ring-1 ring-rose-500/10'
                : 'bg-white border-slate-200 hover:border-slate-300';

              return (
                <div
                  key={`${kasus._tipeKategori}-${kasus.id}`}
                  onClick={() => onOpenDetail(kasus.id, kasus._tipeKategori)}
                  className={`group border rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${cardBgBorder}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase tracking-wide shrink-0 ${
                          isSos ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                        }`}>
                          {isSos ? 'DARURAT SOS' : 'LAPORAN'}
                        </span>
                        <span className={`font-mono text-[10.5px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                          isSos
                            ? 'bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-sky-100 text-sky-700 border-sky-200'
                        }`}>
                          {idKasusDisplay}
                        </span>
                      </div>
                      <Badge variant={statusRaw} showDot isPill className="text-[10px] py-0.5 px-2" />
                    </div>

                    <div>
                      <h3 className="text-[13.5px] font-bold text-slate-900 line-clamp-1 leading-snug group-hover:text-[#0b6f61] transition-colors">
                        {getKategori(kasus)}
                      </h3>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 line-clamp-1" title={alamat}>
                        <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                        <span>{alamat}</span>
                      </p>
                    </div>

                    <div className="px-2.5 py-1.5 bg-slate-50/75 rounded-lg border border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <InitialsAvatar name={getPelapor(kasus)} src={getFotoPelapor(kasus)} size={24} />
                        <div className="min-w-0 leading-tight">
                          <p className="text-[11.5px] font-bold text-slate-800 truncate">{getPelapor(kasus)}</p>
                          <p className="text-[9.5px] text-slate-400">Pelapor</p>
                        </div>
                      </div>
                      {disabilitas && (
                        <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md capitalize shrink-0">
                          {disabilitas}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100/90 flex items-center justify-between gap-2 text-[10.5px] text-slate-500">
                    <div className="truncate min-w-0">
                      {relawan ? (
                        <span className="truncate">Relawan: <strong className="text-slate-700">{relawan.name}</strong></span>
                      ) : (
                        <span className="text-slate-400">Ditangani Admin</span>
                      )}
                    </div>
                    <span className="shrink-0 text-slate-400">
                      {formatDateRow(kasus.waktu ?? kasus.waktu_laporan ?? kasus.waktu_sos ?? kasus.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              showingCount={paginatedCases.length}
              filteredCount={sortedCases.length}
              totalCount={cases.length}
              label="riwayat kasus"
            />
          </div>
        </div>
      )}
    </div>
  );
}
