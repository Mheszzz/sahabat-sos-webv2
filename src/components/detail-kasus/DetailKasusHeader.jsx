import { ArrowLeft, Printer, UserCheck, CheckCircle2, Loader2 } from 'lucide-react';
import Badge from '../global/Badge';
import { formatDateTime } from '../../utils/dateHelper';

/**
 * DetailKasusHeader
 * Bilah atas (Command Bar Header) pada halaman Detail Kasus:
 * Menampilkan ID insiden, badge status & urgensi, tema visual status,
 * serta tombol aksi operasional (Ambil Alih, Cetak, dan Selesaikan).
 */
export default function DetailKasusHeader({
  kasus,
  isSos,
  isKasusSelesai,
  isDitangani,
  isBelumDitangani,
  relawanBertugas,
  loadingTangani,
  onBack,
  onTanganiKasus,
  onOpenSelesaiModal,
}) {
  // Tema warna dinamis header berdasarkan status kasus:
  // - Ditangani: Kuning (Amber)
  // - Belum Ditangani: Merah (Rose)
  // - Selesai: Hijau (Emerald)
  const headerTheme = (() => {
    if (isBelumDitangani) {
      return {
        card: 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-xs shadow-rose-500/5',
        backBtn: 'border-rose-200 bg-white hover:bg-rose-100/70 text-rose-700 focus-visible:ring-rose-600',
        divider: 'bg-rose-200/80',
        title: 'text-rose-950',
        time: 'text-rose-800',
        printBtn: 'border-rose-200 bg-white hover:bg-rose-100/70 text-rose-800 focus-visible:ring-rose-600',
      };
    }
    if (isDitangani) {
      return {
        card: 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs shadow-amber-500/5',
        backBtn: 'border-amber-200 bg-white hover:bg-amber-100/70 text-amber-800 focus-visible:ring-amber-600',
        divider: 'bg-amber-200/80',
        title: 'text-amber-950',
        time: 'text-amber-900',
        printBtn: 'border-amber-200 bg-white hover:bg-amber-100/70 text-amber-800 focus-visible:ring-amber-600',
      };
    }
    if (isKasusSelesai) {
      return {
        card: 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-xs shadow-emerald-500/5',
        backBtn: 'border-emerald-200 bg-white hover:bg-emerald-100/70 text-emerald-700 focus-visible:ring-emerald-600',
        divider: 'bg-emerald-200/80',
        title: 'text-emerald-950',
        time: 'text-emerald-800',
        printBtn: 'border-emerald-200 bg-white hover:bg-emerald-100/70 text-emerald-800 focus-visible:ring-emerald-600',
      };
    }
    return {
      card: 'bg-white border-slate-200 text-slate-900 shadow-xs',
      backBtn: 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 focus-visible:ring-[#0b6f61]',
      divider: 'bg-slate-200',
      title: 'text-slate-900',
      time: 'text-slate-600',
      printBtn: 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 focus-visible:ring-[#0b6f61]',
    };
  })();

  const rawTime = kasus?.waktu_laporan || kasus?.waktu || kasus?.created_at || kasus?.waktu_sos;
  const idDisplay = kasus?.id_kasus || kasus?.nomor_kasus || (isSos ? `SOS #${kasus?.id}` : `LAPORAN #${kasus?.id}`);

  return (
    <header className={`shrink-0 border rounded-2xl px-4 py-2.5 transition-colors flex items-center justify-between gap-3 print:border-slate-300 print:bg-white print:p-3 print:rounded-xl ${headerTheme.card}`}>
      {/* Sisi Kiri: Tombol Back, Tag ID, Status Badge, Judul & Waktu */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Kembali ke daftar kasus aktif"
          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 no-print focus-visible:outline-none focus-visible:ring-2 ${headerTheme.backBtn}`}
          title="Kembali ke Daftar Kasus Aktif"
        >
          <ArrowLeft size={15} />
        </button>

        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider flex items-center gap-1.5 shrink-0 ${
            isSos
              ? 'bg-rose-100 text-rose-700 border border-rose-200 print:bg-slate-100 print:text-rose-800'
              : 'bg-sky-100 text-sky-700 border border-sky-200 print:bg-slate-100 print:text-sky-800'
          }`}>
            {isSos && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block no-print" />}
            {idDisplay}
          </span>

          <Badge variant={kasus?.status} isPill showDot />

          {kasus?.urgensi && (
            <span className="hidden sm:inline-flex print:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Urgensi: {kasus.urgensi}
            </span>
          )}

          <div className={`h-4 w-px hidden md:block print:block ${headerTheme.divider}`} />

          <h1 className={`text-[14px] font-black truncate hidden md:block print:block ${headerTheme.title}`}>
            {kasus?.kategori_laporan || (isSos ? 'Panggilan Darurat SOS' : 'Laporan Kejadian')}
          </h1>

          <span className={`text-[11px] hidden xl:inline print:inline truncate ${headerTheme.time}`}>
            &middot; {formatDateTime(rawTime)}
          </span>
        </div>
      </div>

      {/* Sisi Kanan: Quick Operational Action Toolbar */}
      <div className="flex items-center gap-2 shrink-0 no-print">
        <button
          type="button"
          onClick={() => window.print()}
          aria-label="Cetak berkas kasus"
          className={`btn-base text-[11px] h-8 px-2.5 hidden sm:inline-flex focus-visible:outline-none focus-visible:ring-2 ${headerTheme.printBtn}`}
          title="Cetak Berkas Kasus"
        >
          <Printer size={12} />
          <span>Cetak</span>
        </button>

        {!isKasusSelesai && !isDitangani && !relawanBertugas && (
          <button
            type="button"
            onClick={() => onTanganiKasus('Kasus diambil alih penanganannya oleh Admin.')}
            disabled={loadingTangani}
            aria-label="Ambil alih penanganan kasus darurat"
            className="btn-base btn-secondary text-[11px] h-8 px-2.5 text-[#0b6f61] border-emerald-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
            title="Ambil alih penanganan kasus darurat"
          >
            {loadingTangani ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
            <span>Ambil Alih Kasus</span>
          </button>
        )}

        {!isKasusSelesai && (
          <button
            type="button"
            onClick={onOpenSelesaiModal}
            aria-label="Tandai kasus ini selesai ditangani"
            className="btn-base btn-primary text-[11px] h-8 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
            title="Tandai kasus ini selesai ditangani"
          >
            <CheckCircle2 size={12} />
            <span>Selesaikan Kasus</span>
          </button>
        )}
      </div>
    </header>
  );
}
