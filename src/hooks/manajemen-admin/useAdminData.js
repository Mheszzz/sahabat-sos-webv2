import { useState, useEffect } from 'react';
import { adminService } from '../../api/services/adminService';

export function useAdminData() {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua'); // Semua | Punya Akses | Tanpa Akses
  const [roleFilter, setRoleFilter] = useState('Semua');    // Semua | admin | superadmin
  const [sortBy, setSortBy] = useState('terbaru');          // terbaru | nama

  const fetchAdmins = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getAdmins();
      // Backend mengembalikan { data: [...] } atau langsung array
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setAdmins(list);
    } catch (err) {
      console.error('Gagal memuat data admin:', err);
      setError('Gagal memuat data admin dari server. Periksa koneksi dan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // ── Statistik (berdasarkan data nyata dari backend) ─────────────────────────
  const totalAdmin = admins.length;

  // Admin yang punya akses (Super Admin otomatis punya akses penuh, atau admin dengan minimal 1 permission)
  const adminDenganAkses = admins.filter(
    (a) => (a.role || '').toLowerCase() === 'superadmin' || (Array.isArray(a.permissions) && a.permissions.length > 0)
  ).length;

  // Admin yang belum punya permission sama sekali
  const adminTanpaAkses = admins.filter(
    (a) => (a.role || '').toLowerCase() !== 'superadmin' && (!Array.isArray(a.permissions) || a.permissions.length === 0)
  ).length;

  // ── Filter & Sort ────────────────────────────────────────────────────────────
  const filteredAdmins = admins
    .filter((a) => {
      // Filter status keaktifan & hak akses
      const hasPerms = (a.role || '').toLowerCase() === 'superadmin' || (Array.isArray(a.permissions) && a.permissions.length > 0);
      const isActive = a.is_active !== false;

      const matchStatus =
        statusFilter === 'Semua'
          ? true
          : statusFilter === 'Aktif'
          ? isActive
          : statusFilter === 'Nonaktif'
          ? !isActive
          : statusFilter === 'Punya Akses'
          ? hasPerms
          : statusFilter === 'Tanpa Akses'
          ? !hasPerms
          : true;

      // Filter role
      const matchRole =
        roleFilter === 'Semua'
          ? true
          : (a.role || '').toLowerCase() === roleFilter.toLowerCase();

      // Search (nama, email, id)
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (a.name || a.nama || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        String(a.id).includes(q);

      return matchStatus && matchRole && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'nama') {
        return (a.name || a.nama || '').localeCompare(b.name || b.nama || '');
      }
      // Default: terbaru (descending by id atau created_at)
      if (a.created_at && b.created_at) {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return Number(b.id) - Number(a.id);
    });

  return {
    admins: filteredAdmins,
    isLoading,
    error,
    // Search & Filter
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    sortBy,
    setSortBy,
    // Stats: hanya dari data yang ada di backend
    totalAdmin,
    adminDenganAkses,
    adminTanpaAkses,
    // Actions
    fetchAdmins,
  };
}
