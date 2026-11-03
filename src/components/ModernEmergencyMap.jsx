import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation, Plus, Minus, RotateCcw, Eye, Phone,
  AlertTriangle, Shield, HeartPulse, Clock, X, Radio,
  MessageCircle, MapPin, Layers, Users, Loader2
} from 'lucide-react';

// Pusat Default Wilayah D.I. Yogyakarta (Tugu / Malioboro)
export const DEFAULT_MAP_CENTER = [-7.7956, 110.3695];
export const DEFAULT_STREET_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
export const DEFAULT_SATELLITE_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export default function ModernEmergencyMap({
  height = '300px',
  fullscreen = false,
  popupClassName = '',
  onOpenDetail,
  onSelectMarker,
  focusTarget = null,
  showFilterBar = true,
  showLegend = true,
  showControls = true,
  controlsPosition = 'top-right', // 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className = '',
  mapData = [],
  center = DEFAULT_MAP_CENTER,
  streetTileUrl = DEFAULT_STREET_TILE_URL,
  satelliteTileUrl = DEFAULT_SATELLITE_TILE_URL,
  activeFilter: controlledActiveFilter,
  onFilterChange,
  mapMode: controlledMapMode,
  onMapModeChange,
  selectedItem: controlledSelectedItem,
  onSelectItem,
  children
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const hasInitialBoundsRef = useRef(false);

  const [internalMapMode, setInternalMapMode] = useState('street'); // 'street' | 'satellite'
  const [internalActiveFilter, setInternalActiveFilter] = useState('semua');
  const [internalSelectedItem, setInternalSelectedItem] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const activeFilter = controlledActiveFilter !== undefined ? controlledActiveFilter : internalActiveFilter;
  const prevFilterRef = useRef(activeFilter);
  const mapMode = controlledMapMode !== undefined ? controlledMapMode : internalMapMode;
  const selectedItem = controlledSelectedItem !== undefined ? controlledSelectedItem : internalSelectedItem;

  const handleSetFilter = (newFilter) => {
    if (onFilterChange) onFilterChange(newFilter);
    else setInternalActiveFilter(newFilter);
  };

  const handleSetMapMode = (newMode) => {
    if (onMapModeChange) onMapModeChange(newMode);
    else setInternalMapMode(newMode);
  };

  const handleSetSelectedItem = (item) => {
    if (onSelectItem) onSelectItem(item);
    else setInternalSelectedItem(item);
  };

  const activeMapData = Array.isArray(mapData) ? mapData : [];

  // 1. Initialize Leaflet Map (Centered on Yogyakarta)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
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
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Auto-Resize Observer: Mencegah peta abu-abu / rusak saat panel samping di-toggle atau layar berubah
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;

    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });

    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // 3. Handle Mode Layer Toggle (Peta Jalan vs Satelit)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const currentUrl = mapMode === 'satellite' ? satelliteTileUrl : streetTileUrl;
    tileLayerRef.current = L.tileLayer(currentUrl, {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri',
    }).addTo(mapInstanceRef.current);
  }, [mapMode]);

  // 4. Handle focusTarget (e.g. Relawan atau Kasus diklik dari panel samping)
  useEffect(() => {
    if (!mapInstanceRef.current || !focusTarget) return;

    const lat = focusTarget.lat ?? focusTarget.latitude;
    const lng = focusTarget.lng ?? focusTarget.longitude;

    if (lat && lng && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
      const targetZoom = focusTarget.zoom || 15;
      mapInstanceRef.current.flyTo([Number(lat), Number(lng)], targetZoom, { duration: 0.8 });

      // Temukan item terkait dari mapData jika ada
      const targetId = focusTarget.id;
      const foundItem = activeMapData.find(d =>
        (targetId && (d.id === targetId || d.id === `REL-${targetId}` || d.displayId === targetId)) ||
        (Math.abs(d.lat - Number(lat)) < 0.0001 && Math.abs(d.lng - Number(lng)) < 0.0001)
      );

      if (foundItem) {
        handleSetSelectedItem(foundItem);
      } else {
        // Fallback item info dari focusTarget
        handleSetSelectedItem({
          id: focusTarget.id ? `REL-${focusTarget.id}` : 'FOCUS-ITEM',
          displayId: focusTarget.nama || focusTarget.label || 'Relawan',
          type: focusTarget.type || 'relawan',
          label: focusTarget.nama || focusTarget.label || 'Relawan Siaga',
          kategori: focusTarget.peran || focusTarget.kompetensi || focusTarget.kategori || 'Relawan Siaga',
          prioritas: focusTarget.status === 'Bertugas' ? 'Bertugas' : 'Siaga',
          pelapor: focusTarget.nama || 'Unit Relawan',
          lokasi: focusTarget.lokasi || focusTarget.lokasi_user || 'Area Siaga D.I. Yogyakarta',
          status: focusTarget.status || 'Siaga',
          relawan: focusTarget.nama,
          eta: focusTarget.eta || 'Siaga Aktif',
          lat: Number(lat),
          lng: Number(lng),
          kontak: focusTarget.kontak || focusTarget.no_telp,
        });
      }
    }
  }, [focusTarget, activeMapData]);

  // 5. Update Markers whenever filter or mapData changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    const bounds = L.latLngBounds();

    const filtered = activeMapData.filter(item => {
      if (activeFilter === 'semua') return true;
      if (activeFilter === 'sos') return item.type === 'sos';
      if (activeFilter === 'relawan') return item.type === 'relawan';
      if (activeFilter === 'laporan') return item.type === 'laporan';

      const isSos = item.type === 'sos';
      const isRelawan = item.type === 'relawan';
      const isLaporan = item.type === 'laporan' || (!isSos && !isRelawan);

      if (isSos) {
        const itemStatus = String(item.status || '').toLowerCase().trim();
        const isDitangani = itemStatus === 'ditangani' || itemStatus === 'proses' || Boolean(item.relawan && item.relawan !== 'Menunggu Penugasan' && item.relawan !== '-');
        if (activeFilter === 'sos_belum') return !isDitangani;
        if (activeFilter === 'sos_ditangani') return isDitangani;
        return false;
      }

      if (isRelawan) {
        const itemStatus = String(item.status || '').toLowerCase().trim();
        const isMenangani = itemStatus === 'dalam_misi' ||
          itemStatus === 'sedang_bertugas' ||
          itemStatus === 'bertugas' ||
          itemStatus === 'sedang bertugas' ||
          Boolean(item.misi && (item.misi.id || item.misi.id_kasus));
        if (activeFilter === 'relawan_menangani') return isMenangani;
        if (activeFilter === 'relawan_siaga') return !isMenangani;
        return false;
      }

      if (isLaporan) {
        const itemStatus = String(item.status || '').toLowerCase().trim();
        const isDitangani = itemStatus === 'ditangani' || itemStatus === 'proses' || Boolean(item.relawan && item.relawan !== 'Menunggu Penugasan' && item.relawan !== '-');
        if (activeFilter === 'laporan_belum') return !isDitangani;
        if (activeFilter === 'laporan_ditangani') return isDitangani;
        return false;
      }

      return true;
    });

    filtered.forEach(item => {
      if (!item.lat || !item.lng) return;

      let iconHtml = '';

      if (item.type === 'sos') {
        const itemStatus = (selectedItem && selectedItem.id === item.id && selectedItem.type === 'sos')
          ? selectedItem.status
          : item.status;
        const statusLower = String(itemStatus || '').toLowerCase().trim();
        const isSosDitangani = statusLower === 'ditangani' || statusLower === 'proses' || Boolean(item.relawan && item.relawan !== 'Menunggu Penugasan' && item.relawan !== '-');
        const markerClass = isSosDitangani ? 'command-map-marker sos-marker sos-ditangani group' : 'command-map-marker sos-marker sos-belum-ditangani group';
        const rippleClass = isSosDitangani ? 'emergency-beacon-ripple success-ripple' : 'emergency-beacon-ripple';
        const subStatusText = isSosDitangani ? 'Ditangani' : 'Belum Ditangani';

        // SOS Marker
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
            <div class="marker-tag">${item.displayId || item.id || '#SOS'}</div>
          </div>
        `;
      } else if (item.type === 'relawan') {
        // Relawan: Orange ketika baru menangani, Hijau ketika siaga
        const itemStatus = (selectedItem && selectedItem.id === item.id && selectedItem.type === 'relawan')
          ? selectedItem.status
          : item.status;
        const statusLower = String(itemStatus || '').toLowerCase().trim();
        const isRelawanMenangani = statusLower === 'dalam_misi' ||
          statusLower === 'sedang_bertugas' ||
          statusLower === 'bertugas' ||
          statusLower === 'sedang bertugas' ||
          Boolean(item.misi && (item.misi.id || item.misi.id_kasus));
        const markerClass = isRelawanMenangani
          ? 'command-map-marker relawan-marker relawan-menangani group'
          : 'command-map-marker relawan-marker relawan-siaga group';
        const rippleClass = isRelawanMenangani ? 'emergency-beacon-ripple warning-ripple' : '';

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
            <div class="marker-tag">${item.label || item.pelapor || item.displayId || 'Relawan'}</div>
          </div>
        `;
      } else {
        // Laporan: Orange ketika belum ditangani, Hijau ketika ditangani
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
        const rippleClass = isLaporanDitangani ? 'emergency-beacon-ripple success-ripple' : 'emergency-beacon-ripple warning-ripple';

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
            <div class="marker-tag">${item.displayId || item.label || item.id || '#Laporan'}</div>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        className: 'custom-emergency-div-icon',
        html: iconHtml,
        iconSize: [140, 56],
        iconAnchor: [70, 18],
      });

      const marker = L.marker([item.lat, item.lng], { icon: customIcon });

      marker.on('click', () => {
        handleSetSelectedItem(item);
        mapInstanceRef.current?.flyTo([item.lat, item.lng], 15, { duration: 0.8 });
        onSelectMarker?.(item);
      });

      markersLayerRef.current.addLayer(marker);
      bounds.extend([item.lat, item.lng]);
    });

    // Responsif fokus batas peta saat filter status dipilih atau saat pertama kali render
    if (prevFilterRef.current !== activeFilter) {
      prevFilterRef.current = activeFilter;
      if (filtered.length > 0 && bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    } else if (!hasInitialBoundsRef.current && filtered.length > 0 && bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      hasInitialBoundsRef.current = true;
    }
  }, [activeFilter, activeMapData, onSelectMarker, selectedItem?.status, selectedItem?.id]);

  // Map Navigation Functions
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleResetView = () => {
    if (activeMapData.length > 0) {
      const bounds = L.latLngBounds();
      activeMapData.forEach(item => {
        if (item.lat && item.lng) bounds.extend([item.lat, item.lng]);
      });
      if (bounds.isValid()) {
        mapInstanceRef.current?.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
        handleSetSelectedItem(null);
        return;
      }
    }
    mapInstanceRef.current?.flyTo(YOGYAKARTA_CENTER, 13, { duration: 0.6 });
    handleSetSelectedItem(null);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const { latitude, longitude } = pos.coords;
          mapInstanceRef.current?.flyTo([latitude, longitude], 15, { duration: 0.8 });
        },
        () => {
          setIsLocating(false);
          handleResetView();
        },
        { timeout: 8000 }
      );
    } else {
      handleResetView();
    }
  };

  // Counts for legend & filters
  const countSos = activeMapData.filter(d => d.type === 'sos').length;
  const countRelawan = activeMapData.filter(d => d.type === 'relawan').length;
  const countLaporan = activeMapData.filter(d => d.type === 'laporan').length;

  const countSosBelum = activeMapData.filter(d => d.type === 'sos' && d.status !== 'ditangani' && d.status !== 'proses' && !(d.relawan && d.relawan !== 'Menunggu Penugasan' && d.relawan !== '-')).length;
  const countSosDitangani = activeMapData.filter(d => d.type === 'sos' && (d.status === 'ditangani' || d.status === 'proses' || (d.relawan && d.relawan !== 'Menunggu Penugasan' && d.relawan !== '-'))).length;

  const countLaporanBelum = activeMapData.filter(d => d.type === 'laporan' && d.status !== 'ditangani' && d.status !== 'proses' && !(d.relawan && d.relawan !== 'Menunggu Penugasan' && d.relawan !== '-')).length;
  const countLaporanDitangani = activeMapData.filter(d => d.type === 'laporan' && (d.status === 'ditangani' || d.status === 'proses' || (d.relawan && d.relawan !== 'Menunggu Penugasan' && d.relawan !== '-'))).length;

  const countRelawanMenangani = activeMapData.filter(d => {
    if (d.type !== 'relawan') return false;
    return d.status === 'dalam_misi' || d.status === 'sedang_bertugas' || d.status === 'Bertugas' || d.status === 'Sedang Bertugas' || Boolean(d.misi && (d.misi.id || d.misi.id_kasus));
  }).length;
  const countRelawanSiaga = Math.max(0, countRelawan - countRelawanMenangani);

  const POSITION_MAP = {
    'top-right': fullscreen ? 'top-24 right-4' : 'top-4 right-4',
    'top-left': fullscreen ? 'top-24 left-4' : 'top-4 left-4',
    'bottom-right': 'bottom-6 right-4',
    'bottom-left': 'bottom-16 left-4',
  };

  const controlsPosClasses = POSITION_MAP[controlsPosition] || controlsPosition || 'top-4 right-4';

  return (
    <div className={`relative flex w-full min-w-0 flex-col overflow-hidden ${
      fullscreen
        ? 'h-full border-0 rounded-none bg-slate-900 shadow-none'
        : 'rounded-2xl border border-[#eaedf1] bg-white shadow-xs'
    } ${className}`}>
      {/* ── Top Header Controls & Filter Bar (Only shown if showFilterBar is true) ── */}
      {showFilterBar && (
        <div className="p-3.5 border-b border-[#f1f5f9] flex flex-wrap items-center justify-between gap-3 bg-white z-10 shrink-0">
          {/* Filter Pills */}
          <div className="filter-pills flex-1 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleSetFilter('semua')}
              className={`filter-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${activeFilter === 'semua' ? 'is-active' : ''}`}
            >
              Semua ({activeMapData.length})
            </button>
            <button
              type="button"
              onClick={() => handleSetFilter('sos')}
              className={`filter-pill tone-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${activeFilter === 'sos' ? 'is-active' : ''}`}
            >
              SOS Aktif ({countSos})
            </button>
            <button
              type="button"
              onClick={() => handleSetFilter('relawan')}
              className={`filter-pill tone-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${activeFilter === 'relawan' ? 'is-active' : ''}`}
            >
              Relawan ({countRelawan})
            </button>
            <button
              type="button"
              onClick={() => handleSetFilter('laporan')}
              className={`filter-pill tone-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${activeFilter === 'laporan' ? 'is-active' : ''}`}
            >
              Laporan ({countLaporan})
            </button>
          </div>

          {/* Segmented Button: Peta Jalan / Satelit */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600 shrink-0">
            <button
              type="button"
              onClick={() => handleSetMapMode('street')}
              className={`rounded-lg px-3 py-1.5 min-h-[32px] text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                mapMode === 'street'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Peta Jalan
            </button>
            <button
              type="button"
              onClick={() => handleSetMapMode('satellite')}
              className={`rounded-lg px-3 py-1.5 min-h-[32px] text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
                mapMode === 'satellite'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satelit
            </button>
          </div>
        </div>
      )}

      {/* ── Map Canvas Container ── */}
      <div
        className="relative isolate w-full h-full flex-1 overflow-hidden"
        style={!fullscreen && height ? { height } : undefined}
      >
        {/* Leaflet container */}
        <div ref={mapContainerRef} className="w-full h-full relative z-0" />

        {/* Floating Zoom & Center Controls */}
        {showControls && (
          <div className={`absolute ${controlsPosClasses} flex flex-col gap-2 z-20 select-none`}>
            {/* Kelompok Kontrol Zoom */}
            <div className="flex flex-col bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-md shadow-slate-900/5 overflow-hidden">
              <button
                type="button"
                onClick={handleZoomIn}
                className="h-9 w-9 sm:h-[38px] sm:w-[38px] flex items-center justify-center text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 active:bg-slate-200/60 active:scale-95 transition-all cursor-pointer border-b border-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-inset"
                title="Perbesar Peta (Zoom In)"
                aria-label="Perbesar Peta"
              >
                <Plus size={16} strokeWidth={2.2} />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="h-9 w-9 sm:h-[38px] sm:w-[38px] flex items-center justify-center text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 active:bg-slate-200/60 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-inset"
                title="Perkecil Peta (Zoom Out)"
                aria-label="Perkecil Peta"
              >
                <Minus size={16} strokeWidth={2.2} />
              </button>
            </div>

            {/* Kelompok Kontrol Navigasi & Orientasi */}
            <div className="flex flex-col bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-md shadow-slate-900/5 overflow-hidden">
              <button
                type="button"
                onClick={handleCurrentLocation}
                disabled={isLocating}
                className={`h-9 w-9 sm:h-[38px] sm:w-[38px] flex items-center justify-center transition-all cursor-pointer border-b border-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-inset ${
                  isLocating
                    ? 'text-emerald-600 bg-emerald-50/70'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-emerald-700 active:bg-slate-200/60 active:scale-95'
                }`}
                title="Lokasi Anda Sekarang (GPS)"
                aria-label="Lokasi Anda Sekarang"
              >
                {isLocating ? (
                  <Loader2 size={15} className="animate-spin text-emerald-600" />
                ) : (
                  <Navigation size={15} strokeWidth={2} />
                )}
              </button>
              <button
                type="button"
                onClick={handleResetView}
                className="h-9 w-9 sm:h-[38px] sm:w-[38px] flex items-center justify-center text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 active:bg-slate-200/60 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-inset"
                title="Pusatkan Peta ke D.I. Yogyakarta"
                aria-label="Pusatkan Peta ke D.I. Yogyakarta"
              >
                <RotateCcw size={15} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* Arbitrary Child Overlays */}
        {children}

        {/* ── Interactive Popup / Detail Card when marker is clicked ── */}
        {selectedItem && (() => {
          const s = String(selectedItem.status || '').toLowerCase().trim();
          const isSelectedRelawanBusy = selectedItem.type === 'relawan' && (
            s === 'bertugas' ||
            s === 'sedang bertugas' ||
            s === 'sedang_bertugas' ||
            s === 'dalam_misi' ||
            Boolean(selectedItem.misi && (selectedItem.misi.id || selectedItem.misi.id_kasus))
          );

          return (
            <div className={`absolute z-30 max-w-85 w-[calc(100%-1.75rem)] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-4 animate-fade-in max-h-[calc(100%-70px)] overflow-y-auto ${
              popupClassName || (fullscreen ? 'left-3.5 bottom-14.5' : 'left-3.5 bottom-3.5')
            }`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[13px] text-slate-900">{selectedItem.displayId || selectedItem.label || selectedItem.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedItem.type === 'sos' ? 'bg-red-500 text-white' :
                      selectedItem.type === 'relawan'
                        ? (isSelectedRelawanBusy ? 'bg-orange-600 text-white' : 'bg-emerald-600 text-white')
                        : 'bg-amber-500 text-white'
                    }`}>
                      {selectedItem.type === 'relawan'
                        ? (isSelectedRelawanBusy ? 'Bertugas' : 'Siaga')
                        : selectedItem.status}
                    </span>
                  </div>
                  <h4 className="text-[13px] font-bold text-slate-800 mt-1 leading-snug">{selectedItem.kategori}</h4>
                </div>
                <button
                  onClick={() => handleSetSelectedItem(null)}
                  aria-label="Tutup jendela detail"
                  className="min-h-[36px] min-w-[36px] -mr-1.5 -mt-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Info Body */}
              {selectedItem.type === 'relawan' ? (
                <div className="py-2.5 text-[12px] text-slate-700 space-y-1.5">
                  <div>
                    <span className="text-slate-600 block text-[11px] font-medium">Nama Relawan:</span>
                    <strong className="text-slate-900 text-[13px]">{selectedItem.relawan || selectedItem.label}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600 block text-[11px] font-medium">Keahlian / Spesialisasi:</span>
                    <span className="text-slate-800 font-medium">{selectedItem.kategori}</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <MapPin size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-[11px] leading-tight">{selectedItem.lokasi || 'Area Siaga D.I. Yogyakarta'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-600 font-medium">Status Operasi:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      isSelectedRelawanBusy
                        ? 'text-orange-800 bg-orange-50 border border-orange-200'
                        : 'text-emerald-800 bg-emerald-50 border border-emerald-200'
                    }`}>
                      {isSelectedRelawanBusy ? 'Sedang Bertugas' : 'Siaga Aktif'}
                    </span>
                  </div>
                  {selectedItem.misi && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-[11px] text-blue-900 mt-1 space-y-1">
                      <div className="flex items-center justify-between font-bold text-blue-950">
                        <span>Misi Tanggap Darurat</span>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenDetail?.(selectedItem.misi.id, selectedItem.misi.tipe || 'sos', selectedItem.misi);
                            handleSetSelectedItem(null);
                          }}
                          className="underline text-blue-800 hover:text-blue-950 cursor-pointer font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] rounded"
                        >
                          {selectedItem.misi.id_kasus}
                        </button>
                      </div>
                      {selectedItem.misi.pelapor && (
                        <div className="text-[10.5px] text-slate-700">
                          Korban/Pelapor: <strong className="text-slate-900">{selectedItem.misi.pelapor}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2.5 text-[12px] text-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Prioritas:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      selectedItem.prioritas === 'DARURAT' || selectedItem.type === 'sos'
                        ? 'text-red-800 bg-red-50 border border-red-200'
                        : 'text-amber-800 bg-amber-50 border border-amber-200'
                    }`}>
                      {selectedItem.prioritas || 'Prioritas'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 block text-[11px] font-medium">Nama Pelapor / Korban:</span>
                    <strong className="text-slate-900">{selectedItem.pelapor}</strong>
                  </div>
                  <div className="flex items-start gap-1">
                    <MapPin size={13} className="text-slate-600 shrink-0 mt-0.5" />
                    <span className="text-slate-800 text-[11px] leading-tight">{selectedItem.lokasi}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-600 font-medium">Relawan: <strong className="text-slate-900">{selectedItem.relawan}</strong></span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                      ETA {selectedItem.eta}
                    </span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2.5 border-t border-slate-100 space-y-2">
                {/* Baris 1: Tombol Panggilan Seluler & WhatsApp jika ada kontak */}
                {selectedItem.type === 'relawan' && selectedItem.kontak && (
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${selectedItem.kontak}`}
                      className="flex-1 btn-base bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] min-h-[38px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-2"
                      title={`Panggil ${selectedItem.relawan || selectedItem.label}`}
                    >
                      <Phone size={13} />
                      <span>Telepon</span>
                    </a>
                    <a
                      href={`https://wa.me/${String(selectedItem.kontak).replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo ${selectedItem.relawan || selectedItem.label}, kami dari Command Center Sahabat SOS D.I. Yogyakarta.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 btn-base bg-teal-600 hover:bg-teal-700 text-white text-[11px] min-h-[38px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-2"
                      title={`WhatsApp ${selectedItem.relawan || selectedItem.label}`}
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                )}

                {/* Baris 2: Tombol Navigasi Kasus & Kelola */}
                {selectedItem.type === 'relawan' ? (
                  <div className="flex items-center gap-2">
                    {selectedItem.misi ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenDetail?.(selectedItem.misi.id, selectedItem.misi.tipe || 'sos', selectedItem.misi);
                            handleSetSelectedItem(null);
                          }}
                          className="flex-1 btn-base bg-[#0b6f61] hover:bg-[#095c52] text-white text-[11px] min-h-[38px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold shadow-2xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-2"
                          title={`Buka detail kasus ${selectedItem.misi.id_kasus || 'aktif'}`}
                        >
                          <Eye size={13} />
                          <span className="truncate">Detail Kasus ({selectedItem.misi.id_kasus || 'Misi'})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenDetail?.(selectedItem.id, 'relawan', selectedItem);
                            handleSetSelectedItem(null);
                          }}
                          className="btn-base bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] min-h-[38px] py-2 px-3 rounded-xl flex items-center justify-center gap-1 font-semibold transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-2"
                          title="Buka data relawan di halaman Kelola Relawan"
                        >
                          <Users size={13} className="text-slate-600" />
                          <span>Kelola</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenDetail?.(selectedItem.id, 'relawan', selectedItem);
                          handleSetSelectedItem(null);
                        }}
                        className="w-full btn-base btn-primary text-[12px] min-h-[38px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-2"
                      >
                        <Eye size={13} />
                        <span>Kelola Relawan</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenDetail?.(selectedItem.id, selectedItem.type, selectedItem);
                      handleSetSelectedItem(null);
                    }}
                    className="w-full btn-base btn-primary text-[12px] min-h-[38px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-2"
                  >
                    <Eye size={13} />
                    <span>Lihat Detail</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Bottom Legend (Only shown if showLegend is true) ── */}
      {showLegend && (
        <div className="px-4 py-2 bg-[#f8fafc] border-t border-[#eaedf1] flex items-center justify-center text-[11px] font-semibold text-slate-600 flex-wrap gap-1.5 sm:gap-2 z-10 shrink-0">
          <button
            type="button"
            onClick={() => handleSetFilter(activeFilter === 'laporan_belum' ? 'semua' : 'laporan_belum')}
            className={`group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 min-h-[34px] text-[11px] font-bold transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
              activeFilter === 'laporan_belum'
                ? 'bg-orange-100 text-orange-950 ring-2 ring-orange-500 shadow-xs scale-102'
                : activeFilter !== 'semua'
                ? 'opacity-60 hover:opacity-100 hover:bg-white text-slate-600'
                : 'hover:bg-white hover:shadow-xs text-slate-700'
            }`}
            title="Klik untuk memfilter: Hanya Laporan Belum Ditangani"
          >
            <div className="w-5 h-5 rounded-full bg-[#ea580c] border border-white shadow-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <span>Laporan Belum Ditangani</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeFilter === 'laporan_belum' ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {countLaporanBelum}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSetFilter(activeFilter === 'laporan_ditangani' ? 'semua' : 'laporan_ditangani')}
            className={`group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 min-h-[34px] text-[11px] font-bold transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
              activeFilter === 'laporan_ditangani'
                ? 'bg-emerald-100 text-emerald-950 ring-2 ring-emerald-500 shadow-xs scale-102'
                : activeFilter !== 'semua'
                ? 'opacity-60 hover:opacity-100 hover:bg-white text-slate-600'
                : 'hover:bg-white hover:shadow-xs text-slate-700'
            }`}
            title="Klik untuk memfilter: Hanya Laporan Ditangani"
          >
            <div className="w-5 h-5 rounded-full bg-[#10b981] border border-white shadow-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <span>Laporan Ditangani</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeFilter === 'laporan_ditangani' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {countLaporanDitangani}
            </span>
          </button>

          <span className="hidden md:inline-block w-px h-4 bg-slate-200" />

          <button
            type="button"
            onClick={() => handleSetFilter(activeFilter === 'relawan_siaga' ? 'semua' : 'relawan_siaga')}
            className={`group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 min-h-[34px] text-[11px] font-bold transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
              activeFilter === 'relawan_siaga'
                ? 'bg-emerald-100 text-emerald-950 ring-2 ring-emerald-600 shadow-xs scale-102'
                : activeFilter !== 'semua'
                ? 'opacity-60 hover:opacity-100 hover:bg-white text-slate-600'
                : 'hover:bg-white hover:shadow-xs text-slate-700'
            }`}
            title="Klik untuk memfilter: Hanya Relawan Siaga"
          >
            <div className="w-5 h-5 rounded-full bg-[#059669] border border-white shadow-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span>Relawan Siaga</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeFilter === 'relawan_siaga' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {countRelawanSiaga}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSetFilter(activeFilter === 'relawan_menangani' ? 'semua' : 'relawan_menangani')}
            className={`group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 min-h-[34px] text-[11px] font-bold transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
              activeFilter === 'relawan_menangani'
                ? 'bg-orange-100 text-orange-950 ring-2 ring-orange-500 shadow-xs scale-102'
                : activeFilter !== 'semua'
                ? 'opacity-60 hover:opacity-100 hover:bg-white text-slate-600'
                : 'hover:bg-white hover:shadow-xs text-slate-700'
            }`}
            title="Klik untuk memfilter: Hanya Relawan Menangani"
          >
            <div className="w-5 h-5 rounded-full bg-[#ea580c] border border-white shadow-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span>Relawan Menangani</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeFilter === 'relawan_menangani' ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {countRelawanMenangani}
            </span>
          </button>

          <span className="hidden md:inline-block w-px h-4 bg-slate-200" />

          <button
            type="button"
            onClick={() => handleSetFilter(activeFilter === 'sos_belum' ? 'semua' : 'sos_belum')}
            className={`group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 min-h-[34px] text-[11px] font-bold transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
              activeFilter === 'sos_belum'
                ? 'bg-red-100 text-red-950 ring-2 ring-red-500 shadow-xs scale-102'
                : activeFilter !== 'semua'
                ? 'opacity-60 hover:opacity-100 hover:bg-white text-slate-600'
                : 'hover:bg-white hover:shadow-xs text-slate-700'
            }`}
            title="Klik untuk memfilter: Hanya SOS Belum Ditangani"
          >
            <div className="w-5 h-5 rounded-full bg-[#ef4444] border border-white shadow-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <span>SOS Belum Ditangani</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeFilter === 'sos_belum' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {countSosBelum}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSetFilter(activeFilter === 'sos_ditangani' ? 'semua' : 'sos_ditangani')}
            className={`group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 min-h-[34px] text-[11px] font-bold transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${
              activeFilter === 'sos_ditangani'
                ? 'bg-emerald-100 text-emerald-950 ring-2 ring-emerald-500 shadow-xs scale-102'
                : activeFilter !== 'semua'
                ? 'opacity-60 hover:opacity-100 hover:bg-white text-slate-600'
                : 'hover:bg-white hover:shadow-xs text-slate-700'
            }`}
            title="Klik untuk memfilter: Hanya SOS Ditangani"
          >
            <div className="w-5 h-5 rounded-full bg-[#10b981] border border-white shadow-xs flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <span>SOS Ditangani</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeFilter === 'sos_ditangani' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {countSosDitangani}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
