import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Edit2,
  Database,
  MessageSquare,
  Power,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Palette,
  X,
  Layers,
  Save
} from 'lucide-react';
import { masterDataService } from '../../api/services/masterDataService';
import PageHeader from '../../components/global/PageHeader';

const PRESET_COLORS = [
  { name: 'Merah Darurat', hex: '#D32F2F' },
  { name: 'Oranye Bahaya', hex: '#E65100' },
  { name: 'Biru Pendamping', hex: '#1565C0' },
  { name: 'Sian Navigasi', hex: '#00838F' },
  { name: 'Ungu Aksesibilitas', hex: '#6A1B9A' },
  { name: 'Hijau Relawan', hex: '#10B981' },
  { name: 'Abu-Abu Umum', hex: '#546E7A' },
  { name: 'Amber Waspada', hex: '#F59E0B' },
];

const PRESET_ICONS = [
  { label: 'Medis / Obat', value: 'medis' },
  { label: 'Pendamping', value: 'pendamping' },
  { label: 'Bahaya / Darurat', value: 'bahaya' },
  { label: 'Tersesat / Peta', value: 'tersesat' },
  { label: 'Aksesibilitas', value: 'aksesibilitas' },
  { label: 'Kebakaran', value: 'kebakaran' },
  { label: 'Bencana Alam', value: 'bencana' },
  { label: 'Kecelakaan', value: 'kecelakaan' },
  { label: 'Umum / Lainnya', value: 'lainnya' },
];

export default function MasterDataPage() {
  const { currentUser } = useOutletContext() || {};

  const [kategoriList, setKategoriList] = useState([]);
  const [pesanCepatList, setPesanCepatList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'info', message: '' }

  // Form Tambah Kategori
  const [showAddKategori, setShowAddKategori] = useState(false);
  const [newKatTitle, setNewKatTitle] = useState('');
  const [newKatSubtitle, setNewKatSubtitle] = useState('');
  const [newKatColor, setNewKatColor] = useState('#D32F2F');
  const [newKatIcon, setNewKatIcon] = useState('medis');
  const [isSubmittingKat, setIsSubmittingKat] = useState(false);

  // Form Edit Kategori
  const [editingKategori, setEditingKategori] = useState(null);
  const [editKatTitle, setEditKatTitle] = useState('');
  const [editKatSubtitle, setEditKatSubtitle] = useState('');
  const [editKatColor, setEditKatColor] = useState('#D32F2F');
  const [editKatIcon, setEditKatIcon] = useState('medis');
  const [editKatActive, setEditKatActive] = useState(true);
  const [isUpdatingKat, setIsUpdatingKat] = useState(false);

  // Form Tambah & Edit Pesan
  const [newPesan, setNewPesan] = useState('');
  const [isSubmittingPesan, setIsSubmittingPesan] = useState(false);
  const [editingPesanId, setEditingPesanId] = useState(null);
  const [editPesanText, setEditPesanText] = useState('');

  // Hak Akses
  const isSuperAdmin = (currentUser?.role || '').toLowerCase() === 'superadmin' || currentUser?.role === 'Super Admin';
  const hasKelolaAdmin = Array.isArray(currentUser?.permissions) && currentUser.permissions.includes('kelola_admin');

  const fetchMasterData = async () => {
    setIsLoading(true);
    try {
      const [resKat, resPes] = await Promise.all([
        masterDataService.getKategori(),
        masterDataService.getPesanCepat(),
      ]);
      if (resKat?.data) setKategoriList(resKat.data);
      if (resPes?.data) setPesanCepatList(resPes.data);
    } catch (error) {
      console.error('Gagal mengambil master data:', error);
      setFeedback({ type: 'error', message: 'Gagal memuat master data dari server.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin || hasKelolaAdmin) {
      fetchMasterData();
    }
  }, [isSuperAdmin, hasKelolaAdmin]);

  // Auto-dismiss feedback message after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  if (!isSuperAdmin && !hasKelolaAdmin) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} />
        </div>
        <h1 className="text-2xl font-black text-slate-900">403 - Akses Ditolak</h1>
        <p className="text-slate-500 mt-2 text-[14px]">
          Halaman Master Data hanya dapat diakses oleh Super Admin atau Administrator dengan hak akses <strong>Kelola Administrator</strong>.
        </p>
      </div>
    );
  }

  // --- KATEGORI HANDLERS ---

  const handleAddKategori = async (e) => {
    e.preventDefault();
    if (!newKatTitle.trim()) return;

    try {
      setIsSubmittingKat(true);
      await masterDataService.createKategori({
        title: newKatTitle.trim(),
        subtitle: newKatSubtitle.trim() || undefined,
        color: newKatColor,
        icon: newKatIcon,
        is_active: true,
      });

      setNewKatTitle('');
      setNewKatSubtitle('');
      setShowAddKategori(false);
      setFeedback({ type: 'success', message: `Kategori '${newKatTitle}' berhasil ditambahkan.` });
      fetchMasterData();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Gagal menambahkan kategori laporan.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmittingKat(false);
    }
  };

  const handleStartEditKategori = (item) => {
    setEditingKategori(item);
    setEditKatTitle(item.title || item.nama || '');
    setEditKatSubtitle(item.subtitle || '');
    setEditKatColor(item.color || '#546E7A');
    setEditKatIcon(item.icon || 'lainnya');
    setEditKatActive(item.is_active !== false);
  };

  const handleSaveEditKategori = async (e) => {
    e.preventDefault();
    if (!editingKategori || !editKatTitle.trim()) return;

    try {
      setIsUpdatingKat(true);
      await masterDataService.updateKategori(editingKategori.id, {
        title: editKatTitle.trim(),
        subtitle: editKatSubtitle.trim(),
        color: editKatColor,
        icon: editKatIcon,
        is_active: editKatActive,
      });

      setFeedback({ type: 'success', message: `Kategori '${editKatTitle}' berhasil diperbarui.` });
      setEditingKategori(null);
      fetchMasterData();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Gagal memperbarui kategori laporan.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsUpdatingKat(false);
    }
  };

  const handleToggleKategoriStatus = async (item) => {
    try {
      const newStatus = item.is_active === false ? true : false;
      await masterDataService.updateKategori(item.id, { is_active: newStatus });
      setFeedback({
        type: 'info',
        message: `Kategori '${item.title}' ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`
      });
      fetchMasterData();
    } catch (error) {
      setFeedback({ type: 'error', message: 'Gagal mengubah status kategori.' });
    }
  };

  const handleDeleteKategori = async (item) => {
    if (!window.confirm(`Hapus kategori '${item.title}'? Jika telah ada laporan terkait, kategori akan otomatis dinonaktifkan alih-alih dihapus permanen.`)) {
      return;
    }

    try {
      const res = await masterDataService.deleteKategori(item.id);
      setFeedback({
        type: res?.is_active === false ? 'info' : 'success',
        message: res?.message || 'Kategori berhasil diproses.'
      });
      fetchMasterData();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Gagal menghapus kategori.';
      setFeedback({ type: 'error', message: msg });
    }
  };

  // --- PESAN CEPAT HANDLERS ---

  const handleAddPesan = async (e) => {
    e.preventDefault();
    if (!newPesan.trim()) return;

    try {
      setIsSubmittingPesan(true);
      await masterDataService.createPesanCepat({
        pesan: newPesan.trim(),
        is_active: true,
      });
      setNewPesan('');
      setFeedback({ type: 'success', message: 'Pesan cepat berhasil ditambahkan.' });
      fetchMasterData();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Gagal menambahkan pesan cepat.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmittingPesan(false);
    }
  };

  const handleSaveEditPesan = async (id) => {
    if (!editPesanText.trim()) return;
    try {
      await masterDataService.updatePesanCepat(id, { pesan: editPesanText.trim() });
      setEditingPesanId(null);
      setFeedback({ type: 'success', message: 'Pesan cepat berhasil diperbarui.' });
      fetchMasterData();
    } catch (error) {
      setFeedback({ type: 'error', message: 'Gagal memperbarui pesan cepat.' });
    }
  };

  const handleTogglePesanStatus = async (item) => {
    try {
      const newStatus = item.is_active === false ? true : false;
      await masterDataService.updatePesanCepat(item.id, { is_active: newStatus });
      setFeedback({
        type: 'info',
        message: `Pesan cepat ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`
      });
      fetchMasterData();
    } catch (error) {
      setFeedback({ type: 'error', message: 'Gagal mengubah status pesan cepat.' });
    }
  };

  const handleDeletePesan = async (id) => {
    if (!window.confirm('Hapus template pesan cepat ini?')) return;
    try {
      await masterDataService.deletePesanCepat(id);
      setFeedback({ type: 'success', message: 'Pesan cepat berhasil dihapus.' });
      fetchMasterData();
    } catch (error) {
      setFeedback({ type: 'error', message: 'Gagal menghapus pesan cepat.' });
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1680px] w-full mx-auto relative">
      <PageHeader
        title="Master Data Laporan & Konfigurasi"
        description="Kelola kategori laporan darurat, parameter warna/ikon seluler, serta template pesan cepat instan."
      />

      {/* Notifikasi Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-[13px] animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : feedback.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' && <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
            {feedback.type === 'info' && <CheckCircle2 size={16} className="text-blue-600 shrink-0" />}
            {feedback.type === 'error' && <AlertTriangle size={16} className="text-red-600 shrink-0" />}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================================= */}
        {/* PANEL 1: KATEGORI LAPORAN DARURAT */}
        {/* ========================================================================= */}
        <div className="bg-white border border-[#eaedf1] rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Database size={18} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Kategori Laporan Darurat</h2>
                <p className="text-[12px] text-slate-500">Tersinkronisasi langsung ke aplikasi mobile pengguna</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddKategori(!showAddKategori)}
              className="flex items-center gap-1.5 px-3 h-8.5 rounded-xl bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>{showAddKategori ? 'Tutup Form' : 'Tambah Kategori'}</span>
            </button>
          </div>

          {/* Form Tambah Kategori */}
          {showAddKategori && (
            <form onSubmit={handleAddKategori} className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 mb-4 space-y-3 animate-fade-in">
              <h3 className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
                <Layers size={14} className="text-emerald-600" /> Tambah Kategori Baru
              </h3>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Judul Kategori *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kebakaran Rumah / Lahan"
                  value={newKatTitle}
                  onChange={(e) => setNewKatTitle(e.target.value)}
                  className="w-full px-3 h-9 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Subjudul / Keterangan Cepat (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Pemadam & Evakuasi Cepat"
                  value={newKatSubtitle}
                  onChange={(e) => setNewKatSubtitle(e.target.value)}
                  className="w-full px-3 h-9 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Warna Penanda</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newKatColor}
                      onChange={(e) => setNewKatColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-200 p-0.5 cursor-pointer bg-white"
                    />
                    <select
                      value={newKatColor}
                      onChange={(e) => setNewKatColor(e.target.value)}
                      className="flex-1 px-2.5 h-9 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700"
                    >
                      {PRESET_COLORS.map((c) => (
                        <option key={c.hex} value={c.hex}>{c.name} ({c.hex})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Ikon Tampilan Mobile</label>
                  <select
                    value={newKatIcon}
                    onChange={(e) => setNewKatIcon(e.target.value)}
                    className="w-full px-3 h-9 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700"
                  >
                    {PRESET_ICONS.map((ic) => (
                      <option key={ic.value} value={ic.value}>{ic.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddKategori(false)}
                  className="px-3 h-8.5 rounded-lg bg-slate-200/80 text-slate-700 text-[12px] font-semibold hover:bg-slate-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingKat || !newKatTitle.trim()}
                  className="px-4 h-8.5 rounded-lg bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingKat ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  <span>Simpan Kategori</span>
                </button>
              </div>
            </form>
          )}

          {/* Modal / Dialog Edit Kategori */}
          {editingKategori && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Edit2 size={16} />
                    </div>
                    <h3 className="text-[15px] font-bold text-slate-900">Edit Kategori Laporan</h3>
                  </div>
                  <button
                    onClick={() => setEditingKategori(null)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveEditKategori} className="space-y-3.5">
                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 block mb-1">Kode / Slug ID</label>
                    <input
                      type="text"
                      disabled
                      value={editingKategori.id}
                      className="w-full px-3 h-9 bg-slate-100 border border-slate-200 rounded-lg text-[12px] font-mono text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 block mb-1">Judul Kategori *</label>
                    <input
                      type="text"
                      required
                      value={editKatTitle}
                      onChange={(e) => setEditKatTitle(e.target.value)}
                      className="w-full px-3 h-9 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-semibold text-slate-700 block mb-1">Subjudul / Deskripsi Singkat</label>
                    <input
                      type="text"
                      value={editKatSubtitle}
                      onChange={(e) => setEditKatSubtitle(e.target.value)}
                      className="w-full px-3 h-9 bg-white border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] font-semibold text-slate-700 block mb-1">Warna Penanda</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editKatColor}
                          onChange={(e) => setEditKatColor(e.target.value)}
                          className="w-9 h-9 rounded-lg border border-slate-200 p-0.5 cursor-pointer bg-white"
                        />
                        <input
                          type="text"
                          value={editKatColor}
                          onChange={(e) => setEditKatColor(e.target.value)}
                          className="w-full px-2 h-9 bg-white border border-slate-200 rounded-lg text-[11px] font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[12px] font-semibold text-slate-700 block mb-1">Ikon Tampilan</label>
                      <select
                        value={editKatIcon}
                        onChange={(e) => setEditKatIcon(e.target.value)}
                        className="w-full px-2.5 h-9 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700"
                      >
                        {PRESET_ICONS.map((ic) => (
                          <option key={ic.value} value={ic.value}>{ic.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="editKatActive"
                      checked={editKatActive}
                      onChange={(e) => setEditKatActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="editKatActive" className="text-[13px] font-semibold text-slate-700 cursor-pointer">
                      Kategori Aktif (Dapat dipilih oleh pengguna di aplikasi mobile)
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingKategori(null)}
                      className="px-4 h-9.5 rounded-xl bg-slate-100 text-slate-700 text-[13px] font-semibold hover:bg-slate-200 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingKat || !editKatTitle.trim()}
                      className="px-5 h-9.5 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isUpdatingKat ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      <span>Simpan Perubahan</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Daftar Kategori */}
          <div className="flex-1 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 size={24} className="animate-spin mx-auto mb-2 text-emerald-600" />
                <p className="text-[13px]">Memuat data kategori...</p>
              </div>
            ) : kategoriList.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Database size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-[13px]">Belum ada kategori laporan darurat.</p>
              </div>
            ) : (
              kategoriList.map((item) => {
                const isActive = item.is_active !== false;
                const itemColor = item.color || '#546E7A';

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3.5 border rounded-xl transition-all ${
                      isActive ? 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300' : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      {/* Color marker */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white shadow-xs"
                        style={{ backgroundColor: itemColor }}
                        title={`Warna: ${itemColor}`}
                      >
                        <Palette size={14} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[13.5px] font-bold text-slate-800 truncate">
                            {item.title || item.nama}
                          </p>
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                              isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                            }`}
                          >
                            {isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-slate-500 truncate mt-0.5">
                          {item.subtitle || <span className="italic text-slate-400">Tanpa subjudul</span>} • <span className="font-mono text-slate-400">{item.id}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Toggle status */}
                      <button
                        onClick={() => handleToggleKategoriStatus(item)}
                        className={`w-7.5 h-7.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                          isActive
                            ? 'border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200'
                            : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                        title={isActive ? 'Nonaktifkan Kategori' : 'Aktifkan Kategori'}
                      >
                        <Power size={13} />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleStartEditKategori(item)}
                        className="w-7.5 h-7.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 flex items-center justify-center transition-colors cursor-pointer"
                        title="Edit Data Kategori"
                      >
                        <Edit2 size={13} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteKategori(item)}
                        className="w-7.5 h-7.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 flex items-center justify-center transition-colors cursor-pointer"
                        title="Hapus Kategori (Akan dinonaktifkan otomatis jika riwayat laporan ada)"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANEL 2: PESAN CEPAT (QUICK MESSAGES) */}
        {/* ========================================================================= */}
        <div className="bg-white border border-[#eaedf1] rounded-2xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MessageSquare size={18} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Pesan Cepat (Quick Messages)</h2>
                <p className="text-[12px] text-slate-500">Pesan darurat 1-tap untuk mempercepat proses pelaporan</p>
              </div>
            </div>
          </div>

          {/* Form Tambah Pesan Cepat */}
          <form onSubmit={handleAddPesan} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newPesan}
              onChange={(e) => setNewPesan(e.target.value)}
              placeholder="Ketik pesan cepat darurat baru..."
              className="flex-1 px-3.5 h-10 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isSubmittingPesan || !newPesan.trim()}
              className="px-4 h-10 rounded-xl bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmittingPesan ? <Loader2 size={14} className="animate-spin" /> : <Plus size={15} />}
              <span>Tambah</span>
            </button>
          </form>

          {/* Daftar Pesan Cepat */}
          <div className="flex-1 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-[13px]">Memuat template pesan cepat...</p>
              </div>
            ) : pesanCepatList.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-[13px]">Belum ada template pesan cepat.</p>
              </div>
            ) : (
              pesanCepatList.map((item) => {
                const isActive = item.is_active !== false;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3.5 border rounded-xl transition-all ${
                      isActive ? 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300' : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    {editingPesanId === item.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editPesanText}
                          onChange={(e) => setEditPesanText(e.target.value)}
                          className="flex-1 px-3 h-8.5 bg-white border border-blue-400 rounded-lg text-[13px] focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEditPesan(item.id)}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditPesan(item.id)}
                          className="px-2.5 h-8.5 bg-blue-600 text-white rounded-lg text-[12px] font-semibold hover:bg-blue-700"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPesanId(null)}
                          className="px-2.5 h-8.5 bg-slate-200 text-slate-700 rounded-lg text-[12px] font-semibold hover:bg-slate-300"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          <p className="text-[13px] font-medium text-slate-800 leading-snug">
                            {item.pesan}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Toggle status */}
                          <button
                            onClick={() => handleTogglePesanStatus(item)}
                            className={`w-7.5 h-7.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                              isActive
                                ? 'border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200'
                                : 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                            title={isActive ? 'Nonaktifkan Pesan' : 'Aktifkan Pesan'}
                          >
                            <Power size={13} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingPesanId(item.id);
                              setEditPesanText(item.pesan);
                            }}
                            className="w-7.5 h-7.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 flex items-center justify-center transition-colors cursor-pointer"
                            title="Edit Pesan Cepat"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeletePesan(item.id)}
                            className="w-7.5 h-7.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 flex items-center justify-center transition-colors cursor-pointer"
                            title="Hapus Pesan Cepat"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
