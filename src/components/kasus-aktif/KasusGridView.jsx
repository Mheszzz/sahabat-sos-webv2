import { Eye, MapPin, Clock } from 'lucide-react';
import Badge from '../global/Badge';
import InitialsAvatar from '../global/InitialsAvatar';

export default function KasusGridView({
  cases,
  onOpenDetail,
  helpers = {},
}) {
  const {
    getPelapor = (c) => c?.pelapor?.name ?? 'Anonim',
    getFotoPelapor = () => null,
    getFotoRelawan = () => null,
    getDisabilitas = () => null,
    getStatusRaw = (c) => c?.status || '',
    getKategori = () => 'Kasus',
  } = helpers;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
      {cases.map((kasus) => {
        const isSos = kasus._tipeKategori === 'SOS';
        const disabilitas = getDisabilitas(kasus);
        const relawan = kasus.relawan;
        const alamat = kasus.lokasi?.alamat ?? kasus.lokasi_laporan ?? 'Lokasi Kejadian';
        const statusRaw = getStatusRaw(kasus);
        const idKasusDisplay = kasus.id_kasus || kasus.nomor_kasus || (isSos ? `SOS-${kasus.id}` : `LP-${kasus.id}`);

        let cardBgBorder = 'bg-white border-slate-200 hover:border-slate-300';
        if (isSos) {
          if (statusRaw === 'belum ditangani') {
            cardBgBorder = 'bg-rose-50/35 border-rose-200 hover:border-rose-300 ring-1 ring-rose-500/10';
          } else if (statusRaw === 'ditangani') {
            cardBgBorder = 'bg-amber-50/35 border-amber-200 hover:border-amber-300 ring-1 ring-amber-500/10';
          } else if (statusRaw === 'selesai') {
            cardBgBorder = 'bg-emerald-50/35 border-emerald-200 hover:border-emerald-300 ring-1 ring-emerald-500/10';
          }
        }

        return (
          <div
            key={`${kasus._tipeKategori}-${kasus.id}`}
            role="button"
            tabIndex={0}
            aria-label={`Buka detail kasus ${idKasusDisplay} - ${getKategori(kasus)}`}
            onClick={() => onOpenDetail(kasus.id, kasus._tipeKategori)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenDetail(kasus.id, kasus._tipeKategori);
              }
            }}
            className={`group border rounded-xl p-3.5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61] ${cardBgBorder}`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase tracking-wide ${
                    isSos ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                  }`}>
                    {isSos ? 'DARURAT SOS' : 'LAPORAN'}
                  </span>
                  <span className={`font-mono text-[10.5px] font-bold px-1.5 py-0.2 rounded border ${
                    isSos
                      ? 'bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-sky-100 text-sky-700 border-sky-200'
                  }`}>
                    {idKasusDisplay}
                  </span>
                </div>
                <Badge variant={getStatusRaw(kasus)} showDot isPill className="text-[10px] py-0.5 px-2" />
              </div>

              <div>
                <h3 className="text-[13.5px] font-bold text-slate-900 line-clamp-1 leading-snug group-hover:text-[#0b6f61] transition-colors">
                  {getKategori(kasus)}
                </h3>
                <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5 line-clamp-1" title={alamat}>
                  <MapPin size={11} className="text-slate-500 shrink-0" />
                  <span>{alamat}</span>
                </p>
              </div>

              <div className="px-2.5 py-1.5 bg-slate-50/75 rounded-lg border border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <InitialsAvatar name={getPelapor(kasus)} src={getFotoPelapor(kasus)} size={24} />
                  <div className="min-w-0 leading-tight">
                    <p className="text-[11.5px] font-bold text-slate-800 truncate">{getPelapor(kasus)}</p>
                    <p className="text-[9.5px] text-slate-500 font-medium">Pelapor</p>
                  </div>
                </div>
                {disabilitas && (
                  <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md capitalize shrink-0">
                    {disabilitas}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100/90 flex items-center justify-between gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                {relawan ? (
                  <>
                    <InitialsAvatar name={relawan.name} src={getFotoRelawan(relawan)} size={20} bgClass="bg-emerald-700" />
                    <span
                      className="font-semibold text-slate-800 text-[11.5px] truncate"
                      title={relawan.name}
                    >
                      {relawan.name}
                    </span>
                  </>
                ) : statusRaw === 'batal' || statusRaw === 'dibatalkan' ? (
                  <span className="text-slate-500 font-semibold flex items-center gap-1 text-[10.5px]">
                    Tidak Ditugaskan
                  </span>
                ) : statusRaw === 'selesai' ? (
                  <span className="text-slate-500 font-semibold flex items-center gap-1 text-[10.5px]">
                    Selesai
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold flex items-center gap-1 text-[10.5px]">
                    <Clock size={11} />
                    Belum ditugaskan
                  </span>
                )}
              </div>

              <button
                type="button"
                aria-label={`Buka detail kasus ${idKasusDisplay}`}
                onClick={e => { e.stopPropagation(); onOpenDetail(kasus.id, kasus._tipeKategori); }}
                className="btn-base btn-primary text-[10.5px] h-6.5 px-2.5 shrink-0 inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6f61]"
              >
                <Eye size={11} />
                <span>Detail</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
