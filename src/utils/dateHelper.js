/**
 * dateHelper.js
 * Utilitas pemformatan & parsing tanggal lintas platform (Safari, Chrome, Firefox, Node, dsb.)
 * Menangani format SQL datetime ("YYYY-MM-DD HH:mm:ss") dengan mengganti spasi menjadi "T"
 * agar sesuai spesifikasi ISO 8601 dan tidak menghasilkan Invalid Date.
 */

/**
 * Parsing input tanggal string/number/Date secara aman.
 * @param {string|number|Date|null|undefined} input
 * @returns {Date|null}
 */
export function parseSafeDate(input) {
  if (!input) return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === 'number') {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    // Format SQL datetime "YYYY-MM-DD HH:mm:ss" diubah menjadi "YYYY-MM-DDTHH:mm:ss"
    const isoCompliant = trimmed.includes(' ') && !trimmed.includes('T')
      ? trimmed.replace(' ', 'T')
      : trimmed;
    const d = new Date(isoCompliant);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Mengambil nilai epoch timestamp (ms) untuk sorting.
 * @param {any} input
 * @returns {number}
 */
export function getSafeTimestamp(input) {
  const d = parseSafeDate(input);
  return d ? d.getTime() : 0;
}

/**
 * Format tanggal dan waktu standar Indonesia (e.g., "12 Mei 2025, 14.30.45").
 * Mendukung presisi per detik kejadian untuk timeline & audit trail.
 * @param {any} input
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDateTime(input, options = {}) {
  if (!input) return '-';
  const d = parseSafeDate(input);
  if (!d) return typeof input === 'string' ? input : '-';

  try {
    const defaultOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit', // Presisi per detik untuk timeline audit kejadian
      ...options,
    };
    return d.toLocaleString('id-ID', defaultOptions).replaceAll(':', '.');
  } catch {
    return String(input);
  }
}

/**
 * Format waktu audit trail dengan presisi detik eksplisit (e.g., "14.30.25 WIB, 12 Mei 2026").
 * @param {any} input
 * @returns {string}
 */
export function formatAuditDateTime(input) {
  if (!input) return '-';
  const d = parseSafeDate(input);
  if (!d) return typeof input === 'string' ? input : '-';

  try {
    const timeStr = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).replaceAll(':', '.');
    const dateStr = d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return `${dateStr}, ${timeStr} WIB`;
  } catch {
    return String(input);
  }
}

/**
 * Format waktu ringkas kartu kasus aktif (e.g. "14.30, 12 Mei" atau "14.30, 12 Mei 2024").
 * @param {any} input
 * @returns {string}
 */
export function formatKasusTime(input) {
  if (!input) return '-';
  if (typeof input === 'string' && input.toLowerCase().includes('lalu')) return input;

  const d = parseSafeDate(input);
  if (!d) return String(input);

  try {
    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
    const isCurrentYear = d.getFullYear() === new Date().getFullYear();
    const dateStr = d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      ...(isCurrentYear ? {} : { year: 'numeric' }),
    });
    return `${timeStr}, ${dateStr}`;
  } catch {
    return String(input);
  }
}

/**
 * Format waktu relatif (e.g. "Baru saja", "5 mnt lalu", "2 jam lalu", "3 hr lalu").
 * @param {any} input
 * @returns {string}
 */
export function formatRelativeTime(input) {
  if (!input) return '';
  const d = parseSafeDate(input);
  if (!d) return '';

  try {
    const diffMs = Date.now() - d.getTime();
    if (Number.isNaN(diffMs) || diffMs < 0) return 'Baru saja';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} hr lalu`;
    return formatDateTime(d, { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
}
