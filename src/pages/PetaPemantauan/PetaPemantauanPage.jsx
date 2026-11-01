import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Phone, Users, MessageCircle,
  MapPin, X, RefreshCw, Search, Info, ExternalLink,
  ChevronDown, ChevronUp, Shield, CheckCircle
} from 'lucide-react';
import ModernEmergencyMap from '../../components/ModernEmergencyMap';
import Badge from '../../components/global/Badge';
import { adminService } from '../../api/services/adminService';
import { useNavigate } from 'react-router-dom';
import echo from '../../api/libs/echo';

// Koordinat Pusat Wilayah D.I. Yogyakarta (Tugu / Malioboro)
const YOGYAKARTA_CENTER = [-7.7956, 110.3695];

// Helper formula Haversine untuk kalkulasi jarak riil (km)
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const l1 = Number(lat1);
  const o1 = Number(lon1);
  const l2 = Number(lat2);
  const o2 = Number(lon2);
  if (Number.isNaN(l1) || Number.isNaN(o1) || Number.isNaN(l2) || Number.isNaN(o2)) return null;

  const R = 6371; // km
  const dLat = ((l2 - l1) * Math.PI) / 180;
  const dLon = ((o2 - o1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((l1 * Math.PI) / 180) *
      Math.cos((l2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistanceText(distKm) {
  if (distKm == null || Number.isNaN(distKm)) return '-';
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
}

function formatEtaText(distKm) {
  if (distKm == null || Number.isNaN(distKm)) return '-';
  // Perkiraan respon kendaraan cepat relawan di Yogyakarta: ~30 km/jam + 2 menit persiapan awal
  const minutes = Math.max(2, Math.round(distKm * 2.2 + 2));
  return `~${minutes} mnt`;
}

export default function PetaPemantauanPage() {
  const navigate = useNavigate();

  // State Peta & Filter
  const [activeFilter, setActiveFilter] = useState('semua'); // 'semua' | 'sos' | 'relawan' | 'laporan'
  const [mapMode, setMapMode] = useState('street'); // 'street' | 'satellite'
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false); // Default false: tertutup sampai kasus SOS diklik atau user membuka panel relawan
  const [selectedSos, setSelectedSos] = useState(null); // Kasus SOS yang sedang aktif dipilih sebagai acuan relawan terdekat
  const [selectedMapItem, setSelectedMapItem] = useState(null); // Item popup yang sedang aktif di peta
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [volunteerStatusFilter, setVolunteerStatusFilter] = useState('siaga'); // 'siaga' | 'semua' | 'bertugas'
  const [volunteerLimit, setVolunteerLimit] = useState(5); // Default 5 relawan terdekat, bisa diperbesar jadi 10
  const [maxRadiusKm, setMaxRadiusKm] = useState(25); // Default radius batas darurat: 25 km (mencegah relawan > 50-60 km muncul)

  // Data State
  const [mapData, setMapData] = useState([]);
  const [rawVolunteers, setRawVolunteers] = useState([]);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [dispatchingId, setDispatchingId] = useState(null);

  const handleDispatchVolunteer = async (vol) => {
    if (!selectedSos || !vol) return;
    try {
      setDispatchingId(vol.id);
      const tipe = selectedSos.type === 'laporan' ? 'laporan' : 'sos';
      await adminService.dispatchRelawan(selectedSos.id, vol.id, tipe);
      setFeedback({
        type: 'success',
        message: `Relawan ${vol.nama} berhasil ditugaskan ke ${selectedSos.displayId || 'kasus'}!`
      });
      setSelectedSos((prev) => (prev ? {
        ...prev,
        status: 'ditangani',
        relawan: vol.nama,
        id_relawan: vol.id,
      } : null));
      fetchMapData();
      window.dispatchEvent(new CustomEvent('kasus-updated'));
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.message || 'Gagal menugaskan relawan.'
      });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setDispatchingId(null);
    }
  };

  // Navigasi detail kasus & profil user
  const onOpenDetail = useCallback((id, type, item) => {
    if (type === 'relawan') {
      const cleanId = String(id).replace(/^REL-/, '');
      const searchParam = item?.relawan || item?.label || item?.pelapor
        ? `?search=${encodeURIComponent(item.relawan || item.label || item.pelapor)}`
        : (cleanId ? `?id=${cleanId}` : '');
      navigate(`/manajemen-user${searchParam}`);
    } else if (type === 'laporan') {
      navigate(`/detail-kasus/${id}?tipe=laporan`);
    } else {
      navigate(`/detail-kasus/${id}?tipe=sos`);
    }
  }, [navigate]);

  // Fetch data kasus aktif & relawan geospasial
  const fetchMapData = useCallback(async () => {
    try {
      setRefreshLoading(true);
      const res = await adminService.getPetaKasus();
      if (res && res.data) {
        const d = res.data;
        const volList = d.posisi_relawan || [];
        const rawSosList = d.titik_darurat_sos || [];
        const rawLaporanList = d.titik_laporan_aktif || [];

        const mappedData = [];

        // 1. Titik Darurat SOS
        rawSosList.forEach(t => {
          let etaStr = '-';
          if (t.latitude && t.longitude) {
            let assignedVol = null;
            if (t.relawan_penangan) {
              assignedVol = volList.find(r => r.nama === t.relawan_penangan);
            }

            if (assignedVol && assignedVol.latitude && assignedVol.longitude) {
              const dist = calculateHaversineDistanceKm(t.latitude, t.longitude, assignedVol.latitude, assignedVol.longitude);
              etaStr = dist ? `${formatEtaText(dist)} (${formatDistanceText(dist)})` : 'Menuju Lokasi';
            } else if (t.relawan_penangan) {
              etaStr = `Ditangani (${t.relawan_penangan})`;
            } else if (volList.length > 0) {
              let minDist = null;
              volList.forEach(v => {
                if (v.latitude && v.longitude) {
                  const dist = calculateHaversineDistanceKm(t.latitude, t.longitude, v.latitude, v.longitude);
                  if (dist !== null && (minDist === null || dist < minDist)) {
                    minDist = dist;
                  }
                }
              });
              etaStr = minDist !== null ? `${formatEtaText(minDist)} (Relawan Terdekat)` : 'Belum Ditugaskan';
            } else {
              etaStr = 'Belum Ditugaskan';
            }
          }

          const alamatRiil = t.alamat || t.lokasi || (t.latitude && t.longitude ? `Koordinat: ${Number(t.latitude).toFixed(4)}, ${Number(t.longitude).toFixed(4)}` : 'D.I. Yogyakarta');

          mappedData.push({
            id: t.id,
            displayId: t.id_kasus,
            type: 'sos',
            label: t.id_kasus,
            kategori: 'Darurat SOS (' + (t.jenis_disabilitas || 'Umum') + ')',
            prioritas: (t.status === 'aktif' || t.status === 'belum ditangani') ? 'DARURAT' : 'Ditangani',
            pelapor: t.korban || 'Warga SOS',
            lokasi: alamatRiil,
            status: t.status,
            relawan: t.relawan_penangan || 'Menunggu Penugasan',
            eta: etaStr,
            lat: t.latitude,
            lng: t.longitude,
            waktu: t.waktu_sos || 'Baru saja'
          });
        });

        // 2. Titik Laporan Aktif
        rawLaporanList.forEach(l => {
          let etaStr = '-';
          if (l.latitude && l.longitude) {
            let assignedVol = null;
            if (l.relawan_penangan) {
              assignedVol = volList.find(r => r.nama === l.relawan_penangan);
            }

            if (assignedVol && assignedVol.latitude && assignedVol.longitude) {
              const dist = calculateHaversineDistanceKm(l.latitude, l.longitude, assignedVol.latitude, assignedVol.longitude);
              etaStr = dist ? `${formatEtaText(dist)} (${formatDistanceText(dist)})` : 'Menuju Lokasi';
            } else if (l.relawan_penangan || l.status === 'ditangani' || l.status === 'proses') {
              etaStr = l.relawan_penangan ? `Ditangani (${l.relawan_penangan})` : 'Sedang Ditangani';
            } else {
              etaStr = 'Menunggu Penugasan';
            }
          }

          const alamatRiil = l.lokasi_laporan || l.alamat || l.lokasi || (l.latitude && l.longitude ? `Koordinat: ${Number(l.latitude).toFixed(4)}, ${Number(l.longitude).toFixed(4)}` : 'D.I. Yogyakarta');

          mappedData.push({
            id: l.id,
            displayId: l.id_laporan,
            type: 'laporan',
            label: l.id_laporan,
            kategori: l.kategori || 'Laporan Pengguna',
            prioritas: l.urgensi === 'sedang' ? 'Prioritas Sedang' : 'Rendah',
            pelapor: l.pelapor || 'Warga Pelapor',
            lokasi: alamatRiil,
            status: l.status,
            relawan: l.relawan_penangan || 'Menunggu Penugasan',
            eta: etaStr,
            lat: l.latitude,
            lng: l.longitude,
            waktu: l.waktu_laporan || 'Baru saja'
          });
        });

        // 3. Titik Relawan Siaga & Bertugas
        volList.forEach(r => {
          const lokasiRiil = r.lokasi_user ? r.lokasi_user.replace(/Posko\s+/gi, '').trim() : 'Area Siaga D.I. Yogyakarta';
          const isBertugas = r.status === 'sedang_bertugas' || r.status === 'dalam_misi' || Boolean(r.misi && (r.misi.id || r.misi.id_kasus));
          mappedData.push({
            id: 'REL-' + r.id,
            displayId: r.nama,
            type: 'relawan',
            label: r.nama,
            kategori: r.kompetensi || 'Relawan Siaga',
            prioritas: isBertugas ? 'Bertugas' : 'Siaga',
            pelapor: 'Unit Relawan',
            lokasi: lokasiRiil,
            status: isBertugas ? 'Sedang Bertugas' : 'Siaga Aktif',
            relawan: r.nama,
            eta: isBertugas ? 'Menuju Lokasi' : 'Siaga Aktif',
            lat: r.latitude,
            lng: r.longitude,
            waktu: 'Real-time GPS',
            kontak: r.no_telp,
            misi: r.misi || null
          });
        });

        setMapData(mappedData);
        setRawVolunteers(volList);
      }
    } catch (err) {
      console.error('Gagal mengambil data peta pemantauan:', err);
    } finally {
      setRefreshLoading(false);
    }
  }, []);

  // ─── Kalkulasi Relawan Dinamis Terhadap Kasus SOS yang Dipilih ──────────────
  // Aturan Logika:
  // 1. Jika ada kasus SOS yang diklik (selectedSos):
  //    - Hitung jarak geodesik riil (Haversine) dari setiap relawan ke titik kasus SOS tersebut.
  //    - Urutkan (sort) daftar relawan dari yang paling dekat ke titik SOS (distKm terkecil).
  //    - Tampilkan label jarak spesifik, e.g. "189 m ke SOS-2" & "ETA ~2 mnt".
  // 2. Jika BELUM ada kasus SOS yang diklik (selectedSos == null):
  //    - Tampilkan daftar relawan umum se-wilayah DIY.
  //    - JANGAN tampilkan label "... ke SOS" palsu/acak karena belum ada titik acuan darurat.
  const volunteers = useMemo(() => {
    const colors = ['bg-[#0ea5e9]', 'bg-[#10b981]', 'bg-[#f59e0b]', 'bg-[#8b5cf6]', 'bg-[#ec4899]'];

    const sosLat = selectedSos?.lat ?? selectedSos?.latitude;
    const sosLng = selectedSos?.lng ?? selectedSos?.longitude;
    const hasSosTarget = Boolean(
      selectedSos &&
      sosLat != null &&
      sosLng != null &&
      !Number.isNaN(Number(sosLat)) &&
      !Number.isNaN(Number(sosLng))
    );

    const list = rawVolunteers.map((v, i) => {
      const vLat = v.latitude;
      const vLng = v.longitude;

      let calculatedDistKm = null;
      let calculatedEta = null;
      let jarakLabel = null;

      if (hasSosTarget && vLat != null && vLng != null) {
        const dist = calculateHaversineDistanceKm(vLat, vLng, sosLat, sosLng);
        if (dist !== null) {
          calculatedDistKm = dist;
          jarakLabel = `${formatDistanceText(dist)} ke ${selectedSos.displayId || selectedSos.label || 'SOS'}`;
          calculatedEta = `ETA ${formatEtaText(dist)}`;
        }
      }

      const isBusy = v.status === 'sedang_bertugas' || v.status === 'dalam_misi' || Boolean(v.misi && (v.misi.id || v.misi.id_kasus));

      return {
        id: v.id,
        nama: v.nama,
        peran: v.kompetensi || 'Relawan Lapangan',
        status: isBusy ? 'Bertugas' : 'Online',
        isBusy,
        avatar: v.nama ? v.nama.substring(0, 2).toUpperCase() : 'RL',
        avatarBg: colors[i % colors.length],
        jarak: jarakLabel,
        distKm: calculatedDistKm,
        eta: calculatedEta,
        kontak: v.no_telp,
        lat: v.latitude,
        lng: v.longitude,
        lokasi: v.lokasi_user ? v.lokasi_user.replace(/Posko\s+/gi, '').trim() : 'Area Siaga D.I. Yogyakarta'
      };
    });

    // Jika kasus SOS dipilih, urutkan relawan paling dekat ke lokasi kejadian
    if (hasSosTarget) {
      list.sort((a, b) => {
        if (a.distKm == null && b.distKm == null) return 0;
        if (a.distKm == null) return 1;
        if (b.distKm == null) return -1;
        return a.distKm - b.distKm;
      });
    }

    return list;
  }, [rawVolunteers, selectedSos]);

  useEffect(() => {
    fetchMapData();

    const channel = echo.private('command-center');

    const handleRelawanLocation = (data) => {
      if (!data?.relawan_id) return;
      const rId = data.relawan_id;
      const newLat = parseFloat(data.latitude);
      const newLng = parseFloat(data.longitude);
      if (isNaN(newLat) || isNaN(newLng)) return;

      setRawVolunteers((prev) =>
        prev.map((v) =>
          String(v.id) === String(rId)
            ? { ...v, lat: newLat, lng: newLng, lokasi: data.lokasi_user || v.lokasi }
            : v
        )
      );

      setMapData((prev) =>
        prev.map((m) =>
          m.type === 'relawan' && (String(m.id) === String(rId) || String(m.id) === `REL-${rId}`)
            ? { ...m, lat: newLat, lng: newLng }
            : m
        )
      );
    };

    const handleRelawanStatus = () => fetchMapData();
    const handleSosCreated = () => fetchMapData();
    const handleLaporanCreated = () => fetchMapData();

    const handleSosUpdateStatus = (data) => {
      if (data?.id) {
        const st = (data.status_sos || data.status_raw || data.status || '').toLowerCase().trim();
        const isEnded = ['batal', 'dibatalkan', 'selesai'].includes(st);
        if (isEnded) {
          setMapData((prev) => prev.filter((m) => !(m.type === 'sos' && String(m.id) === String(data.id))));
          setSelectedSos((prev) => (prev && String(prev.id) === String(data.id) ? null : prev));
          setSelectedMapItem((prev) => (prev && String(prev.id) === String(data.id) ? null : prev));
        }
      }
      fetchMapData();
    };

    channel.listen('.RelawanLocationUpdate', handleRelawanLocation);
    channel.listen('RelawanLocationUpdate', handleRelawanLocation);
    channel.listen('.RelawanStatusUpdated', handleRelawanStatus);
    channel.listen('RelawanStatusUpdated', handleRelawanStatus);
    channel.listen('.SOSCreated', handleSosCreated);
    channel.listen('SOSCreated', handleSosCreated);
    channel.listen('.SOSUpdateStatus', handleSosUpdateStatus);
    channel.listen('SOSUpdateStatus', handleSosUpdateStatus);
    channel.listen('.LaporanCreated', handleLaporanCreated);
    channel.listen('LaporanCreated', handleLaporanCreated);

    return () => {
      channel.stopListening('.RelawanLocationUpdate', handleRelawanLocation);
      channel.stopListening('RelawanLocationUpdate', handleRelawanLocation);
      channel.stopListening('.RelawanStatusUpdated', handleRelawanStatus);
      channel.stopListening('RelawanStatusUpdated', handleRelawanStatus);
      channel.stopListening('.SOSCreated', handleSosCreated);
      channel.stopListening('SOSCreated', handleSosCreated);
      channel.stopListening('.SOSUpdateStatus', handleSosUpdateStatus);
      channel.stopListening('SOSUpdateStatus', handleSosUpdateStatus);
      channel.stopListening('.LaporanCreated', handleLaporanCreated);
      channel.stopListening('LaporanCreated', handleLaporanCreated);
    };
  }, [fetchMapData]);

  // Handler klik kartu relawan -> FlyTo GPS di peta
  const handleVolunteerSelect = (vol) => {
    setSelectedVolunteer(vol);
    if (vol.lat && vol.lng) {
      setFocusTarget({
        id: vol.id,
        lat: vol.lat,
        lng: vol.lng,
        zoom: 16,
        item: vol,
        nama: vol.nama,
        kontak: vol.kontak,
        peran: vol.peran,
        lokasi: vol.lokasi,
        status: vol.status,
        eta: vol.eta
      });
    }
  };

  // Handler sinkronisasi saat marker di peta diklik langsung
  const handleSelectMarker = useCallback((item) => {
    if (!item) return;

    if (item.type === 'sos' || item.type === 'laporan') {
      setSelectedSos(item);
      // Mencegah duplikasi popup card di sudut kiri bawah karena drawer inspeksi lengkap di sisi kanan sudah terbuka
      setSelectedMapItem(null);
      setVolunteerStatusFilter('siaga'); // Otomatis filter ke relawan siaga
      setVolunteerLimit(5); // Batasi 5 relawan terdekat
      setIsPanelOpen(true); // Otomatis buka drawer relawan terdekat untuk kasus ini
    } else if (item.type === 'relawan') {
      const cleanId = String(item.id).replace(/^REL-/, '');
      const matched = rawVolunteers.find(v => String(v.id) === String(cleanId) || v.nama === item.label);
      if (matched) {
        setSelectedVolunteer(matched);
      }
      setSelectedMapItem(item);
    }
  }, [rawVolunteers]);

  // Relawan yang lolos filter radius batas tanggap darurat
  const radiusFilteredVolunteers = useMemo(() => {
    return volunteers.filter(v => {
      if (!selectedSos || maxRadiusKm === 'semua') return true;
      return v.distKm != null && v.distKm <= maxRadiusKm;
    });
  }, [volunteers, selectedSos, maxRadiusKm]);

  // Filter Relawan di Panel Samping (Search + Status + Radius)
  const filteredVolunteers = useMemo(() => {
    return radiusFilteredVolunteers.filter(v => {
      const matchSearch = volunteerSearch === '' ||
        v.nama?.toLowerCase().includes(volunteerSearch.toLowerCase()) ||
        v.peran?.toLowerCase().includes(volunteerSearch.toLowerCase());

      const matchStatus = volunteerStatusFilter === 'semua' ||
        (volunteerStatusFilter === 'siaga' && !v.isBusy) ||
        (volunteerStatusFilter === 'bertugas' && v.isBusy);

      return matchSearch && matchStatus;
    });
  }, [radiusFilteredVolunteers, volunteerSearch, volunteerStatusFilter]);

  // Batasi jumlah relawan yang ditampilkan (default 5 terdekat, bisa diperbesar jadi 10 atau semua)
  const displayedVolunteers = useMemo(() => {
    if (!volunteerLimit || !selectedSos) return filteredVolunteers;
    return filteredVolunteers.slice(0, volunteerLimit);
  }, [filteredVolunteers, volunteerLimit, selectedSos]);

  // Jumlah relawan di luar batas radius tanggap darurat
  const excludedByRadiusCount = useMemo(() => {
    if (!selectedSos || maxRadiusKm === 'semua') return 0;
    return volunteers.filter(v => v.distKm != null && v.distKm > maxRadiusKm).length;
  }, [volunteers, selectedSos, maxRadiusKm]);

  const sosCount = useMemo(() => mapData.filter(d => d.type === 'sos').length, [mapData]);
  const relawanCount = useMemo(() => mapData.filter(d => d.type === 'relawan').length, [mapData]);
  const laporanCount = useMemo(() => mapData.filter(d => d.type === 'laporan').length, [mapData]);

  return (
    <div className="relative w-full h-full min-h-0 flex-1 overflow-hidden select-none bg-slate-900">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-[13px] font-bold animate-fade-in ${
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
            : feedback.type === 'info'
            ? 'bg-blue-50 border-blue-300 text-blue-800'
            : 'bg-rose-50 border-rose-300 text-rose-800'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full ${
            feedback.type === 'success'
              ? 'bg-emerald-500'
              : feedback.type === 'info'
              ? 'bg-blue-500 animate-pulse'
              : 'bg-rose-500'
          }`} />
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="ml-2 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── 1. Map Canvas (Fullscreen Backdrop) ── */}
      <ModernEmergencyMap
        fullscreen={true}
        height="100%"
        className="w-full h-full absolute inset-0 z-0"
        onOpenDetail={onOpenDetail}
        onSelectMarker={handleSelectMarker}
        selectedItem={selectedMapItem}
        onSelectItem={setSelectedMapItem}
        focusTarget={focusTarget}
        showFilterBar={false}
        showLegend={false}
        showControls={true}
        controlsPosition="top-left"
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        mapMode={mapMode}
        onMapModeChange={setMapMode}
        mapData={mapData}
      />

      {/* ── 2. Top Floating HUD Bar (Header, Filter Terpadu, & Kontrol Peta) ── */}
      <header className="absolute top-3 left-3 right-3 z-20 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md rounded-2xl p-2.5 sm:p-3 px-4 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
          {/* Sisi Kiri: Judul, Status Koneksi Real-time, & Lokasi */}
          <div className="flex items-center gap-3.5 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <h1 className="text-[15px] font-black tracking-tight text-slate-900 leading-none">
                  Peta Pemantauan Wilayah
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10.5px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Live Echo Terhubung</span>
                </span>
              </div>
              <p className="text-[11.5px] font-medium text-slate-600 mt-1 flex items-center gap-1">
                <MapPin size={12} className="text-emerald-700 inline shrink-0" />
                Pusat Kendali D.I. Yogyakarta &bull; Real-time Command Center
              </p>
            </div>
          </div>

          {/* Sisi Tengah: Filter Terpadu (Menyatukan KPI & Filter Pill) & Mode Peta */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Pills Terpadu dengan Hitungan Real-time */}
            <div className="inline-flex rounded-xl bg-slate-100/90 p-1 text-xs font-semibold text-slate-700 border border-slate-200/80 shadow-2xs" role="tablist" aria-label="Filter Tampilan Peta">
              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'semua'}
                onClick={() => setActiveFilter('semua')}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                  activeFilter === 'semua'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Tampilkan semua data penanda di peta"
              >
                <span>Semua</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  activeFilter === 'semua' ? 'bg-slate-800 text-slate-100' : 'bg-slate-200 text-slate-700'
                }`}>
                  {mapData?.length || 0}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'sos'}
                onClick={() => setActiveFilter(activeFilter === 'sos' ? 'semua' : 'sos')}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${
                  activeFilter === 'sos'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-red-800 hover:bg-red-50'
                }`}
                title="Filter hanya kasus darurat SOS"
              >
                <span>SOS Aktif</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  activeFilter === 'sos' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-800'
                }`}>
                  {sosCount}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'relawan'}
                onClick={() => setActiveFilter(activeFilter === 'relawan' ? 'semua' : 'relawan')}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                  activeFilter === 'relawan'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-800 hover:bg-emerald-50'
                }`}
                title="Filter hanya relawan aktif"
              >
                <span>Relawan</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  activeFilter === 'relawan' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {relawanCount}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeFilter === 'laporan'}
                onClick={() => setActiveFilter(activeFilter === 'laporan' ? 'semua' : 'laporan')}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${
                  activeFilter === 'laporan'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
                title="Filter hanya laporan warga"
              >
                <span>Laporan</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  activeFilter === 'laporan' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {laporanCount}
                </span>
              </button>
            </div>

            {/* Segmented Map Layer Toggle */}
            <div className="inline-flex rounded-xl bg-slate-100/90 p-1 text-xs font-semibold text-slate-700 shrink-0 border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setMapMode('street')}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer min-h-[36px] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                  mapMode === 'street' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Peta Jalan
              </button>
              <button
                type="button"
                onClick={() => setMapMode('satellite')}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer min-h-[36px] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                  mapMode === 'satellite' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Satelit
              </button>
            </div>
          </div>

          {/* Sisi Kanan: Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Tombol Refresh Data */}
            <button
              type="button"
              onClick={fetchMapData}
              disabled={refreshLoading}
              className="btn-base bg-slate-100 hover:bg-slate-200 text-slate-800 text-[12px] min-h-[38px] px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-2"
              title="Segarkan data peta"
              aria-label="Segarkan data peta"
            >
              <RefreshCw size={14} className={refreshLoading ? 'animate-spin text-slate-600' : 'text-slate-700'} />
              <span className="hidden xl:inline font-bold">Refresh</span>
            </button>

            {/* Tombol Relawan: Mengatur drawer relawan terdekat */}
            {selectedSos ? (
              <button
                type="button"
                onClick={() => setIsPanelOpen(prev => !prev)}
                className={`btn-base text-[12px] min-h-[38px] px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 ${
                  isPanelOpen
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                }`}
                title="Tampilkan atau sembunyikan panel relawan terdekat"
              >
                <Users size={14} className={isPanelOpen ? 'text-white' : 'text-red-700'} />
                <span className="font-bold">Relawan Terdekat ({selectedSos.displayId || 'SOS'})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFeedback({
                    type: 'info',
                    message: 'Klik salah satu pin darurat SOS di peta untuk melihat unit relawan terdekat.'
                  });
                  setTimeout(() => setFeedback(null), 4500);
                  setActiveFilter('sos');
                }}
                className="btn-base text-[12px] min-h-[38px] px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all border bg-white text-slate-800 border-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-2"
                title="Klik pin kasus SOS di peta untuk melihat relawan terdekat"
              >
                <Users size={14} className="text-emerald-700" />
                <span className="font-bold">{rawVolunteers.length} Relawan Terdaftar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── 3. Right Floating Volunteer Dispatch Drawer (HANYA MUNCUL JIKA KASUS SOS DIKLIK) ── */}
      {isPanelOpen && selectedSos && (
        <aside className="absolute top-20 right-3.5 bottom-3.5 z-20 w-88 sm:w-96 max-w-[calc(100vw-1.75rem)] flex flex-col bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden animate-fade-in pointer-events-auto">
          {/* Header Drawer */}
          <div className="p-3.5 pb-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                <h2 className="text-[13px] font-black text-slate-900 tracking-tight leading-none">
                  Unit Relawan Terdekat
                </h2>
              </div>
              <p className="text-[11.5px] text-slate-600 mt-1">
                Jarak &amp; rute dihitung ke <strong className="text-red-600 font-bold">{selectedSos.displayId || selectedSos.label || 'Kasus SOS'}</strong>
              </p>
            </div>
            <button
              onClick={() => {
                setIsPanelOpen(false);
                setSelectedSos(null);
                setSelectedMapItem(null);
              }}
              className="min-h-[36px] min-w-[36px] h-9 w-9 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
              title="Tutup Panel Relawan Terdekat"
              aria-label="Tutup Panel Relawan Terdekat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Banner Kasus SOS Terpilih */}
          <div className="p-3 bg-red-50/90 border-b border-red-200/80 shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-black text-red-900 tracking-tight">
                    Target: {selectedSos.displayId || selectedSos.label || 'Kasus SOS'}
                  </span>
                  <span className="text-[10px] bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 rounded-md font-bold uppercase">
                    {selectedSos.status || 'Aktif'}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-red-800 line-clamp-1 mt-1">
                  {selectedSos.kategori || 'Insiden Darurat SOS'}
                </p>
                <p className="text-[11px] text-slate-700 line-clamp-1 mt-0.5 flex items-center gap-1">
                  <MapPin size={12} className="shrink-0 text-red-600 inline" />
                  <span className="truncate">{selectedSos.lokasi || 'D.I. Yogyakarta'}</span>
                </p>
              </div>
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenDetail) {
                      onOpenDetail(selectedSos.id);
                    } else {
                      navigate(`/detail-kasus/${selectedSos.id}?tipe=sos`);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-1"
                  title="Buka Halaman Detail Kasus"
                >
                  <span>Detail</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>

            {/* Informasi Jika Kasus Sedang Ditangani */}
            {(() => {
              const assignedName = selectedSos.relawan && selectedSos.relawan !== 'Menunggu Penugasan' && selectedSos.relawan !== 'Belum Ditugaskan' ? selectedSos.relawan : null;
              const sosStatusLower = String(selectedSos.status || '').toLowerCase().trim();
              const isSosHandled = sosStatusLower === 'ditangani' || sosStatusLower === 'proses' || Boolean(assignedName);
              if (!isSosHandled) return null;
              return (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50/90 p-2 text-[10.5px] text-amber-950">
                  <Info size={13} className="text-amber-800 shrink-0 mt-0.5" />
                  <div className="leading-tight">
                    <p className="font-bold text-amber-950">Kasus Berstatus Ditangani</p>
                    <p className="text-amber-900 text-[10.5px] mt-0.5">
                      {assignedName ? `Relawan ${assignedName} sedang ditugaskan. ` : 'Relawan sudah ditugaskan. '}
                      Untuk mengganti relawan penangan, silakan masuk ke Detail Kasus.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Search & Filter Relawan */}
          <div className="p-3 border-b border-slate-100 space-y-2 shrink-0 bg-slate-50/50">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama relawan atau keahlian..."
                value={volunteerSearch}
                onChange={(e) => setVolunteerSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 min-h-[38px] bg-white border border-slate-200 rounded-xl text-[12px] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0b6f61] focus:border-[#0b6f61] transition-all"
              />
            </div>

            {/* Filter Status Relawan */}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setVolunteerStatusFilter('siaga')}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                  volunteerStatusFilter === 'siaga' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                Siaga ({radiusFilteredVolunteers.filter(v => !v.isBusy).length})
              </button>
              <button
                type="button"
                onClick={() => setVolunteerStatusFilter('semua')}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                  volunteerStatusFilter === 'semua' ? 'bg-slate-900 text-white font-bold shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                Semua ({radiusFilteredVolunteers.length})
              </button>
              <button
                type="button"
                onClick={() => setVolunteerStatusFilter('bertugas')}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                  volunteerStatusFilter === 'bertugas' ? 'bg-blue-600 text-white font-bold shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                Bertugas ({radiusFilteredVolunteers.filter(v => v.isBusy).length})
              </button>
            </div>

            {/* Kontrol Batas Relawan Terdekat (5 terdekat, 10 terdekat, semua) */}
            {selectedSos && (
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/70">
                <span className="text-slate-600 font-medium">Batas Ditampilkan:</span>
                <div className="inline-flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setVolunteerLimit(5)}
                    className={`min-h-[28px] px-2.5 py-0.5 rounded-md font-bold text-[10.5px] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                      volunteerLimit === 5
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    5 Terdekat
                  </button>
                  <button
                    type="button"
                    onClick={() => setVolunteerLimit(10)}
                    className={`min-h-[28px] px-2.5 py-0.5 rounded-md font-bold text-[10.5px] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                      volunteerLimit === 10
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    10 Terdekat
                  </button>
                  <button
                    type="button"
                    onClick={() => setVolunteerLimit(null)}
                    className={`min-h-[28px] px-2.5 py-0.5 rounded-md font-bold text-[10.5px] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                      volunteerLimit === null
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                    title="Tampilkan semua relawan tanpa batas"
                  >
                    Semua
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifikasi relawan di luar radius yang disembunyikan */}
          {selectedSos && maxRadiusKm !== 'semua' && excludedByRadiusCount > 0 && (
            <div className="mx-3 mt-2 px-2.5 py-1.5 bg-amber-50/90 border border-amber-200/80 rounded-lg flex items-center justify-between text-[10.5px] text-amber-950 shrink-0">
              <span className="truncate pr-1">
                {excludedByRadiusCount} relawan berjarak &gt; {maxRadiusKm} km disaring.
              </span>
              <button
                type="button"
                onClick={() => setMaxRadiusKm('semua')}
                className="font-bold text-red-700 hover:text-red-900 underline shrink-0 cursor-pointer text-[10.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded"
              >
                Tampilkan Semua
              </button>
            </div>
          )}

          {/* List Kartu Relawan */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {displayedVolunteers.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-600 text-[12px] space-y-2">
                <p>
                  {volunteerStatusFilter === 'siaga'
                    ? 'Tidak ada relawan berstatus siaga di sekitar lokasi ini.'
                    : 'Tidak ada data relawan yang cocok dengan pencarian.'}
                </p>
                {volunteerStatusFilter === 'siaga' && radiusFilteredVolunteers.some(v => v.isBusy) && (
                  <button
                    type="button"
                    onClick={() => setVolunteerStatusFilter('semua')}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] rounded"
                  >
                    Lihat Semua Relawan (Termasuk yang sedang bertugas)
                  </button>
                )}
              </div>
            ) : (
              displayedVolunteers.map(vol => {
                const isSelected = selectedVolunteer?.id === vol.id;
                const cleanKontak = vol.kontak ? String(vol.kontak).replace(/[^0-9]/g, '') : '';
                const waUrl = cleanKontak
                  ? `https://wa.me/${cleanKontak.startsWith('0') ? '62' + cleanKontak.slice(1) : cleanKontak}?text=${encodeURIComponent(
                      `Halo ${vol.nama}, panggilan darurat dari Pusat Kendali Sahabat SOS D.I. Yogyakarta untuk penanganan ${selectedSos?.displayId || 'kasus SOS'} di ${selectedSos?.lokasi || 'D.I. Yogyakarta'}. Mohon segera merapat.`
                    )}`
                  : null;

                return (
                  <div
                    key={vol.id}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                    }`}
                    onClick={() => handleVolunteerSelect(vol)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${vol.avatarBg} text-white shrink-0`}>
                          {vol.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-slate-900 leading-tight truncate">{vol.nama}</p>
                          <p className="text-[11px] text-slate-600 truncate">{vol.peran}</p>
                        </div>
                      </div>
                      <Badge variant={vol.isBusy ? 'Sedang Bertugas' : 'Online'} isPill />
                    </div>

                    {/* Jarak, ETA & Aksi Panggilan Riil */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <div className="min-w-0 pr-2">
                        {selectedSos && vol.jarak ? (
                          <div className="truncate">
                            <strong className="text-slate-900 font-bold">{vol.jarak}</strong> &middot;{' '}
                            <span className="text-emerald-800 font-bold">{vol.eta}</span>
                          </div>
                        ) : (
                          <div className="text-slate-600 font-medium truncate flex items-center gap-1">
                            <MapPin size={12} className="text-slate-500 shrink-0 inline" />
                            <span className="truncate">{vol.lokasi || 'Area Siaga D.I. Yogyakarta'}</span>
                          </div>
                        )}
                      </div>

                      {/* Tombol Telepon, WhatsApp, & Tugaskan Riil */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {selectedSos && (() => {
                          const assignedName = selectedSos.relawan && selectedSos.relawan !== 'Menunggu Penugasan' && selectedSos.relawan !== 'Belum Ditugaskan' ? selectedSos.relawan : null;
                          const sosStatusLower = String(selectedSos.status || '').toLowerCase().trim();
                          const isSosHandled = sosStatusLower === 'ditangani' || sosStatusLower === 'proses' || Boolean(assignedName);
                          const isSosFinished = sosStatusLower === 'selesai' || sosStatusLower === 'batal';
                          const isSosLocked = isSosHandled || isSosFinished;
                          const isThisVolAssigned = Boolean(
                            (selectedSos.id_relawan && Number(selectedSos.id_relawan) === Number(vol.id)) ||
                            (assignedName && vol.nama && (
                              vol.nama.toLowerCase().includes(assignedName.toLowerCase()) ||
                              assignedName.toLowerCase().includes(vol.nama.toLowerCase())
                            ))
                          );

                          if (isThisVolAssigned) {
                            return (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-[10.5px] shrink-0"
                                title="Relawan ini sedang bertugas menangani kasus ini"
                              >
                                <CheckCircle size={12} className="text-emerald-700" />
                                <span>Ditugaskan</span>
                              </span>
                            );
                          }

                          if (isSosLocked) {
                            return (
                              <button
                                type="button"
                                disabled={true}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] rounded-lg bg-slate-100 text-slate-500 font-bold text-[10.5px] border border-slate-200 cursor-not-allowed opacity-60 shrink-0"
                                title={
                                  isSosFinished
                                    ? `Kasus sudah ${selectedSos.status}. Penugasan ditutup.`
                                    : 'Kasus sudah berstatus ditangani. Untuk mengganti relawan, silakan masuk ke Detail Kasus.'
                                }
                              >
                                <Shield size={12} />
                                <span>Tugaskan</span>
                              </button>
                            );
                          }

                          return (
                            <button
                              type="button"
                              disabled={dispatchingId === vol.id || vol.isBusy}
                              onClick={() => handleDispatchVolunteer(vol)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-lg bg-[#0b6f61] text-white hover:bg-[#095c52] font-bold transition-colors text-[11px] disabled:opacity-50 cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-1"
                              title={`Tugaskan ${vol.nama} ke kasus ${selectedSos.displayId || ''}`}
                            >
                              <Shield size={12} />
                              <span>{dispatchingId === vol.id ? '...' : 'Tugaskan'}</span>
                            </button>
                          );
                        })()}
                        {vol.kontak ? (
                          <>
                            <a
                              href={`tel:${vol.kontak}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold transition-colors text-[11px] border border-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
                              title={`Panggil telepon seluler ${vol.nama}`}
                            >
                              <Phone size={12} />
                              <span>Telepon</span>
                            </a>
                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold transition-colors text-[11px] border border-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-1"
                                title={`Kirim pesan WhatsApp ke ${vol.nama}`}
                              >
                                <MessageCircle size={12} />
                                <span>WA</span>
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">No. Telp Tidak Ada</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
