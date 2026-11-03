/**
 * paginationHelper.js
 * Utilitas pembuat deret halaman pagination dengan dukungan elipsis ('...').
 * Mencegah layout baris pagination rusak/melebar saat jumlah data & halaman sangat banyak.
 * Contoh output: [1, 2, 3, 4, 5, '...', 20] atau [1, '...', 4, 5, 6, '...', 20]
 *
 * @param {number} currentPage - Halaman aktif saat ini (1-indexed)
 * @param {number} totalPages - Total keseluruhan halaman
 * @param {number} [siblingCount=1] - Jumlah tombol halaman di kiri & kanan halaman aktif
 * @returns {(number|string)[]} Deret halaman yang siap di-render di antarmuka
 */
export function getPaginationRange(currentPage, totalPages, siblingCount = 1) {
  const current = Math.max(1, Math.min(Number(currentPage) || 1, totalPages || 1));
  const total = Math.max(1, Number(totalPages) || 1);

  // Jika total halaman sedikit (<= 7), tampilkan semua tanpa elipsis
  const totalSlots = siblingCount * 2 + 5; // 1 + sibling*2 + 2 elipsis + lastPage
  if (total <= totalSlots) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(current - siblingCount, 1);
  const rightSiblingIndex = Math.min(current + siblingCount, total);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < total - 2;

  const firstPageIndex = 1;
  const lastPageIndex = total;

  // Kasus 1: Elipsis hanya di sisi kanan
  // [1, 2, 3, 4, 5, '...', 20]
  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, '...', lastPageIndex];
  }

  // Kasus 2: Elipsis hanya di sisi kiri
  // [1, '...', 16, 17, 18, 19, 20]
  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => total - rightItemCount + i + 1
    );
    return [firstPageIndex, '...', ...rightRange];
  }

  // Kasus 3: Elipsis di kedua sisi (kiri dan kanan)
  // [1, '...', 9, 10, 11, '...', 20]
  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
  }

  return Array.from({ length: total }, (_, i) => i + 1);
}
