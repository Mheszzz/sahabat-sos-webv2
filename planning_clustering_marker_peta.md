# 🗺️ Planning: Implementasi Clustering Marker pada Dashboard & Peta Pemantauan

> Dibuat: 04 November 2026  
> Scope: `AdminCommandMap.jsx`, `ModernEmergencyMap.jsx`  
> Status: **FEASIBLE — Dapat Dikerjakan Tanpa Perubahan Backend**

---

## ✅ Kesimpulan Feasibility

**Clustering marker BISA diterapkan** sepenuhnya di sisi frontend tanpa perubahan endpoint backend.

Semua data koordinat sudah tersedia dari API yang ada:
- `GET /api/admin/dashboard/peta-kasus` → `titik_darurat_sos`, `titik_laporan_aktif`, `posisi_relawan`

Tidak ada endpoint baru yang dibutuhkan.

---

## 🔎 Kondisi Saat Ini (Temuan Audit)

### Arsitektur Rendering Marker (Kedua Map)

Kedua komponen peta menggunakan pola yang identik:

```js
// Saat ini — L.layerGroup biasa, tanpa clustering
markersLayerRef.current = L.layerGroup().addTo(map);     // init
markersLayerRef.current.clearLayers();                    // setiap update data
L.marker([lat, lng], { icon: L.divIcon({ html: ... }) }) // per marker
  .addTo(markersLayerRef.current);                        // ditambah satu per satu
```

### Masalah yang Ada

| # | Masalah | Dampak |
|---|---------|--------|
| 1 | **Semua marker langsung dirender** tanpa grouping saat zoom out | Marker saling tumpuk, tidak bisa diklik, tidak informatif |
| 2 | **Setiap marker pakai `L.divIcon` dengan HTML kompleks** (SVG + ripple animation) | Banyak DOM node, berat saat banyak marker |
| 3 | **Backend mengembalikan semua data tanpa limit/paginasi** | N marker = N DOM element tanpa batas |
| 4 | **N+1 query pattern** di `PetaKasusAdminController.php` untuk tiap relawan | Respons API lambat saat relawan banyak |
| 5 | **Tidak ada clustering** di `AdminCommandMap.jsx` maupun `ModernEmergencyMap.jsx` | — |

### Library yang Tersedia

```json
// package.json — saat ini
"leaflet": "^1.9.4"   ✅ ada

// BELUM ADA — perlu ditambahkan
"leaflet.markercluster" ❌ belum install
```

---

## 📦 Library yang Dipilih: `leaflet.markercluster`

### Alasan Pemilihan

| Kriteria | Keterangan |
|----------|------------|
| **Kompatibilitas** | Native Leaflet plugin — langsung cocok dengan arsitektur saat ini (pakai `L` dari `leaflet`) |
| **Zero refactor besar** | Cukup ganti `L.layerGroup()` → `L.markerClusterGroup()`. Semua `addLayer()` tetap sama |
| **Fitur built-in** | Spiderify saat cluster di-klik, animasi smooth, jumlah marker per cluster otomatis |
| **TypeScript support** | Ada `@types/leaflet.markercluster` |
| **Aktif dipakai** | Standar industri untuk Leaflet, 4M+ download/bulan npm |
| **Tidak butuh react-leaflet** | Sesuai dengan arsitektur vanilla Leaflet yang sudah dipakai proyek ini |

### Alternatif yang Dipertimbangkan & Ditolak

| Library | Alasan Ditolak |
|---------|----------------|
| `supercluster` + manual render | Butuh reimplementasi render marker dari nol |
| `react-leaflet` + `react-leaflet-cluster` | Butuh migrasi seluruh komponen peta ke react-leaflet — refactor besar |
| Clustering manual (algoritmik sendiri) | Reinvent the wheel, tidak perlu |

---

## 🛠️ Syarat yang Harus Dipenuhi Sebelum Mulai

### ✅ Sudah Tersedia

- [x] Leaflet `^1.9.4` sudah terinstall
- [x] Semua koordinat marker sudah ada di response API (`latitude`, `longitude`)
- [x] Data type marker sudah ada (`type: 'sos' | 'relawan' | 'laporan'`)
- [x] Pola render marker sudah konsisten di kedua komponen

### ❌ Yang Harus Disiapkan

| # | Kebutuhan | Cara Pemenuhan | Prioritas |
|---|-----------|----------------|-----------|
| 1 | **Install `leaflet.markercluster`** | `npm install leaflet.markercluster` | 🔴 Wajib |
| 2 | **CSS `leaflet.markercluster`** | Import `MarkerCluster.css` + `MarkerCluster.Default.css` | 🔴 Wajib |
| 3 | **Custom style cluster badge** | Styling CSS sesuai brand (`#0b6f61` untuk SOS, dll.) | 🟡 Penting (UX) |
| 4 | **(Opsional) Fix N+1 query backend** | Tambah `with(['aktiveSOS', 'aktiveLaporan'])` di relawan query | 🟢 Disarankan |

### ❌ Endpoint Backend yang Belum Ada

**Tidak ada endpoint baru yang dibutuhkan.** Semua data sudah tersedia dari:
```
GET /api/admin/dashboard/peta-kasus
```

Clustering dilakukan 100% di sisi frontend oleh library.

---

## 📋 Plan Pengerjaan

### FASE 1 — Setup Library (±30 menit)

**Task 1.1 — Install dependency**
```bash
npm install leaflet.markercluster
npm install --save-dev @types/leaflet.markercluster
```

**Task 1.2 — Tambahkan CSS di file yang relevan**

Di `AdminCommandMap.jsx` dan `ModernEmergencyMap.jsx`:
```js
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
```

---

### FASE 2 — Implementasi Clustering di `AdminCommandMap.jsx` (±2 jam)

Ini adalah peta utama di halaman Dashboard. **Target utama.**

**Task 2.1 — Ganti `L.layerGroup` dengan `L.markerClusterGroup`**

```js
// SEBELUM (baris 264):
markersLayerRef.current = L.layerGroup().addTo(map);

// SESUDAH:
import L from 'leaflet';
import 'leaflet.markercluster';

markersLayerRef.current = L.markerClusterGroup({
  maxClusterRadius: 60,          // radius pixel sebelum marker dicluster
  spiderfyOnMaxZoom: true,       // klik cluster = spiderify saat zoom max
  showCoverageOnHover: false,    // nonaktifkan polygon coverage (clean UI)
  zoomToBoundsOnClick: true,     // klik cluster = zoom ke area tersebut
  iconCreateFunction: createClusterIcon, // custom icon per cluster (lihat Task 2.2)
  disableClusteringAtZoom: 16,   // zoom >= 16, semua marker tampil individual
  chunkedLoading: true,          // load marker bertahap agar tidak freeze
});
markersLayerRef.current.addTo(map);
```

**Task 2.2 — Buat fungsi `createClusterIcon` custom**

Cluster badge harus bisa membedakan isi cluster (ada SOS kritis atau tidak):

```js
function createClusterIcon(cluster) {
  const markers = cluster.getAllChildMarkers();
  const hasSos = markers.some(m => m.options._type === 'sos');
  const hasLaporan = markers.some(m => m.options._type === 'laporan');
  const count = cluster.getChildCount();

  // Warna cluster: merah jika ada SOS, kuning jika hanya laporan, hijau jika hanya relawan
  const bgColor = hasSos ? '#dc2626' : hasLaporan ? '#f59e0b' : '#10b981';
  const size = count >= 10 ? 44 : 36;

  return L.divIcon({
    html: `
      <div style="
        width:${size}px; height:${size}px;
        background:${bgColor};
        border:3px solid white;
        border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        color:white; font-weight:900; font-size:${count >= 10 ? 11 : 13}px;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
      ">${count}</div>
    `,
    className: 'custom-cluster-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
```

**Task 2.3 — Simpan type marker ke options (untuk cluster icon)**

Saat membuat `L.marker`, simpan `_type` ke options agar bisa diakses `createClusterIcon`:

```js
// Tambahkan _type ke options marker (setelah baris 419 saat ini)
const marker = L.marker([item.lat, item.lng], {
  icon: customIcon,
  _type: item.type,  // 'sos' | 'laporan' | 'relawan'
});
```

**Task 2.4 — Pastikan `clearLayers()` tetap bekerja**

`L.markerClusterGroup` mendukung `clearLayers()` persis sama dengan `L.layerGroup`, jadi baris 302 tidak perlu diubah:
```js
markersLayerRef.current.clearLayers(); // ✅ tetap sama
```

---

### FASE 3 — Implementasi Clustering di `ModernEmergencyMap.jsx` (±1.5 jam)

Peta ini dipakai di halaman Peta Pemantauan (`/peta-pemantauan`). Pola implementasi **identik dengan Fase 2**.

**Task 3.1** — Ganti `L.layerGroup` (baris 90) dengan `L.markerClusterGroup` (konfigurasi sama)

**Task 3.2** — Tambah `_type` ke marker options (sekitar baris 330)

**Task 3.3** — Reuse fungsi `createClusterIcon` — ekstrak ke file utilitas bersama:
```
src/utils/mapUtils.js   ← createClusterIcon() dipindah ke sini
```

Kedua komponen import dari file yang sama agar konsisten.

---

### FASE 4 — Styling & UX Polish (±1 jam)

**Task 4.1 — Override CSS default `leaflet.markercluster`**

CSS default pakai warna biru. Override di file CSS global atau inline:

```css
/* src/index.css atau komponen-level */

/* Sembunyikan div default marker cluster (kita pakai custom icon) */
.marker-cluster { background: transparent !important; }
.marker-cluster div { background: transparent !important; }

/* Nonaktifkan shadow default yang bentrok dengan custom icon */
.leaflet-cluster-anim .leaflet-marker-icon { transition: transform 0.3s ease; }
```

**Task 4.2 — Tambah tooltip pada cluster (opsional tapi direkomendasikan)**

```js
clusterGroup.on('clustermouseover', function(e) {
  const count = e.layer.getChildCount();
  const markers = e.layer.getAllChildMarkers();
  const sosCount = markers.filter(m => m.options._type === 'sos').length;
  e.layer.bindTooltip(`${count} titik (${sosCount} SOS darurat)`, { sticky: true }).openTooltip();
});
```

**Task 4.3 — Perilaku klik cluster**

Sudah ditangani otomatis oleh `zoomToBoundsOnClick: true`. Tidak perlu tambahan kode.

---

### FASE 5 — Perbaikan Backend (Opsional, Disarankan) (±1 jam)

> ⚠️ **Ini tidak memblokir implementasi clustering**, tapi sangat disarankan dilakukan bersamaan agar performa backend juga baik.

**Task 5.1 — Fix N+1 Query di `PetaKasusAdminController.php`**

Saat ini setiap relawan melakukan query SOS dan Laporan terpisah:
```php
// Saat ini — N query untuk N relawan (N+1 problem)
$activeSOS = SOS::with('pengguna')->whereIn(...)->where('id_relawan', $relawan->id)->first(); // per relawan!
$activeLaporan = Laporan::with('pengguna')->whereIn(...)->where('id_relawan', $relawan->id)->first(); // per relawan!
```

**Perbaikan:**
```php
// Ambil semua SOS aktif sekaligus, lalu lookup by id_relawan
$activeSosMap = SOS::with('pengguna')
    ->whereIn('status_sos', ['belum ditangani', 'ditangani', 'aktif', 'proses'])
    ->whereNotNull('id_relawan')
    ->get()
    ->keyBy('id_relawan');

$activeLaporanMap = Laporan::with('pengguna')
    ->whereIn('status', ['belum ditangani', 'menunggu', 'proses', 'ditangani', 'aktif'])
    ->whereNotNull('id_relawan')
    ->get()
    ->keyBy('id_relawan');

// Lalu dalam map relawan:
$activeSOS = $activeSosMap->get($relawan->id);
$activeLaporan = $activeLaporanMap->get($relawan->id);
```

Ini mengurangi dari **2×N query** menjadi **2 query total** untuk seluruh relawan.

---

## 📊 Estimasi Effort

| Fase | Komponen | Effort | Prioritas |
|------|----------|--------|-----------|
| Fase 1 — Install library | — | 30 menit | 🔴 Wajib |
| Fase 2 — Clustering `AdminCommandMap.jsx` | Dashboard | 2 jam | 🔴 Wajib |
| Fase 3 — Clustering `ModernEmergencyMap.jsx` | Peta Pemantauan | 1.5 jam | 🔴 Wajib |
| Fase 4 — Styling & UX polish | Kedua peta | 1 jam | 🟡 Penting |
| Fase 5 — Fix N+1 backend | Backend | 1 jam | 🟢 Opsional |
| **Total** | | **~6 jam** | |

---

## 🚫 Yang TIDAK Perlu Dikerjakan

| Hal | Alasan |
|-----|--------|
| Buat endpoint backend baru | Semua data koordinat sudah ada |
| Migrasi ke `react-leaflet` | Tidak diperlukan, `leaflet.markercluster` cocok dengan arsitektur vanilla Leaflet saat ini |
| Ubah struktur data dari API | Format `{ lat, lng, type }` sudah cukup untuk clustering |
| Implementasi `DetailSosMap.jsx` | Peta detail kasus hanya menampilkan 1 SOS + beberapa relawan terdekat — clustering tidak relevan dan malah mengganggu UX |

---

## ⚠️ Risiko & Mitigasi

| Risiko | Kemungkinan | Mitigasi |
|--------|-------------|----------|
| `L.markerClusterGroup` tidak kompatibel dengan `L.divIcon` kompleks | Rendah | Plugin ini mendukung semua jenis icon Leaflet. Telah dipakai luas dengan divIcon custom |
| CSS default cluster bentrok dengan styling custom | Sedang | Fase 4 Task 4.1 sudah mengakomodasi override CSS |
| Marker `_type` pada options tidak terbaca di cluster icon | Rendah | Sudah diakomodasi di Task 2.3 dengan menyimpan ke `marker.options._type` |
| Performa masih lambat jika data sangat besar (100+ marker) | Rendah | `chunkedLoading: true` di konfigurasi mencegah freeze UI |

---

## 🗂️ File yang Akan Diubah

| File | Perubahan | Fase |
|------|-----------|------|
| `package.json` | Tambah `leaflet.markercluster` + `@types/leaflet.markercluster` | Fase 1 |
| `src/components/AdminCommandMap.jsx` | Ganti `L.layerGroup` → `L.markerClusterGroup`, tambah import CSS, tambah `_type` ke marker | Fase 2 |
| `src/components/ModernEmergencyMap.jsx` | Sama seperti `AdminCommandMap.jsx` | Fase 3 |
| `src/utils/mapUtils.js` *(file baru)* | Fungsi `createClusterIcon()` yang dipakai bersama kedua komponen | Fase 2–3 |
| `src/index.css` atau CSS global | Override style default `leaflet.markercluster` | Fase 4 |
| `PetaKasusAdminController.php` | Fix N+1 query relawan (opsional) | Fase 5 |

**File yang TIDAK perlu diubah:**
- `DetailSosMap.jsx` — clustering tidak relevan untuk peta detail 1 kasus
- `MapPanel.jsx` — hanya wrapper, otomatis ikut `ModernEmergencyMap`
- Semua file backend lain — tidak ada endpoint baru yang diperlukan
- `DashboardPage.jsx` / `PetaPemantauanPage.jsx` — tidak ada perubahan cara passing data ke komponen peta

---

*Dibuat 04 November 2026. Konfirmasi feasibility telah diverifikasi langsung dari kode.*
