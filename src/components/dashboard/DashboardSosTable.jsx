import { Search, Eye, MessageSquare, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Badge from '../global/Badge';

export default function DashboardSosTable({
  cases = [],
  paginatedCases = [],
  totalCasesCount = 0,
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  searchQuery = '',
  setSearchQuery,
  setCurrentPage,
  loading = false,
  onOpenDetail,
  onContact,
}) {
  const startIndex = totalCasesCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCasesCount);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-2 border-b border-slate-100 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold tracking-tight text-slate-900 sm:text-sm">
            Daftar Kasus Darurat SOS Aktif
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full border border-red-200/80 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
            <span className="tabular-nums font-mono">{totalCasesCount}</span>
            <span>Kasus Aktif</span>
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search
            size={13}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari ID, pelapor, atau insiden..."
            className="w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0b6f61] focus:outline-none focus:ring-2 focus:ring-[#0b6f61]/20 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold text-slate-600">
              <th scope="col" className="py-2 pl-3.5 pr-2.5">ID Kasus</th>
              <th scope="col" className="px-2.5 py-2">Tipe</th>
              <th scope="col" className="px-2.5 py-2">Status</th>
              <th scope="col" className="px-2.5 py-2">Kategori / Insiden</th>
              <th scope="col" className="px-2.5 py-2">Pelapor</th>
              <th scope="col" className="px-2.5 py-2">Kontak Pelapor</th>
              <th scope="col" className="px-2.5 py-2">Waktu</th>
              <th scope="col" className="py-2 pl-2.5 pr-3.5 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {loading && paginatedCases.length === 0 ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-2.5 pl-3.5 pr-2.5"><div className="h-3.5 w-14 rounded bg-slate-100" /></td>
                  <td className="px-2.5 py-2.5"><div className="h-3.5 w-10 rounded bg-slate-100" /></td>
                  <td className="px-2.5 py-2.5"><div className="h-4.5 w-18 rounded-full bg-slate-100" /></td>
                  <td className="px-2.5 py-2.5"><div className="h-3.5 w-24 rounded bg-slate-100" /></td>
                  <td className="px-2.5 py-2.5"><div className="h-3.5 w-20 rounded bg-slate-100" /></td>
                  <td className="px-2.5 py-2.5"><div className="h-3.5 w-24 rounded bg-slate-100" /></td>
                  <td className="px-2.5 py-2.5"><div className="h-3.5 w-16 rounded bg-slate-100" /></td>
                  <td className="py-2.5 pl-2.5 pr-3.5 text-right"><div className="ml-auto h-6 w-14 rounded bg-slate-100" /></td>
                </tr>
              ))
            ) : paginatedCases.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    {searchQuery ? (
                      <>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <AlertTriangle size={15} />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-800">
                          Tidak ada hasil pencarian
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Tidak ditemukan kasus yang cocok dengan &quot;{searchQuery}&quot;
                        </p>
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-xs font-medium text-emerald-700 hover:text-emerald-800 underline"
                        >
                          Hapus kata kunci pencarian
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <CheckCircle2 size={18} />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-800">
                          Tidak ada kasus SOS darurat aktif
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Semua panggilan darurat telah tertangani atau selesai. Panggilan baru akan muncul otomatis di sini.
                        </p>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedCases.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/75 transition-colors"
                >
                  {/* ID Kasus */}
                  <td className="py-2.5 pl-3.5 pr-2.5 font-mono font-semibold text-slate-900 whitespace-nowrap">
                    <button
                      onClick={() => onOpenDetail(item.id, item.tipe, item)}
                      className="text-[#0b6f61] hover:text-[#095c52] hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-1 cursor-pointer"
                      title="Lihat detail kasus ini"
                    >
                      {item.displayId || `#SOS-${item.id}`}
                    </button>
                  </td>

                  {/* Tipe */}
                  <td className="px-2.5 py-2.5 whitespace-nowrap">
                    <span className="inline-flex items-center rounded border border-red-200/80 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                      SOS
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-2.5 py-2.5 whitespace-nowrap">
                    <Badge variant={item.status} showDot={true} isPill={true} />
                  </td>

                  {/* Kategori / Insiden */}
                  <td className="px-2.5 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
                      <span className="font-medium text-slate-800 line-clamp-1 max-w-48">
                        {item.kategori}
                      </span>
                    </div>
                  </td>

                  {/* Pelapor */}
                  <td className="px-2.5 py-2.5 font-medium text-slate-700 whitespace-nowrap">
                    {item.pelapor}
                  </td>

                  {/* Kontak Pelapor */}
                  <td className="px-2.5 py-2.5 whitespace-nowrap">
                    {item.kontak && item.kontak !== '-' ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-600 tabular-nums">
                          {item.kontak}
                        </span>
                        {(() => {
                          const hasValidNumber = Boolean(
                            item.whatsappUrl ||
                            ((item.kontakWa || item.kontak) &&
                             (item.kontakWa || item.kontak) !== '-' &&
                             (item.kontakWa || item.kontak).replace(/\D/g, '').length >= 9)
                          );
                          return (
                            <button
                              onClick={() => onContact(item)}
                              disabled={!hasValidNumber}
                              title={hasValidNumber ? "Hubungi pelapor via WhatsApp" : "Nomor kontak tidak valid"}
                              className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                                hasValidNumber
                                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 cursor-pointer'
                                  : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                              }`}
                            >
                              <MessageSquare size={10} className={hasValidNumber ? "text-emerald-600" : "text-slate-400"} />
                              <span>Hubungi</span>
                            </button>
                          );
                        })()}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Waktu */}
                  <td className="px-2.5 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock size={11} className="text-slate-400 shrink-0" />
                      <span className="font-mono tabular-nums text-[11px]">{item.waktu}</span>
                    </div>
                  </td>

                  {/* Aksi */}
                  <td className="py-2.5 pl-2.5 pr-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => onOpenDetail(item.id, item.tipe, item)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-offset-1 active:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Eye size={11} className="text-slate-500" />
                      <span>Detail</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-2 border-t border-slate-100 px-3.5 py-2 sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-600">
        <div>
          Menampilkan <span className="font-semibold tabular-nums text-slate-800">{startIndex}</span>
          {' - '}
          <span className="font-semibold tabular-nums text-slate-800">{endIndex}</span>
          {' dari '}
          <span className="font-semibold tabular-nums text-slate-800">{totalCasesCount}</span>
          {' kasus aktif'}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1 self-start sm:self-auto">
            {/* Tombol Sebelumnya */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:border-slate-200 disabled:bg-slate-50/50 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              Sebelumnya
            </button>

            {/* Nomor Halaman */}
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              const isActive = p === currentPage;
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`h-6 w-6 rounded-md text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#0b6f61] font-semibold text-white shadow-2xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            {/* Tombol Selanjutnya */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700 shadow-2xs hover:bg-slate-50 disabled:border-slate-200 disabled:bg-slate-50/50 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
