import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Menu, AlertTriangle } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import AudioSirenController from '../AudioSirenController';
import GlobalSearchModal from '../global/GlobalSearchModal';

function getBreadcrumbs(pathname) {
  if (pathname.startsWith('/detail-kasus')) {
    return [
      { label: 'Kasus Aktif', to: '/kasus-aktif', icon: AlertTriangle },
      { label: 'Detail Kasus' },
    ];
  }
  if (pathname.startsWith('/kasus-aktif')) {
    return [
      { label: 'Kasus Aktif', icon: AlertTriangle },
    ];
  }
  if (pathname.startsWith('/riwayat')) {
    return [
      { label: 'Riwayat Kasus' },
    ];
  }
  if (pathname.startsWith('/peta')) {
    return [
      { label: 'Peta Pemantauan' },
    ];
  }
  if (pathname.startsWith('/pengaturan')) {
    return [
      { label: 'Profil' },
    ];
  }
  if (pathname.startsWith('/manajemen-admin')) {
    return [
      { label: 'Kelola Admin' },
    ];
  }
  if (pathname.startsWith('/detail-relawan')) {
    return [
      { label: 'Kelola Relawan', to: '/manajemen-user' },
      { label: 'Detail Relawan' },
    ];
  }
  if (pathname.startsWith('/manajemen-user')) {
    return [
      { label: 'Kelola Relawan' },
    ];
  }
  if (pathname.startsWith('/detail-laporan')) {
    return [
      { label: 'Master Data Laporan', to: '/master-data' },
      { label: 'Detail Laporan' },
    ];
  }
  if (pathname.startsWith('/master-data')) {
    return [
      { label: 'Master Data Laporan' },
    ];
  }
  return [
    { label: 'Dashboard Utama' },
  ];
}

export default function TopHeader({ onMenuToggle, isCollapsed, onToggleCollapse }) {
  const location = useLocation();
  const crumbs = getBreadcrumbs(location.pathname);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Global shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur-sm lg:px-8 no-print gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile navigation toggle */}
          <button
            onClick={onMenuToggle}
            className="flex min-h-[40px] min-w-[40px] h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-2 md:hidden shrink-0"
            aria-label="Buka Menu Navigasi"
          >
            <Menu size={18} />
          </button>

          {/* Desktop collapse/expand toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex min-h-[36px] min-w-[36px] h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-2 shrink-0 cursor-pointer"
            title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            aria-label={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            <Menu size={16} />
          </button>

          <nav className="hidden sm:flex items-center gap-1.5 text-[13px] font-medium truncate" aria-label="Breadcrumb">
            {crumbs.map((crumb, idx) => {
              const isLast = idx === crumbs.length - 1;
              const IconComponent = crumb.icon;

              return (
                <div key={idx} className="flex items-center gap-1.5 truncate">
                  {crumb.to && !isLast ? (
                    <Link
                      to={crumb.to}
                      className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 transition-colors truncate focus-visible:outline-none focus-visible:underline"
                    >
                      {IconComponent && <IconComponent size={14} className="text-slate-500 shrink-0" />}
                      <span className="truncate">{crumb.label}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-1.5 truncate">
                      {IconComponent && <IconComponent size={14} className="text-slate-500 shrink-0" />}
                      <span className={isLast ? "font-bold text-slate-900 truncate" : "text-slate-600 truncate"}>
                        {crumb.label}
                      </span>
                    </div>
                  )}
                  {!isLast && (
                    <ChevronRight size={12} className="text-slate-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Audio Siren Controller */}
          <AudioSirenController />

          {/* Notification Dropdown */}
          <NotificationDropdown />
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}
