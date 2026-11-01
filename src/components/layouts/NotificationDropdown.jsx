import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { kasusAktifService } from '../../api/services/kasusAktifService';
import { parseSafeDate } from '../../utils/dateHelper';
import echo from '../../api/libs/echo';

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const dropdownRef = useRef(null);

  // Fetch real active SOS from backend
  const fetchActiveSos = async () => {
    try {
      const res = await kasusAktifService.getSOS({ per_page: 10 });
      const rawSos = res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
      const activeSos = rawSos.filter(s => {
        const st = (s.status_raw || s.status || '').toLowerCase().trim();
        return st !== 'selesai' && st !== 'batal' && st !== 'dibatalkan';
      });

      const mapped = activeSos.map(s => ({
        id: s.id,
        type: 'sos',
        title: `Darurat SOS #${s.id} - ${s.pelapor?.nama || s.pelapor?.name || 'Warga SOS'}`,
        message: `${s.lokasi?.alamat || 'Wilayah Operasional'} • Butuh respon segera`,
        time: s.waktu ? formatWaktu(s.waktu) : 'Baru saja',
        read: false,
        path: `/detail-kasus/${s.id}?tipe=sos`,
      }));
      setNotifications(mapped);
    } catch (err) {
      console.warn('Gagal memuat notifikasi SOS:', err);
    }
  };

  const formatWaktu = (dateStr) => {
    if (!dateStr) return 'Baru saja';
    try {
      const d = parseSafeDate(dateStr);
      if (!d) return dateStr;
      const day = d.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const month = monthNames[d.getMonth()];
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} • ${hours}:${minutes} WIB`;
    } catch {
      return 'Baru saja';
    }
  };

  useEffect(() => {
    fetchActiveSos();

    const channel = echo.private('command-center');

    const handleSosCreated = () => {
      fetchActiveSos();
    };

    const handleSosUpdateStatus = (data) => {
      if (data?.id) {
        const st = (data.status_sos || data.status_raw || data.status || '').toLowerCase().trim();
        const isEnded = ['batal', 'dibatalkan', 'selesai'].includes(st);
        if (isEnded) {
          setNotifications((prev) => prev.filter((n) => String(n.id) !== String(data.id)));
        }
      }
      fetchActiveSos();
    };

    channel.listen('.SOSCreated', handleSosCreated);
    channel.listen('SOSCreated', handleSosCreated);
    channel.listen('.SOSUpdateStatus', handleSosUpdateStatus);
    channel.listen('SOSUpdateStatus', handleSosUpdateStatus);

    return () => {
      channel.stopListening('.SOSCreated', handleSosCreated);
      channel.stopListening('SOSCreated', handleSosCreated);
      channel.stopListening('.SOSUpdateStatus', handleSosUpdateStatus);
      channel.stopListening('SOSUpdateStatus', handleSosUpdateStatus);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle click outside & Esc key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleReset = () => {
    fetchActiveSos();
  };

  const handleItemClick = (item) => {
    setNotifications(prev =>
      prev.map(n => (n.id === item.id ? { ...n, read: true } : n))
    );
    setIsOpen(false);
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Bell Trigger Button ── */}
      <button
        onClick={() => {
          setIsOpen(prev => !prev);
        }}
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
          isOpen
            ? 'border-slate-300 bg-slate-100 text-slate-800 shadow-xs'
            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800'
        }`}
        aria-label="Notifikasi SOS Aktif"
        title="Notifikasi Darurat SOS Aktif"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in">
            {unreadCount}
          </span>
        )}
      </button>

      {/* ── Pop-up Dropdown (Inspired by YouTube's Notification Pop-up) ── */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 w-[360px] sm:w-[410px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col font-sans">
          {/* ════ Header Bar ════ */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 bg-white">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-slate-900">
                Notifikasi
              </h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-extrabold text-red-600">
                  {unreadCount} SOS Aktif
                </span>
              )}
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Tandai semua sudah dibaca"
                    >
                      <CheckCheck size={13} />
                      <span className="hidden sm:inline">Tandai Dibaca</span>
                    </button>
                  )}
                  <button
                    onClick={handleClearAll}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    title="Bersihkan notifikasi"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ════ Content Body ════ */}
          {notifications.length > 0 ? (
            /* ── DAFTAR NOTIFIKASI SOS AKTIF SAJA ── */
            <div>
              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {notifications.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                      item.read ? 'bg-white hover:bg-slate-50' : 'bg-red-50/25 hover:bg-red-50/45'
                    }`}
                  >
                    {/* SOS Red Icon */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-[#dc2626]">
                      <AlertTriangle size={17} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <h4 className="text-[12.5px] font-bold text-slate-900 truncate">
                            {item.title}
                          </h4>
                          <span className="rounded bg-red-100 px-1.5 py-0.2 text-[9px] font-black text-red-600 uppercase tracking-wider">
                            DARURAT
                          </span>
                        </div>
                        {!item.read && (
                          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-slate-600 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10.5px] font-medium text-slate-400">
                          {item.time}
                        </span>
                        <span className="text-[10.5px] font-bold text-red-600 hover:underline">
                          Buka Kasus &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Footer */}
              <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-center flex items-center justify-between">
                <button
                  onClick={handleClearAll}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Bersihkan
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/kasus-aktif');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#dc2626] hover:underline"
                >
                  <span>Lihat Kasus Darurat SOS</span>
                  <ExternalLink size={11} />
                </button>
              </div>
            </div>
          ) : (
            /* ── EMPTY STATE (TAMPILAN IDENTIK DENGAN GAMBAR 2 / YOUTUBE) ── */
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              {/* Icon Lonceng Besar Outlined */}
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-2">
                <Bell size={52} strokeWidth={1.3} className="text-slate-400" />
              </div>

              {/* Judul Teks */}
              <h3 className="mt-3 text-[16px] font-bold text-slate-900 tracking-tight">
                Notifikasi Anda ada di sini
              </h3>

              {/* Sub-judul Penjelas */}
              <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500 max-w-[280px]">
                Tidak ada panggilan darurat SOS aktif saat ini. Semua panggilan darurat baru akan muncul di sini secara real-time.
              </p>

              {/* Tombol Refresh Notifikasi */}
              <button
                onClick={handleReset}
                className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-[11.5px] font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
                title="Refresh daftar notifikasi darurat"
              >
                <RotateCcw size={13} className="text-slate-500" />
                <span>Refresh Notifikasi</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
