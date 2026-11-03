import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../api/services/adminService';

export function useUsers() {
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('relawan'); // 'relawan' | 'pending'
  const [search, setSearch] = useState(querySearch);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'aktif' | 'nonaktif'
  const [sortBy, setSortBy] = useState('terbaru'); // 'terbaru' | 'terlama' | 'nama_asc' | 'nama_desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    if (q !== null && q !== undefined) {
      setSearch(q);
    }
  }, [searchParams]);

  // Data state
  const [relawan, setRelawan] = useState([]);
  const [pendingRelawans, setPendingRelawans] = useState([]);
  const [totalRelawanBackend, setTotalRelawanBackend] = useState(0);

  // Loading state
  const [isLoadingRelawan, setIsLoadingRelawan] = useState(false);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, hideToast]);

  // ─── Fetch Relawan Superadmin ─────────────────────────────────────────
  const fetchRelawan = useCallback(async () => {
    setIsLoadingRelawan(true);
    try {
      const res = await adminService.getRelawanSuperadmin({ status_verifikasi: 'terverifikasi' });
      // Backend: { status, data: { data: [...], current_page, total, ... } } (paginated)
      const list = res?.data?.data ?? res?.data ?? res ?? [];
      const verifiedList = Array.isArray(list)
        ? list.filter((r) => !r.status_verifikasi || r.status_verifikasi === 'terverifikasi')
        : [];
      setRelawan(verifiedList);
      if (typeof res?.data?.total === 'number') {
        setTotalRelawanBackend(res.data.total);
      } else {
        setTotalRelawanBackend(verifiedList.length);
      }
    } catch (error) {
      console.error('Gagal mengambil data relawan:', error);
      setRelawan([]);
      showToast('Gagal memuat data relawan.', 'error');
    } finally {
      setIsLoadingRelawan(false);
    }
  }, [showToast]);

  // ─── Fetch Pending Relawan ────────────────────────────────────────────
  const fetchPendingRelawan = useCallback(async () => {
    setIsLoadingPending(true);
    try {
      const res = await adminService.getPendingRelawan();
      const list = res?.data?.data || res?.data || [];
      if (Array.isArray(list)) {
        setPendingRelawans(list);
      }
    } catch (error) {
      console.error('Gagal mengambil relawan pending:', error);
      setPendingRelawans([]);
      showToast('Gagal memuat pengajuan pending.', 'error');
    } finally {
      setIsLoadingPending(false);
    }
  }, [showToast]);

  // ─── Refresh All Data ────────────────────────────────────────────────
  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchPendingRelawan(), fetchRelawan()]);
      showToast('Data relawan berhasil diperbarui.', 'success');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    let mounted = true;
    const loadInitialData = async () => {
      setIsLoadingRelawan(true);
      setIsLoadingPending(true);
      try {
        const [resRelawan, resPending] = await Promise.allSettled([
          adminService.getRelawanSuperadmin({ status_verifikasi: 'terverifikasi' }),
          adminService.getPendingRelawan(),
        ]);
        if (!mounted) return;
        if (resRelawan.status === 'fulfilled') {
          const list = resRelawan.value?.data?.data ?? resRelawan.value?.data ?? resRelawan.value ?? [];
          const verifiedList = Array.isArray(list)
            ? list.filter((r) => !r.status_verifikasi || r.status_verifikasi === 'terverifikasi')
            : [];
          setRelawan(verifiedList);
          if (typeof resRelawan.value?.data?.total === 'number') {
            setTotalRelawanBackend(resRelawan.value.data.total);
          } else {
            setTotalRelawanBackend(verifiedList.length);
          }
        } else if (resRelawan.status === 'rejected') {
          console.error('Gagal mengambil data relawan saat inisialisasi:', resRelawan.reason);
          showToast('Gagal memuat data relawan.', 'error');
        }
        if (resPending.status === 'fulfilled') {
          const list = resPending.value?.data?.data || resPending.value?.data || [];
          setPendingRelawans(Array.isArray(list) ? list : []);
        } else if (resPending.status === 'rejected') {
          console.error('Gagal mengambil relawan pending saat inisialisasi:', resPending.reason);
        }
      } catch {
        // Handled silently on initial mount
      } finally {
        if (mounted) {
          setIsLoadingRelawan(false);
          setIsLoadingPending(false);
        }
      }
    };

    loadInitialData();
    return () => {
      mounted = false;
    };
  }, []);

  // Handler setters that automatically reset page without cascading effects
  const handleSetActiveTab = useCallback((tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  }, []);

  const handleSetSearch = useCallback((q) => {
    setSearch(q);
    setCurrentPage(1);
  }, []);

  const handleSetStatusFilter = useCallback((s) => {
    setStatusFilter(s);
    setCurrentPage(1);
  }, []);

  const handleSetSortBy = useCallback((sb) => {
    setSortBy(sb);
    setCurrentPage(1);
  }, []);

  const handleSetItemsPerPage = useCallback((count) => {
    setItemsPerPage(Number(count));
    setCurrentPage(1);
  }, []);

  // ─── Verifikasi relawan ───────────────────────────────────────────────
  const handleVerify = async (id, status, alasanPenolakan = null) => {
    try {
      await adminService.verifikasiRelawan(id, status, alasanPenolakan);
      setPendingRelawans((prev) => prev.filter((r) => r.id !== id));
      await fetchRelawan();
      const statusText = status === 'terverifikasi' ? 'disetujui' : 'ditolak';
      showToast(`Pendaftaran relawan berhasil ${statusText}.`, 'success');
      return { success: true, status };
    } catch (error) {
      console.error('Gagal verifikasi relawan:', error);
      showToast('Terjadi kesalahan saat memverifikasi relawan.', 'error');
      throw error;
    }
  };

  // ─── Update status aktif relawan (is_active boolean) ────────────────────
  const handleUpdateStatusRelawan = async (id, isActive) => {
    try {
      await adminService.updateStatusRelawan(id, isActive);
      setRelawan((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: isActive } : r))
      );
      const actionText = isActive ? 'diaktifkan' : 'dinonaktifkan';
      showToast(`Status relawan berhasil ${actionText}.`, 'success');
    } catch (error) {
      console.error('Gagal update status relawan:', error);
      showToast('Terjadi kesalahan saat memperbarui status keaktifan.', 'error');
      throw error;
    }
  };

  // ─── Statistics Calculation ───────────────────────────────────────────
  const stats = useMemo(() => {
    const verifiedList = relawan.filter((r) => !r.status_verifikasi || r.status_verifikasi === 'terverifikasi');
    const totalRelawan = Math.max(verifiedList.length, totalRelawanBackend);
    const relawanAktif = verifiedList.filter((r) => r.is_active === true || r.is_active === 1).length;
    const relawanNonaktif = verifiedList.filter((r) => r.is_active === false || r.is_active === 0).length;
    const totalPending = pendingRelawans.length;

    return {
      totalRelawan,
      relawanAktif,
      relawanNonaktif,
      totalPending,
    };
  }, [relawan, totalRelawanBackend, pendingRelawans]);

  // ─── Filter & Sort Data ───────────────────────────────────────────────
  const currentSource = useMemo(() => {
    if (activeTab === 'pending') {
      return pendingRelawans;
    }
    return relawan.filter((r) => !r.status_verifikasi || r.status_verifikasi === 'terverifikasi');
  }, [activeTab, relawan, pendingRelawans]);

  const filteredData = useMemo(() => {
    return currentSource.filter((item) => {
      // Search query
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (item.name || item.nama || '').toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        (item.alamat || item.lokasi || '').toLowerCase().includes(q) ||
        (item.no_telp || item.kontak || '').toLowerCase().includes(q) ||
        (item.pekerjaan || '').toLowerCase().includes(q) ||
        String(item.id || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Status filter (only applicable in relawan tab)
      if (activeTab === 'relawan' && statusFilter !== 'all') {
        const isActive = item.is_active === true || item.is_active === 1;
        if (statusFilter === 'aktif' && !isActive) return false;
        if (statusFilter === 'nonaktif' && isActive) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'nama_asc') {
        const nameA = (a.name || a.nama || '').toLowerCase();
        const nameB = (b.name || b.nama || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'nama_desc') {
        const nameA = (a.name || a.nama || '').toLowerCase();
        const nameB = (b.name || b.nama || '').toLowerCase();
        return nameB.localeCompare(nameA);
      }
      if (sortBy === 'terlama') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : a.id || 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : b.id || 0;
        return dateA - dateB;
      }
      // Default: 'terbaru'
      const dateA = a.created_at ? new Date(a.created_at).getTime() : a.id || 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : b.id || 0;
      return dateB - dateA;
    });
  }, [currentSource, search, statusFilter, sortBy, activeTab]);

  // ─── Paginated Slice ──────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('all');
    setSortBy('terbaru');
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = Boolean(
    search.trim() || statusFilter !== 'all' || sortBy !== 'terbaru'
  );

  const isLoading = isLoadingRelawan || isLoadingPending;

  return {
    activeTab,
    setActiveTab: handleSetActiveTab,
    search,
    setSearch: handleSetSearch,
    statusFilter,
    setStatusFilter: handleSetStatusFilter,
    sortBy,
    setSortBy: handleSetSortBy,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage: handleSetItemsPerPage,
    totalPages,
    relawan,
    pendingRelawans,
    stats,
    isLoading,
    isRefreshing,
    filteredData,
    paginatedData,
    hasActiveFilters,
    resetFilters,
    handleVerify,
    handleUpdateStatusRelawan,
    fetchRelawan,
    fetchPendingRelawan,
    refreshAll,
    toast,
    showToast,
    hideToast,
  };
}
