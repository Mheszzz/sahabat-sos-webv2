import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { kasusAktifService } from '../../api/services/kasusAktifService';
import { formatKasusTime, getSafeTimestamp } from '../../utils/dateHelper';
import echo from '../../api/libs/echo';
import { playEmergencyAlertSound } from '../../utils/audioAlert';

export const ITEMS_PER_PAGE = 10;

// Helpers parsing data kasus
export const getPelapor = (c) =>
  c?.pelapor?.name ?? c?.pengguna?.name ?? c?.korban ?? 'Anonim';

export const getFotoPelapor = (c) => {
  const p = c?.pelapor ?? c?.pengguna;
  return p?.foto_profile ?? p?.foto_profile_url ?? p?.foto_url ?? null;
};

export const getFotoRelawan = (r) => {
  return r?.foto_profile ?? r?.foto_profile_url ?? r?.foto_url ?? null;
};

export const getDisabilitas = (c) => {
  const user = c?.pelapor ?? c?.pengguna;
  return user?.kategori_user && user.kategori_user !== 'umum' ? user.kategori_user : null;
};

export const getWaktu = (c) => {
  const raw = c?.waktu ?? c?.waktu_laporan ?? c?.waktu_sos ?? c?.created_at;
  return formatKasusTime(raw);
};

export const getStatusRaw = (c) => {
  const s = (c?.status_raw ?? c?.status ?? '').toLowerCase().trim();
  if (['aktif', 'pending', 'belum ditangani', 'belum_ditangani', 'belum tertangani', 'belum_tertangani'].includes(s)) {
    return 'belum ditangani';
  }
  if (['proses', 'ditangani', 'dalam penanganan'].includes(s)) {
    return 'ditangani';
  }
  if (s === 'selesai') return 'selesai';
  if (s === 'batal' || s === 'dibatalkan') return 'batal';
  return s;
};

export const getKategori = (c) => {
  if (c?.jenis_laporan) return c.jenis_laporan;
  if (c?.sub_judul) return c.sub_judul;
  if (c?.kategori_laporan) {
    return c.kategori_laporan.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return c?._tipeKategori === 'SOS' ? 'Panggilan Darurat SOS' : 'Laporan';
};

/**
 * useKasusAktif
 * Custom hook sentral untuk halaman Kasus Aktif Command Center.
 * Mengelola pemanggilan API, state filter, search, sort, pagination, dan navigasi.
 */
export function useKasusAktif() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('terbaru');
  const [filterKategori, setFilterKategori] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Navigasi ke detail kasus
  const onOpenDetail = useCallback((id, tipeKategori) => {
    const tipe = tipeKategori === 'SOS' ? 'sos' : 'laporan';
    navigate(`/detail-kasus/${id}?tipe=${tipe}`);
  }, [navigate]);

  // Fetch data kasus aktif dari backend
  const fetchTugasAktif = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await kasusAktifService.getAll({ per_page: 50 });
      const d = res?.data ?? {};

      const laporanItems = d.laporan?.data ?? (Array.isArray(d.laporan) ? d.laporan : []);
      const sosItems = d.sos?.data ?? (Array.isArray(d.sos) ? d.sos : []);

      const merged = [
        ...sosItems.map(i => ({ ...i, _tipeKategori: 'SOS' })),
        ...laporanItems.map(i => ({ ...i, _tipeKategori: 'Laporan' })),
      ];

      setCases(merged);
    } catch (err) {
      setError('Gagal memuat data kasus aktif. Pastikan server backend Sahabat SOS sedang aktif.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTugasAktif();
  }, [fetchTugasAktif]);

  // WebSocket Real-time Listener (command-center)
  useEffect(() => {
    const channel = echo.private('command-center');

    // Handler ketika sinyal darurat SOS baru masuk
    const handleNewSOS = (data) => {
      if (!data?.id) return;
      playEmergencyAlertSound();

      setCases((prev) => {
        const exists = prev.some(
          (c) => c._tipeKategori === 'SOS' && String(c.id) === String(data.id)
        );
        if (exists) {
          return prev.map((c) =>
            c._tipeKategori === 'SOS' && String(c.id) === String(data.id)
              ? { ...c, ...data, _tipeKategori: 'SOS' }
              : c
          );
        }

        const newCase = {
          id: data.id,
          id_kasus: data.id_kasus || `SOS-${data.id}`,
          nomor_kasus: data.nomor_kasus || `SOS-${data.id}`,
          status: data.status_sos || 'belum ditangani',
          status_raw: data.status_sos || 'belum ditangani',
          latitude: data.latitude,
          longitude: data.longitude,
          waktu: data.waktu_sos || new Date().toISOString(),
          created_at: data.waktu_sos || new Date().toISOString(),
          pengguna: data.pengguna || { name: 'Pengguna SOS' },
          pelapor: data.pengguna || { name: 'Pengguna SOS' },
          _tipeKategori: 'SOS',
          kategori_laporan: 'Darurat SOS',
          ...data,
        };
        return [newCase, ...prev];
      });
    };

    // Handler ketika status SOS diperbarui
    const handleStatusUpdate = (data) => {
      if (!data?.id) return;
      console.log('🔄 SOSUpdateStatus diterima di useKasusAktif:', data);
      const st = (data.status_sos || data.status_raw || data.status || '').toLowerCase().trim();
      const isEnded = ['batal', 'dibatalkan', 'selesai'].includes(st);

      setCases((prev) => {
        if (isEnded) {
          // Kasus sudah dibatalkan atau selesai -> langsung hapus seketika dari daftar Kasus Aktif
          return prev.filter(
            (c) => !(c._tipeKategori === 'SOS' && String(c.id) === String(data.id))
          );
        }

        return prev.map((c) => {
          if (c._tipeKategori === 'SOS' && String(c.id) === String(data.id)) {
            return {
              ...c,
              ...data,
              status: data.status_sos || c.status,
              status_raw: data.status_sos || c.status_raw,
              relawan: data.relawan !== undefined ? data.relawan : c.relawan,
              updated_at: data.updated_at || c.updated_at,
            };
          }
          return c;
        });
      });

      // Sinkronkan ulang data dari backend secara hening untuk memperbarui KPI & paginasi
      fetchTugasAktif();
    };

    // Handler ketika laporan warga baru masuk
    const handleNewLaporan = (data) => {
      if (!data?.id) return;
      setCases((prev) => {
        const exists = prev.some(
          (c) => c._tipeKategori === 'Laporan' && String(c.id) === String(data.id)
        );
        if (exists) return prev;

        const newLaporan = {
          id: data.id,
          id_kasus: data.id_kasus || `LP-${data.id}`,
          nomor_kasus: data.nomor_kasus || `LP-${data.id}`,
          status: 'belum ditangani',
          status_raw: 'belum ditangani',
          latitude: data.latitude,
          longitude: data.longitude,
          lokasi_laporan: data.lokasi_laporan,
          deskripsi: data.deskripsi,
          waktu: data.waktu_laporan || new Date().toISOString(),
          created_at: data.waktu_laporan || new Date().toISOString(),
          pelapor: { name: data.pengguna_nama || 'Warga' },
          pengguna: { name: data.pengguna_nama || 'Warga' },
          _tipeKategori: 'Laporan',
          kategori_laporan: data.kategori_laporan || 'Laporan',
          foto_laporan_url: data.foto_laporan_url,
          rekam_suara_url: data.rekam_suara_url,
          ...data,
        };
        return [newLaporan, ...prev];
      });
    };

    // Pasang listener dengan format broadcastAs dan dot notation
    channel.listen('.SOSCreated', handleNewSOS);
    channel.listen('SOSCreated', handleNewSOS);
    channel.listen('.NewSOSReport', handleNewSOS);
    channel.listen('NewSOSReport', handleNewSOS);

    channel.listen('.SOSUpdateStatus', handleStatusUpdate);
    channel.listen('SOSUpdateStatus', handleStatusUpdate);

    channel.listen('.LaporanCreated', handleNewLaporan);
    channel.listen('LaporanCreated', handleNewLaporan);

    const onLocalKasusUpdated = () => fetchTugasAktif();
    window.addEventListener('kasus-updated', onLocalKasusUpdated);

    return () => {
      window.removeEventListener('kasus-updated', onLocalKasusUpdated);
      channel.stopListening('.SOSCreated', handleNewSOS);
      channel.stopListening('SOSCreated', handleNewSOS);
      channel.stopListening('.NewSOSReport', handleNewSOS);
      channel.stopListening('NewSOSReport', handleNewSOS);
      channel.stopListening('.SOSUpdateStatus', handleStatusUpdate);
      channel.stopListening('SOSUpdateStatus', handleStatusUpdate);
      channel.stopListening('.LaporanCreated', handleNewLaporan);
      channel.stopListening('LaporanCreated', handleNewLaporan);
    };
  }, [fetchTugasAktif]);

  // Kategori unik dari list kasus
  const availableCategories = useMemo(() => {
    return Array.from(new Set(cases.map(c => getKategori(c)).filter(Boolean)));
  }, [cases]);

  // Opsi dropdown kategori dengan counter badge
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

  // Opsi dropdown pengurutan data
  const sortOptions = useMemo(() => [
    { value: 'terbaru', label: 'Terbaru' },
    { value: 'prioritas', label: 'Prioritas Darurat' },
  ], []);

  // Statistik Ringkasan KPI
  const stats = useMemo(() => {
    const total = cases.length;
    const sosCount = cases.filter(c => c._tipeKategori === 'SOS').length;
    const laporanCount = cases.filter(c => c._tipeKategori !== 'SOS').length;
    const pendingCount = cases.filter(c => getStatusRaw(c) === 'belum ditangani').length;
    const inProgressCount = cases.filter(c => getStatusRaw(c) === 'ditangani').length;
    return { total, sosCount, laporanCount, pendingCount, inProgressCount };
  }, [cases]);

  // Tab filter items
  const filterTabs = useMemo(() => [
    { id: 'semua', label: 'Semua Kasus', count: stats.total },
    { id: 'sos', label: 'Darurat SOS', count: stats.sosCount, isDanger: true },
    { id: 'laporan', label: 'Laporan', count: stats.laporanCount },
    { id: 'belum ditangani', label: 'Belum Ditangani', count: stats.pendingCount, isWarning: true },
    { id: 'ditangani', label: 'Sedang Ditangani', count: stats.inProgressCount },
  ], [stats]);

  // Filtering data berdasarkan tab, kategori, dan query pencarian
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      if (activeTab === 'sos' && c._tipeKategori !== 'SOS') return false;
      if (activeTab === 'laporan' && c._tipeKategori === 'SOS') return false;
      if (activeTab === 'belum ditangani' && getStatusRaw(c) !== 'belum ditangani') return false;
      if (activeTab === 'ditangani' && getStatusRaw(c) !== 'ditangani') return false;

      if (filterKategori && getKategori(c).toLowerCase() !== filterKategori.toLowerCase()) return false;

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
  }, [cases, activeTab, filterKategori, searchQuery]);

  // Sorting
  const sortedCases = useMemo(() => {
    return [...filteredCases].sort((a, b) => {
      const timeA = getSafeTimestamp(a.waktu ?? a.waktu_laporan ?? a.waktu_sos ?? a.created_at);
      const timeB = getSafeTimestamp(b.waktu ?? b.waktu_laporan ?? b.waktu_sos ?? b.created_at);

      if (sortBy === 'prioritas') {
        if (a._tipeKategori === 'SOS' && b._tipeKategori !== 'SOS') return -1;
        if (a._tipeKategori !== 'SOS' && b._tipeKategori === 'SOS') return 1;
        return timeB - timeA;
      }
      return timeB - timeA;
    });
  }, [filteredCases, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedCases.length / ITEMS_PER_PAGE));
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedCases.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedCases, currentPage]);

  const resetFilter = useCallback(() => {
    setSearchQuery('');
    setFilterKategori('');
    setActiveTab('semua');
    setCurrentPage(1);
  }, []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((val) => {
    setFilterKategori(val);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((val) => {
    setSortBy(val);
    setCurrentPage(1);
  }, []);

  return {
    // States
    activeTab,
    setActiveTab: handleTabChange,
    searchQuery,
    setSearchQuery: handleSearchChange,
    sortBy,
    setSortBy: handleSortChange,
    filterKategori,
    setFilterKategori: handleCategoryChange,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    loading,
    error,
    cases,
    // Processed Data
    categoryOptions,
    sortOptions,
    stats,
    filterTabs,
    filteredCases,
    sortedCases,
    paginatedCases,
    totalPages,
    totalCount: cases.length,
    filteredCount: sortedCases.length,
    // Actions & Helpers
    onOpenDetail,
    refetch: fetchTugasAktif,
    resetFilter,
    helpers: {
      getPelapor,
      getFotoPelapor,
      getFotoRelawan,
      getDisabilitas,
      getWaktu,
      getStatusRaw,
      getKategori,
    },
    getPelapor,
    getFotoPelapor,
    getFotoRelawan,
    getDisabilitas,
    getWaktu,
    getStatusRaw,
    getKategori,
  };
}
