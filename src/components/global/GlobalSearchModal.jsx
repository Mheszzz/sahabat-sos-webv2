import { useState, useEffect, useRef } from 'react';
import { Search, X, AlertTriangle, FileText, User, Shield, ArrowRight, Loader2, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../api/services/adminService';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await adminService.globalSearch(query.trim());
        setResults(res?.data || null);
      } catch (err) {
        console.error('Error global search:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results
    ? (results.kasus_sos?.length || 0) +
      (results.laporan?.length || 0) +
      (results.relawan?.length || 0) +
      (results.pengguna?.length || 0)
    : 0;

  const handleSelectSos = (id) => {
    onClose();
    navigate(`/detail-kasus/${id}?tipe=sos`);
  };

  const handleSelectLaporan = (id) => {
    onClose();
    navigate(`/detail-kasus/${id}?tipe=laporan`);
  };

  const handleSelectRelawan = (relawan) => {
    onClose();
    navigate(`/manajemen-user?search=${encodeURIComponent(relawan.nama || '')}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 gap-3 bg-slate-50/50">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nomor kasus (SOS-001, LP-12), nama pelapor, relawan..."
            className="flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {loading && <Loader2 size={16} className="text-emerald-600 animate-spin shrink-0" />}
          {query && !loading && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
            >
              <X size={15} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-400 shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {!query.trim() ? (
            <div className="py-10 text-center">
              <Command size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">Pencarian Cepat Posko</p>
              <p className="text-xs text-slate-400 mt-1">
                Ketik nomor tiket, ID kasus, nama pelapor, atau nomor telepon untuk mencari lintas sistem.
              </p>
            </div>
          ) : totalResults === 0 && !loading ? (
            <div className="py-10 text-center text-slate-400">
              <p className="text-sm font-medium">Tidak ada hasil ditemukan untuk &ldquo;{query}&rdquo;</p>
              <p className="text-xs mt-1">Coba gunakan kata kunci lain atau periksa ejaan.</p>
            </div>
          ) : (
            <>
              {/* 1. Kategori Kasus Darurat SOS */}
              {results?.kasus_sos?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-red-600 uppercase tracking-wider">
                    <AlertTriangle size={12} />
                    <span>Darurat SOS ({results.kasus_sos.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.kasus_sos.map((sos) => (
                      <div
                        key={sos.id}
                        onClick={() => handleSelectSos(sos.id)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-red-100 hover:border-red-300 hover:bg-red-50/50 cursor-pointer transition-all group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-red-700">
                              {sos.nomor_kasus || `SOS-${sos.id}`}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase bg-red-100 text-red-700">
                              {sos.status || 'Aktif'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                            Pelapor: {sos.pelapor || 'Warga SOS'} &middot; Disabilitas: {sos.disabilitas || 'Umum'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{sos.lokasi || '-'}</p>
                        </div>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-red-600 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Kategori Laporan Bantuan */}
              {results?.laporan?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                    <FileText size={12} />
                    <span>Laporan Bantuan ({results.laporan.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.laporan.map((lap) => (
                      <div
                        key={lap.id}
                        onClick={() => handleSelectLaporan(lap.id)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-amber-100 hover:border-amber-300 hover:bg-amber-50/50 cursor-pointer transition-all group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-amber-700">
                              {lap.nomor_kasus || `LP-${lap.id}`}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase bg-amber-100 text-amber-700">
                              {lap.status || 'Aktif'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                            {lap.kategori ? `${lap.kategori} &middot; ` : ''}Pelapor: {lap.pelapor || 'Warga'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{lap.lokasi || '-'}</p>
                        </div>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-amber-600 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Kategori Relawan */}
              {results?.relawan?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    <Shield size={12} />
                    <span>Relawan Lapangan ({results.relawan.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.relawan.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => handleSelectRelawan(rel)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer transition-all group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{rel.nama}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-100 text-emerald-800">
                              {rel.status === 'siaga' || rel.status === 'tersedia' ? 'Siaga' : 'Bertugas'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {rel.pekerjaan || 'Relawan Pendamping'} &middot; Telp: {rel.no_telp || '-'}
                          </p>
                        </div>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-700 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Kategori Pengguna / Warga */}
              {results?.pengguna?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <User size={12} />
                    <span>Pengguna Difabel / Warga ({results.pengguna.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.pengguna.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-xs text-slate-900">{user.nama}</span>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            Kategori: {user.kategori} &middot; Telp: {user.no_telp || '-'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{user.alamat || '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tekan <strong>ESC</strong> untuk menutup</span>
          <span>Sahabat SOS Command Search</span>
        </div>
      </div>
    </div>
  );
}
