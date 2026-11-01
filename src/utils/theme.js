/** Design tokens: single source for status colors used in JS components. */
export const colors = {
  brand: '#0a271f',
  brandSoft: '#154d3e',
  primary: '#0b6f61',
  primaryHover: '#085d52',
  primaryLight: '#eaf8f5',
  emerald: '#1bb88d',
  danger: '#ef4444',
  success: '#12b76a',
  warning: '#f59e0b',
  info: '#2e90fa',
  bg: '#f5f7f7',
  surface: '#ffffff',
  border: '#e3e8ee',
  text: '#162033',
  muted: '#667085',
};

// Accessible amber token (contrast >= 5.8:1 for WCAG 2.1 AA on 11-12px badges)
const AMBER_BADGE = 'bg-[#fef3c7] text-[#92400e] border-[#fcd34d]';
const RED_BADGE = 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]';
const GREEN_BADGE = 'bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]';
const BLUE_BADGE = 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]';
const SLATE_BADGE = 'bg-[#f8fafc] text-[#475569] border-[#e2e8f0]';

export const statusClassMap = {
  Online: GREEN_BADGE,
  'Sedang Bertugas': BLUE_BADGE,
  Offline: SLATE_BADGE,
  Nonaktif: RED_BADGE,
  'Tidak Aktif': RED_BADGE,
  'Belum Ditangani': RED_BADGE,
  'Belum Tertangani': RED_BADGE,
  'belum ditangani': RED_BADGE,
  'belum tertangani': RED_BADGE,
  Aktif: RED_BADGE,
  aktif: RED_BADGE,
  Ditangani: AMBER_BADGE,
  ditangani: AMBER_BADGE,
  'Sedang Ditangani': AMBER_BADGE,
  'sedang ditangani': AMBER_BADGE,
  'sedang_ditangani': AMBER_BADGE,
  Proses: AMBER_BADGE,
  proses: AMBER_BADGE,
  'SOS Darurat': RED_BADGE,
  'Menunggu Respon': AMBER_BADGE,
  Selesai: GREEN_BADGE,
  selesai: GREEN_BADGE,
  Teratasi: GREEN_BADGE,
  Dibatalkan: RED_BADGE,
  dibatalkan: RED_BADGE,
  Batal: RED_BADGE,
  batal: RED_BADGE,
  Laporan: SLATE_BADGE,
  Terverifikasi: GREEN_BADGE,
  Pending: AMBER_BADGE,
  'Pending Verifikasi': AMBER_BADGE,
  'Daksa (Kursi Roda)': BLUE_BADGE,
  Tunanetra: 'bg-[#f5f3ff] text-[#6d28d9] border-[#ddd6fe]',
  'Rungu & Wicara': 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]',
  'Disabilitas Rungu': 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]',
  Psikososial: 'bg-[#fdf2f8] text-[#be185d] border-[#fbcfe8]',
  Epilepsi: RED_BADGE,
  'Disabilitas Ganda': SLATE_BADGE,
  default: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const statusDotMap = {
  Online: 'bg-[#059669]',
  'Sedang Bertugas': 'bg-[#2563eb]',
  Offline: 'bg-slate-400',
  Nonaktif: 'bg-red-500',
  'Tidak Aktif': 'bg-red-500',
  'Belum Ditangani': 'bg-red-500',
  'Belum Tertangani': 'bg-red-500',
  'belum ditangani': 'bg-red-500',
  'belum tertangani': 'bg-red-500',
  Aktif: 'bg-red-500',
  aktif: 'bg-red-500',
  Ditangani: 'bg-yellow-500',
  ditangani: 'bg-yellow-500',
  'Sedang Ditangani': 'bg-yellow-500',
  'sedang ditangani': 'bg-yellow-500',
  'sedang_ditangani': 'bg-yellow-500',
  Proses: 'bg-yellow-500',
  proses: 'bg-yellow-500',
  'SOS Darurat': 'bg-red-500',
  'Menunggu Respon': 'bg-amber-500',
  Selesai: 'bg-green-600',
  selesai: 'bg-green-600',
  Teratasi: 'bg-green-600',
  Dibatalkan: 'bg-red-500',
  dibatalkan: 'bg-red-500',
  Batal: 'bg-red-500',
  batal: 'bg-red-500',
  Terverifikasi: 'bg-green-600',
  'Pending Verifikasi': 'bg-amber-500',
  Pending: 'bg-amber-500',
};

export function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'AD';
  return parts.map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * Normalisasi URL gambar dari storage Laravel atau URL eksternal/blob
 * @param {string} pathOrUrl
 * @returns {string|null}
 */
export function resolveStorageUrl(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return null;
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;

  // Blob URL (preview upload lokal) dan Base64 data URL
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const backendBase = apiUrl.replace(/\/api\/?$/, '');

  // Jika path adalah dokumen KYC / storage-file yang membutuhkan token autentikasi
  if (trimmed.includes('kyc_documents') || trimmed.includes('/storage-file/')) {
    let cleanPath = trimmed.replace(/^.*\/storage-file\//, '').replace(/^.*\/storage\//, '').replace(/^\/+/, '');
    if (cleanPath.includes('?')) {
      cleanPath = cleanPath.split('?')[0];
    }
    const token = typeof window !== 'undefined' ? (localStorage.getItem('admin_access_token') || localStorage.getItem('auth_token')) : null;
    const authQuery = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${apiUrl}/storage-file/${cleanPath}${authQuery}`;
  }

  // Jika URL berisi path /storage/ (baik URL absolut localhost/127.0.0.1 maupun path relatif)
  if (trimmed.includes('/storage/')) {
    const storageIndex = trimmed.indexOf('/storage/');
    const pathAfterStorage = trimmed.slice(storageIndex + '/storage/'.length).replace(/^\/+/, '');
    return `${backendBase}/storage/${pathAfterStorage}`;
  }

  // URL eksternal pihak ketiga (misal Google avatar, CDN eksternal)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const cleanPath = trimmed.replace(/^\/?storage\/?/, '').replace(/^\/+/, '');
  return `${backendBase}/storage/${cleanPath}`;
}

/**
 * Helper untuk mengambil URL foto avatar dari objek user/admin/relawan atau string
 * @param {Object|string} userOrUrl
 * @returns {string|null}
 */
export function getAvatarUrl(userOrUrl) {
  if (!userOrUrl) return null;
  if (typeof userOrUrl === 'string') {
    return resolveStorageUrl(userOrUrl);
  }
  const raw =
    userOrUrl.foto_profile_url ||
    userOrUrl.foto_url ||
    userOrUrl.avatar_url ||
    userOrUrl.foto_profile;
  return resolveStorageUrl(raw);
}

