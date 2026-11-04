# Planning: Marker Clustering Frontend

> Status: **IMPLEMENTED** — semua task FE-1 sampai FE-5 sudah berhasil diterapkan dan diuji (build clean).

---

## 1. Tujuan & Scope

**Tujuan:** Ganti `L.layerGroup()` dengan `L.markerClusterGroup()` pada dua komponen peta agar marker yang berdekatan dikelompokkan otomatis — mengurangi visual noise dan meningkatkan performa render saat banyak titik.

**In scope:**
- `AdminCommandMap.jsx` (Dashboard → Peta Komando)
- `ModernEmergencyMap.jsx` (Peta Pemantauan)
- File utilitas baru: `src/utils/mapClusterUtils.js`
- CSS override cluster

**Out of scope:**
- `DetailSosMap.jsx` — single-case map, clustering tidak relevan
- `MapPanel.jsx` — thin wrapper, tidak perlu diubah
- Endpoint backend baru — clustering murni frontend

---

## 2. Library yang Dibutuhkan

```bash
npm install leaflet.markercluster
```

Versi yang kompatibel dengan Leaflet ^1.x. Tidak perlu install type definitions tambahan untuk JS project.

**CSS yang perlu ditambahkan** (selain `leaflet/dist/leaflet.css` yang sudah ada):

```js
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
```

> `MarkerCluster.Default.css` boleh di-skip jika kita pakai custom `iconCreateFunction` sepenuhnya. Tetap import untuk fallback.

---

## 3. File yang Diubah + File Baru

| File | Aksi | Keterangan |
|------|------|------------|
| `src/utils/mapClusterUtils.js` | **BARU** | `createClusterIcon` function |
| `src/components/AdminCommandMap.jsx` | **UBAH** | Ganti `layerGroup`, tambah import, tambah `_type` ke marker options |
| `src/components/ModernEmergencyMap.jsx` | **UBAH** | Sama persis dengan AdminCommandMap |
| `src/index.css` | **UBAH** | Override CSS cluster default |
| `DetailSosMap.jsx` | TIDAK DIUBAH | — |
| `MapPanel.jsx` | TIDAK DIUBAH | — |

---

## 4. Rincian Task per File

### Task FE-1: Install Dependency

```bash
npm install leaflet.markercluster
```

Verifikasi setelah install:
```bash
ls node_modules/leaflet.markercluster/dist/
# Harus ada: leaflet.markercluster.js, MarkerCluster.css, MarkerCluster.Default.css
```

---

### Task FE-2: Buat `src/utils/mapClusterUtils.js`

File baru. Berisi satu fungsi `createClusterIcon` yang dipanggil oleh `iconCreateFunction` di konfigurasi `markerClusterGroup`.

**Logika warna badge cluster:**
- **Merah** (`#EF4444`) → cluster mengandung ≥1 marker `_type === 'sos'`
- **Kuning** (`#F59E0B`) → tidak ada SOS, tapi ada `_type === 'laporan'`
- **Hijau** (`#22C55E`) → semua marker `_type === 'relawan'`

**Ukuran badge adaptif:**
- `count < 10` → `width/height: 32px`, `font-size: 11px`
- `count < 100` → `width/height: 40px`, `font-size: 12px`
- `count >= 100` → `width/height: 50px`, `font-size: 13px`

**Pseudocode:**

```js
// src/utils/mapClusterUtils.js
import L from 'leaflet';

export function createClusterIcon(cluster) {
  const markers = cluster.getAllChildMarkers();
  const count   = markers.length;

  // Tentukan warna berdasarkan prioritas tipe marker
  const hasSos     = markers.some(m => m.options._type === 'sos');
  const hasLaporan = markers.some(m => m.options._type === 'laporan');

  let color, shadowColor;
  if (hasSos) {
    color = '#EF4444';        // merah
    shadowColor = 'rgba(239,68,68,0.35)';
  } else if (hasLaporan) {
    color = '#F59E0B';        // kuning
    shadowColor = 'rgba(245,158,11,0.35)';
  } else {
    color = '#22C55E';        // hijau
    shadowColor = 'rgba(34,197,94,0.35)';
  }

  // Ukuran adaptif
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
    className: '',                       // kosongkan agar tidak ada default style Leaflet
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  });
}
```

---

### Task FE-3: Modifikasi `AdminCommandMap.jsx`

**Lokasi perubahan:**

#### 3a. Import (baris 1–4 area)

```js
// TAMBAH setelah import leaflet/dist/leaflet.css:
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';                        // daftarkan plugin ke L
import { createClusterIcon } from '../utils/mapClusterUtils';
```

#### 3b. Inisialisasi layer (saat ini baris 264)

```js
// SEBELUM:
markersLayerRef.current = L.layerGroup().addTo(map);

// SESUDAH:
markersLayerRef.current = L.markerClusterGroup({
  maxClusterRadius: 60,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  disableClusteringAtZoom: 16,
  chunkedLoading: true,
  iconCreateFunction: createClusterIcon,
}).addTo(map);
```

#### 3c. Tambah `_type` saat buat marker (saat ini baris 419)

```js
// SEBELUM:
const marker = L.marker([item.lat, item.lng], { icon: customIcon });

// SESUDAH:
const marker = L.marker([item.lat, item.lng], {
  icon: customIcon,
  _type: item.type,   // 'sos' | 'laporan' | 'relawan'
});
```

> Tidak ada perubahan lain. `clearLayers()`, `addLayer()`, popup logic — semua tetap sama.

---

### Task FE-4: Modifikasi `ModernEmergencyMap.jsx`

Perubahan **identik** dengan Task FE-3. Lokasi baris berbeda:

| Perubahan | Baris saat ini |
|-----------|---------------|
| Import area | baris 1–3 |
| `L.layerGroup()` → `L.markerClusterGroup()` | **baris 90** |
| Tambah `_type` di `L.marker()` | **baris 322** |

Kode yang digunakan **sama persis** dengan Task FE-3.

---

### Task FE-5: Override CSS Default Cluster

Tambahkan di `src/index.css` (atau file CSS global):

```css
/* ===== Leaflet MarkerCluster Overrides ===== */

/* Sembunyikan background default bawaan plugin */
.leaflet-cluster-anim .leaflet-marker-icon,
.leaflet-cluster-anim .leaflet-marker-shadow {
  transition: transform 0.3s ease-out, opacity 0.3s ease-in;
}

/* Pastikan divIcon cluster tidak dapat padding/border dari Leaflet default */
.marker-cluster-small,
.marker-cluster-medium,
.marker-cluster-large {
  background: transparent !important;
  box-shadow: none !important;
}

.marker-cluster-small div,
.marker-cluster-medium div,
.marker-cluster-large div {
  background: transparent !important;
  color: white !important;
}
```

> Override ini perlu karena `MarkerCluster.Default.css` memberi background abu-abu/biru default yang akan bentrok dengan custom `divIcon` kita.

---

## 5. Konfigurasi `markerClusterGroup`

```js
L.markerClusterGroup({
  maxClusterRadius: 60,         // pixel — radius untuk menggabung marker
  spiderfyOnMaxZoom: true,      // klik cluster di zoom max → marker menyebar (spiderfy)
  showCoverageOnHover: false,   // nonaktif highlight area coverage (lebih bersih)
  zoomToBoundsOnClick: true,    // klik cluster → zoom masuk ke batas cluster
  disableClusteringAtZoom: 16,  // zoom 16+ → semua marker tampil individual
  chunkedLoading: true,         // render marker bertahap, tidak freeze UI
  iconCreateFunction: createClusterIcon,
})
```

---

## 6. Estimasi Effort per Task

| Task | Estimasi | Risiko |
|------|----------|--------|
| FE-1: Install dependency | 5 menit | Rendah |
| FE-2: Buat `mapClusterUtils.js` | 20 menit | Rendah |
| FE-3: Modifikasi `AdminCommandMap.jsx` | 15 menit | Rendah |
| FE-4: Modifikasi `ModernEmergencyMap.jsx` | 15 menit | Rendah |
| FE-5: Override CSS | 10 menit | Rendah |
| **Testing & tuning** | 30 menit | Sedang |
| **Total** | **~1.5 jam** | |

---

## 7. Urutan Pengerjaan

1. **FE-1** — Install `leaflet.markercluster` dulu, pastikan `import 'leaflet.markercluster'` tidak error
2. **FE-2** — Buat `src/utils/mapClusterUtils.js` dan test `createClusterIcon` secara isolated
3. **FE-3** — Modifikasi `AdminCommandMap.jsx`, test di halaman Dashboard
4. **FE-4** — Modifikasi `ModernEmergencyMap.jsx`, test di halaman Peta Pemantauan
5. **FE-5** — Apply CSS override, cek visual di kedua halaman
6. **Tuning** — Adjust `maxClusterRadius` dan `disableClusteringAtZoom` sesuai kepadatan data real

> FE-3 dan FE-4 independen satu sama lain — bisa dikerjakan paralel jika ada dua orang.

---

## 8. Checklist Selesai

- [x] `leaflet.markercluster` terinstall (`node_modules/leaflet.markercluster` ada)
- [x] `src/utils/mapClusterUtils.js` dibuat, `createClusterIcon` diekspor
- [x] `AdminCommandMap.jsx` — `L.layerGroup` → `L.markerClusterGroup` ✓
- [x] `AdminCommandMap.jsx` — `_type` ditambahkan ke `marker.options` ✓
- [x] `AdminCommandMap.jsx` — CSS cluster diimport ✓
- [x] `ModernEmergencyMap.jsx` — `L.layerGroup` → `L.markerClusterGroup` ✓
- [x] `ModernEmergencyMap.jsx` — `_type` ditambahkan ke `marker.options` ✓
- [x] `ModernEmergencyMap.jsx` — CSS cluster diimport ✓
- [x] CSS override ditambahkan di `src/assets/index.css`
- [x] Cluster merah muncul saat ada SOS ✓
- [x] Cluster kuning muncul saat hanya ada laporan ✓
- [x] Cluster hijau muncul saat hanya ada relawan ✓
- [x] Spiderfy berjalan di zoom max ✓
- [x] `disableClusteringAtZoom: 16` — marker individual muncul di zoom 16+ ✓
- [x] `DetailSosMap.jsx` tidak disentuh ✓
- [x] `MapPanel.jsx` tidak disentuh ✓
