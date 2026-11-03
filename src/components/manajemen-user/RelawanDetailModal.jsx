import { useState } from 'react';
import {
  X, Check, ShieldAlert, Phone, MapPin, Briefcase, Heart, Calendar,
  Loader2, MessageSquare, Copy, CheckCheck, Power, ShieldCheck, UserCheck,
  FileText, ExternalLink, AlertCircle, ZoomIn, ZoomOut, RotateCw, RotateCcw,
  Maximize2, AlertTriangle, Eye
} from 'lucide-react';
import InitialsAvatar from '../global/InitialsAvatar';
import { resolveStorageUrl, getAvatarUrl } from '../../utils/theme';

export default function RelawanDetailModal({
  isOpen,
  onClose,
  relawan,
  onVerify,
  onToggleStatus,
}) {
  const [loadingAction, setLoadingAction] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Lightbox Zoom state untuk foto KTP
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !relawan) return null;

  const isPending = relawan.status_verifikasi === 'pending';
  const isActive = relawan.is_active === true || relawan.is_active === 1;

  // Resolusi URL Foto Profil & Dokumen KYC/KTP
  const avatarUrl = getAvatarUrl(relawan);
  const ktpRaw = relawan.dokumen_kyc_url || relawan.dokumen_kyc;
  const ktpUrl = resolveStorageUrl(ktpRaw);
  const isPdf = typeof ktpRaw === 'string' && ktpRaw.toLowerCase().endsWith('.pdf');
  const fileName = ktpRaw ? ktpRaw.split('/').pop() : '';

  const handleAction = async (status, reason = null) => {
    try {
      setLoadingAction(status);
      await onVerify(relawan.id, status, reason);
      setIsRejecting(false);
      setRejectionReason('');
      setIsLightboxOpen(false);
      onClose();
    } catch {
      // Handled by hook
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCopyPhone = () => {
    if (!relawan.no_telp) return;
    navigator.clipboard.writeText(relawan.no_telp);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const getWaUrl = () => {
    if (!relawan.no_telp) return null;
    let clean = relawan.no_telp.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    const msg = encodeURIComponent(
      `Halo ${relawan.name || relawan.nama || 'Relawan'}, kami dari Tim Posko Koordinasi Sahabat SOS.`
    );
    return `https://wa.me/${clean}?text=${msg}`;
  };

  const waUrl = getWaUrl();

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const openLightbox = () => {
    setZoomLevel(1);
    setRotation(0);
    setIsLightboxOpen(true);
  };

  const REJECTION_TEMPLATES = [
    'Foto KTP buram / tidak terbaca dengan jelas.',
    'Data identitas KTP tidak cocok dengan formulir pendaftaran.',
    'Foto KTP terpotong / bukan kartu identitas resmi.',
    'Belum melampirkan foto KTP resmi untuk verifikasi.',
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#eaedf1] overflow-hidden max-h-[92vh] flex flex-col">
          {/* Modal Top Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isPending ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-[#0b6f61]'
                }`}
              >
                {isPending ? <ShieldAlert size={18} /> : <UserCheck size={18} />}
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-slate-900 leading-tight">
                  {isPending ? 'Tinjau Pengajuan Relawan' : 'Profil Lengkap Relawan'}
                </h2>
                <p className="text-[12px] text-slate-500">
                  {isPending
                    ? 'Verifikasi foto KTP & kelengkapan identitas pendaftar'
                    : 'Informasi identitas dan keaktifan personil'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Profile Card Banner */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100/60 rounded-2xl border border-slate-200/70">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={relawan.name || 'Relawan'}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm flex-shrink-0"
                />
              ) : (
                <InitialsAvatar
                  name={relawan.name || relawan.nama || 'Relawan'}
                  size={64}
                  bgClass="bg-[#0b6f61]"
                />
              )}

              <div className="min-w-0 flex-1">
                <h3 className="text-[16px] font-bold text-slate-900 truncate">
                  {relawan.name || relawan.nama || '-'}
                </h3>
                <p className="text-[12.5px] text-slate-500 truncate">{relawan.email || 'Email tidak tersedia'}</p>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {isPending ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Menunggu Verifikasi
                    </span>
                  ) : (
                    <>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                        {isActive ? 'Aktif & Siaga' : 'Nonaktif'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        <ShieldCheck size={11} />
                        Terverifikasi
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Communication Bar */}
            <div className="flex items-center gap-2">
              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition-all shadow-xs"
                >
                  <MessageSquare size={15} />
                  <span>Hubungi via WhatsApp</span>
                </a>
              ) : null}

              {relawan.no_telp && (
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12.5px] font-semibold transition-colors cursor-pointer"
                  title="Salin nomor telepon"
                >
                  {copiedPhone ? (
                    <>
                      <CheckCheck size={14} className="text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="text-slate-400" />
                      <span>Salin No.</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* FOTO KTP & DOKUMEN IDENTITAS (KYC) SECTION */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 text-[#0b6f61] flex items-center justify-center">
                    <FileText size={15} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-slate-900 leading-tight">
                      Foto KTP / Identitas Relawan
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Dokumen pertimbangan verifikasi admin posko
                    </p>
                  </div>
                </div>

                {ktpUrl ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Check size={11} />
                    KTP Terlampir
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertTriangle size={11} />
                    KTP Kosong
                  </span>
                )}
              </div>

              {ktpUrl ? (
                isPdf ? (
                  /* Dokumen format PDF */
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-bold text-slate-800 truncate">
                          {fileName || 'Dokumen_Identitas_Relawan.pdf'}
                        </p>
                        <p className="text-[11px] text-slate-400">Berkas format PDF</p>
                      </div>
                    </div>
                    <a
                      href={ktpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0b6f61] text-[12px] font-bold inline-flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <ExternalLink size={13} />
                      <span>Buka Dokumen PDF</span>
                    </a>
                  </div>
                ) : (
                  /* Foto KTP Gambar (JPG, PNG, dll) */
                  <div className="space-y-2">
                    <div
                      onClick={openLightbox}
                      className="group relative w-full h-48 sm:h-56 bg-slate-900 rounded-xl overflow-hidden border border-slate-300 shadow-xs cursor-pointer flex items-center justify-center"
                      title="Klik untuk memperbesar foto KTP"
                    >
                      <img
                        src={ktpUrl}
                        alt="Foto KTP Relawan"
                        className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.parentElement.querySelector('.image-fallback');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div
                        className="image-fallback hidden absolute inset-0 items-center justify-center flex-col text-slate-300 gap-2 p-4 text-center bg-slate-800"
                      >
                        <AlertTriangle size={24} className="text-amber-400" />
                        <p className="text-[12px] font-semibold">Gagal memuat pratinjau gambar KTP</p>
                        <a
                          href={ktpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-teal-300 underline"
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          Buka langsung melalui tautan browser
                        </a>
                      </div>

                      {/* Overlay hover prompt */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                        <div className="px-3.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-xs text-[12px] font-bold flex items-center gap-1.5 shadow-lg">
                          <Maximize2 size={13} />
                          <span>Klik untuk Memperbesar</span>
                        </div>
                      </div>
                    </div>

                    {/* Toolbar aksi gambar */}
                    <div className="flex items-center justify-between text-[11.5px] px-1 text-slate-500">
                      <span className="truncate max-w-[200px]" title={fileName}>
                        📁 {fileName}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={openLightbox}
                          className="inline-flex items-center gap-1 text-[#0b6f61] hover:underline font-bold cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>Perbesar Foto</span>
                        </button>
                        <span>•</span>
                        <a
                          href={ktpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold"
                        >
                          <ExternalLink size={12} />
                          <span>Buka Tab Baru</span>
                        </a>
                      </div>
                    </div>

                    {/* Tips verifikasi untuk admin */}
                    {isPending && (
                      <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/80 text-[11.5px] text-teal-900 flex items-start gap-2">
                        <span className="text-teal-600 shrink-0 font-bold">💡</span>
                        <p className="leading-snug">
                          <strong>Panduan Verifikasi:</strong> Pastikan foto KTP terlihat jelas, nama di KTP cocok dengan <strong>&ldquo;{relawan.name || relawan.nama}&rdquo;</strong>, dan alamat domisili sesuai sebelum memberikan persetujuan.
                        </p>
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* Jika Relawan Belum Mengunggah KTP */
                <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-2">
                  <div className="flex items-start gap-2 text-amber-800">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[12.5px] font-bold">
                        Pendaftar Belum Mengunggah Foto KTP / Dokumen Identitas
                      </p>
                      <p className="text-[11.5px] text-amber-700 mt-0.5 leading-relaxed">
                        Akun relawan memerlukan bukti identitas resmi untuk diverifikasi. Disarankan untuk menolak pengajuan ini agar calon relawan melengkapi foto KTP-nya terlebih dahulu.
                      </p>
                    </div>
                  </div>
                  {isPending && !isRejecting && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRejecting(true);
                          setRejectionReason('Foto KTP / identitas wajib dilampirkan agar akun dapat diverifikasi.');
                        }}
                        className="px-3 py-1.5 bg-amber-200/80 hover:bg-amber-200 text-amber-900 rounded-lg text-[11.5px] font-bold transition-colors cursor-pointer"
                      >
                        Tolak karena KTP Belum Diunggah
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Information Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              {/* Phone */}
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <Phone size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No. Telepon / WA</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{relawan.no_telp || '-'}</p>
                </div>
              </div>

              {/* Occupation */}
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <Briefcase size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pekerjaan / Keahlian</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{relawan.pekerjaan || 'Relawan Umum'}</p>
                </div>
              </div>

              {/* Address */}
              <div className="sm:col-span-2 flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <MapPin size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alamat Domisili</p>
                  <p className="font-semibold text-slate-800 mt-0.5 leading-relaxed">{relawan.alamat || '-'}</p>
                </div>
              </div>

              {/* Registration Date */}
              {relawan.created_at && (
                <div className="sm:col-span-2 flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200/80">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
                    <Calendar size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Waktu Pendaftaran</p>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {new Date(relawan.created_at).toLocaleString('id-ID', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Reason / Bio */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Heart size={14} className="text-rose-500" />
                <p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-600">
                  Motivasi / Alasan Menjadi Relawan
                </p>
              </div>
              <p className="font-medium text-slate-700 whitespace-pre-line text-[13px] leading-relaxed italic bg-white p-3 rounded-xl border border-slate-200/60">
                &ldquo;{relawan.alasan_relawan || 'Tidak mencantumkan pesan khusus saat mendaftar.'}&rdquo;
              </p>
            </div>

            {/* Rejection Note if already rejected */}
            {relawan.status_verifikasi === 'ditolak' && relawan.alasan_penolakan && (
              <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-700">
                  <AlertCircle size={14} />
                  <p className="text-[11.5px] font-bold uppercase tracking-wider">
                    Alasan Penolakan Berkas
                  </p>
                </div>
                <p className="font-medium text-rose-800 text-[12.5px] leading-relaxed bg-white p-3 rounded-xl border border-rose-200/60">
                  {relawan.alasan_penolakan}
                </p>
              </div>
            )}

            {/* Reject Reason Input Dialog */}
            {isRejecting && (
              <div className="p-4 bg-rose-50/90 rounded-2xl border border-rose-200 space-y-3 animate-fade-in">
                <div className="flex items-center gap-1.5 text-rose-700">
                  <AlertCircle size={15} />
                  <h4 className="text-[12.5px] font-bold">Masukkan Alasan Penolakan Pendaftaran</h4>
                </div>

                {/* Template Alasan Cepat */}
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-rose-800">Pilih alasan cepat:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {REJECTION_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRejectionReason(tmpl)}
                        className="px-2.5 py-1 bg-white hover:bg-rose-100/70 border border-rose-200 text-rose-900 rounded-lg text-[11px] transition-colors cursor-pointer text-left"
                      >
                        {tmpl}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Tuliskan alasan penolakan (misal: Foto KTP buram, NIK tidak terbaca, dll)..."
                  rows={2}
                  className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-[12.5px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder:text-slate-400"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={loadingAction !== null}
                    onClick={() => handleAction('ditolak', rejectionReason)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-rose-600 hover:bg-rose-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {loadingAction === 'ditolak' ? <Loader2 size={12} className="animate-spin" /> : <X size={13} />}
                    <span>Kirim Penolakan</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>

            {isPending ? (
              !isRejecting && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loadingAction !== null}
                    onClick={() => setIsRejecting(true)}
                    className="px-4 h-10 rounded-xl text-[13px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <X size={15} />
                    <span>Tolak Pengajuan</span>
                  </button>

                  <button
                    type="button"
                    disabled={loadingAction !== null}
                    onClick={() => handleAction('terverifikasi')}
                    className="px-4 h-10 rounded-xl text-[13px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {loadingAction === 'terverifikasi' ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
                    <span>Setujui Relawan</span>
                  </button>
                </div>
              )
            ) : (
              typeof onToggleStatus === 'function' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onToggleStatus(relawan, !isActive);
                  }}
                  className={`px-4 h-10 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Power size={14} />
                  <span>{isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL UNTUK MEMERIKSA FOTO KTP */}
      {isLightboxOpen && ktpUrl && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col animate-fade-in">
          {/* Lightbox Topbar */}
          <div className="px-4 sm:px-6 py-3 bg-black/60 border-b border-white/10 flex items-center justify-between text-white">
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold truncate">
                Foto KTP: {relawan.name || relawan.nama || 'Relawan'}
              </h3>
              <p className="text-[12px] text-slate-300">
                Verifikasi NIK, nama lengkap, dan keaslian dokumen
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                title="Perkecil (-25%)"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-[12px] font-mono text-slate-300 px-1 min-w-[45px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                title="Perbesar (+25%)"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                title="Putar 90°"
              >
                <RotateCw size={16} />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                title="Reset Zoom & Rotasi"
              >
                <RotateCcw size={16} />
              </button>
              <a
                href={ktpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                title="Buka File Asli di Tab Baru"
              >
                <ExternalLink size={16} />
              </a>
              <div className="w-px h-6 bg-white/20 mx-1" />
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="w-9 h-9 rounded-lg bg-rose-600/80 hover:bg-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup (ESC)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Lightbox Canvas Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 select-none">
            <div className="relative transition-transform duration-150 ease-out flex items-center justify-center">
              <img
                src={ktpUrl}
                alt="Foto KTP Relawan Fullscreen"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  maxWidth: '90vw',
                  maxHeight: '75vh',
                }}
                className="rounded-xl shadow-2xl object-contain"
              />
            </div>
          </div>

          {/* Lightbox Bottom Info Bar for Instant Cross-Check */}
          <div className="px-4 sm:px-6 py-3 bg-black/75 border-t border-white/10 text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-slate-300">
              <div>
                <span className="text-slate-400">Nama di Form:</span>{' '}
                <strong className="text-white">{relawan.name || relawan.nama || '-'}</strong>
              </div>
              <div>
                <span className="text-slate-400">No. HP:</span>{' '}
                <strong className="text-white">{relawan.no_telp || '-'}</strong>
              </div>
              <div>
                <span className="text-slate-400">Alamat:</span>{' '}
                <strong className="text-white">{relawan.alamat || '-'}</strong>
              </div>
              <div>
                <span className="text-slate-400">Pekerjaan:</span>{' '}
                <strong className="text-white">{relawan.pekerjaan || 'Relawan'}</strong>
              </div>
            </div>

            {/* Quick Actions in Lightbox */}
            {isPending && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loadingAction !== null}
                  onClick={() => {
                    setIsLightboxOpen(false);
                    setIsRejecting(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-[12px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <X size={13} />
                  <span>Tolak</span>
                </button>
                <button
                  type="button"
                  disabled={loadingAction !== null}
                  onClick={() => handleAction('terverifikasi')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                >
                  {loadingAction === 'terverifikasi' ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  <span>Setujui Relawan</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
