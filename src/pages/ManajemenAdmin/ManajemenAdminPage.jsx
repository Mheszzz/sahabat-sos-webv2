import { useState } from 'react';
import { UserPlus, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import PageHeader from '../../components/global/PageHeader';
import { useAdminData } from '../../hooks/manajemen-admin/useAdminData';
import AdminStats from '../../components/manajemen-admin/AdminStats';
import AdminFilters from '../../components/manajemen-admin/AdminFilters';
import AdminTable from '../../components/manajemen-admin/AdminTable';
import AdminAddModal from '../../components/manajemen-admin/AdminAddModal';
import AdminEditModal from '../../components/manajemen-admin/AdminEditModal';
import AdminDetailModal from '../../components/manajemen-admin/AdminDetailModal';
import AdminPermissionsModal from '../../components/manajemen-admin/AdminPermissionsModal';
import { adminService } from '../../api/services/adminService';

export default function ManajemenAdminPage() {
  const { currentUser } = useOutletContext() || {};
  const {
    admins, isLoading, error,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    roleFilter, setRoleFilter,
    sortBy, setSortBy,
    totalAdmin, adminDenganAkses, adminTanpaAkses, fetchAdmins
  } = useAdminData();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [detailAdmin, setDetailAdmin] = useState(null);
  const [managingPerms, setManagingPerms] = useState(null);
  const [confirmStatusToggle, setConfirmStatusToggle] = useState(null); // stores admin object to toggle status
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Akses Kontrol: Super Admin atau Admin yang memiliki izin 'kelola_admin'
  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'superadmin';
  const hasKelolaAdmin = Array.isArray(currentUser?.permissions) && currentUser.permissions.includes('kelola_admin');

  if (!isSuperAdmin && !hasKelolaAdmin) {
    return (
      <div className="p-12 text-center">
        <h1 className="text-2xl font-black text-slate-900">403 - Akses Ditolak</h1>
        <p className="text-slate-500 mt-2">Halaman khusus Super Admin atau Administrator dengan izin Kelola Administrator.</p>
      </div>
    );
  }

  const handleStatusToggleConfirm = async () => {
    if (!confirmStatusToggle) return;
    try {
      setIsUpdatingStatus(true);
      const newStatus = confirmStatusToggle.is_active === false ? true : false;
      await adminService.updateAdminStatus(confirmStatusToggle.id, newStatus);
      fetchAdmins();
    } catch (err) {
      alert(err?.response?.data?.message || 'Gagal mengubah status keaktifan admin.');
    } finally {
      setIsUpdatingStatus(false);
      setConfirmStatusToggle(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1680px] w-full mx-auto relative">
      <PageHeader
        title="Manajemen Admin"
        description="Kelola akun operator posko, hak akses modular, dan pantau status administrator."
        actions={
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 h-10 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Tambah Admin</span>
          </button>
        }
      />

      <AdminStats
        totalAdmin={totalAdmin}
        adminDenganAkses={adminDenganAkses}
        adminTanpaAkses={adminTanpaAkses}
      />

      <AdminFilters
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        roleFilter={roleFilter} setRoleFilter={setRoleFilter}
        sortBy={sortBy} setSortBy={setSortBy}
      />

      <AdminTable
        admins={admins}
        isLoading={isLoading}
        error={error}
        onDetail={(admin) => setDetailAdmin(admin)}
        onEdit={(admin) => setEditingAdmin(admin)}
        onPermissions={(admin) => setManagingPerms(admin)}
        onToggleStatus={(admin) => setConfirmStatusToggle(admin)}
      />

      {/* Modal Tambah Admin */}
      <AdminAddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={() => { setIsAddOpen(false); fetchAdmins(); }}
      />

      {/* Modal Edit Admin */}
      <AdminEditModal
        admin={editingAdmin}
        isOpen={!!editingAdmin}
        onClose={() => setEditingAdmin(null)}
        onSave={() => { setEditingAdmin(null); fetchAdmins(); }}
      />

      {/* Modal Detail Admin */}
      <AdminDetailModal
        admin={detailAdmin}
        isOpen={!!detailAdmin}
        onClose={() => setDetailAdmin(null)}
      />

      {/* Modal Kelola Hak Akses */}
      <AdminPermissionsModal
        admin={managingPerms}
        onClose={() => setManagingPerms(null)}
        onSave={() => { setManagingPerms(null); fetchAdmins(); }}
      />

      {/* Dialog Konfirmasi Aktifkan / Nonaktifkan Akun Admin */}
      {confirmStatusToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                confirmStatusToggle.is_active === false ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {confirmStatusToggle.is_active === false ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {confirmStatusToggle.is_active === false ? 'Aktifkan Akun Admin?' : 'Nonaktifkan Akun Admin?'}
              </h3>
            </div>

            <p className="text-[13px] text-slate-600 mb-6 leading-relaxed">
              {confirmStatusToggle.is_active === false ? (
                <>
                  Apakah Anda yakin ingin mengaktifkan kembali akun admin <strong>{confirmStatusToggle.name || confirmStatusToggle.nama}</strong>? Admin ini dapat kembali masuk ke dashboard.
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menonaktifkan akun admin <strong>{confirmStatusToggle.name || confirmStatusToggle.nama}</strong>? Akses admin ini akan segera dibekukan dan sesi aktifnya akan dihentikan.
                </>
              )}
            </p>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmStatusToggle(null)}
                disabled={isUpdatingStatus}
                className="px-4 h-10 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleStatusToggleConfirm}
                disabled={isUpdatingStatus}
                className={`px-4 h-10 rounded-xl text-white text-[13px] font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer ${
                  confirmStatusToggle.is_active === false
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isUpdatingStatus ? (
                  <><Loader2 size={14} className="animate-spin" /><span>Memproses...</span></>
                ) : (
                  <span>{confirmStatusToggle.is_active === false ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
