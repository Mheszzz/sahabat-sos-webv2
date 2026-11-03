import { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft, MapPin, AlertTriangle, RefreshCw, Loader2, X,
  Volume2, Image as ImageIcon, FileText, ExternalLink, Maximize2
} from 'lucide-react';
import DetailSosMap from '../../components/DetailSosMap';
import DetailKasusHeader from '../../components/detail-kasus/DetailKasusHeader';
import ProfilKorbanCard from '../../components/detail-kasus/ProfilKorbanCard';
import KontakDaruratList from '../../components/detail-kasus/KontakDaruratList';
import TelemetriCard from '../../components/detail-kasus/TelemetriCard';
import PenugasanRelawanCard from '../../components/detail-kasus/PenugasanRelawanCard';
import AktivitasConsoleTab from '../../components/detail-kasus/AktivitasConsoleTab';
import SelesaiKasusModal from '../../components/detail-kasus/SelesaiKasusModal';
import { useDetailKasus } from '../../hooks/detail-kasus/useDetailKasus';
import { calculateHaversineDistanceKm, formatDistance } from '../../utils/geoHelper';

// Sub-komponen Toast Umpan Balik
function FeedbackToast({ feedback }) {
  if (!feedback) return null;
  const isSuccess = feedback.type === 'success';
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-xl border text-[12px] font-bold transition-all animate-fade-in ${
        isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      <span>{feedback.message}</span>
    </div>
  );
}

// Sub-komponen Bukti Media
function BuktiMediaCard({ kasus, setPreviewImage }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <FileText size={13} className="text-[#0b6f61]" />
          Bukti Kejadian (Foto &amp; Audio)
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-3 pr-1">
        {/* Foto Lampiran Bukti */}
        {kasus.foto_laporan_url ? (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1 mb-1">
              <ImageIcon size={11} /> Foto Tempat Kejadian:
            </span>
            <div
              role="button"
              tabIndex={0}
              aria-label="Perbesar foto bukti tempat kejadian"
              onClick={() => setPreviewImage(kasus.foto_laporan_url)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setPreviewImage(kasus.foto_laporan_url);
                }
              }}
              className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-28 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
            >
              <img
                src={kasus.foto_laporan_url}
                alt="Bukti Kejadian"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1.5">
                <Maximize2 size={13} />
                <span>Perbesar Foto</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl border border-dashed border-slate-200 text-center text-slate-500 text-[11px]">
            Tidak ada foto bukti terlampir
          </div>
        )}

        {/* Rekaman Suara Pelapor */}
        {kasus.rekam_suara_url ? (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1 mb-1">
              <Volume2 size={11} /> Rekaman Suara Pelapor:
            </span>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <audio controls className="w-full h-8 outline-none" aria-label="Pemutar audio rekaman suara pelapor">
                <source src={kasus.rekam_suara_url} />
                Audio tidak didukung di browser ini.
              </audio>
            </div>
          </div>
        ) : (
          <div className="p-2 rounded-xl border border-dashed border-slate-200 text-center text-slate-500 text-[11px]">
            Tidak ada rekaman audio terlampir
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-komponen Lightbox Foto Bukti
function ImageLightbox({ src, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!src) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tampilan penuh foto bukti kejadian"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-zoom-out"
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-black/40 rounded-2xl overflow-hidden p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pratinjau gambar"
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X size={16} />
        </button>
        <img src={src} alt="Bukti Laporan Penuh" className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain mx-auto" />
      </div>
    </div>
  );
}

/**
 * DetailKasusPage
 * Halaman Konsol Pusat Komando Insiden Darurat SOS & Laporan Warga.
 * Terstruktur dalam 3 kolom modular dengan sub-komponen terpisah di src/components/detail-kasus/.
 */
export default function DetailKasusPage() {
  const {
    kasus,
    activities,
    relawanList,
    loadingKasus,
    loadingActivities,
    loadingRelawan,
    loadingDispatch,
    loadingSelesai,
    loadingTangani,
    errorKasus,
    selectedRelawanId,
    setSelectedRelawanId,
    showDispatchPanel,
    setShowDispatchPanel,
    showSelesaiModal,
    setShowSelesaiModal,
    catatanSelesai,
    setCatatanSelesai,
    feedback,
    navigate,
    fetchKasus,
    handleDispatch,
    handleTanganiKasus,
    handleSelesai,
    handleLogAksi,
    handleOpenDispatchPanel,
  } = useDetailKasus();

  const [previewImage, setPreviewImage] = useState(null);
  const [rightTab, setRightTab] = useState('log'); // 'log' | 'catatan'
  const [centerTab, setCenterTab] = useState('peta'); // 'peta' | 'media'

  const handleSelectRelawan = useCallback((volId) => {
    setSelectedRelawanId(volId);
    setShowDispatchPanel(true);
  }, [setSelectedRelawanId, setShowDispatchPanel]);

  const isSos = kasus?._tipe === 'sos' ||
    kasus?.kategori === 'SOS' ||
    kasus?.kategori_laporan?.toLowerCase().includes('sos') ||
    kasus?.jenis_laporan?.toLowerCase().includes('sos');
  const pengguna = kasus?.pengguna ?? null;
  const kontakDarurat = Array.isArray(pengguna?.kontak_darurat) ? pengguna.kontak_darurat : [];
  const relawanBertugas = kasus?.relawan ?? null;

  // Standarisasi pengecekan status selesai
  const statusRaw = (kasus?.status || '').toLowerCase().trim();
  const isSelesai = ['selesai', 'batal'].includes(statusRaw);
  const isKasusSelesai = isSelesai;
  const isDitangani = statusRaw === 'ditangani' || statusRaw === 'proses' || statusRaw === 'sedang ditangani';
  const isBelumDitangani = statusRaw === 'belum ditangani' || statusRaw === 'menunggu';

  // Hitung jarak antara lokasi kejadian dan relawan bertugas jika keduanya memiliki koordinat valid
  const assignedFromList = relawanList.find((r) => r.id === relawanBertugas?.id);
  const vLat = parseFloat(relawanBertugas?.latitude ?? assignedFromList?.latitude);
  const vLng = parseFloat(relawanBertugas?.longitude ?? assignedFromList?.longitude);
  const kLat = parseFloat(kasus?.latitude ?? kasus?.lat);
  const kLng = parseFloat(kasus?.longitude ?? kasus?.lng);
  const hasGpsCoords = !Number.isNaN(kLat) && !Number.isNaN(kLng) && (kLat !== 0 || kLng !== 0);
  const hasBothCoords = !Number.isNaN(vLat) && !Number.isNaN(vLng) && hasGpsCoords && (vLat !== 0 || vLng !== 0);

  const relawanDistanceText = hasBothCoords
    ? formatDistance(calculateHaversineDistanceKm(kLat, kLng, vLat, vLng))
    : null;

  // Tampilan Memuat Data
  if (loadingKasus) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)] gap-3 text-slate-500">
        <Loader2 size={26} className="animate-spin text-[#0b6f61]" />
        <p className="text-[13px] font-bold">Memuat konsol komando kasus...</p>
      </div>
    );
  }

  // Tampilan Galat
  if (errorKasus || !kasus) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)] gap-4 text-slate-500 p-6">
        <AlertTriangle size={36} className="text-rose-500" />
        <p className="text-[14px] font-bold text-slate-800">{errorKasus || 'Data kasus tidak ditemukan.'}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-base btn-secondary text-[12px] h-8.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
          >
            <ArrowLeft size={13} /> Kembali
          </button>
          <button
            type="button"
            onClick={fetchKasus}
            className="btn-base btn-primary text-[12px] h-8.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
          >
            <RefreshCw size={13} /> Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-auto lg:h-[calc(100vh-130px)] lg:max-h-[calc(100vh-130px)] min-h-0 w-full gap-2.5 overflow-y-auto lg:overflow-hidden text-slate-800 animate-fade-in print-report-container">
      <div className="no-print">
        <FeedbackToast feedback={feedback} />
        {previewImage && <ImageLightbox src={previewImage} onClose={() => setPreviewImage(null)} />}
        {showSelesaiModal && (
          <SelesaiKasusModal
            kasus={kasus}
            catatanSelesai={catatanSelesai}
            setCatatanSelesai={setCatatanSelesai}
            loadingSelesai={loadingSelesai}
            onConfirm={handleSelesai}
            onClose={() => setShowSelesaiModal(false)}
          />
        )}
      </div>

      {/* Baris 1: Header Konsol Komando */}
      <DetailKasusHeader
        kasus={kasus}
        isSos={isSos}
        isKasusSelesai={isKasusSelesai}
        isDitangani={isDitangani}
        isBelumDitangani={isBelumDitangani}
        relawanBertugas={relawanBertugas}
        loadingTangani={loadingTangani}
        onBack={() => navigate(-1)}
        onTanganiKasus={handleTanganiKasus}
        onOpenSelesaiModal={() => setShowSelesaiModal(true)}
      />

      {/* Baris 2: Grid Komando 3 Kolom */}
      <div className="flex-1 min-h-0 overflow-visible lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-2.5 pb-4 lg:pb-0">
        {/* Kolom 1: Profil Korban & Kontak Darurat */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-2.5 min-h-0 overflow-visible lg:overflow-hidden">
          <ProfilKorbanCard
            pengguna={pengguna}
            onLogAksi={handleLogAksi}
          />
          <KontakDaruratList
            kontakDarurat={kontakDarurat}
            onLogAksi={handleLogAksi}
          />
        </div>

        {/* Kolom 2: Insiden, Lokasi & Bukti Media */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-2.5 min-h-0 overflow-visible lg:overflow-hidden">
          {/* Subcard 1: Lokasi & Deskripsi Kejadian */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs shrink-0 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin size={13} className="text-rose-500" />
                Lokasi &amp; Informasi Kejadian
              </span>
              {((kasus.latitude || kasus.lat) && (kasus.longitude || kasus.lng)) ? (
                <a
                  href={`https://www.google.com/maps?q=${kasus.latitude ?? kasus.lat},${kasus.longitude ?? kasus.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Buka koordinat lokasi di Google Maps"
                  className="text-[10.5px] font-bold text-[#0b6f61] hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] rounded"
                >
                  <ExternalLink size={10} />
                  Buka Maps
                </a>
              ) : null}
            </div>

            <div>
              <p className="text-[12.5px] font-black text-slate-900 leading-snug">
                {kasus.lokasi_laporan || kasus.lokasi?.alamat || 'Lokasi Panggilan Darurat'}
              </p>
              {(kasus.latitude || kasus.lat) && (kasus.longitude || kasus.lng) ? (
                <p className="font-mono text-[10.5px] text-slate-500 mt-0.5">
                  Koordinat: {kasus.latitude ?? kasus.lat}, {kasus.longitude ?? kasus.lng}
                </p>
              ) : (
                <p className="text-[10.5px] text-amber-700 italic mt-0.5 flex items-center gap-1">
                  <AlertTriangle size={11} className="text-amber-500" />
                  Koordinat GPS tidak tersedia untuk kasus ini
                </p>
              )}
            </div>

            {kasus.deskripsi && (
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11.5px] text-slate-700 leading-relaxed max-h-20 overflow-y-auto">
                <span className="text-[10px] font-bold uppercase text-slate-600 block mb-0.5">Deskripsi Masalah:</span>
                {kasus.deskripsi}
              </div>
            )}
          </div>

          {/* Subcard 2: Peta Lokasi ATAU Bukti Media */}
          {isSos ? (
            <DetailSosMap
              kasus={kasus}
              relawanBertugas={relawanBertugas}
              relawanList={relawanList}
              onSelectRelawan={handleSelectRelawan}
            />
          ) : hasGpsCoords ? (
            <div className="flex-1 min-h-0 flex flex-col gap-2">
              {/* Tab Selector Peta vs Bukti Media */}
              <div
                role="tablist"
                aria-label="Pilihan tampilan peta atau bukti media"
                className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0 no-print"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={centerTab === 'peta'}
                  onClick={() => setCenterTab('peta')}
                  className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                    centerTab === 'peta' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapPin size={12} className={centerTab === 'peta' ? 'text-[#0b6f61]' : ''} />
                  <span>Peta &amp; Relawan Sekitar</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={centerTab === 'media'}
                  onClick={() => setCenterTab('media')}
                  className={`flex-1 py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                    centerTab === 'media' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText size={12} className={centerTab === 'media' ? 'text-[#0b6f61]' : ''} />
                  <span>Bukti Media</span>
                </button>
              </div>

              {centerTab === 'peta' ? (
                <DetailSosMap
                  kasus={kasus}
                  relawanBertugas={relawanBertugas}
                  relawanList={relawanList}
                  onSelectRelawan={handleSelectRelawan}
                />
              ) : (
                <BuktiMediaCard kasus={kasus} setPreviewImage={setPreviewImage} />
              )}
            </div>
          ) : (
            <BuktiMediaCard kasus={kasus} setPreviewImage={setPreviewImage} />
          )}

          {/* Subcard 3: Telemetri Perangkat Korban & IoT Tuya (Khusus SOS) */}
          <TelemetriCard deviceInfo={kasus.device_info} isSos={isSos} />
        </div>

        {/* Kolom 3: Respon Relawan & Linimasa Konsol */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-2.5 min-h-0 overflow-visible lg:overflow-hidden">
          <PenugasanRelawanCard
            relawanBertugas={relawanBertugas}
            relawanDistanceText={relawanDistanceText}
            isSelesai={isSelesai}
            showDispatchPanel={showDispatchPanel}
            setShowDispatchPanel={setShowDispatchPanel}
            relawanList={relawanList}
            loadingRelawan={loadingRelawan}
            selectedRelawanId={selectedRelawanId}
            setSelectedRelawanId={setSelectedRelawanId}
            loadingDispatch={loadingDispatch}
            onDispatch={handleDispatch}
            onOpenDispatchPanel={handleOpenDispatchPanel}
            onLogAksi={handleLogAksi}
          />
          <AktivitasConsoleTab
            activities={activities}
            loadingActivities={loadingActivities}
            catatanPenanganan={kasus.catatan_penanganan}
            rightTab={rightTab}
            setRightTab={setRightTab}
          />
        </div>
      </div>
    </div>
  );
}
