import { useState } from 'react';
import {
  Lock, ArrowLeft, UserPlus, RefreshCw,
  CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { useOutletContext, Link } from 'react-router-dom';
import { useUsers } from '../../hooks/manajemen-user/useUsers';
import RelawanStats from '../../components/manajemen-user/RelawanStats';
import UserTabs from '../../components/manajemen-user/UserTabs';
import RelawanFilters from '../../components/manajemen-user/RelawanFilters';
import UserTable from '../../components/manajemen-user/UserTable';
import RelawanAddModal from '../../components/manajemen-user/RelawanAddModal';

export default function ManajemenUserPage() {
  const { currentUser } = useOutletContext() || {};
  const isSuperAdmin =
    currentUser?.role?.toLowerCase() === 'super admin' ||
    currentUser?.role?.toLowerCase() === 'superadmin';
  const hasVerifyPermission =
    Array.isArray(currentUser?.permissions) &&
    currentUser.permissions.includes('verifikasi_relawan');
  const canAccess = isSuperAdmin || hasVerifyPermission;

  const {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
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
    refreshAll,
    toast,
    hideToast,
  } = useUsers();

  const [isAddRelawanOpen, setIsAddRelawanOpen] = useState(false);

  // Akses Kontrol jika tidak punya hak akses
  if (!canAccess) {
    return (
      <div className="p-8 lg:p-16 max-w-[700px] mx-auto text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
          <Lock size={30} />
        </div>
        <div>
          <h1 className="text-[24px] font-black text-slate-900">403: Akses Ditolak</h1>
          <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
            Anda memerlukan izin khusus &quot;verifikasi_relawan&quot; atau hak akses Super Admin untuk membuka halaman manajemen relawan.
          </p>
        </div>
        <Link
          to="/"
          className="btn-base btn-primary text-[13px] h-10 px-5 inline-flex shadow-xs"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Dashboard Utama</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 lg:p-6 space-y-3.5 sm:space-y-4 max-w-[1680px] w-full mx-auto relative">
      {/* Toast Notification Banner */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in max-w-md shadow-xl rounded-2xl overflow-hidden border">
          <div
            className={`p-3.5 flex items-center gap-3 ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-emerald-600 text-white border-emerald-700'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle size={18} className="flex-shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="flex-shrink-0" />
            )}
            <p className="text-[13px] font-semibold flex-1 leading-snug">{toast.message}</p>
            <button
              onClick={hideToast}
              className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <RelawanStats
        stats={stats}
        onSelectPendingTab={() => setActiveTab('pending')}
      />

      {/* Navigation Tabs & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <UserTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          registeredCount={stats.totalRelawan}
          pendingCount={stats.totalPending}
        />

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={refreshAll}
            disabled={isRefreshing || isLoading}
            className="h-9 px-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-[12.5px] font-semibold transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-1"
            title="Refresh data dari server"
          >
            <RefreshCw
              size={13.5}
              className={`text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* + Tambah Relawan Primary Button */}
          <button
            type="button"
            onClick={() => setIsAddRelawanOpen(true)}
            className="h-9 px-4 rounded-xl bg-[#0b6f61] hover:bg-[#085d52] active:scale-[0.98] text-white text-[12.5px] font-bold transition-all flex items-center gap-1.5 shadow-xs hover:shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-1"
          >
            <UserPlus size={14.5} />
            <span>+ Tambah Relawan</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <RelawanFilters
        activeTab={activeTab}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
        totalResults={filteredData.length}
      />

      {/* Main Data Table */}
      <UserTable
        activeTab={activeTab}
        data={paginatedData}
        totalResults={filteredData.length}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        isLoading={isLoading}
        onVerify={handleVerify}
        onUpdateStatus={handleUpdateStatusRelawan}
        onOpenAddModal={() => setIsAddRelawanOpen(true)}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
      />

      {/* Modal Tambah Relawan */}
      <RelawanAddModal
        isOpen={isAddRelawanOpen}
        onClose={() => setIsAddRelawanOpen(false)}
        onSave={() => {
          setIsAddRelawanOpen(false);
          fetchRelawan();
        }}
      />
    </div>
  );
}
