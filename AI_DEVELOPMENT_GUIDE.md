# Panduan AI Developer (AI Development Guide)
**Proyek:** Sahabat SOS Web
**Stack:** React.js (Vite), Tailwind CSS, React Router v6, Axios

Dokumen ini berfungsi sebagai **SUMBER KEBENARAN MUTLAK** (Source of Truth) bagi setiap AI atau Developer yang akan memodifikasi, menambah, atau melakukan refaktor pada *source code* ini. 
**DILARANG KERAS** mengubah arsitektur dasar, *library* utama, maupun penamaan *file* yang bertentangan dengan panduan ini tanpa persetujuan eksplisit dari *User*.

---

## 1. Arsitektur Proyek (Strict Page-Based Architecture)
Struktur *folder* telah dirancang khusus untuk memisahkan UI, logika (hooks), dan API. AI **wajib** menempatkan file sesuai strukturnya:
```text
src/
├── api/             # TERPUSAT: Semua komunikasi HTTP ke Backend
│   ├── libs/        # Konfigurasi dasar (contoh: axiosInstance.js)
│   └── services/    # Pemanggilan endpoint API (contoh: adminService.js, authService.js)
├── components/      # KOMPONEN UI murni
│   ├── global/      # Dipakai berulang kali (Button, Badge, Modal, dsb)
│   ├── layouts/     # Kerangka utama aplikasi (Sidebar, Navbar, MainLayout)
│   └── [nama-page]/ # Komponen spesifik milik halaman tertentu (contoh: manajemen-admin/)
├── hooks/           # KUMPULAN LOGIKA (Custom Hooks)
│   ├── [nama-page]/ # State management lokal per fitur (contoh: useAdminData.js)
├── pages/           # HALAMAN (Routing Entry Points)
│   └── [NamaPage]/  # Struktur folder: Kapital (Contoh: Dashboard/)
│       └── [NamaPage]Page.jsx # File utama halaman (Harus menggunakan suffiks "Page")
├── routes/          # Konfigurasi React Router DOM v6 (AppRouter.jsx)
└── utils/           # Fungsi helper, validasi, dan dummyData.js
```

## 2. Aturan Emas Modifikasi Kode (Golden Rules)
1. **Jangan Memodifikasi Komponen Global Secara Sembarangan:** 
   Jika Anda mengubah desain atau _props_ di `src/components/global/`, pastikan tidak memecahkan tampilan di halaman lain. Selalu pertahankan _props_ lama yang sudah digunakan.
2. **Pisahkan Logika dari UI (Hooks Pattern):**
   Jika sebuah file di `pages/` memiliki panjang lebih dari **200 baris** karena logika _state_, AI WAJIB memindahkannya ke dalam _Custom Hook_ di folder `src/hooks/`.
3. **Kepatuhan Routing:**
   - Gunakan `useNavigate` atau `<Link>` dari `react-router-dom` untuk berpindah halaman.
   - **DILARANG** menggunakan metode _state-based routing_ (seperti `activePage` / `onPageChange`).
4. **Pengecekan Tipe dan Variabel (No Undefined):**
   Proyek ini menggunakan **ESLint (v9)**. AI dilarang meninggalkan variabel usang atau _import_ yang sudah tidak digunakan. Setiap variabel yang di-_destructuring_ dari *hook* harus terdefinisi di dalam _hook_ tersebut.
5. **Manajemen *State* Data API:**
   - Selalu berikan nilai _fallback_ (kosong/default) apabila _endpoint_ gagal: `setAdmins(Array.isArray(data) ? data : (data?.data || []))`.
   - Gunakan blok `try...catch...finally` di semua *request* API.

## 3. Aturan Modifikasi Styling & Perubahan UI (PENTING!)
Jika *User* secara eksplisit meminta **"Ubah tampilan halaman X"** atau **"Sesuaikan UI fitur Y"**, maka AI HARUS mengikuti tahapan berhati-hati ini:
1. **Analisis Komponen Hirarki:** Periksa apakah tampilan yang diubah berada di file `pages/` atau di `components/`. Pastikan Anda HANYA memodifikasi komponen spesifik milik halaman tersebut (misal di `src/components/manajemen-admin/`) agar tidak merusak halaman lain.
2. **Hindari Perubahan Komponen Global:** Jangan langsung merombak `src/components/global/Button.jsx` atau `Badge.jsx` hanya demi satu halaman. Jika halaman baru butuh *style* unik, buat prop khusus (seperti `variant="new-style"`) atau buat *custom class* tambahan di pemanggilannya.
3. **Hanya Tailwind CSS:** Jangan menambahkan file CSS baru (kecuali konfigurasi global di `index.css`). Gunakan _utility classes_ Tailwind sepenuhnya.
4. **Konsistensi Desain:** Gunakan palet warna, _border-radius_ (`rounded-xl`, `rounded-2xl`), dan pola _spacing_ yang sudah ada di aplikasi. Jangan tiba-tiba menggunakan pola desain kotak kaku jika aplikasi menggunakan *rounded corners*.
5. **Komponen Visual (Icon):** Proyek ini menggunakan `lucide-react`. Gunakan pustaka ini untuk menambah ikon baru. DILARANG meng-*install* pustaka ikon tambahan seperti FontAwesome, Heroicons, dll.
*(Catatan: Jika User TIDAK SECARA EKSPLISIT meminta perubahan visual/tata letak saat menangani bug/logic, DILARANG KERAS mengubah class Tailwind yang sudah ada).*

## 4. Manajemen Library (Dependensi)
**DILARANG MENG-*INSTALL* LIBRARY BARU** kecuali diminta secara eksplisit.
- **HTTP Client:** Gunakan `Axios` yang sudah terkonfigurasi di `axiosInstance.js`. Jangan memanggil `fetch()` mentah.
- **State Management:** Saat ini hanya menggunakan Local State (React Hooks) dan React Context. Dilarang meng-*install* Redux/Zustand kecuali aplikasi telah tumbuh sedemikian kompleks dan disetujui pengguna.
- **UI Frameworks:** Dilarang meng-install _library_ UI seperti Material UI, Chakra, Ant Design, dsb karena proyek berjalan *pure* dengan figma-to-Tailwind buatan sendiri.

## 5. Menangani Autentikasi dan *Role*
- Token otentikasi dikelola otomatis oleh interceptor di `axiosInstance.js`.
- Pemeriksaan izin (Role-based access) harus toleran terhadap *case* dan *spelling* (misal: dukung `'Super Admin'` dan `'superadmin'`).
- Penyimpanan *user session* berada di `localStorage` melalui fungsi yang ada di `authService.js`.

---
*Pesan untuk AI Pembaca: Jika Anda telah memuat dokumen ini ke konteks Anda, mulailah setiap analisis Anda dengan mempertimbangkan "AI Development Guide" ini untuk menjaga kualitas kode.*

## 6. Integrasi API & Data Dummy (Mocking)
- Jika *endpoint backend* belum tersedia atau masih dalam pengembangan, gunakan data tiruan dari `src/utils/dummyData.js`.
- Pastikan logika pemanggilan API selalu diisolasi di `src/api/services/`.
- Jangan menaruh logika _fetch_ manual (seperti `axios.get('...')`) langsung di dalam komponen UI atau *hook*. Semua harus melalui *Service Layer*.

## 7. Penamaan File & Konvensi (Naming Conventions)
1. **Komponen UI (`.jsx`):** Wajib menggunakan **PascalCase** (contoh: `ManajemenAdminPage.jsx`, `AdminTable.jsx`).
2. **Custom Hooks (`.js`):** Wajib menggunakan **camelCase** dengan awalan "use" (contoh: `useAdminData.js`).
3. **Fungsi / Utils / Service (`.js`):** Wajib menggunakan **camelCase** (contoh: `authService.js`, `formatDate.js`).
4. **Environment Variables:** Semua kunci (key) rahasia atau URL konfigurasi di `.env` harus menggunakan awalan `VITE_` agar dapat dibaca oleh Vite (contoh: `VITE_API_URL`).

## 8. Penanganan Error & Stabilitas (Error Handling & Fallbacks)
- **Cegah Blank Screen (White Screen of Death):** Selalu pasang validasi data sebelum melakukan operasi *Array* seperti `.map()` atau `.filter()`. Contoh: `const safeArray = Array.isArray(data) ? data : [];`.
- Jika menambahkan fitur _routing_ baru yang krusial, pertimbangkan untuk menggunakan `errorElement` bawaan `react-router-dom` untuk menahan *error* per-halaman tanpa merusak halaman lainnya.
- **Validasi Props:** Jika komponen menerima data, sediakan nilai _default_ atau gunakan *optional chaining* (`data?.property`) untuk merender komponen secara aman saat data belum dimuat.
