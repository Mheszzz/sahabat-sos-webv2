import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Home, AlertTriangle, Clock, MapPin, Settings,
  LogOut, UserCog, Users, ChevronRight, ChevronLeft, Database, Smartphone
} from 'lucide-react';
import InitialsAvatar from '../global/InitialsAvatar';
import { adminService } from '../../api/services/adminService';

const initialNavItems = [
  { id: 'dashboard', label: 'Dashboard Utama', icon: Home },
  { id: 'kasus-aktif', label: 'Kasus Aktif', icon: AlertTriangle, badge: 0 },
  { id: 'riwayat', label: 'Riwayat Kasus', icon: Clock },
  { id: 'peta', label: 'Peta Pemantauan', icon: MapPin },
  { id: 'pengaturan', label: 'Profil', icon: Settings },
];

const manajemenItems = [
  { id: 'manajemen-admin', label: 'Kelola Admin', icon: UserCog },
  { id: 'manajemen-user', label: 'Kelola Relawan', icon: Users },
  { id: 'master-data', label: 'Master Data Laporan', icon: Database },
];

function NavButton({ id, label, icon: Icon, badge, isActive, isCollapsed }) {
  if (isCollapsed) {
    return (
      <Link
        to={id === 'dashboard' ? '/' : '/' + id}
        title={label}
        className={`
          w-full flex items-center justify-center py-2 px-1 rounded-xl
          transition-all duration-150 cursor-pointer group relative
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d399] focus-visible:ring-offset-2 focus-visible:ring-offset-[#062c26]
          ${isActive
            ? 'bg-white/[0.12] text-white'
            : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
          }
        `}
      >
        <span
          className={`
            w-[38px] h-[38px] flex items-center justify-center rounded-lg flex-shrink-0 transition-colors relative
            ${isActive
              ? 'bg-[#0b6f61] text-[#34d399] shadow-sm'
              : 'bg-white/[0.05] text-white/50 group-hover:bg-white/[0.08] group-hover:text-white'
            }
          `}
        >
          <Icon size={17} />
          {badge > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#ef4444] text-white text-[9px] font-bold rounded-full min-w-[17px] h-[17px] flex items-center justify-center px-1 border-2 border-[#062c26] shadow-sm">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={id === 'dashboard' ? '/' : '/' + id}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold
        transition-all duration-150 cursor-pointer text-left group
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d399] focus-visible:ring-offset-2 focus-visible:ring-offset-[#062c26]
        ${isActive
          ? 'bg-white/[0.10] text-white'
          : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
        }
      `}
    >
      <span className={`w-[30px] h-[30px] flex items-center justify-center rounded-lg flex-shrink-0 transition-colors ${isActive
          ? 'bg-[#0b6f61] text-[#34d399]'
          : 'bg-white/[0.05] text-white/40 group-hover:bg-white/[0.08] group-hover:text-white/60'
        }`}>
        <Icon size={15} />
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge > 0 && (
        <span className="bg-[#ef4444] text-white text-[10px] font-bold rounded-full min-w-[19px] h-[19px] flex items-center justify-center flex-shrink-0 px-1">
          {badge}
        </span>
      )}
      {isActive && !badge && (
        <ChevronRight size={13} className="flex-shrink-0 text-white/30" />
      )}
    </Link>
  );
}

export default function Sidebar({ isOpen, onToggle, isCollapsed = false, onToggleCollapse, currentUser, onLogout }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isItemActive = (id) => {
    if (id === 'dashboard') {
      return currentPath === '/' || currentPath === '/dashboard';
    }
    if (id === 'kasus-aktif') {
      return currentPath.startsWith('/kasus-aktif') || currentPath.startsWith('/detail-kasus');
    }
    if (id === 'riwayat') {
      return currentPath.startsWith('/riwayat');
    }
    if (id === 'peta') {
      return currentPath.startsWith('/peta');
    }
    if (id === 'pengaturan') {
      return currentPath.startsWith('/pengaturan');
    }
    if (id === 'manajemen-admin') {
      return currentPath.startsWith('/manajemen-admin');
    }
    if (id === 'manajemen-user') {
      return currentPath.startsWith('/manajemen-user') || currentPath.startsWith('/detail-relawan');
    }
    if (id === 'master-data') {
      return currentPath.startsWith('/master-data') || currentPath.startsWith('/detail-laporan');
    }
    return false;
  };
  const [navItems, setNavItems] = useState(initialNavItems);

  const isUnhandledStatus = (status) => {
    const s = (status || '').toLowerCase().trim();
    return ['aktif', 'pending', 'menunggu', 'belum ditangani', 'belum_ditangani', 'belum tertangani', 'belum_tertangani'].includes(s);
  };

  useEffect(() => {
    const fetchActiveCount = async () => {
      try {
        const res = await adminService.getPetaKasus();
        if (res) {
          let count = 0;
          if (res.summary?.total_belum_tertangani !== undefined) {
            count = res.summary.total_belum_tertangani;
          } else if (res.summary?.total_kasus_belum_tertangani !== undefined) {
            count = res.summary.total_kasus_belum_tertangani;
          } else if (res.data) {
            const sosBelum = (res.data.titik_darurat_sos || []).filter(item =>
              isUnhandledStatus(item.status)
            ).length;
            const lapBelum = (res.data.titik_laporan_aktif || []).filter(item =>
              isUnhandledStatus(item.status)
            ).length;
            count = sosBelum + lapBelum;
          }

          setNavItems(prev => prev.map(item =>
            item.id === 'kasus-aktif' ? { ...item, badge: count } : item
          ));
        }
      } catch (err) {
        console.error('Failed to fetch sidebar active cases count', err);
      }
    };
    fetchActiveCount();

    // Auto-refresh berkala & saat ada trigger update status kasus
    const interval = setInterval(fetchActiveCount, 30000);
    const handleUpdate = () => fetchActiveCount();
    window.addEventListener('kasus-updated', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('kasus-updated', handleUpdate);
    };
  }, [currentPath]);

  // Evaluasi hak akses granular untuk filter navigasi sidebar
  const isSuperAdmin = (currentUser?.role || '').toLowerCase() === 'superadmin' || currentUser?.role === 'Super Admin';
  const permissions = Array.isArray(currentUser?.permissions) ? currentUser.permissions : [];
  const hasPerm = (perm) => isSuperAdmin || permissions.includes(perm);

  const visibleNavItems = navItems.filter((item) => {
    if (item.id === 'kasus-aktif' || item.id === 'riwayat') {
      return isSuperAdmin || hasPerm('kelola_laporan') || hasPerm('pantau_peta');
    }
    if (item.id === 'peta') {
      return isSuperAdmin || hasPerm('pantau_peta');
    }
    return true; // 'dashboard', 'pengaturan'
  });

  const visibleManajemenItems = manajemenItems.filter((item) => {
    if (item.id === 'manajemen-admin') {
      return isSuperAdmin || hasPerm('kelola_admin');
    }
    if (item.id === 'manajemen-user') {
      return isSuperAdmin || hasPerm('kelola_relawan') || hasPerm('verifikasi_relawan');
    }
    if (item.id === 'master-data') {
      return isSuperAdmin || hasPerm('kelola_admin');
    }
    return true;
  });

  const displayName = currentUser?.name || currentUser?.nama || 'Admin';
  const displayRole = isSuperAdmin ? 'Super Admin' : (currentUser?.role || 'Admin');

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onToggle}
        />
      )}

      {/* Spacer on Desktop */}
      <div
        className={`hidden md:block transition-all duration-300 ease-in-out flex-shrink-0 ${
          isCollapsed ? 'w-[72px]' : 'w-[256px]'
        }`}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        style={{ backgroundColor: '#062c26' }}
        className={`
          fixed inset-y-0 left-0 flex flex-col z-50
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'md:w-[72px]' : 'md:w-[256px]'}
          w-[256px]
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className={`h-[64px] flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'} flex-shrink-0 border-b border-white/[0.07]`}>
          {isCollapsed ? (
            <button
              onClick={onToggleCollapse}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-white/[0.08] transition-colors group cursor-pointer"
              title="Perluas Sidebar"
              aria-label="Perluas Sidebar"
            >
              <img src="/logo.png" alt="Sahabat SOS Logo" className="h-8 w-8 object-contain rounded-md bg-white p-0.5 shadow-sm group-hover:opacity-20 transition-opacity" />
              <ChevronRight size={18} className="absolute inset-0 m-auto text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <img src="/logo.png" alt="Sahabat SOS Logo" className="h-8 w-8 object-contain rounded-md bg-white p-0.5 flex-shrink-0 shadow-sm" />
                <div className="min-w-0">
                  <h1 className="text-white font-extrabold text-[15px] tracking-tight leading-none truncate">Sahabat SOS</h1>
                  <p className="text-[#34d399] text-[10px] font-bold uppercase tracking-[0.12em] mt-[3px] leading-none opacity-80">
                    Admin Command
                  </p>
                </div>
              </div>
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex w-7 h-7 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                title="Ciutkan Sidebar"
                aria-label="Ciutkan Sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className={`flex-1 flex flex-col overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'} pt-4 pb-2`} style={{ scrollbarWidth: 'none' }}>
          {!isCollapsed ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300/80 px-2.5 mb-2">
              Menu Utama
            </p>
          ) : (
            <div className="w-8 h-[1px] bg-white/[0.1] mx-auto mb-2" />
          )}
          <div className="space-y-0.5">
            {visibleNavItems.map(item => (
              <NavButton key={item.id} {...item} isActive={isItemActive(item.id)} isCollapsed={isCollapsed} />
            ))}
          </div>

          {/* Manajemen Section */}
          {visibleManajemenItems.length > 0 && (
            <div className="mt-4">
              {!isCollapsed ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300/80 px-2.5 mb-2">
                  Manajemen
                </p>
              ) : (
                <div className="w-8 h-[1px] bg-white/[0.1] mx-auto mb-2" />
              )}
              <div className="space-y-0.5">
                {visibleManajemenItems.map(item => (
                  <NavButton key={item.id} {...item} isActive={isItemActive(item.id)} isCollapsed={isCollapsed} />
                ))}
              </div>
            </div>
          )}

          {/* Quick link to Mobile APK Download Page */}
          <div className="mt-4 pt-3 border-t border-white/[0.08]">
            <Link
              to="/download"
              target="_blank"
              rel="noopener noreferrer"
              className={`
                w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'} rounded-xl text-[12px] font-semibold
                bg-white/[0.06] text-white/80 hover:bg-white/[0.12] hover:text-white transition-all
              `}
              title="Halaman Unduh APK Mobile"
            >
              <span className="w-[28px] h-[28px] rounded-lg bg-[#dc2626] text-white flex items-center justify-center flex-shrink-0">
                <Smartphone size={14} />
              </span>
              {!isCollapsed && (
                <div className="min-w-0 flex-1 truncate">
                  <p className="truncate text-white font-bold leading-tight">Unduh APK Mobile</p>
                  <p className="text-[10px] text-emerald-300/80 truncate">v1.0.0 Android</p>
                </div>
              )}
            </Link>
          </div>

          <div className="flex-1" />
        </div>

        {/* User Profile */}
        {currentUser && (
          <div className={`${isCollapsed ? 'px-2 pb-3 pt-2' : 'px-3 pb-3 pt-2'} border-t border-white/[0.07] flex-shrink-0`}>
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-2 py-1">
                <Link
                  to="/pengaturan"
                  className="rounded-full ring-2 ring-transparent hover:ring-[#34d399] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34d399]"
                  title={`Profil: ${displayName} (${displayRole})`}
                >
                  <InitialsAvatar
                    name={displayName}
                    src={currentUser.foto_profile_url || currentUser.foto_profile || currentUser.foto_url || currentUser.avatar_url}
                    size={36}
                    bgClass="bg-[#0b6f61]"
                  />
                </Link>
                <button
                  onClick={onLogout}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.07] text-white/70 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  title="Keluar dari Akun"
                  aria-label="Logout"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors">
                <Link to="/pengaturan" className="shrink-0" title="Buka Profil">
                  <InitialsAvatar
                    name={displayName}
                    src={currentUser.foto_profile_url || currentUser.foto_profile || currentUser.foto_url || currentUser.avatar_url}
                    size={34}
                    bgClass="bg-[#0b6f61]"
                  />
                </Link>
                <Link to="/pengaturan" className="flex-1 min-w-0" title="Buka Profil">
                  <p className="text-white text-[13px] font-bold truncate leading-tight hover:text-emerald-300 transition-colors">{displayName}</p>
                  <p className="text-white/75 text-[11px] truncate leading-tight mt-0.5">{displayRole}</p>
                </Link>
                <button
                  onClick={onLogout}
                  className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-white/[0.07] text-white/70 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#062c26]"
                  title="Keluar dari Akun"
                  aria-label="Logout"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}





