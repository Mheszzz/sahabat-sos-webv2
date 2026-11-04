import L from 'leaflet';

/**
 * Buat ikon custom untuk cluster marker Leaflet.
 * Warna badge ditentukan berdasarkan prioritas tipe marker di dalam cluster:
 *   - Merah  (#ef4444) → ada ≥1 marker SOS darurat
 *   - Kuning (#f59e0b) → tidak ada SOS, tapi ada laporan
 *   - Hijau  (#10b981) → semua marker adalah relawan
 *
 * @param {L.MarkerCluster} cluster
 * @returns {L.DivIcon}
 */
export function createClusterIcon(cluster) {
  const markers = cluster.getAllChildMarkers();
  const count   = markers.length;

  const hasSos     = markers.some(m => m.options._type === 'sos');
  const hasLaporan = markers.some(m => m.options._type === 'laporan');

  let color, shadowColor;
  if (hasSos) {
    color       = '#EF4444';        // merah
    shadowColor = 'rgba(239,68,68,0.35)';
  } else if (hasLaporan) {
    color       = '#F59E0B';        // kuning
    shadowColor = 'rgba(245,158,11,0.35)';
  } else {
    color       = '#22C55E';        // hijau
    shadowColor = 'rgba(34,197,94,0.35)';
  }

  let size, fontSize;
  if (count < 10)       { size = 32; fontSize = 11; }
  else if (count < 100) { size = 40; fontSize = 12; }
  else                  { size = 50; fontSize = 13; }

  const html = `
    <div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: ${fontSize}px; font-weight: 700; color: white;
      box-shadow: 0 0 0 4px ${shadowColor}, 0 2px 8px rgba(0,0,0,0.3);
      font-family: system-ui, sans-serif;
    ">${count}</div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize:   L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  });
}
