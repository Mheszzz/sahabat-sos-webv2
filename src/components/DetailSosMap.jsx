import { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, ExternalLink, Plus, Minus, LocateFixed,
  AlertTriangle, Users, Route, User
} from 'lucide-react';

const streetTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
const satelliteTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export default function DetailSosMap({
  kasus,
  relawanBertugas,
  relawanList = [],
  onSelectRelawan,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [mapMode, setMapMode] = useState('street'); // 'street' | 'satellite'

  const rawLat = kasus?.latitude ?? kasus?.lat;
  const rawLng = kasus?.longitude ?? kasus?.lng;
  const parsedLat = parseFloat(rawLat);
  const parsedLng = parseFloat(rawLng);
  const hasValidCoords = !Number.isNaN(parsedLat) && !Number.isNaN(parsedLng) && (parsedLat !== 0 || parsedLng !== 0);

  const sosLat = hasValidCoords ? parsedLat : null;
  const sosLng = hasValidCoords ? parsedLng : null;

  // Cari koordinat relawan bertugas jika ada
  const assignedInList = relawanList.find((r) => r.id === relawanBertugas?.id);
  const relawanLat = parseFloat(
    relawanBertugas?.latitude ?? relawanBertugas?.lat ?? assignedInList?.latitude ?? assignedInList?.lat
  );
  const relawanLng = parseFloat(
    relawanBertugas?.longitude ?? relawanBertugas?.lng ?? assignedInList?.longitude ?? assignedInList?.lng
  );
  const hasRelawanCoords = !Number.isNaN(relawanLat) && !Number.isNaN(relawanLng) && (relawanLat !== 0 || relawanLng !== 0);

  // Hitung jarak riil (geodesic) antara korban SOS dan relawan yang bertugas
  let distanceMeters = null;
  let distanceText = null;
  if (hasValidCoords && hasRelawanCoords && sosLat != null && sosLng != null && relawanLat != null && relawanLng != null) {
    distanceMeters = L.latLng(sosLat, sosLng).distanceTo(L.latLng(relawanLat, relawanLng));
    distanceText = distanceMeters < 1000
      ? `${Math.round(distanceMeters)} m`
      : `${(distanceMeters / 1000).toFixed(1)} km`;
  }

  // Filter relawan siaga unassigned di radius darurat <= 10 km dari korban
  const MAX_RADIUS_METERS = 10000;
  const nearbyVolunteers = useMemo(() => {
    return (Array.isArray(relawanList) ? relawanList : []).filter((vol) => {
      if (relawanBertugas && vol.id === relawanBertugas.id) return false;
      const vLat = parseFloat(vol.latitude ?? vol.lat);
      const vLng = parseFloat(vol.longitude ?? vol.lng);
      if (Number.isNaN(vLat) || Number.isNaN(vLng) || (vLat === 0 && vLng === 0)) return false;
      if (!hasValidCoords || sosLat == null || sosLng == null) return false;
      const dMeters = L.latLng(sosLat, sosLng).distanceTo(L.latLng(vLat, vLng));
      return dMeters <= MAX_RADIUS_METERS;
    });
  }, [relawanList, relawanBertugas, hasValidCoords, sosLat, sosLng]);

  const nearbyCount = nearbyVolunteers.length;

  // Klasifikasi tipe kasus & status penanganan (component scope agar dapat diakses di marker dan legend)
  const isSosCase = kasus?._tipe === 'sos' ||
    kasus?.kategori === 'SOS' ||
    kasus?.kategori_laporan?.toLowerCase().includes('sos');
  const isCaseHandled = Boolean(relawanBertugas) || kasus?.status === 'ditangani' || kasus?.status_sos === 'ditangani';

  // Initialize Leaflet Map jika kasus memiliki koordinat valid
  useEffect(() => {
    if (!hasValidCoords || sosLat == null || sosLng == null) return;
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Zoom level default street-level (16) agar langsung fokus detail pada lokasi korban
    const map = L.map(mapContainerRef.current, {
      center: [sosLat, sosLng],
      zoom: 16,
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

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasValidCoords, sosLat, sosLng]);

  // Handle ResizeObserver for responsive container
  useEffect(() => {
    if (!hasValidCoords || !mapContainerRef.current || !mapInstanceRef.current) return;
    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [hasValidCoords]);

  // Handle Tile Layer Switch (Street vs Satellite)
  useEffect(() => {
    if (!hasValidCoords || !mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newUrl = mapMode === 'satellite' ? satelliteTileUrl : streetTileUrl;
    tileLayerRef.current = L.tileLayer(newUrl, {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri',
    }).addTo(mapInstanceRef.current);
  }, [hasValidCoords, mapMode]);

  // Update Markers & Kamera (SOS, Relawan Bertugas, & Relawan Siaga)
  useEffect(() => {
    if (!hasValidCoords || sosLat == null || sosLng == null || !mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    // ── 1. Marker SOS / Lokasi Kejadian Beacon dengan Animasi Radar ──
    const victimName = kasus?.pengguna?.name || kasus?.pelapor?.name || (isSosCase ? 'Korban' : 'Pelapor');
    const caseTag = isSosCase ? `#SOS-${kasus?.id || ''}` : `#LP-${kasus?.id || ''}`;
    const headerTitle = isSosCase
      ? `Panggilan Darurat SOS #${kasus?.id || ''}`
      : `Laporan Kejadian #${kasus?.id || ''}`;
    const markerTypeClass = isSosCase
      ? (isCaseHandled ? 'sos-marker sos-ditangani' : 'sos-marker sos-belum-ditangani')
      : (isCaseHandled ? 'laporan-marker laporan-ditangani' : 'laporan-marker laporan-belum-ditangani');
    const rippleClass = isCaseHandled
      ? 'emergency-beacon-ripple success-ripple'
      : (isSosCase ? 'emergency-beacon-ripple' : 'emergency-beacon-ripple warning-ripple');
    const statusKeterangan = isCaseHandled ? 'Ditangani' : 'Belum Ditangani';

    const sosMarkerHtml = `
      <div class="command-map-marker ${markerTypeClass} group cursor-pointer">
        <div class="marker-beacon-wrapper">
          <div class="${rippleClass}"></div>
          <div class="marker-circle">
            ${isSosCase ? `
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            ` : `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            `}
          </div>
        </div>
        <div class="marker-tag">${caseTag} &bull; ${victimName}</div>
      </div>
    `;

    const sosIcon = L.divIcon({
      className: 'custom-command-center-icon',
      html: sosMarkerHtml,
      iconSize: [140, 56],
      iconAnchor: [70, 18],
    });

    const sosMarker = L.marker([sosLat, sosLng], { icon: sosIcon, zIndexOffset: 1000 });
    sosMarker.bindPopup(`
      <div class="p-1 space-y-1 text-slate-800 text-[11px] leading-tight max-w-[220px]">
        <div class="flex items-center gap-1 font-bold ${isSosCase ? 'text-rose-700' : 'text-[#0b6f61]'} uppercase text-[10px]">
          <span class="w-1.5 h-1.5 rounded-full ${isSosCase ? 'bg-rose-600' : 'bg-emerald-600'} animate-pulse"></span>
          ${headerTitle}
        </div>
        <p class="font-black text-slate-900 text-[12px]">${victimName}</p>
        <p class="text-slate-500">${kasus?.lokasi_laporan || (isSosCase ? 'Lokasi SOS' : 'Lokasi Kejadian')}</p>
        <div class="font-mono text-[9.5px] text-slate-400">
          ${sosLat.toFixed(5)}, ${sosLng.toFixed(5)}
        </div>
        <a
          href="https://www.google.com/maps/dir/?api=1&destination=${sosLat},${sosLng}"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-2 w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[10.5px] font-bold shadow-xs hover:opacity-90 transition-opacity"
          style="background-color: #0b6f61 !important; color: #ffffff !important; text-decoration: none !important;"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #ffffff !important;">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          <span style="color: #ffffff !important;">Buka Rute Google Maps &rarr;</span>
        </a>
      </div>
    `);

    markersLayerRef.current.addLayer(sosMarker);

    // ── 2. Lingkaran Radius Akurasi Darurat (150m) ──
    const radiusCircle = L.circle([sosLat, sosLng], {
      radius: 150,
      color: '#dc2626',
      weight: 1.5,
      opacity: 0.8,
      dashArray: '4, 4',
      fillColor: '#ef4444',
      fillOpacity: 0.12,
    });
    markersLayerRef.current.addLayer(radiusCircle);

    // ── 3. Relawan Bertugas (Jika Sudah Ditugaskan) ──
    if (relawanBertugas && hasRelawanCoords) {
      const assignedHtml = `
        <div class="command-map-marker relawan-marker relawan-menangani group cursor-pointer">
          <div class="marker-beacon-wrapper">
            <div class="emergency-beacon-ripple warning-ripple"></div>
            <div class="marker-circle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          </div>
          <div class="marker-tag">${relawanBertugas.name} ${distanceText ? `(${distanceText})` : ''}</div>
        </div>
      `;
      const assignedIcon = L.divIcon({
        className: 'custom-command-center-icon',
        html: assignedHtml,
        iconSize: [140, 56],
        iconAnchor: [70, 18],
      });
      const assignedMarker = L.marker([relawanLat, relawanLng], { icon: assignedIcon, zIndexOffset: 900 });
      assignedMarker.bindPopup(`
        <div class="p-1 space-y-1.5 text-slate-800 text-[11px] leading-tight max-w-[230px]">
          <div class="flex items-center justify-between pb-1 border-b border-slate-100">
            <div class="flex items-center gap-1 font-bold text-orange-600 uppercase text-[9.5px]">
              <span class="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse"></span>
              Relawan Sedang Menangani
            </div>
            ${distanceText ? `
              <span class="text-[9px] font-extrabold bg-orange-50 text-orange-800 border border-orange-200 px-1.5 py-0.2 rounded-full">
                Jarak: ${distanceText}
              </span>
            ` : ''}
          </div>
          <p class="font-black text-slate-900 text-[12.5px]">${relawanBertugas.name}</p>
          <p class="text-slate-500">${relawanBertugas.kompetensi || 'Relawan Tanggap Darurat'}</p>
          ${distanceText ? `
            <div class="p-1.5 bg-orange-50/70 border border-orange-100 rounded-md text-[10px] text-orange-900 font-semibold flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-orange-600 flex-shrink-0"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>Jarak langsung ke lokasi:</span>
              <span class="font-black">${distanceText}</span>
            </div>
          ` : ''}
          ${relawanBertugas.no_telp ? `
            <div class="pt-1">
              <a
                href="tel:${relawanBertugas.no_telp}"
                class="w-full inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg font-bold text-[10px] shadow-xs hover:opacity-90 transition-opacity"
                style="background-color: #ea580c !important; color: #ffffff !important; text-decoration: none !important;"
              >
                <span style="color: #ffffff !important;">Hubungi Relawan (${relawanBertugas.no_telp})</span>
              </a>
            </div>
          ` : ''}
        </div>
      `);
      markersLayerRef.current.addLayer(assignedMarker);

      // Garis Rute Panduan Relawan -> Korban
      const routeLine = L.polyline([[relawanLat, relawanLng], [sosLat, sosLng]], {
        color: '#ea580c',
        weight: 3.5,
        dashArray: '6, 8',
        opacity: 0.9,
      });
      markersLayerRef.current.addLayer(routeLine);
    }

    // ── 4. Daftar Relawan Siaga Terdekat (Hanya radius <= 10 km) ──
    nearbyVolunteers.forEach((vol) => {
      const vLat = parseFloat(vol.latitude ?? vol.lat);
      const vLng = parseFloat(vol.longitude ?? vol.lng);
      const distToSos = L.latLng(sosLat, sosLng).distanceTo(L.latLng(vLat, vLng));
      const distFormatted = distToSos < 1000 ? `${Math.round(distToSos)} m` : `${(distToSos / 1000).toFixed(1)} km`;
      const volName = vol.nama || vol.name || 'Relawan Siaga';
      const jarakLabel = vol.jarak_text && vol.jarak_text !== '-' ? vol.jarak_text : distFormatted;

      // Validasi data relawan untuk penugasan
      const statusClean = String(vol.status || '').toLowerCase().trim();
      const isRelawanValid = Boolean(
        vol &&
        vol.id != null &&
        (vol.nama || vol.name) &&
        statusClean !== 'tidak_aktif' &&
        statusClean !== 'nonaktif' &&
        statusClean !== 'banned' &&
        statusClean !== 'sedang_bertugas'
      );

      const volHtml = `
        <div class="command-map-marker relawan-marker relawan-siaga group cursor-pointer">
          <div class="marker-circle">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="marker-tag">${volName} (${jarakLabel})</div>
        </div>
      `;

      const volIcon = L.divIcon({
        className: 'custom-command-center-icon',
        html: volHtml,
        iconSize: [140, 56],
        iconAnchor: [70, 18],
      });

      const volMarker = L.marker([vLat, vLng], { icon: volIcon });
      const popupContentId = `dispatch-btn-${vol.id}`;

      volMarker.bindPopup(`
        <div class="p-1 space-y-1 text-slate-800 text-[11px] leading-tight max-w-[210px]">
          <div class="flex items-center justify-between pb-1 border-b border-slate-100">
            <span class="font-bold text-emerald-700 uppercase text-[9.5px]">Relawan Siaga Terdekat</span>
            <span class="text-[9px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-full">
              ${jarakLabel}
            </span>
          </div>
          <p class="font-black text-slate-900 text-[12px] pt-0.5">${volName}</p>
          <p class="text-slate-500 text-[10.5px]">${vol.kompetensi || 'Relawan Tanggap Darurat'}</p>
          ${vol.no_telp ? `<p class="text-slate-600 font-mono text-[10px]">HP: ${vol.no_telp}</p>` : ''}
          ${!relawanBertugas && onSelectRelawan ? (
            isRelawanValid ? `
              <button
                id="${popupContentId}"
                type="button"
                class="mt-2 w-full inline-flex items-center justify-center gap-1 bg-[#0b6f61] hover:bg-[#085046] text-white font-bold text-[10.5px] py-1.5 px-2 rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Tugaskan ke Kasus Ini
              </button>
            ` : `
              <button
                id="${popupContentId}"
                type="button"
                disabled
                title="Data relawan tidak valid untuk penugasan"
                class="mt-2 w-full inline-flex items-center justify-center gap-1 bg-slate-200 text-slate-400 font-bold text-[10.5px] py-1.5 px-2 rounded-lg cursor-not-allowed border border-slate-300"
              >
                Penugasan Tidak Tersedia
              </button>
            `
          ) : ''}
        </div>
      `);

      // Event listener saat tombol dispatch di popup diklik (hanya jika data relawan valid)
      volMarker.on('popupopen', () => {
        const btn = document.getElementById(popupContentId);
        if (btn && onSelectRelawan && isRelawanValid) {
          btn.onclick = () => onSelectRelawan(vol.id);
        } else if (btn) {
          btn.onclick = null;
        }
      });

      markersLayerRef.current.addLayer(volMarker);
      // CATATAN: Relawan siaga unassigned sengaja TIDAK memanggil bounds.extend()
      // agar kamera tidak terlempar ke relawan di radius luar yang jauh.
    });

    // ── 5. Auto Camera Framing Logic ──
    // a) Jika ADA relawan bertugas yang memiliki koordinat GPS:
    //    Zoom out pas (fitBounds) antara korban dan relawan bertugas agar rute dan jarak terlihat jelas.
    // b) Jika BELUM ada relawan bertugas (atau koordinat relawan belum ada):
    //    Zoom in street-level ke korban (zoom 16) agar admin melihat detail lokasi kejadian.
    if (relawanBertugas && hasRelawanCoords) {
      const missionBounds = L.latLngBounds([
        [sosLat, sosLng],
        [relawanLat, relawanLng],
      ]);
      mapInstanceRef.current.fitBounds(missionBounds, {
        padding: [50, 50],
        maxZoom: 16,
      });
    } else {
      mapInstanceRef.current.setView([sosLat, sosLng], 16);
    }
  }, [
    hasValidCoords,
    sosLat,
    sosLng,
    hasRelawanCoords,
    relawanLat,
    relawanLng,
    distanceText,
    kasus,
    relawanBertugas,
    nearbyVolunteers,
    onSelectRelawan,
    isSosCase,
    isCaseHandled,
  ]);

  // Map Controls Helpers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  // Recenter ke lokasi darurat SOS korban (Zoom In street-level)
  const handleRecenterSos = () => {
    if (mapInstanceRef.current && hasValidCoords && sosLat != null && sosLng != null) {
      mapInstanceRef.current.flyTo([sosLat, sosLng], 16, { duration: 0.6 });
    }
  };

  // Zoom Out pas untuk melihat rute dan jarak antara relawan bertugas dan korban
  const handleFitRoute = () => {
    if (
      mapInstanceRef.current &&
      hasValidCoords &&
      hasRelawanCoords &&
      sosLat != null &&
      sosLng != null &&
      relawanLat != null &&
      relawanLng != null
    ) {
      const missionBounds = L.latLngBounds([
        [sosLat, sosLng],
        [relawanLat, relawanLng],
      ]);
      mapInstanceRef.current.fitBounds(missionBounds, {
        padding: [50, 50],
        maxZoom: 16,
        duration: 0.6,
      });
    }
  };

  const googleMapsUrl = hasValidCoords && sosLat != null && sosLng != null
    ? `https://www.google.com/maps?q=${sosLat},${sosLng}`
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex-1 min-h-[260px] flex flex-col overflow-hidden">
      {/* ── Subcard Header: Peta Lokasi SOS & Relawan ── */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-shrink-0 gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 shrink-0">
            <MapPin size={13} className="text-rose-600 flex-shrink-0" />
            Peta Lokasi Darurat &amp; Relawan
          </span>
          {hasValidCoords && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
              Live GPS
            </span>
          )}
          {relawanBertugas ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
              <User size={11} className="text-emerald-600" />
              <span>{relawanBertugas.name}</span>
              {distanceText && <span className="font-mono text-emerald-700">({distanceText})</span>}
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
              nearbyCount > 0
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              <Users size={11} className={nearbyCount > 0 ? "text-emerald-600" : "text-slate-400"} />
              {nearbyCount > 0 ? `${nearbyCount} Relawan Radius 10km` : '0 Relawan di Sekitar'}
            </span>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasValidCoords && (
            <div className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 text-[11px] font-bold text-slate-600 shrink-0">
              <button
                type="button"
                onClick={() => setMapMode('street')}
                className={`rounded px-2.5 py-1 whitespace-nowrap transition-all cursor-pointer ${
                  mapMode === 'street'
                    ? 'bg-white font-extrabold text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Jalan
              </button>
              <button
                type="button"
                onClick={() => setMapMode('satellite')}
                className={`rounded px-2.5 py-1 whitespace-nowrap transition-all cursor-pointer ${
                  mapMode === 'satellite'
                    ? 'bg-white font-extrabold text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Satelit
              </button>
            </div>
          )}

          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Buka di Google Maps"
              className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      {/* ── Map Canvas Container / Placeholder jika Koordinat Tidak Tersedia ── */}
      {!hasValidCoords ? (
        <div className="relative flex-1 min-h-[200px] w-full rounded-xl border border-dashed border-amber-300 bg-amber-50/50 mt-2 flex flex-col items-center justify-center p-6 text-center gap-2">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-slate-800">
              Koordinat GPS tidak tersedia untuk kasus ini
            </h4>
            <p className="text-[11px] text-slate-500 max-w-sm mt-1 leading-relaxed">
              {kasus?.lokasi_laporan
                ? `Alamat tercatat: "${kasus.lokasi_laporan}". Peta tidak dapat dirender karena nilai koordinat latitude dan longitude tidak valid atau kosong.`
                : 'Peta tidak dapat dirender karena nilai koordinat latitude dan longitude tidak valid atau kosong.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative isolate flex-1 min-h-[200px] w-full rounded-xl overflow-hidden border border-slate-200 mt-2 bg-slate-100">
          <div ref={mapContainerRef} className="h-full w-full relative z-0" />

          {/* Floating Zoom & Recenter Controls (Top Right) */}
          <div className="absolute right-2.5 top-2.5 z-10 flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/95 backdrop-blur-xs shadow-md">
            <button
              type="button"
              onClick={handleZoomIn}
              className="flex h-7 w-7 items-center justify-center border-b border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Perbesar"
            >
              <Plus size={12} />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="flex h-7 w-7 items-center justify-center border-b border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Perkecil"
            >
              <Minus size={12} />
            </button>
            <button
              type="button"
              onClick={handleRecenterSos}
              className="flex h-7 w-7 items-center justify-center text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-b border-slate-100"
              title="Fokus Zoom ke Korban SOS"
            >
              <LocateFixed size={12} />
            </button>
            {hasRelawanCoords && relawanBertugas && (
              <button
                type="button"
                onClick={handleFitRoute}
                className="flex h-7 w-7 items-center justify-center text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                title="Lihat Rute & Jarak Relawan (Zoom Out)"
              >
                <Route size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
