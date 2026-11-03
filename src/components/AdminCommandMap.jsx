import { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, Minus, Users, Eye, X, MapPin, Maximize2, Navigation, CheckCircle, Info, Activity, Layers, Filter } from 'lucide-react';
import { adminService } from '../api/services/adminService';

// Pusat Yogyakarta (Malioboro / Tugu / Depok Sleman)
const YOGYAKARTA_CENTER = [-7.7956, 110.3695];
const streetTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
const satelliteTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

// Mapping label untuk status filter
const STATUS_FILTER_LABELS = {
  all: 'Semua Titik',
  laporan_belum: 'Laporan Belum Ditangani',
  laporan_ditangani: 'Laporan Ditangani',
  relawan_siaga: 'Relawan Siaga',
  relawan_menangani: 'Relawan Menangani',
  sos_belum: 'SOS Belum Ditangani',
  sos_ditangani: 'SOS Ditangani',
};

// Helper klasifikasi kategori & status marker
const getItemCategoryKey = (item, allItems, selected) => {
  if (!item) return null;
  const isSos = item.type === 'sos';
  const isRelawan = item.type === 'relawan';
  const isLaporan = item.type === 'laporan' || (!isSos && !isRelawan);

  if (isSos) {
    const itemStatus = (selected && selected.id === item.id && selected.type === 'sos')
      ? selected.status
      : item.status;
    const sLower = String(itemStatus || '').toLowerCase().trim();
    const isSosDitangani = sLower === 'ditangani' || sLower === 'proses' || Boolean(item.relawan && item.relawan !== 'Menunggu Penugasan' && item.relawan !== '-');
    return isSosDitangani ? 'sos_ditangani' : 'sos_belum';
  }

  if (isRelawan) {
    const cleanRelName = (item.pelapor || item.label || '').toLowerCase().trim();
    const hasAssignedIncident = (allItems || []).some((m) => {
      if (m.type !== 'sos' && m.type !== 'laporan') return false;
      if (item.id && m.id_relawan && Number(m.id_relawan) === Number(item.id)) return true;
      if (cleanRelName && m.relawan && m.relawan.toLowerCase().includes(cleanRelName)) return true;
      return false;
    });

    const itemStatus = (selected && selected.id === item.id && selected.type === 'relawan')
      ? selected.status
      : item.status;
    const sLower = String(itemStatus || '').toLowerCase().trim();
    const isRelawanMenangani = sLower === 'dalam_misi' ||
      sLower === 'sedang_bertugas' ||
      sLower === 'bertugas' ||
      Boolean(item.misi && (item.misi.id || item.misi.id_kasus)) ||
      hasAssignedIncident;

    return isRelawanMenangani ? 'relawan_menangani' : 'relawan_siaga';
  }

  if (isLaporan) {
    const itemStatus = (selected && selected.id === item.id && selected.type === 'laporan')
      ? selected.status
      : item.status;
    const sLower = String(itemStatus || '').toLowerCase().trim();
    const isLaporanDitangani = sLower === 'ditangani' ||
      sLower === 'proses' ||
      Boolean(item.relawan && item.relawan !== 'Menunggu Penugasan' && item.relawan !== '-');
    return isLaporanDitangani ? 'laporan_ditangani' : 'laporan_belum';
  }

  return null;
};

export default function AdminCommandMap({
  height,
  className = '',
  onOpenDetail,
  onDispatchSuccess,
  mapData = [],
  relawanCount = 0,
  sosCount = 0,
  laporanCount = 0,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const hasInitialBoundsRef = useRef(false);

  const [mapMode, setMapMode] = useState('street'); // 'street' | 'satellite'
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const prevFilterRef = useRef(activeStatusFilter);
  const [nearbyVolunteers, setNearbyVolunteers] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [dispatchingId, setDispatchingId] = useState(null);
  const [dispatchSuccess, setDispatchSuccess] = useState(null);

  const assignedVolunteerName = selectedItem?.relawan && selectedItem.relawan !== 'Menunggu Penugasan' && selectedItem.relawan !== '-' ? selectedItem.relawan : null;
  const statusLower = String(selectedItem?.status || '').toLowerCase().trim();
  const isHandled = statusLower === 'ditangani' || statusLower === 'proses' || Boolean(assignedVolunteerName);
  const isFinished = statusLower === 'selesai' || statusLower === 'batal';
  const isLocked = isHandled || isFinished;

  // Misi aktif relawan (jika relawan sedang ditugaskan ke kasus SOS/Laporan)
  const volunteerMission = useMemo(() => {
    if (!selectedItem || selectedItem.type !== 'relawan') return null;

    // 1. Cek dari payload misi langsung yang dikirim backend
    if (selectedItem.misi && (selectedItem.misi.id || selectedItem.misi.id_kasus)) {
      return {
        id: selectedItem.misi.id,
        type: selectedItem.misi.tipe || 'sos',
        displayId: selectedItem.misi.id_kasus || `#${selectedItem.misi.id}`,
        pelapor: selectedItem.misi.pelapor || null,
        kategori: selectedItem.misi.kategori || null,
        lokasi: selectedItem.misi.tujuan || null,
      };
    }

    // 2. Pencarian sinkron dalam mapData jika ada SOS/Laporan yang ditugaskan ke relawan ini
    const cleanRelName = (selectedItem.pelapor || selectedItem.label || '').toLowerCase().trim();
    const matched = (mapData || []).find((m) => {
      if (m.type !== 'sos' && m.type !== 'laporan') return false;
      if (selectedItem.id && m.id_relawan && Number(m.id_relawan) === Number(selectedItem.id)) return true;
      if (cleanRelName && m.relawan && m.relawan.toLowerCase().includes(cleanRelName)) return true;
      return false;
    });

    if (matched) {
      return {
        id: matched.id,
        type: matched.type,
        displayId: matched.displayId || matched.label || `#${matched.id}`,
        pelapor: matched.pelapor || null,
        kategori: matched.kategori || null,
        lokasi: matched.lokasi || null,
      };
    }

    return null;
  }, [selectedItem, mapData]);

  const isRelawanBusy = selectedItem?.type === 'relawan' && (
    selectedItem.status === 'dalam_misi' ||
    selectedItem.status === 'sedang_bertugas' ||
    selectedItem.status === 'Bertugas' ||
    Boolean(volunteerMission)
  );

  // ── Hitung Jumlah Indikator Real-time untuk Legenda di Bawah Peta ──
  const sosBelumCount = useMemo(() => (mapData || []).filter(i => {
    if (i.type !== 'sos') return false;
    const s = String(i.status || '').toLowerCase().trim();
    const isHandled = s === 'ditangani' || s === 'proses' || Boolean(i.relawan && i.relawan !== 'Menunggu Penugasan' && i.relawan !== '-');
    return !isHandled;
  }).length, [mapData]);

  const sosDitanganiCount = useMemo(() => (mapData || []).filter(i => {
    if (i.type !== 'sos') return false;
    const s = String(i.status || '').toLowerCase().trim();
    return s === 'ditangani' || s === 'proses' || Boolean(i.relawan && i.relawan !== 'Menunggu Penugasan' && i.relawan !== '-');
  }).length, [mapData]);

  const laporanBelumCount = useMemo(() => (mapData || []).filter(i => {
    if (i.type !== 'laporan') return false;
    const s = String(i.status || '').toLowerCase().trim();
    const isHandled = s === 'ditangani' || s === 'proses' || Boolean(i.relawan && i.relawan !== 'Menunggu Penugasan' && i.relawan !== '-');
    return !isHandled;
  }).length, [mapData]);

  const laporanDitanganiCount = useMemo(() => (mapData || []).filter(i => {
    if (i.type !== 'laporan') return false;
    const s = String(i.status || '').toLowerCase().trim();
    return s === 'ditangani' || s === 'proses' || Boolean(i.relawan && i.relawan !== 'Menunggu Penugasan' && i.relawan !== '-');
  }).length, [mapData]);

  const relawanMenanganiCount = useMemo(() => (mapData || []).filter(i => {
    if (i.type !== 'relawan') return false;
    const s = String(i.status || '').toLowerCase().trim();
    const isBusy = s === 'dalam_misi' || s === 'sedang_bertugas' || s === 'bertugas' || Boolean(i.misi && (i.misi.id || i.misi.id_kasus));
    if (isBusy) return true;
    const cleanName = (i.pelapor || i.label || '').toLowerCase().trim();
    return (mapData || []).some(m => (m.type === 'sos' || m.type === 'laporan') && (
      (i.id && m.id_relawan && Number(m.id_relawan) === Number(i.id)) ||
      (cleanName && m.relawan && m.relawan.toLowerCase().includes(cleanName))
    ));
  }).length, [mapData]);

  const relawanSiagaCount = useMemo(() => {
    const total = (mapData || []).filter(i => i.type === 'relawan').length;
    return Math.max(0, total - relawanMenanganiCount);
  }, [mapData, relawanMenanganiCount]);

  // Filter daftar item berdasarkan tombol status yang dipilih di legenda
  const filteredItems = useMemo(() => {
    const items = Array.isArray(mapData) ? mapData : [];
    if (activeStatusFilter === 'all') return items;
    return items.filter((item) => getItemCategoryKey(item, items, selectedItem) === activeStatusFilter);
  }, [mapData, activeStatusFilter, selectedItem]);

  const handleToggleStatusFilter = (filterKey) => {
    setActiveStatusFilter((prev) => (prev === filterKey ? 'all' : filterKey));
  };

  const formatStatusText = (status) => {
    if (!status) return '-';
    const s = String(status).toLowerCase().trim();
    if (s === 'dalam_misi') return 'Dalam Misi (Bertugas)';
    if (s === 'siaga_bebas' || s === 'tersedia' || s === 'siaga') return 'Siaga Bebas';
    if (s === 'off_istirahat') return 'Off / Istirahat';
    if (s === 'ditangani') return 'Sedang Ditangani';
    if (s === 'belum ditangani' || s === 'menunggu') return 'Menunggu Penugasan';
    return status.replace(/_/g, ' ');
  };

  const handleQuickDispatch = async (relawan) => {
    if (!selectedItem || !relawan || isLocked) return;
    try {
      setDispatchingId(relawan.id);
      const tipe = selectedItem.type === 'laporan' ? 'laporan' : 'sos';
      await adminService.dispatchRelawan(selectedItem.id, relawan.id, tipe);
      const cleanRelawanName = relawan.nama ? relawan.nama.replace(/\s*\(Relawan\)/i, '').trim() : 'Relawan';
      setDispatchSuccess(`Relawan ${cleanRelawanName} berhasil ditugaskan!`);

      // Update selectedItem agar status langsung berubah menjadi 'ditangani' dan relawan tercatat
      setSelectedItem((prev) => (prev ? {
        ...prev,
        status: 'ditangani',
        relawan: cleanRelawanName,
        id_relawan: relawan.id,
      } : null));

      onDispatchSuccess?.();
      window.dispatchEvent(new CustomEvent('kasus-updated'));
      setTimeout(() => setDispatchSuccess(null), 4000);
    } catch (err) {
      console.error('Gagal dispatch relawan:', err);
      alert(err?.response?.data?.message || 'Gagal menugaskan relawan.');
    } finally {
      setDispatchingId(null);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: YOGYAKARTA_CENTER,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
    });

    tileLayerRef.current = L.tileLayer(streetTileUrl, {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Invalidate size once rendered
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Container Resizing to auto-fit right column height
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;
    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle Layer Toggle (Peta Jalan vs Satelit)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newUrl = mapMode === 'satellite' ? satelliteTileUrl : streetTileUrl;
    tileLayerRef.current = L.tileLayer(newUrl, {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri',
    }).addTo(mapInstanceRef.current);
  }, [mapMode]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    const bounds = L.latLngBounds();

    filteredItems.forEach((item) => {
      if (!item.lat || !item.lng) return;

      let iconHtml = '';
      const isSos = item.type === 'sos';
      const isRelawan = item.type === 'relawan';

      if (isSos) {
        const itemStatus = (selectedItem && selectedItem.id === item.id && selectedItem.type === 'sos')
          ? selectedItem.status
          : item.status;
        const statusLower = String(itemStatus || '').toLowerCase().trim();
        const isSosDitangani = statusLower === 'ditangani' || statusLower === 'proses' || Boolean(item.relawan && item.relawan !== 'Menunggu Penugasan' && item.relawan !== '-');
        const markerClass = isSosDitangani ? 'command-map-marker sos-marker sos-ditangani group' : 'command-map-marker sos-marker sos-belum-ditangani group';
        const rippleClass = isSosDitangani ? 'emergency-beacon-ripple success-ripple' : 'emergency-beacon-ripple';
        const statusKeterangan = isSosDitangani ? 'Ditangani' : 'Belum Ditangani';

        iconHtml = `
          <div class="${markerClass}">
            <div class="marker-beacon-wrapper">
              <div class="${rippleClass}"></div>
              <div class="marker-circle">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
            </div>
            <div class="marker-tag">${item.label || item.displayId || '#SOS'}</div>
          </div>
        `;
      } else if (isRelawan) {
        const cleanRelName = (item.pelapor || item.label || '').toLowerCase().trim();
        const hasAssignedIncident = filteredItems.some((m) => {
          if (m.type !== 'sos' && m.type !== 'laporan') return false;
          if (item.id && m.id_relawan && Number(m.id_relawan) === Number(item.id)) return true;
          if (cleanRelName && m.relawan && m.relawan.toLowerCase().includes(cleanRelName)) return true;
          return false;
        });

        const itemStatus = (selectedItem && selectedItem.id === item.id && selectedItem.type === 'relawan')
          ? selectedItem.status
          : item.status;
        const statusLower = String(itemStatus || '').toLowerCase().trim();
        const isRelawanMenangani = statusLower === 'dalam_misi' ||
          statusLower === 'sedang_bertugas' ||
          statusLower === 'bertugas' ||
          Boolean(item.misi && (item.misi.id || item.misi.id_kasus)) ||
          hasAssignedIncident;

        const markerClass = isRelawanMenangani
          ? 'command-map-marker relawan-marker relawan-menangani group'
          : 'command-map-marker relawan-marker relawan-siaga group';
        const rippleClass = isRelawanMenangani ? 'emergency-beacon-ripple warning-ripple' : '';
        const statusKeterangan = isRelawanMenangani ? 'Menangani' : 'Siaga';

        iconHtml = `
          <div class="${markerClass}">
            <div class="marker-beacon-wrapper">
              ${isRelawanMenangani ? `<div class="${rippleClass}"></div>` : ''}
              <div class="marker-circle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </div>
            <div class="marker-tag">${item.label || item.pelapor || 'Relawan'}</div>
          </div>
        `;
      } else {
        // Laporan (Orange ketika belum ditangani, Hijau ketika ditangani)
        const itemStatus = (selectedItem && selectedItem.id === item.id && selectedItem.type === 'laporan')
          ? selectedItem.status
          : item.status;
        const statusLower = String(itemStatus || '').toLowerCase().trim();
        const isLaporanDitangani = statusLower === 'ditangani' ||
          statusLower === 'proses' ||
          Boolean(item.relawan && item.relawan !== 'Menunggu Penugasan' && item.relawan !== '-');
        const isLaporanAktif = statusLower !== 'selesai' && statusLower !== 'batal';

        const markerClass = isLaporanDitangani
          ? 'command-map-marker laporan-marker laporan-ditangani group'
          : 'command-map-marker laporan-marker laporan-belum-ditangani group';
        const rippleClass = isLaporanDitangani
          ? 'emergency-beacon-ripple success-ripple'
          : 'emergency-beacon-ripple warning-ripple';

        iconHtml = `
          <div class="${markerClass}">
            <div class="marker-beacon-wrapper">
              ${isLaporanAktif ? `<div class="${rippleClass}"></div>` : ''}
              <div class="marker-circle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
            </div>
            <div class="marker-tag">${item.label || item.displayId || '#Laporan'}</div>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        className: 'custom-command-center-icon',
        html: iconHtml,
        iconSize: [140, 56],
        iconAnchor: [70, 18],
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon });
      marker.on('click', () => {
        setSelectedItem(item);
        mapInstanceRef.current?.flyTo([item.lat, item.lng], 14, { duration: 0.6 });
      });

      markersLayerRef.current.addLayer(marker);
      bounds.extend([item.lat, item.lng]);
    });

    // Responsif fokus batas peta saat filter status dipilih atau saat pertama kali render
    if (prevFilterRef.current !== activeStatusFilter) {
      prevFilterRef.current = activeStatusFilter;
      if (filteredItems.length > 0 && bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      }
    } else if (!hasInitialBoundsRef.current && filteredItems.length > 0 && bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      hasInitialBoundsRef.current = true;
    }

    // Jika selectedItem yang sedang dibuka tidak lolos filter yang aktif, tutup popup
    if (selectedItem && !filteredItems.some(i => i.id === selectedItem.id && i.type === selectedItem.type)) {
      setSelectedItem(null);
    }
  }, [filteredItems, activeStatusFilter, selectedItem?.status, selectedItem?.id]);

  // Zoom Helpers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  // Focus on Volunteers
  const handleFocusVolunteers = () => {
    const volunteers = (mapData || []).filter(i => i.type === 'relawan' && i.lat && i.lng);
    if (volunteers.length > 0 && mapInstanceRef.current) {
      if (volunteers.length === 1) {
        mapInstanceRef.current.flyTo([volunteers[0].lat, volunteers[0].lng], 15, { duration: 0.8 });
        return;
      }
      const vBounds = L.latLngBounds();
      volunteers.forEach(v => {
        vBounds.extend([v.lat, v.lng]);
      });
      if (vBounds.isValid()) {
        mapInstanceRef.current.fitBounds(vBounds, { padding: [70, 70], maxZoom: 14 });
        return;
      }
    }
    // Fallback to center
    mapInstanceRef.current?.flyTo(YOGYAKARTA_CENTER, 13);
  };

  // Fit all markers (SOS, Laporan, Relawan)
  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const items = (mapData || []).filter(i => i.lat && i.lng);
    if (items.length > 0) {
      const bounds = L.latLngBounds();
      items.forEach(i => bounds.extend([i.lat, i.lng]));
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
        return;
      }
    }
    mapInstanceRef.current.flyTo(YOGYAKARTA_CENTER, 13);
  };

  // Helper Haversine Distance (km)
  const getHaversineDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch / Compute Nearby Volunteers when an Incident (SOS / Laporan) is selected
  useEffect(() => {
    if (!selectedItem || (selectedItem.type !== 'sos' && selectedItem.type !== 'laporan')) {
      setNearbyVolunteers([]);
      setNearbyLoading(false);
      return;
    }

    let isMounted = true;
    setNearbyLoading(true);

    const computeFallbackNearby = () => {
      if (!selectedItem.lat || !selectedItem.lng) {
        setNearbyVolunteers([]);
        return;
      }
      const volunteers = (mapData || [])
        .filter((i) => i.type === 'relawan' && i.lat && i.lng)
        .map((v) => {
          const dist = getHaversineDistanceKm(selectedItem.lat, selectedItem.lng, v.lat, v.lng);
          return {
            id: v.id,
            nama: v.label || v.pelapor || 'Relawan',
            kompetensi: v.kategori || 'Relawan Siaga',
            jarak_km: Math.round(dist * 100) / 100,
            jarak_text: dist < 1 ? `${Math.round(dist * 1000)} m` : `${Math.round(dist * 10) / 10} km`,
            status: v.status?.includes('misi') ? 'sedang_bertugas' : 'siaga',
            latitude: v.lat,
            longitude: v.lng,
          };
        })
        .sort((a, b) => a.jarak_km - b.jarak_km);

      setNearbyVolunteers(volunteers);
    };

    const fetchNearby = async () => {
      try {
        const params = {
          lat: selectedItem.lat,
          lng: selectedItem.lng,
        };
        if (selectedItem.type === 'sos') params.sos_id = selectedItem.id;
        else if (selectedItem.type === 'laporan') params.laporan_id = selectedItem.id;

        const res = await adminService.getQuickDispatchRelawan(params);
        if (isMounted) {
          if (Array.isArray(res?.data) && res.data.length > 0) {
            setNearbyVolunteers(res.data);
          } else {
            computeFallbackNearby();
          }
        }
      } catch (err) {
        console.warn('Gagal memuat relawan terdekat via API, menggunakan fallback peta:', err);
        if (isMounted) {
          computeFallbackNearby();
        }
      } finally {
        if (isMounted) setNearbyLoading(false);
      }
    };

    fetchNearby();

    return () => {
      isMounted = false;
    };
  }, [selectedItem, mapData]);

  // Focus on Selected Incident + Nearby Volunteers
  const handleFocusNearbyVolunteers = () => {
    if (!mapInstanceRef.current || !selectedItem) return;
    const bounds = L.latLngBounds();
    if (selectedItem.lat && selectedItem.lng) {
      bounds.extend([selectedItem.lat, selectedItem.lng]);
    }

    let hasVolunteers = false;
    nearbyVolunteers.forEach((v) => {
      const vLat = v.latitude || v.lat;
      const vLng = v.longitude || v.lng;
      if (vLat && vLng) {
        bounds.extend([vLat, vLng]);
        hasVolunteers = true;
      }
    });

    if (hasVolunteers && bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
    } else if (selectedItem.lat && selectedItem.lng) {
      mapInstanceRef.current.flyTo([selectedItem.lat, selectedItem.lng], 15, { duration: 0.8 });
    }
  };

  return (
    <div className={`relative flex w-full h-full min-h-110 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs ${className}`}>
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col gap-2.5 border-b border-slate-100 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <h2 className="text-xs font-bold tracking-tight text-slate-900 sm:text-sm">
              Peta Pemantauan Wilayah
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {/* Segmented Button: Peta Jalan / Satelit */}
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium text-slate-600 shrink-0">
            <button
              onClick={() => setMapMode('street')}
              className={`rounded-md px-3 py-1 transition-all whitespace-nowrap cursor-pointer ${
                mapMode === 'street'
                  ? 'bg-white font-semibold text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Peta Jalan
            </button>
            <button
              onClick={() => setMapMode('satellite')}
              className={`rounded-md px-3 py-1 transition-all whitespace-nowrap cursor-pointer ${
                mapMode === 'satellite'
                  ? 'bg-white font-semibold text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satelit
            </button>
          </div>

          {/* Button Relawan: 'Relawan Terdekat' saat kasus (SOS/Laporan) aktif dipilih, atau 'Relawan Siaga' saat default */}
          {selectedItem?.type === 'sos' || selectedItem?.type === 'laporan' ? (
            <button
              onClick={handleFocusNearbyVolunteers}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold shadow-2xs transition-all cursor-pointer animate-in fade-in duration-200 ${
                selectedItem.type === 'sos'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100/90'
                  : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100/90'
              }`}
              title="Fokuskan peta ke lokasi kasus dan relawan terdekat"
            >
              <Users size={13} className={selectedItem.type === 'sos' ? 'text-emerald-700' : 'text-amber-700'} />
              <span>
                {nearbyLoading
                  ? 'Mencari Relawan...'
                  : `${nearbyVolunteers.length} Relawan Terdekat`}
              </span>
            </button>
          ) : (
            <button
              onClick={handleFocusVolunteers}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100/80 transition-colors cursor-pointer"
              title="Fokus ke semua posisi relawan di peta"
            >
              <Users size={13} className="text-emerald-700" />
              <span className="tabular-nums">{relawanCount} Relawan Siaga</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Map Canvas Container ── */}
      <div className="relative isolate w-full flex-1 min-h-[380px]" style={height ? { minHeight: height } : undefined}>
        <div ref={mapContainerRef} className="h-full w-full relative z-0" />

        {/* Floating Active Filter Banner (Top Left inside map) */}
        {activeStatusFilter !== 'all' && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-xs px-3 py-1.5 shadow-md animate-in fade-in zoom-in-95 duration-150">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-800">
              Filter: <span className="text-[#0b6f61]">{STATUS_FILTER_LABELS[activeStatusFilter]}</span> ({filteredItems.length} titik)
            </span>
            <button
              type="button"
              onClick={() => setActiveStatusFilter('all')}
              className="ml-1 inline-flex items-center gap-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
              title="Reset ke semua titik"
            >
              <X size={11} />
              <span>Reset</span>
            </button>
          </div>
        )}

        {/* Notifikasi jika filter menghasilkan 0 titik */}
        {activeStatusFilter !== 'all' && filteredItems.length === 0 && (
          <div className="absolute inset-x-4 top-16 z-20 mx-auto max-w-sm rounded-xl border border-amber-200 bg-amber-50/95 backdrop-blur-xs p-3 text-center shadow-lg animate-in fade-in duration-200">
            <p className="text-xs font-bold text-amber-900">
              Tidak ada marker dengan status &quot;{STATUS_FILTER_LABELS[activeStatusFilter]}&quot; saat ini
            </p>
            <p className="mt-0.5 text-[11px] text-amber-700">
              Klik tombol di bawah untuk melihat semua titik di peta.
            </p>
            <button
              type="button"
              onClick={() => setActiveStatusFilter('all')}
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Layers size={12} />
              <span>Tampilkan Semua Titik</span>
            </button>
          </div>
        )}

        {/* Floating Zoom Controls (Top Right inside map) */}
        <div className="absolute right-4 top-4 z-20 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
          <button
            onClick={handleZoomIn}
            className="flex h-8 w-8 items-center justify-center border-b border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors"
            title="Perbesar"
          >
            <Plus size={15} />
          </button>
          <button
            onClick={handleZoomOut}
            className="flex h-8 w-8 items-center justify-center border-b border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors"
            title="Perkecil"
          >
            <Minus size={15} />
          </button>
          <button
            onClick={handleFitAll}
            className="flex h-8 w-8 items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
            title="Tampilkan Semua Titik & Relawan"
          >
            <Maximize2 size={13} />
          </button>
        </div>

        {/* Selected Marker Popup */}
        {selectedItem && (
          <div className="absolute bottom-3 left-3 z-30 flex w-80 max-h-[88%] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header (Always Pinned) */}
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/60 p-3 shrink-0">
              <div>
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  selectedItem.type === 'sos'
                    ? (isHandled ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700')
                    : selectedItem.type === 'relawan'
                    ? (isRelawanBusy ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800')
                    : (isHandled ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800')
                }`}>
                  {selectedItem.type === 'sos'
                    ? (isHandled ? 'SOS Ditangani' : 'SOS Belum Ditangani')
                    : selectedItem.type === 'relawan'
                    ? (isRelawanBusy ? 'Relawan Menangani (Bertugas)' : 'Relawan Siaga')
                    : (isHandled ? 'Laporan Ditangani' : 'Laporan Belum Ditangani')}
                </span>
                <h4 className="mt-1 text-xs font-bold text-slate-900">
                  {selectedItem.label || selectedItem.displayId || `#${selectedItem.id}`}
                </h4>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                aria-label="Tutup jendela detail"
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Scrollable Middle Body */}
            <div className="flex-1 overflow-y-auto p-3 text-[11px] text-slate-600 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-500">
                <MapPin size={12} className="text-slate-400 shrink-0" />
                <span className="line-clamp-2">{selectedItem.lokasi || 'Wilayah D.I. Yogyakarta'}</span>
              </div>
              {selectedItem.pelapor && (
                <div className="text-slate-700">
                  <span className="text-slate-400">Nama:</span> <strong className="font-semibold">{selectedItem.pelapor}</strong>
                </div>
              )}
              {selectedItem.type === 'relawan' && selectedItem.kategori && (
                <div className="text-slate-700">
                  <span className="text-slate-400">Keahlian:</span> <span className="font-medium text-slate-800">{selectedItem.kategori}</span>
                </div>
              )}
              {selectedItem.status && (
                <div className="text-slate-700 flex items-center gap-1.5">
                  <span className="text-slate-400">Status:</span>{' '}
                  <span className={`font-semibold capitalize ${isRelawanBusy ? 'text-blue-700 font-bold' : ''}`}>
                    {formatStatusText(selectedItem.status)}
                  </span>
                </div>
              )}
              {assignedVolunteerName && (
                <div className="text-slate-700 flex items-center gap-1.5">
                  <span className="text-slate-400">Relawan:</span>
                  <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
                    {assignedVolunteerName}
                  </span>
                </div>
              )}

              {/* Info Misi Aktif Relawan */}
              {selectedItem.type === 'relawan' && (
                volunteerMission ? (
                  <div className="mt-2 rounded-lg border border-blue-200/90 bg-blue-50/70 p-2.5 text-[11px] shadow-2xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/70 font-bold text-blue-950">
                      <div className="flex items-center gap-1.5">
                        <Activity size={13} className="text-blue-700 shrink-0" />
                        <span>Misi Tanggap Darurat</span>
                      </div>
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9.5px] font-extrabold text-blue-800">
                        {volunteerMission.displayId}
                      </span>
                    </div>
                    <div className="mt-1.5 space-y-1 text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Kasus:</span>
                        <strong className="text-slate-900">{volunteerMission.displayId} {volunteerMission.kategori ? `• ${volunteerMission.kategori}` : ''}</strong>
                      </div>
                      {volunteerMission.pelapor && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Pelapor/Korban:</span>
                          <span className="font-semibold text-slate-800">{volunteerMission.pelapor}</span>
                        </div>
                      )}
                      {volunteerMission.lokasi && (
                        <div className="pt-0.5 text-[10.5px] text-slate-600 flex items-start gap-1">
                          <MapPin size={11} className="text-blue-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{volunteerMission.lokasi}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-1.5 rounded bg-emerald-50 border border-emerald-200 p-2 text-[10.5px] text-emerald-800 font-medium">
                    <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                    <span>Relawan dalam kondisi siaga bebas dan siap ditugaskan sewaktu-waktu.</span>
                  </div>
                )
              )}

              {/* Relawan Terdekat Section (Muncul saat kasus SOS / Laporan diklik) */}
              {(selectedItem.type === 'sos' || selectedItem.type === 'laporan') && (
                <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-2">
                  <div className="flex items-center justify-between pb-1 border-b border-emerald-100">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-900">
                      <Users size={12} className="text-emerald-600" />
                      <span>Relawan Terdekat</span>
                    </div>
                    <span className="rounded-full bg-emerald-100/90 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      {nearbyLoading ? '...' : `${nearbyVolunteers.length} Personel`}
                    </span>
                  </div>

                  {dispatchSuccess && (
                    <div className="mt-1.5 flex items-center gap-1.5 rounded bg-emerald-100 p-1.5 text-[11px] font-semibold text-emerald-800">
                      <CheckCircle size={13} className="text-emerald-700 shrink-0" />
                      <span>{dispatchSuccess}</span>
                    </div>
                  )}

                  {isHandled && (
                    <div className="mt-1.5 flex items-start gap-1.5 rounded bg-amber-50/90 border border-amber-200/90 p-2 text-[10.5px] text-amber-900">
                      <Info size={13} className="text-amber-700 shrink-0 mt-0.5" />
                      <div className="leading-tight">
                        <span className="font-bold text-amber-950">Kasus sedang ditangani.</span>{' '}
                        <span className="text-amber-800">
                          {assignedVolunteerName ? `Relawan ${assignedVolunteerName} telah ditugaskan. ` : 'Relawan sudah ditugaskan. '}
                          Untuk mengganti relawan, silakan masuk ke{' '}
                          <button
                            type="button"
                            onClick={() => {
                              onOpenDetail?.(selectedItem.id, selectedItem.type, selectedItem);
                              setSelectedItem(null);
                            }}
                            className="font-bold text-amber-950 underline hover:text-[#0b6f61] cursor-pointer"
                          >
                            Detail Kasus
                          </button>.
                        </span>
                      </div>
                    </div>
                  )}

                  {isFinished && (
                    <div className="mt-1.5 flex items-start gap-1.5 rounded bg-slate-100 border border-slate-200 p-2 text-[10.5px] text-slate-700">
                      <Info size={13} className="text-slate-500 shrink-0 mt-0.5" />
                      <span className="font-semibold">
                        Kasus sudah berstatus {selectedItem.status}. Penugasan relawan telah ditutup.
                      </span>
                    </div>
                  )}

                  {nearbyLoading ? (
                    <div className="py-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Mencari relawan dalam radius 10 km...</span>
                    </div>
                  ) : nearbyVolunteers.length > 0 ? (
                    <div className="mt-1.5 space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                      {nearbyVolunteers.slice(0, 3).map((rel, idx) => {
                        const cleanRelNama = rel.nama ? rel.nama.replace(/\s*\(Relawan\)/i, '').trim() : 'Relawan';
                        const isThisRelawanAssigned = Boolean(
                          (selectedItem?.id_relawan && Number(selectedItem.id_relawan) === Number(rel.id)) ||
                          (assignedVolunteerName && cleanRelNama && (
                            cleanRelNama.toLowerCase().includes(assignedVolunteerName.toLowerCase()) ||
                            assignedVolunteerName.toLowerCase().includes(cleanRelNama.toLowerCase())
                          ))
                        );

                        return (
                          <div
                            key={rel.id || idx}
                            className={`flex items-center justify-between gap-1.5 rounded-md border p-1.5 text-[11px] shadow-2xs ${
                              isThisRelawanAssigned
                                ? 'border-emerald-300 bg-emerald-50/70'
                                : 'border-emerald-100/80 bg-white'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-800 truncate block">
                                {cleanRelNama}
                              </span>
                              <span className="text-[10px] text-slate-500 truncate block">
                                {rel.kompetensi || 'Relawan Siaga'}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-emerald-700 block text-[10px]">
                                {rel.jarak_text || (rel.jarak_km ? `${rel.jarak_km} km` : '-')}
                              </span>
                              <span
                                className={`inline-block rounded px-1 text-[9px] font-bold uppercase ${
                                  rel.status === 'siaga'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {rel.status === 'siaga' ? 'Siaga' : 'Bertugas'}
                              </span>
                            </div>
                            {isThisRelawanAssigned ? (
                              <span
                                className="inline-flex items-center gap-1 rounded bg-emerald-100 border border-emerald-300 px-2 py-1 text-[10px] font-bold text-emerald-800 shrink-0 shadow-2xs"
                                title="Relawan ini sedang ditugaskan untuk kasus ini"
                              >
                                <CheckCircle size={10} className="text-emerald-700" />
                                Ditugaskan
                              </span>
                            ) : isLocked ? (
                              <button
                                type="button"
                                disabled={true}
                                className="px-2 py-1 rounded bg-slate-100 text-slate-400 text-[10px] font-bold border border-slate-200 cursor-not-allowed opacity-60 shrink-0"
                                title={
                                  isFinished
                                    ? `Kasus sudah ${selectedItem.status}. Penugasan ditutup.`
                                    : 'Kasus sudah berstatus ditangani. Untuk mengganti relawan, silakan masuk ke Detail Kasus.'
                                }
                              >
                                Tugaskan
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={dispatchingId === rel.id}
                                onClick={() => handleQuickDispatch(rel)}
                                className="px-2 py-1 rounded bg-[#0b6f61] hover:bg-[#095c52] text-white text-[10px] font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs shrink-0"
                                title={`Tugaskan ${cleanRelNama} ke kasus ini`}
                              >
                                {dispatchingId === rel.id ? '...' : 'Tugaskan'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {nearbyVolunteers.length > 3 && (
                        <p className="text-center text-[10px] font-bold text-emerald-700 pt-0.5">
                          +{nearbyVolunteers.length - 3} relawan lain di area ini
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="py-1 text-center text-[10px] font-medium text-slate-500">
                      Tidak ada relawan aktif di dalam radius 10 km.
                    </p>
                  )}

                  {nearbyVolunteers.length > 0 && (
                    <button
                      type="button"
                      onClick={handleFocusNearbyVolunteers}
                      className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-md border border-emerald-300 bg-white py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      <Navigation size={10} className="text-emerald-600" />
                      <span>Fokuskan ke Relawan Terdekat</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Pinned Action Footer: Always Visible */}
            <div className="border-t border-slate-100 bg-slate-50/90 p-2.5 shrink-0">
              {selectedItem.type === 'relawan' ? (
                volunteerMission ? (
                  <div className="flex items-center gap-2">
                    {/* Buka Detail Kasus yang Ditangani Relawan */}
                    <button
                      type="button"
                      onClick={() => {
                        onOpenDetail?.(volunteerMission.id, volunteerMission.type, volunteerMission);
                        setSelectedItem(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#0b6f61] hover:bg-[#095c52] py-1.5 px-2 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
                      title={`Buka detail kasus ${volunteerMission.displayId} yang ditangani oleh ${selectedItem.pelapor || selectedItem.label}`}
                    >
                      <Eye size={13} />
                      <span className="truncate">Detail Kasus ({volunteerMission.displayId})</span>
                    </button>

                    {/* Kelola Akun/Profil Relawan */}
                    <button
                      type="button"
                      onClick={() => {
                        onOpenDetail?.(selectedItem.id, 'relawan', selectedItem);
                        setSelectedItem(null);
                      }}
                      className="flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 py-1.5 px-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer shrink-0"
                      title="Lihat data relawan di halaman Kelola Relawan"
                    >
                      <Users size={13} className="text-slate-500" />
                      <span>Kelola Relawan</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenDetail?.(selectedItem.id, 'relawan', selectedItem);
                      setSelectedItem(null);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0b6f61] hover:bg-[#095c52] py-1.5 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
                    title="Buka data relawan di halaman Kelola Relawan"
                  >
                    <Users size={13} />
                    <span>Kelola Relawan</span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenDetail?.(selectedItem.id, selectedItem.type, selectedItem);
                    setSelectedItem(null);
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0b6f61] hover:bg-[#095c52] py-1.5 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
                >
                  <Eye size={13} />
                  <span>
                    {selectedItem.type === 'sos' ? 'Buka Detail Kasus SOS' : 'Buka Detail Laporan'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Legend & Status Bar (Interaktif & Selaras dengan Marker Peta) ── */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-100 bg-[#f8fafc]/95 px-3 py-2 text-[11px] font-semibold text-slate-600 gap-2">
        {/* Left: Interactive Legend Filter Groups */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Semua Titik Button */}
          <button
            type="button"
            onClick={() => setActiveStatusFilter('all')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer select-none border ${
              activeStatusFilter === 'all'
                ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200/90 shadow-2xs'
            }`}
            title="Tampilkan semua marker di peta"
          >
            <Layers size={13} className={activeStatusFilter === 'all' ? 'text-white' : 'text-slate-500'} />
            <span>Semua</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold min-w-[18px] text-center leading-none ${
              activeStatusFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {mapData?.length || 0}
            </span>
          </button>

          {/* SOS Cluster */}
          <div className="inline-flex items-center gap-1 rounded-xl bg-white p-1 border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100/80 px-1.5 py-0.5 rounded-md select-none">
              SOS
            </span>

            {/* SOS Belum Ditangani (Merah) */}
            <button
              type="button"
              onClick={() => handleToggleStatusFilter('sos_belum')}
              className={`group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition-all cursor-pointer select-none ${
                activeStatusFilter === 'sos_belum'
                  ? 'bg-red-100 text-red-950 ring-2 ring-red-500 shadow-xs'
                  : activeStatusFilter !== 'all'
                  ? 'opacity-40 hover:opacity-100 hover:bg-slate-50 text-slate-500'
                  : 'hover:bg-slate-50 hover:shadow-2xs text-slate-700'
              }`}
              title="Klik untuk memfilter: Hanya SOS Belum Ditangani"
            >
              <div className="w-5 h-5 rounded-full bg-[#dc2626] border border-white shadow-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <span>Belum Ditangani</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold min-w-[18px] text-center leading-none ${
                activeStatusFilter === 'sos_belum' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {sosBelumCount}
              </span>
            </button>

            {/* SOS Ditangani (Hijau) */}
            <button
              type="button"
              onClick={() => handleToggleStatusFilter('sos_ditangani')}
              className={`group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition-all cursor-pointer select-none ${
                activeStatusFilter === 'sos_ditangani'
                  ? 'bg-emerald-100 text-emerald-950 ring-2 ring-emerald-500 shadow-xs'
                  : activeStatusFilter !== 'all'
                  ? 'opacity-40 hover:opacity-100 hover:bg-slate-50 text-slate-500'
                  : 'hover:bg-slate-50 hover:shadow-2xs text-slate-700'
              }`}
              title="Klik untuk memfilter: Hanya SOS Ditangani"
            >
              <div className="w-5 h-5 rounded-full bg-[#10b981] border border-white shadow-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <span>Ditangani</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold min-w-[18px] text-center leading-none ${
                activeStatusFilter === 'sos_ditangani' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {sosDitanganiCount}
              </span>
            </button>
          </div>

          {/* Laporan Cluster */}
          <div className="inline-flex items-center gap-1 rounded-xl bg-white p-1 border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100/80 px-1.5 py-0.5 rounded-md select-none">
              Laporan
            </span>

            {/* Laporan Belum Ditangani (Orange) */}
            <button
              type="button"
              onClick={() => handleToggleStatusFilter('laporan_belum')}
              className={`group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition-all cursor-pointer select-none ${
                activeStatusFilter === 'laporan_belum'
                  ? 'bg-orange-100 text-orange-950 ring-2 ring-orange-500 shadow-xs'
                  : activeStatusFilter !== 'all'
                  ? 'opacity-40 hover:opacity-100 hover:bg-slate-50 text-slate-500'
                  : 'hover:bg-slate-50 hover:shadow-2xs text-slate-700'
              }`}
              title="Klik untuk memfilter: Hanya Laporan Belum Ditangani"
            >
              <div className="w-5 h-5 rounded-full bg-[#ea580c] border border-white shadow-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <span>Belum Ditangani</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold min-w-[18px] text-center leading-none ${
                activeStatusFilter === 'laporan_belum' ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {laporanBelumCount}
              </span>
            </button>

            {/* Laporan Ditangani (Hijau) */}
            <button
              type="button"
              onClick={() => handleToggleStatusFilter('laporan_ditangani')}
              className={`group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition-all cursor-pointer select-none ${
                activeStatusFilter === 'laporan_ditangani'
                  ? 'bg-emerald-100 text-emerald-950 ring-2 ring-emerald-500 shadow-xs'
                  : activeStatusFilter !== 'all'
                  ? 'opacity-40 hover:opacity-100 hover:bg-slate-50 text-slate-500'
                  : 'hover:bg-slate-50 hover:shadow-2xs text-slate-700'
              }`}
              title="Klik untuk memfilter: Hanya Laporan Ditangani"
            >
              <div className="w-5 h-5 rounded-full bg-[#10b981] border border-white shadow-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <span>Ditangani</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold min-w-[18px] text-center leading-none ${
                activeStatusFilter === 'laporan_ditangani' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {laporanDitanganiCount}
              </span>
            </button>
          </div>

          {/* Relawan Cluster */}
          <div className="inline-flex items-center gap-1 rounded-xl bg-white p-1 border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-100/80 px-1.5 py-0.5 rounded-md select-none">
              Relawan
            </span>

            {/* Relawan Siaga (Hijau) */}
            <button
              type="button"
              onClick={() => handleToggleStatusFilter('relawan_siaga')}
              className={`group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition-all cursor-pointer select-none ${
                activeStatusFilter === 'relawan_siaga'
                  ? 'bg-emerald-100 text-emerald-950 ring-2 ring-emerald-600 shadow-xs'
                  : activeStatusFilter !== 'all'
                  ? 'opacity-40 hover:opacity-100 hover:bg-slate-50 text-slate-500'
                  : 'hover:bg-slate-50 hover:shadow-2xs text-slate-700'
              }`}
              title="Klik untuk memfilter: Hanya Relawan Siaga"
            >
              <div className="w-5 h-5 rounded-full bg-[#059669] border border-white shadow-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span>Siaga</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold min-w-[18px] text-center leading-none ${
                activeStatusFilter === 'relawan_siaga' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {relawanSiagaCount}
              </span>
            </button>

            {/* Relawan Menangani (Orange) */}
            <button
              type="button"
              onClick={() => handleToggleStatusFilter('relawan_menangani')}
              className={`group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition-all cursor-pointer select-none ${
                activeStatusFilter === 'relawan_menangani'
                  ? 'bg-orange-100 text-orange-950 ring-2 ring-orange-500 shadow-xs'
                  : activeStatusFilter !== 'all'
                  ? 'opacity-40 hover:opacity-100 hover:bg-slate-50 text-slate-500'
                  : 'hover:bg-slate-50 hover:shadow-2xs text-slate-700'
              }`}
              title="Klik untuk memfilter: Hanya Relawan yang Sedang Menangani"
            >
              <div className="w-5 h-5 rounded-full bg-[#ea580c] border border-white shadow-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span>Menangani</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold min-w-[18px] text-center leading-none ${
                activeStatusFilter === 'relawan_menangani' ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {relawanMenanganiCount}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Reset Filter Pill (hanya tampil jika ada filter yang aktif) */}
        {activeStatusFilter !== 'all' && (
          <div className="flex items-center ml-auto">
            <button
              type="button"
              onClick={() => setActiveStatusFilter('all')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Reset dan tampilkan semua marker"
            >
              <X size={12} />
              <span>Reset Filter</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
