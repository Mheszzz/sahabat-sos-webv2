import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../api/services/adminService';
import { kasusAktifService } from '../../api/services/kasusAktifService';
import echo from '../../api/libs/echo';

// ─── CONSTANTS ─────────────────────────────────────────────────────────
// Palette warna semantik yang tenang dan terarah (bukan pelangi acak)
export const CATEGORY_SEMANTIC_PALETTE = [
  '#0b6f61', // Teal / Brand Primary
  '#dc2626', // Red / Darurat
  '#2563eb', // Blue / Medis & Pendamping
  '#d97706', // Amber / Perlu Perhatian
  '#7c3aed', // Purple / Khusus
  '#475569', // Slate / Lainnya
];

const PAGE_SIZE = 10;

/**
 * Format tanggal dan waktu menjadi format Indonesia yang rapi: "10 Okt, 14:20 WIB"
 */
export function formatWaktu(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const month = monthNames[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month}, ${hours}:${minutes} WIB`;
  } catch {
    return '-';
  }
}

/**
 * Format jam menit saja untuk timestamp sinkronisasi data
 */
export function formatJam(date = new Date()) {
  try {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} WIB`;
  } catch {
    return '-';
  }
}

export function useDashboard() {
  const navigate = useNavigate();

  // ─── STATE MANAGEMENT ──────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => formatJam(new Date()));

  // Top KPI Stats
  const [stats, setStats] = useState(null);

  // Map Data
  const [mapMarkers, setMapMarkers] = useState([]);
  const [relawanCount, setRelawanCount] = useState(0);
  const [sosCount, setSosCount] = useState(0);
  const [laporanCount, setLaporanCount] = useState(0);

  // Category Distribution & Time filter
  const [categoryTimeFilter, setCategoryTimeFilter] = useState('Semua Waktu');
  const categoryFilterRef = useRef('Semua Waktu');
  const categoryDropdownRef = useRef(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categoryStats, setCategoryStats] = useState([]);
  const [urgensiSummary, setUrgensiSummary] = useState(null);

  // Helper konversi label filter waktu ke parameter backend
  const getRentangParam = useCallback((label) => {
    if (label === 'Hari Ini') return 'hari_ini';
    if (label === 'Minggu Ini') return 'minggu_ini';
    if (label === 'Bulan Ini') return 'bulan_ini';
    return 'semua';
  }, []);

  // Weekly Trend Chart Data
  const [weeklyChartData, setWeeklyChartData] = useState(null);

  // Computed max values for dynamic bar scales
  const maxWeeklyCount = useMemo(() => {
    if (!weeklyChartData?.harian?.length) return 1;
    const maxVal = Math.max(...weeklyChartData.harian.map((d) => d.count));
    return maxVal > 0 ? maxVal : 1;
  }, [weeklyChartData]);

  const maxCategoryCount = useMemo(() => {
    if (!categoryStats.length) return 1;
    const maxVal = Math.max(...categoryStats.map((c) => c.count));
    return maxVal > 0 ? maxVal : 1;
  }, [categoryStats]);

  // Dynamic Category Sub-stats: Total Laporan & Kategori Terbanyak
  const totalLaporanKategori = useMemo(() => {
    return categoryStats.reduce((sum, c) => sum + (c.count || 0), 0);
  }, [categoryStats]);

  const topCategory = useMemo(() => {
    if (!categoryStats.length) return null;
    return [...categoryStats].sort((a, b) => (b.count || 0) - (a.count || 0))[0];
  }, [categoryStats]);

  // ─── TABLE SEARCH & PAGINATION STATE ──────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(PAGE_SIZE);

  // Cases List
  const [casesList, setCasesList] = useState([]);

  // ─── FETCH ALL DASHBOARD DATA ─────────────────────────────────────
  const fetchDashboardData = useCallback(async (overrideFilter = null) => {
    try {
      setLoading(true);

      const activeFilterLabel = overrideFilter || categoryFilterRef.current || 'Semua Waktu';
      const rentangParam = getRentangParam(activeFilterLabel);

      // 1. Dashboard stats & KPI
      const [dashRes, petaRes, sebaranRes, tugasRes, grafikRes] = await Promise.allSettled([
        adminService.getDashboardStats(),
        adminService.getPetaKasus(),
        adminService.getSebaranUrgensi({ rentang: rentangParam }),
        kasusAktifService.getSOS({ per_page: 50 }),
        adminService.getGrafikSos(),
      ]);

      // Process KPI
      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        const d = dashRes.value.data;
        const sosHariIni = d.kpi?.panggilan_sos_hari_ini?.total ?? 0;
        const lapHariIni = d.kpi?.jumlah_laporan_hari_ini?.total ?? 0;
        const totalToday = sosHariIni + lapHariIni;

        setStats({
          kasusHariIni: d.kpi?.kasus_periode?.hari_ini ?? d.kpi?.total_kasus_hari_ini ?? totalToday,
          kasusMingguLalu: d.kpi?.kasus_periode?.minggu_lalu ?? d.kpi?.total_kasus_minggu_lalu ?? 0,
          kasusBulanLalu: d.kpi?.kasus_periode?.bulan_lalu ?? d.kpi?.total_kasus_bulan_lalu ?? 0,
          daruratSosAktif: d.kpi?.darurat_sos_aktif?.total ?? 0,
          relawanAktif: d.kpi?.relawan_siaga_aktif?.siaga_bebas ?? d.kpi?.relawan_siaga_aktif?.total_personel ?? 0,
        });
      } else {
        setStats((prev) => prev ?? {
          kasusHariIni: 0,
          kasusMingguLalu: 0,
          kasusBulanLalu: 0,
          daruratSosAktif: 0,
          relawanAktif: 0,
        });
      }

      // Process Peta Markers
      if (petaRes.status === 'fulfilled' && petaRes.value?.data) {
        const p = petaRes.value.data;
        const summary = petaRes.value.summary || {};

        const points = [];

        (p.titik_darurat_sos || []).forEach((sos) => {
          points.push({
            id: sos.id,
            displayId: sos.id_kasus || `#SOS-${sos.id}`,
            type: 'sos',
            label: `${sos.id_kasus || `#SOS-${sos.id}`} • ${sos.korban ? sos.korban.split(' ')[0] : 'Darurat'}`,
            pelapor: sos.korban,
            kategori: 'Darurat SOS',
            status: sos.status,
            relawan: sos.relawan_penangan || null,
            id_relawan: sos.id_relawan || null,
            lokasi: sos.alamat || sos.lokasi_kejadian || sos.lokasi || '-',
            lat: sos.latitude,
            lng: sos.longitude,
          });
        });

        (p.titik_laporan_aktif || []).forEach((lap) => {
          const idKasus = lap.id_kasus || lap.id_laporan || `#${lap.id}`;
          points.push({
            id: lap.id,
            displayId: idKasus,
            type: 'laporan',
            label: `${idKasus}${lap.kategori ? ' • ' + lap.kategori : ''}`,
            pelapor: lap.pelapor,
            kategori: lap.kategori || '-',
            status: lap.status,
            relawan: lap.relawan_penangan || null,
            id_relawan: lap.id_relawan || null,
            lokasi: lap.lokasi_laporan || lap.alamat || lap.lokasi || '-',
            lat: lap.latitude,
            lng: lap.longitude,
          });
        });

        (p.posisi_relawan || []).forEach((rel) => {
          const cleanName = rel.nama ? rel.nama.replace(/\s*\(Relawan\)/i, '').trim() : 'Relawan';
          points.push({
            id: rel.id,
            displayId: `REL-${rel.id}`,
            type: 'relawan',
            label: cleanName,
            pelapor: cleanName,
            kategori: rel.kompetensi || 'Relawan Lapangan',
            status: rel.status,
            lokasi: rel.lokasi_user ? rel.lokasi_user.replace(/Posko\s+/gi, '').trim() : '-',
            lat: rel.latitude,
            lng: rel.longitude,
            kontak: rel.no_telp || null,
            no_telp: rel.no_telp || null,
            misi: rel.misi || null,
          });
        });

        setMapMarkers(points);

        setSosCount(summary.total_sos_aktif ?? (p.titik_darurat_sos?.length || 0));
        setLaporanCount(summary.total_laporan_aktif ?? (p.titik_laporan_aktif?.length || 0));
        const siaga = summary.total_relawan_siaga_bebas;
        const posRelawanLen = p.posisi_relawan?.length || 0;
        setRelawanCount(siaga !== undefined && siaga !== null ? siaga : posRelawanLen);
      }

      // Process Urgensi & Sebaran Kategori Laporan
      if (sebaranRes.status === 'fulfilled' && sebaranRes.value?.data) {
        if (sebaranRes.value.data.ringkasan_urgensi) {
          setUrgensiSummary(sebaranRes.value.data.ringkasan_urgensi);
        }
        if (sebaranRes.value.data.sebaran_kategori_laporan) {
          const rawCats = sebaranRes.value.data.sebaran_kategori_laporan;
          const mapped = rawCats.map((item, idx) => ({
            label: item.label || item.kategori,
            count: item.jumlah,
            color: CATEGORY_SEMANTIC_PALETTE[idx % CATEGORY_SEMANTIC_PALETTE.length],
          }));
          setCategoryStats(mapped);
        }
      }

      // Process Tren Grafik SOS Mingguan
      if (grafikRes.status === 'fulfilled' && grafikRes.value?.data) {
        const g = grafikRes.value.data;
        const mappedHarian = (g.harian || []).map((h) => ({
          day: h.hari,
          count: h.total,
          isPeak: !!h.is_puncak,
          tanggal: h.tanggal,
        }));
        setWeeklyChartData({
          totalKasus: g.total_kasus ?? 0,
          rataRataHarian: g.rata_rata_harian ?? 0,
          puncakInsiden: g.puncak_insiden || { hari: '-', total: 0 },
          harian: mappedHarian,
        });
      } else {
        setWeeklyChartData((prev) => prev ?? {
          totalKasus: 0,
          rataRataHarian: 0,
          puncakInsiden: { hari: '-', total: 0 },
          harian: [
            { day: 'Min', count: 0, isPeak: false },
            { day: 'Sen', count: 0, isPeak: false },
            { day: 'Sel', count: 0, isPeak: false },
            { day: 'Rab', count: 0, isPeak: false },
            { day: 'Kam', count: 0, isPeak: false },
            { day: 'Jum', count: 0, isPeak: false },
            { day: 'Sab', count: 0, isPeak: false },
          ],
        });
      }

      // Process Cases Table (Hanya Kasus SOS Aktif)
      if (tugasRes.status === 'fulfilled' && tugasRes.value) {
        const d = tugasRes.value?.data ?? tugasRes.value;
        const rawSos = Array.isArray(d?.data)
          ? d.data
          : Array.isArray(d?.sos?.data)
          ? d.sos.data
          : Array.isArray(d?.sos)
          ? d.sos
          : Array.isArray(d)
          ? d
          : [];

        const activeSos = rawSos.filter((s) => {
          const st = (s.status_raw || s.status || '').toLowerCase();
          return st !== 'selesai' && st !== 'batal';
        });

        const sosCases = activeSos.map((s) => ({
          id: s.id,
          displayId: s.id_kasus || s.nomor_kasus || `#SOS-${s.id}`,
          tipe: 'SOS',
          status: (s.status_raw || s.status || 'ditangani').toLowerCase(),
          kategori: s.sub_judul || s.jenis_laporan || 'Darurat SOS',
          kategoriDotColor: 'bg-red-500',
          pelapor: s.pelapor?.name || '-',
          kontak: s.pelapor?.no_telp || '-',
          kontakWa: s.pelapor?.no_telp_wa || s.pelapor?.no_telp || null,
          whatsappUrl: s.pelapor?.whatsapp_url,
          waktu: formatWaktu(s.waktu),
          rawDate: s.waktu || new Date().toISOString(),
        }));

        setCasesList(sosCases);
      } else {
        setCasesList([]);
      }

      setLastUpdated(formatJam(new Date()));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setCasesList([]);
    } finally {
      setLoading(false);
    }
  }, [getRentangParam]);

  // Handle WebSockets
  useEffect(() => {
    fetchDashboardData();

    const channel = echo.private('command-center');

    // 1. Relawan Location Real-time Update
    const handleRelawanLocation = (data) => {
      if (!data.relawan_id) return;

      setMapMarkers((prev) => {
        const index = prev.findIndex(
          (m) => m.type === 'relawan' && String(m.id) === String(data.relawan_id)
        );

        const cleanName = data.nama ? data.nama.replace(/\s*\(Relawan\)/i, '').trim() : 'Relawan';
        const existingKategori = index >= 0 ? prev[index].kategori : null;
        const updatedItem = {
          id: data.relawan_id,
          displayId: `REL-${data.relawan_id}`,
          type: 'relawan',
          label: cleanName,
          pelapor: cleanName,
          kategori: existingKategori || data.kompetensi || 'Relawan Siaga',
          status: data.status || 'siaga_bebas',
          lokasi: data.lokasi_user ? data.lokasi_user.replace(/Posko\s+/gi, '').trim() : '-',
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude),
          heading: data.heading,
        };

        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...updatedItem };
          return next;
        } else {
          setRelawanCount((c) => c + 1);
          return [...prev, updatedItem];
        }
      });
    };
    channel.listen('.RelawanLocationUpdate', handleRelawanLocation);
    channel.listen('RelawanLocationUpdate', handleRelawanLocation);

    // 2. SOS Baru Dibuat
    const handleSosCreated = () => {
      fetchDashboardData();
    };
    channel.listen('.SOSCreated', handleSosCreated);
    channel.listen('SOSCreated', handleSosCreated);

    // 3. Status SOS Diperbarui (Termasuk SOS Dibatalkan)
    const handleSosUpdateStatus = (data) => {
      if (data?.id) {
        const st = (data.status_sos || data.status_raw || data.status || '').toLowerCase().trim();
        const isEnded = ['batal', 'dibatalkan', 'selesai'].includes(st);

        if (isEnded) {
          // Hapus seketika dari tabel daftar kasus aktif di dashboard
          setCasesList((prev) => prev.filter((c) => String(c.id) !== String(data.id)));
          // Hapus dari titik peta darurat SOS
          setMapMarkers((prev) => prev.filter((m) => !(m.type === 'sos' && String(m.id) === String(data.id))));
        } else {
          setCasesList((prev) =>
            prev.map((c) =>
              String(c.id) === String(data.id)
                ? {
                    ...c,
                    status: (data.status_sos || c.status).toLowerCase(),
                    relawan: data.relawan?.name || c.relawan,
                  }
                : c
            )
          );
        }
      }
      fetchDashboardData();
    };
    channel.listen('.SOSUpdateStatus', handleSosUpdateStatus);
    channel.listen('SOSUpdateStatus', handleSosUpdateStatus);

    // 4. Laporan Warga Baru Dibuat
    const handleLaporanCreated = () => {
      fetchDashboardData();
    };
    channel.listen('.LaporanCreated', handleLaporanCreated);
    channel.listen('LaporanCreated', handleLaporanCreated);

    // 5. Status Relawan Diperbarui
    const handleRelawanStatusUpdated = () => {
      fetchDashboardData();
    };
    channel.listen('.RelawanStatusUpdated', handleRelawanStatusUpdated);
    channel.listen('RelawanStatusUpdated', handleRelawanStatusUpdated);

    return () => {
      channel.stopListening('.RelawanLocationUpdate', handleRelawanLocation);
      channel.stopListening('RelawanLocationUpdate', handleRelawanLocation);
      channel.stopListening('.SOSCreated', handleSosCreated);
      channel.stopListening('SOSCreated', handleSosCreated);
      channel.stopListening('.SOSUpdateStatus', handleSosUpdateStatus);
      channel.stopListening('SOSUpdateStatus', handleSosUpdateStatus);
      channel.stopListening('.LaporanCreated', handleLaporanCreated);
      channel.stopListening('LaporanCreated', handleLaporanCreated);
      channel.stopListening('.RelawanStatusUpdated', handleRelawanStatusUpdated);
      channel.stopListening('RelawanStatusUpdated', handleRelawanStatusUpdated);
    };
  }, [fetchDashboardData]);

  // Dropdown listeners
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsCategoryDropdownOpen(false);
    };
    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCategoryDropdownOpen]);

  const handleCategoryFilterChange = async (label) => {
    setCategoryTimeFilter(label);
    categoryFilterRef.current = label;
    setIsCategoryDropdownOpen(false);

    const rentangParam = getRentangParam(label);

    try {
      const res = await adminService.getSebaranUrgensi({ rentang: rentangParam });
      if (res?.data?.ringkasan_urgensi) {
        setUrgensiSummary(res.data.ringkasan_urgensi);
      }
      if (res?.data?.sebaran_kategori_laporan) {
        const rawCats = res.data.sebaran_kategori_laporan;
        const mapped = rawCats.map((item, idx) => ({
          label: item.label || item.kategori,
          count: item.jumlah,
          color: CATEGORY_SEMANTIC_PALETTE[idx % CATEGORY_SEMANTIC_PALETTE.length],
        }));
        setCategoryStats(mapped);
      }
    } catch (e) {
      console.error('Gagal memfilter sebaran kategori:', e);
    }
  };

  // Filtered & Sorted Cases for the Data Table
  const filteredCases = useMemo(() => {
    return casesList
      .filter((item) => {
        if (item.tipe !== 'SOS') return false;
        if (item.status === 'selesai' || item.status === 'batal') return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = String(item.id).toLowerCase().includes(q) || item.displayId?.toLowerCase().includes(q);
          const matchPelapor = item.pelapor?.toLowerCase().includes(q);
          const matchKategori = item.kategori?.toLowerCase().includes(q);
          return matchId || matchPelapor || matchKategori;
        }

        return true;
      })
      .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
  }, [casesList, searchQuery]);

  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCases.slice(start, start + pageSize);
  }, [filteredCases, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));

  // Action Handlers
  const handleContact = (item) => {
    if (item.whatsappUrl) {
      window.open(item.whatsappUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const rawNumber = item.kontakWa || item.kontak;
    if (!rawNumber || rawNumber === '-') return;
    const cleanNumber = rawNumber.replace(/\D/g, '');
    if (cleanNumber.length < 9) return;
    const waUrl = `https://wa.me/${cleanNumber.startsWith('0') ? '62' + cleanNumber.slice(1) : cleanNumber}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenDetail = (id, type, item) => {
    if (type === 'relawan') {
      const searchParam = item?.pelapor ? `?search=${encodeURIComponent(item.pelapor)}` : (id ? `?id=${id}` : '');
      navigate(`/manajemen-user${searchParam}`);
      return;
    }
    const tipeParam = (type || 'sos').toLowerCase().includes('sos') ? 'sos' : 'laporan';
    navigate(`/detail-kasus/${id}?tipe=${tipeParam}`);
  };

  return {
    loading,
    lastUpdated,
    stats,
    urgensiSummary,
    mapMarkers,
    relawanCount,
    sosCount,
    laporanCount,
    categoryTimeFilter,
    isCategoryDropdownOpen,
    setIsCategoryDropdownOpen,
    categoryDropdownRef,
    categoryStats,
    maxCategoryCount,
    totalLaporanKategori,
    topCategory,
    handleCategoryFilterChange,
    weeklyChartData,
    maxWeeklyCount,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    casesList,
    filteredCases,
    paginatedCases,
    totalPages,
    fetchDashboardData,
    handleContact,
    handleOpenDetail,
  };
}
