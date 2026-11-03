import { Eye, MapPin, Clock } from 'lucide-react';
import Badge from '../global/Badge';
import InitialsAvatar from '../global/InitialsAvatar';

export default function KasusTableView({
  cases,
  onOpenDetail,
  helpers = {},
}) {
  const {
    getPelapor = (c) => c?.pelapor?.name ?? 'Anonim',
    getFotoPelapor = () => null,
    getFotoRelawan = () => null,
    getDisabilitas = () => null,
    getWaktu = () => '-',
    getStatusRaw = (c) => c?.status || '',
    getKategori = () => 'Kasus',
  } = helpers;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[12.5px] border-collapse" aria-label="Tabel daftar kasus aktif">
        <thead>
          <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <th scope="col" className="py-3 px-4 w-12 text-center">Tipe</th>
            <th scope="col" className="py-3 px-4">Kasus / ID Kasus</th>
            <th scope="col" className="py-3 px-4">Status &amp; Urgensi</th>
            <th scope="col" className="py-3 px-4">Korban / Pelapor</th>
            <th scope="col" className="py-3 px-4">Lokasi Kejadian</th>
            <th scope="col" className="py-3 px-4">Relawan</th>
            <th scope="col" className="py-3 px-4">Waktu</th>
            <th scope="col" className="py-3 px-4 text-center w-28">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {cases.map((kasus) => {
            const isSos = kasus._tipeKategori === 'SOS';
            const statusRaw = getStatusRaw(kasus);
            const disabilitas = getDisabilitas(kasus);
            const relawan = kasus.relawan;
            const alamat = kasus.lokasi?.alamat ?? kasus.lokasi_laporan ?? 'Lokasi Kejadian';
            const idKasusDisplay = kasus.id_kasus || kasus.nomor_kasus || (isSos ? `SOS-${kasus.id}` : `LP-${kasus.id}`);

            const rowBgClass = (() => {
              if (!isSos) return 'hover:bg-slate-50/80';
              if (statusRaw === 'belum ditangani') {
                return 'bg-rose-100/80 hover:bg-rose-200/70 border-b border-rose-200/50';
              }
              if (statusRaw === 'ditangani') {
                return 'bg-amber-100/80 hover:bg-amber-200/70 border-b border-amber-200/50';
              }
              if (statusRaw === 'selesai') {
                return 'bg-emerald-100/80 hover:bg-emerald-200/70 border-b border-emerald-200/50';
              }
              return 'bg-rose-100/80 hover:bg-rose-200/70 border-b border-rose-200/50';
            })();

            return (
              <tr
                key={`${kasus._tipeKategori}-${kasus.id}`}
                tabIndex={0}
                role="button"
                aria-label={`Buka detail kasus ${idKasusDisplay} - ${getKategori(kasus)}`}
                onClick={() => onOpenDetail(kasus.id, kasus._tipeKategori)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenDetail(kasus.id, kasus._tipeKategori);
                  }
                }}
                className={`transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] focus-visible:ring-inset ${rowBgClass}`}
              >
                {/* Tipe Beacon */}
                <td className="py-3.5 px-4 text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-bold text-[10px] ${
                    isSos
                      ? 'bg-rose-200 text-rose-800 border border-rose-300 ring-2 ring-rose-500/20'
                      : 'bg-sky-100 text-sky-700 border border-sky-200'
                  }`}>
                    {isSos ? 'SOS' : 'LAP'}
                  </span>
                </td>

                {/* Kasus / ID */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg border shadow-2xs ${
                      isSos
                        ? 'bg-rose-100/90 text-rose-800 border-rose-300/80'
                        : 'bg-sky-100/90 text-sky-800 border-sky-300/80'
                    }`}>
                      {idKasusDisplay}
                    </span>
                    <span className="font-bold text-slate-900 group-hover:text-[#0b6f61] transition-colors">
                      {getKategori(kasus)}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant={getStatusRaw(kasus)} showDot isPill />
                    {kasus.urgensi && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        {kasus.urgensi}
                      </span>
                    )}
                  </div>
                </td>

                {/* Pelapor & Difabel Tag */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <InitialsAvatar name={getPelapor(kasus)} src={getFotoPelapor(kasus)} size={28} />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{getPelapor(kasus)}</p>
                      {disabilitas && (
                        <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded mt-0.5 capitalize">
                          {disabilitas}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Lokasi */}
                <td className="py-3.5 px-4 max-w-55">
                  <div className="flex items-center gap-1 text-slate-700">
                    <MapPin size={12} className="text-slate-500 shrink-0" />
                    <span className="truncate text-[12px]">{alamat}</span>
                  </div>
                </td>

                {/* Relawan */}
                <td className="py-3.5 px-4">
                  {relawan ? (
                    <div className="flex items-center gap-2">
                      <InitialsAvatar name={relawan.name} src={getFotoRelawan(relawan)} size={24} bgClass="bg-emerald-700" />
                      <span className="font-semibold text-slate-800 text-[12px] whitespace-nowrap">{relawan.name}</span>
                    </div>
                  ) : statusRaw === 'batal' || statusRaw === 'dibatalkan' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      Tidak Ditugaskan
                    </span>
                  ) : statusRaw === 'selesai' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                      Selesai
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Clock size={10} />
                      Menunggu Relawan
                    </span>
                  )}
                </td>

                {/* Waktu */}
                <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-[11.5px]">
                  {getWaktu(kasus)}
                </td>

                {/* Action */}
                <td className="py-3.5 px-4 text-center">
                  <button
                    type="button"
                    aria-label={`Buka detail kasus ${idKasusDisplay}`}
                    onClick={e => { e.stopPropagation(); onOpenDetail(kasus.id, kasus._tipeKategori); }}
                    className="btn-base btn-primary text-[11px] h-7 px-3 inline-flex items-center justify-center gap-1.5 group-hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
                  >
                    <Eye size={12} />
                    <span>Detail</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
