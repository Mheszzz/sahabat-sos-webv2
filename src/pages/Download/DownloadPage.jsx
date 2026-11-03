import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Radio,
  MapPin,
  HeartHandshake,
  ExternalLink,
  ChevronRight,
  Volume2,
  Watch,
  Layers,
  Lock,
  MessageSquare,
  Signal,
  Wifi,
  Battery,
  Heart,
  Phone,
  Clock,
  Home,
  User,
  RotateCw,
  Play
} from 'lucide-react';

export default function DownloadPage() {
  // Simulator State: 'idle' | 'triggering' | 'dispatching' | 'connected'
  const [simState, setSimState] = useState('idle');
  const [simProgress, setSimProgress] = useState(0);
  const [activeRole, setActiveRole] = useState('difabel'); // 'difabel' | 'relawan' | 'posko'

  // Hardware Tuya State
  const [tuyaPressed, setTuyaPressed] = useState(false);
  const [tuyaBeamActive, setTuyaBeamActive] = useState(false);

  // Guide & Verification State
  const [activeGuideStep, setActiveGuideStep] = useState(1);
  const [allowUnknownSourcesToggle, setAllowUnknownSourcesToggle] = useState(true);

  const apkSizeFormatted = '98.9 MB';
  const apkPackageId = 'com.sahabatsos.mobile';
  const apkDownloadPath = '/SahabatSOS.apk';

  // Trigger SOS Simulation Sequence
  const triggerSosSimulation = useCallback(() => {
    if (simState !== 'idle') return;

    setSimState('triggering');
    setSimProgress(15);

    const timer1 = setTimeout(() => {
      setSimState('dispatching');
      setSimProgress(65);
    }, 1200);

    const timer2 = setTimeout(() => {
      setSimState('connected');
      setSimProgress(100);
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [simState]);

  // Reset SOS Simulation
  const resetSosSimulation = () => {
    setSimState('idle');
    setSimProgress(0);
    setTuyaPressed(false);
    setTuyaBeamActive(false);
  };

  // Hardware Tuya Button Click Trigger
  const handleTuyaButtonClick = () => {
    setTuyaPressed(true);
    setTuyaBeamActive(true);

    if (simState === 'idle') {
      setTimeout(() => {
        triggerSosSimulation();
      }, 400);
    }

    setTimeout(() => {
      setTuyaPressed(false);
      setTuyaBeamActive(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-[#0f172a] font-['Plus_Jakarta_Sans',sans-serif] selection:bg-emerald-200 selection:text-emerald-950 flex flex-col antialiased overflow-x-hidden">

      {/* ── UNIFIED COMMAND HERO HEADER (Rich Forest Emerald) ── */}
      <section className="relative overflow-hidden bg-[#062c26] text-white pb-20 pt-2">
        {/* Ambient deep gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 90% 70% at 50% 20%, #0b453b 0%, #062c26 100%)'
          }}
        />

        {/* ── NAVBAR ── */}
        <header className="relative z-40 text-white">
          <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2.5 sm:gap-4">
            <Link to="/" className="min-w-0 shrink flex items-center gap-2.5 sm:gap-3 group focus-visible:outline-2 focus-visible:outline-emerald-400 rounded-xl">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200 shrink-0">
                <img src="/logo.png" alt="Logo Sahabat SOS" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-emerald-300 transition-colors whitespace-nowrap">
                Sahabat SOS
              </span>
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white/90 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-400"
              >
                <Lock size={13} className="text-[#34d399] shrink-0" />
                <span className="hidden xs:inline">Portal </span>
                <span>Posko</span>
              </Link>

              <a
                href={apkDownloadPath}
                download="SahabatSOS.apk"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] rounded-xl shadow-md transition-all hover:shadow-red-600/30 active:scale-95 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-white"
              >
                <Download size={13} className="shrink-0" />
                <span>Unduh<span className="hidden xs:inline"> APK</span></span>
              </a>
            </div>
          </div>
        </header>

        {/* ── HERO & INTERACTIVE SIMULATOR GRID ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-8 sm:pb-12 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
          {/* Left Column: Information, Verification, Direct CTA */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight sm:leading-[1.15] text-white">
              Aplikasi Tanggap Darurat <br className="hidden sm:inline" />
              <span className="text-[#34d399]">Sahabat SOS</span> Mobile
            </h1>

            <p className="text-xs xs:text-sm sm:text-base text-slate-200 leading-relaxed max-w-xl">
              Platform respons darurat terintegrasi untuk rekan penyandang disabilitas, relawan siaga lapangan, dan operator posko induk. Dilengkapi tombol panik aksesibel, navigasi GPS Haversine, dan integrasi tombol IoT Tuya.
            </p>

            {/* Action buttons */}
            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <a
                href={apkDownloadPath}
                download="SahabatSOS.apk"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 sm:px-6 py-3.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white font-bold text-sm shadow-lg shadow-red-900/30 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-white group text-center"
              >
                <Download size={18} className="group-hover:translate-y-0.5 transition-transform shrink-0" />
                <span>Unduh SahabatSOS.apk (98.9 MB)</span>
              </a>
            </div>

            {/* Spesifikasi Teknis */}
            <div className="pt-2 sm:pt-3 max-w-lg">
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden text-xs">
                {/* Specs row */}
                <dl className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10 p-3 sm:p-3.5 gap-2 sm:gap-0">
                  <div className="sm:px-3 sm:first:pl-0">
                    <dt className="text-white/60 text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Format Berkas</dt>
                    <dd className="font-bold text-white text-xs sm:text-sm mt-0.5">APK Android (ARM64/v7a)</dd>
                  </div>
                  <div className="sm:px-3 pt-2 sm:pt-0">
                    <dt className="text-white/60 text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Persyaratan Sistem</dt>
                    <dd className="font-bold text-white text-xs sm:text-sm mt-0.5">Android 8.0 ke atas</dd>
                  </div>
                  <div className="sm:px-3 sm:last:pr-0 pt-2 sm:pt-0">
                    <dt className="text-white/60 text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Distribusi</dt>
                    <dd className="font-bold text-[#34d399] text-xs sm:text-sm mt-0.5">Bebas Biaya / Inklusif</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Phone Mockup Simulator */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* Interactive Role Switcher */}
            <div className="mb-3 w-full max-w-[340px] flex items-center justify-center gap-1 p-1 bg-black/30 rounded-xl border border-white/15 backdrop-blur-xs text-xs">
              <button
                type="button"
                onClick={() => setActiveRole('difabel')}
                className={`flex-1 text-center py-2 px-1 xs:px-2 rounded-lg font-bold text-[10px] xs:text-[11px] transition-all cursor-pointer ${
                  activeRole === 'difabel'
                    ? 'bg-[#0b6f61] text-white shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Peran Pengguna
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('relawan')}
                className={`flex-1 text-center py-2 px-1 xs:px-2 rounded-lg font-bold text-[10px] xs:text-[11px] transition-all cursor-pointer ${
                  activeRole === 'relawan'
                    ? 'bg-[#0b6f61] text-white shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Peran Relawan
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('posko')}
                className={`flex-1 text-center py-2 px-1 xs:px-2 rounded-lg font-bold text-[10px] xs:text-[11px] transition-all cursor-pointer ${
                  activeRole === 'posko'
                    ? 'bg-[#0b6f61] text-white shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Status Posko
              </button>
            </div>

            {/* Tactile Smartphone Container */}
            <div className="relative w-full max-w-[340px] bg-white rounded-3xl p-3 shadow-2xl border-4 border-[#0b6f61]/80 transition-all duration-300">
              {/* Badge: Live Simulator Indicator */}
              <div className="absolute -top-2.5 right-2 sm:-right-2.5 z-20 bg-[#dc2626] text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                <span>Simulasi Interaktif</span>
              </div>

              {/* Smartphone Inner Screen */}
              <div className="rounded-2xl overflow-hidden bg-[#f4f7f6] border border-slate-200/90 text-slate-800 flex flex-col select-none">
                {/* Phone Top Status Bar */}
                <div className="bg-[#f4f7f6] px-3.5 pt-2 pb-1 flex items-center justify-between text-[10px] text-slate-600 font-semibold">
                  <span>09:41</span>
                  <div className="w-16 h-2.5 bg-slate-900 rounded-full" />
                  <div className="flex items-center gap-1 text-slate-700">
                    <Signal size={10} />
                    <Wifi size={10} />
                    <Battery size={11} className="fill-slate-700" />
                  </div>
                </div>

                {/* In-App Header */}
                <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-200 bg-white">
                  <div className="flex items-center gap-1.5">
                    <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain rounded" />
                    <div>
                      <p className="text-[11px] font-bold text-[#00695c] leading-tight">
                        {activeRole === 'difabel' ? 'Halo, Budi Pratama' : activeRole === 'relawan' ? 'Relawan: Sarah Ananda' : 'Posko Induk Komando'}
                      </p>
                      <p className="text-[8.5px] text-slate-500 leading-none">
                        {activeRole === 'difabel' ? 'Disabilitas Sensorik (Tunarungu)' : activeRole === 'relawan' ? 'Keahlian: BISINDO & Medis' : 'Sinkronisasi Waktu Nyata'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetSosSimulation}
                    title="Ulangi simulasi interaktif"
                    className="p-1 rounded-md text-[#00695c] hover:bg-emerald-50 transition-colors"
                  >
                    <RotateCw size={12} className={simState !== 'idle' ? 'animate-spin' : ''} />
                  </button>
                </div>

                {/* ── SCREEN VIEW: ROLE DIFABEL (SOS Trigger) ── */}
                {activeRole === 'difabel' && (
                  <div className="p-3 space-y-2.5">
                    {/* SOS Trigger Area with Interactive States */}
                    <div className="flex flex-col items-center pt-1 pb-1">
                      <div className="relative">
                        {/* Radar expansion rings when triggered */}
                        {simState !== 'idle' && (
                          <>
                            <div className="absolute -inset-4 rounded-full bg-red-500/20 animate-ping pointer-events-none" />
                            <div className="absolute -inset-8 rounded-full border-2 border-red-500/30 anim-pulse-wave pointer-events-none" />
                          </>
                        )}

                        <button
                          type="button"
                          onClick={triggerSosSimulation}
                          disabled={simState !== 'idle'}
                          className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center text-white transition-all transform cursor-pointer ${
                            simState === 'idle'
                              ? 'bg-gradient-to-br from-[#ef4444] via-[#dc2626] to-[#b91c1c] shadow-[0_8px_24px_rgba(220,38,38,0.45)] hover:scale-105 active:scale-95'
                              : simState === 'triggering'
                              ? 'bg-[#dc2626] scale-100 shadow-[0_0_30px_rgba(220,38,38,0.7)]'
                              : simState === 'dispatching'
                              ? 'bg-[#ea580c] scale-100 shadow-[0_0_30px_rgba(234,88,12,0.6)]'
                              : 'bg-[#15803d] scale-100 shadow-[0_0_30px_rgba(21,128,61,0.6)]'
                          }`}
                          aria-label="Picu sinyal darurat interaktif"
                        >
                          {simState === 'idle' ? (
                            <>
                              <AlertTriangle size={26} className="text-white drop-shadow-sm mb-0.5" />
                              <span className="text-xl font-black tracking-widest leading-none drop-shadow">SOS</span>
                              <span className="text-[9px] font-extrabold tracking-wider leading-none mt-0.5 opacity-90">DARURAT</span>
                            </>
                          ) : simState === 'triggering' ? (
                            <>
                              <Radio size={24} className="text-white animate-spin mb-1" />
                              <span className="text-[10px] font-black tracking-wider text-center leading-tight">MENGUNCI<br />GPS</span>
                            </>
                          ) : simState === 'dispatching' ? (
                            <>
                              <MapPin size={24} className="text-white animate-bounce mb-1" />
                              <span className="text-[10px] font-black tracking-wider text-center leading-tight">MENCARI<br />RELAWAN</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={26} className="text-white mb-0.5" />
                              <span className="text-[11px] font-black tracking-wider text-center leading-tight">TERHUBUNG</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Interactive Simulation Status Card */}
                      <div className="mt-2.5 w-full bg-white rounded-xl p-2 border border-slate-200 text-center shadow-2xs">
                        {simState === 'idle' && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-slate-800">Uji Coba Simulator Darurat</p>
                            <p className="text-[8.5px] text-slate-500">
                              Ketuk tombol merah di atas untuk mensimulasikan alur pertolongan.
                            </p>
                          </div>
                        )}
                        {simState === 'triggering' && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#dc2626]">
                              <Radio size={12} className="animate-spin" />
                              <span>Sinyal Dikirim ke Backend Posko</span>
                            </div>
                            <p className="text-[8.5px] text-slate-500 font-mono">
                              Koordinat: -6.2088° S, 106.8456° E (Akurasi 4m)
                            </p>
                          </div>
                        )}
                        {simState === 'dispatching' && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#d97706]">
                              <MapPin size={12} className="animate-bounce" />
                              <span>Kalkulasi Proksimitas Haversine</span>
                            </div>
                            <p className="text-[8.5px] text-slate-500">
                              Memindai relawan terdekat dalam radius 1.5 kilometer...
                            </p>
                          </div>
                        )}
                        {simState === 'connected' && (
                          <div className="space-y-1 bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-200">
                            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>3 Relawan Siaga Menerima Penugasan</span>
                            </div>
                            <p className="text-[8.5px] text-emerald-700">
                              Relawan Sarah Ananda (250m) sedang menuju lokasi pelapor.
                            </p>
                            <button
                              type="button"
                              onClick={resetSosSimulation}
                              className="mt-1 px-2.5 py-0.5 bg-emerald-700 text-white rounded text-[8.5px] font-bold hover:bg-emerald-800 transition-colors"
                            >
                              Reset Ulang Simulasi
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Telemetry Indicator Strip */}
                    <div className="bg-white rounded-xl p-2 border border-slate-200 shadow-2xs grid grid-cols-2 gap-2 text-left">
                      <div className="flex items-center gap-1.5">
                        <Heart size={13} className="text-red-500 fill-red-500 animate-pulse" />
                        <div>
                          <p className="text-[9px] font-bold text-slate-800">76 BPM</p>
                          <p className="text-[7.5px] text-slate-400">BLE Smartband</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Volume2 size={13} className="text-[#00695c]" />
                        <div>
                          <p className="text-[9px] font-bold text-slate-800">TTS Aktif</p>
                          <p className="text-[7.5px] text-slate-400">Panduan Suara</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SCREEN VIEW: ROLE RELAWAN ── */}
                {activeRole === 'relawan' && (
                  <div className="p-3 space-y-2.5">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                          Panggilan Darurat Aktif
                        </span>
                        <span className="text-[9px] text-emerald-700 font-bold">Jarak: 250 Meter</span>
                      </div>
                      <p className="font-bold text-[11px] text-slate-900 leading-tight">
                        Budi Pratama (Tunarungu)
                      </p>
                      <p className="text-[9px] text-slate-600 mt-0.5">
                        Lokasi: Dekat Halte Busway Koridor 1, Jakarta
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        <div className="flex-1 bg-white border border-emerald-300 rounded-lg p-1.5 text-center">
                          <span className="block text-[8px] text-slate-500 uppercase">Kebutuhan</span>
                          <span className="text-[9.5px] font-bold text-slate-800">Bahasa Isyarat BISINDO</span>
                        </div>
                        <div className="flex-1 bg-white border border-emerald-300 rounded-lg p-1.5 text-center">
                          <span className="block text-[8px] text-slate-500 uppercase">Status Korban</span>
                          <span className="text-[9.5px] font-bold text-emerald-700">BPM Normal (76)</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mt-2.5 w-full py-1.5 bg-[#0b6f61] text-white rounded-lg font-bold text-[10px] text-center shadow-xs"
                      >
                        Buka Peta Navigasi &amp; Konfirmasi Respons
                      </button>
                    </div>

                    <p className="text-[8.5px] text-slate-500 text-center">
                      Algoritma Haversine memprioritaskan relawan dengan keterampilan yang sesuai.
                    </p>
                  </div>
                )}

                {/* ── SCREEN VIEW: ROLE POSKO ── */}
                {activeRole === 'posko' && (
                  <div className="p-3 space-y-2 text-xs">
                    <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-800">Sinkronisasi WebSocket</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Terhubung
                        </span>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded-lg text-[9px] space-y-0.5">
                        <p className="text-slate-700 font-semibold">Kasus #SOS-2026-0814</p>
                        <p className="text-slate-500">Dispatcher: Sistem Otomatis Tuya &amp; Mobile</p>
                        <p className="text-emerald-700 font-medium">Relawan tertugaskan: 2 Personel Lapangan</p>
                      </div>
                    </div>
                    <p className="text-[8.5px] text-slate-500 text-center">
                      Tersambung langsung ke antarmuka Dashboard Web Command Center Posko.
                    </p>
                  </div>
                )}

                {/* Bottom App Navigation Bar */}
                <div className="bg-white border-t border-slate-200/80 px-2.5 py-1.5 flex items-center justify-around select-none">
                  <div className="flex flex-col items-center text-[#00695c]">
                    <Home size={13} className="stroke-[2.5]" />
                    <span className="text-[7.5px] font-bold">Beranda</span>
                  </div>
                  <div className="flex flex-col items-center text-slate-400">
                    <MessageSquare size={13} />
                    <span className="text-[7.5px] font-medium">Laporan</span>
                  </div>
                  <div className="flex flex-col items-center text-slate-400">
                    <Radio size={13} />
                    <span className="text-[7.5px] font-medium">Alat IoT</span>
                  </div>
                  <div className="flex flex-col items-center text-slate-400">
                    <Clock size={13} />
                    <span className="text-[7.5px] font-medium">Riwayat</span>
                  </div>
                  <div className="flex flex-col items-center text-slate-400">
                    <User size={13} />
                    <span className="text-[7.5px] font-medium">Profil</span>
                  </div>
                </div>
              </div>

              {/* Mockup Sub-caption */}
              <div className="mt-2.5 px-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 text-[#0b6f61] font-bold">
                  <Smartphone size={13} />
                  <span>Flutter Native Client</span>
                </span>
                <span className="font-semibold text-slate-600">v1.0.0 Build</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: 3 ARSITEKTUR PERAN TERINTEGRASI (Difabel, Relawan, Posko) ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 sm:mt-10 lg:-mt-8 relative z-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Difabel */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-lg transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#dc2626] flex items-center justify-center mb-3.5 border border-red-100">
              <AlertTriangle size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#dc2626] bg-red-50 px-2 py-0.5 rounded-md inline-block mb-1.5">
              Aksesibilitas Difabel
            </span>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Tombol Darurat Aksesibel
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tombol darurat sentuh berukuran ekstra besar, pembaca suara Text-to-Speech Bahasa Indonesia, getaran haptic bertingkat, serta kontras warna tinggi untuk pengguna tunanetra dan tunadaksa.
            </p>
          </div>

          {/* Card 2: Relawan */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-lg transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0b6f61] flex items-center justify-center mb-3.5 border border-emerald-100">
              <HeartHandshake size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0b6f61] bg-emerald-50 px-2 py-0.5 rounded-md inline-block mb-1.5">
              Relawan Siaga
            </span>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Peta Penugasan Haversine
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kalkulasi matematis Haversine menentukan relawan terdekat dari koordinat pelapor, mencocokkan keahlian khusus seperti bahasa isyarat BISINDO atau medis lapangan.
            </p>
          </div>

          {/* Card 3: Posko Web Command */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-lg transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#062c26] flex items-center justify-center mb-3.5 border border-teal-100">
              <ShieldCheck size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#062c26] bg-teal-50 px-2 py-0.5 rounded-md inline-block mb-1.5">
              Posko Terpadu
            </span>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Koordinasi Command Center
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sinkronisasi data langsung via WebSocket dua arah ke dashboard admin web, memudahkan pemantauan persebaran armada pertolongan dan riwayat penanganan darurat.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION: TUYA SMART PANIC BUTTON INTERACTIVE HARDWARE SHOWCASE ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 w-full">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            {/* Visual Hardware Interactive Mockup Column */}
            <div className="lg:col-span-5 p-6 sm:p-8 bg-gradient-to-b from-[#f8fafc] to-[#eaf2ef] border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col items-center text-center relative">
              <div className="w-full max-w-[280px] bg-white rounded-2xl p-5 shadow-md border border-slate-200 relative mb-3">
                <span className="absolute top-3 left-3 bg-[#dc2626] text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                  Perangkat Keras IoT
                </span>

                {/* Interactive Tuya Panic Button Physical Render */}
                <div className="py-2 flex flex-col items-center justify-center select-none">
                  <div className="relative">
                    {/* Wireless transmission arc when pressed */}
                    {tuyaBeamActive && (
                      <div className="absolute -inset-6 rounded-full border-2 border-red-500/50 anim-pulse-wave pointer-events-none" />
                    )}

                    {/* SVG Graphic of Tuya Panic Button */}
                    <svg viewBox="0 0 200 240" className="w-full max-h-[220px] mx-auto block" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Lanyard Strap */}
                      <path d="M100 115 C 100 95, 68 55, 85 22 C 95 3, 115 3, 120 25 C 125 50, 100 90, 100 115" stroke="#2563eb" strokeWidth="9" strokeLinecap="round" fill="none" />
                      <rect x="94" y="108" width="12" height="10" rx="2" fill="#1e293b" />
                      <line x1="100" y1="118" x2="100" y2="130" stroke="#94a3b8" strokeWidth="2" />

                      {/* White Housing */}
                      <rect x="52" y="130" width="96" height="96" rx="28" fill="#ffffff" stroke="#cbd5e1" strokeWidth="3" filter="drop-shadow(0 6px 10px rgba(0,0,0,0.08))" />

                      {/* Interactive Red CALL Button */}
                      <rect
                        x="72"
                        y="148"
                        width="56"
                        height="56"
                        rx="16"
                        fill={tuyaPressed ? '#991b1b' : '#dc2626'}
                        className="transition-colors cursor-pointer"
                        onClick={handleTuyaButtonClick}
                      />

                      {/* Bell Icon & Radio Wave on Button */}
                      <path d="M100 158 C96 158 93 161 93 165 L91 172 H109 L107 165 C107 161 104 158 100 158 Z" fill="#ffffff" />
                      <circle cx="100" cy="174" r="1.5" fill="#ffffff" />
                      <path d="M96 156 C98 154.5 102 154.5 104 156" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M94 153.5 C98 151.5 102 151.5 106 153.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />

                      {/* CALL Text */}
                      <text x="100" y="193" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="0.08em" fontFamily="system-ui, sans-serif">
                        CALL
                      </text>

                      {/* Status Sensor Dot */}
                      <circle cx="100" cy="214" r="2" fill={tuyaPressed ? '#ef4444' : '#94a3b8'} />
                    </svg>
                  </div>

                  <button
                    type="button"
                    onClick={handleTuyaButtonClick}
                    className="mt-3 px-4 py-1.5 bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
                  >
                    {tuyaPressed ? 'Sinyal IoT Terpancar!' : 'Tekan Tombol Fisik (Uji Sinyal)'}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0b6f61]">
                <Radio size={14} />
                <span>Terhubung Webhook API Tuya Smart</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Dapat dikalungkan pada leher atau dipasang pada pegangan kursi roda untuk pemanggilan cepat tanpa ponsel.
              </p>
            </div>

            {/* Content & Architectural Value Column */}
            <div className="lg:col-span-7 p-6 sm:p-10 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0b6f61]">
                Integrasi Perangkat Keras Eksternal
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#062c26] tracking-tight">
                Pemicu Darurat Fisik Tanpa Perlu Membuka Kunci Layar
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed">
                Pengguna lanjut usia maupun individu dengan disabilitas motorik dapat menghadapi kendala saat harus membuka kunci smartphone dalam kondisi kritis. Sahabat SOS terhubung langsung dengan tombol fisik <strong>Tuya Panic Button</strong> melalui gerbang API IoT.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200">
                  <h4 className="font-bold text-xs text-[#062c26] mb-1">
                    Satu Tekanan Instan
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Menekan tombol CALL fisik langsung memicu eskalasi sinyal darurat pada server posko tanpa navigasi aplikasi.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200">
                  <h4 className="font-bold text-xs text-[#062c26] mb-1">
                    Transmisi Cepat ke Relawan
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sinyal terusan otomatis menyiarkan notifikasi ke smartphone relawan terdekat dalam radius pelapor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: FITUR UTAMA SISTEM (Non-repetitive, Content-driven) ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-extrabold text-[#0b6f61] uppercase tracking-wider">
            Kapabilitas Lengkap
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#062c26] tracking-tight">
            Fitur Kunci Aplikasi Sahabat SOS Mobile
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Didesain khusus untuk memastikan sinyal bahaya tiba tepat waktu dengan media interaksi yang ramah disabilitas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#dc2626] flex items-center justify-center mb-3">
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Tombol Darurat Terpusat</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Merekam titik koordinat satelit GPS pelapor dan mendistribusikan sinyal bahaya ke sistem secara otomatis dalam hitungan detik.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0b6f61] flex items-center justify-center mb-3">
              <MapPin size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Perhitungan Jarak Haversine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pengukuran proksimitas presisi menghitung jarak riil antar relawan siaga untuk memprioritaskan penolong yang berada paling dekat.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#062c26] flex items-center justify-center mb-3">
              <MessageSquare size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Pesan Otomatis WhatsApp</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tautan darurat otomatis disiapkan untuk kontak darurat keluarga pengguna, berisi rincian lokasi Google Maps dan kondisi pelapor.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
              <Volume2 size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Aksesibilitas Suara &amp; Getar</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pemandu Text-to-Speech (TTS) berbahasa Indonesia dan getaran berpola membantu pengguna disabilitas sensorik saat berinteraksi.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
              <Watch size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Telemetri BLE Smartwatch</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kompatibel dengan sensor jam tangan pintar Bluetooth Low Energy untuk memantau detak jantung dan mendeteksi kondisi darurat vital.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all duration-200">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <ShieldCheck size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Verifikasi Relawan Ketat</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Relawan melalui peninjauan verifikasi keahlian khusus sebelum menerima izin akses penugasan darurat aktif di lapangan.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION: PANDUAN PEMASANGAN APK DENGAN SIMULATOR IZIN ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0b6f61]">
                Panduan Praktis Android
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#062c26]">
                Cara Memasang Berkas APK di Perangkat Anda
              </h2>
            </div>

            {/* Step Switcher Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveGuideStep(1)}
                className={`flex-1 sm:flex-initial text-center px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeGuideStep === 1 ? 'bg-white text-[#062c26] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Unduh
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideStep(2)}
                className={`flex-1 sm:flex-initial text-center px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeGuideStep === 2 ? 'bg-white text-[#062c26] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Izin Sumber
              </button>
              <button
                type="button"
                onClick={() => setActiveGuideStep(3)}
                className={`flex-1 sm:flex-initial text-center px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeGuideStep === 3 ? 'bg-white text-[#062c26] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Izin GPS
              </button>
            </div>
          </div>

          {/* Interactive Guide Visual Panels */}
          {activeGuideStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200">
                <span className="w-7 h-7 rounded-lg bg-[#062c26] text-white font-bold text-xs flex items-center justify-center mb-2.5">
                  1
                </span>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Tekan Tombol Unduh</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pilih tombol Unduh APK pada halaman ini. Berkas <code className="bg-slate-200/70 px-1 py-0.5 rounded text-[11px]">SahabatSOS.apk</code> akan tersimpan di folder Unduhan ponsel Anda.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200">
                <span className="w-7 h-7 rounded-lg bg-[#0b6f61] text-white font-bold text-xs flex items-center justify-center mb-2.5">
                  2
                </span>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Periksa Notifikasi Peramban</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Jika peramban Chrome meminta konfirmasi unduhan, pilih opsi "Tetap Unduh" atau "Download Anyway".
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200">
                <span className="w-7 h-7 rounded-lg bg-[#dc2626] text-white font-bold text-xs flex items-center justify-center mb-2.5">
                  3
                </span>
                <h4 className="font-bold text-sm text-slate-900 mb-1">Buka Berkas Selesai</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Setelah proses unduh 98.9 MB selesai, ketuk pemberitahuan unduhan atau buka berkas melalui aplikasi File Manager.
                </p>
              </div>
            </div>
          )}

          {activeGuideStep === 2 && (
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-amber-900">
                    Aktivasi Opsi "Instal dari Sumber Tidak Dikenal"
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Karena berkas ini didistribusikan langsung sebagai APK tanpa melalui Google Play Store, Android melindungi perangkat dengan meminta perizinan satu kali:
                  </p>
                </div>
              </div>

              {/* Interactive Android Toggle Simulator */}
              <div className="bg-white rounded-xl p-4 border border-amber-200/90 shadow-2xs max-w-md mx-auto flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-900">Izinkan dari sumber ini</p>
                  <p className="text-[10px] text-slate-500">Memberikan izin instalasi APK via Chrome atau File Manager</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowUnknownSourcesToggle(!allowUnknownSourcesToggle)}
                  className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                    allowUnknownSourcesToggle ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                  aria-label="Simulasikan toggle izin instalasi"
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      allowUnknownSourcesToggle ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-2">
                <li>Buka menu <strong>Pengaturan &rarr; Keamanan &amp; Privasi</strong> pada ponsel Anda.</li>
                <li>Pilih opsi <strong>Instal Aplikasi Tidak Dikenal</strong>.</li>
                <li>Aktifkan sakelar untuk peramban (Chrome) atau File Manager yang Anda gunakan.</li>
              </ol>
            </div>
          )}

          {activeGuideStep === 3 && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[#0b6f61]" />
                <h4 className="font-bold text-sm text-emerald-900">Izin Akses Lokasi (GPS) Wajib untuk Pengiriman Sinyal</h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Saat aplikasi dibuka untuk pertama kali, pilih opsi <strong>"Saat Aplikasi Digunakan"</strong> atau <strong>"Izinkan Sepanjang Waktu"</strong> untuk akses lokasi. Tanpa izin ini, koordinat darurat tidak dapat dikirimkan ke relawan siaga saat tombol SOS ditekan.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION: CALL TO ACTION AKHIR ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full mb-8">
        <div className="bg-[#062c26] rounded-3xl p-8 sm:p-12 text-white text-center shadow-xl relative overflow-hidden">
          {/* Deep ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 90% 70% at 50% 50%, #0b453b 0%, #062c26 100%)'
            }}
          />

          <div className="max-w-xl mx-auto space-y-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#34d399]">
              Mulai Siaga Bersama Sahabat SOS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Unduh Sekarang dan Bergabung dalam Jaringan Tanggap Darurat Inklusif
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Akses cepat bantuan darurat untuk rekan disabilitas serta media penugasan terpadu bagi relawan kemanusiaan.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3">
              <a
                href={apkDownloadPath}
                download="SahabatSOS.apk"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white font-bold text-sm shadow-md transition-all hover:shadow-red-600/30 hover:-translate-y-0.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-white group text-center"
              >
                <Download size={18} className="group-hover:translate-y-0.5 transition-transform shrink-0" />
                <span>Unduh SahabatSOS.apk (98.9 MB)</span>
              </a>

              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white text-[#062c26] hover:bg-slate-100 font-bold text-sm shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-400 text-center"
              >
                <Lock size={15} className="shrink-0" />
                <span>Portal Posko Induk</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <img src="/logo.png" alt="Logo Sahabat SOS" className="w-5 h-5 object-contain" />
            <span className="font-bold text-slate-800">Sahabat SOS</span>
            <span>&copy; {new Date().getFullYear()} Inklusi &amp; Tanggap Darurat Difabel Indonesia.</span>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Link to="/login" className="hover:text-emerald-700 font-medium transition-colors">
              Masuk Admin Posko
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-slate-400">Paket: {apkPackageId}</span>
          </div>
        </div>
      </footer>

      {/* ── PURPOSEFUL ANIMATION KEYFRAMES ── */}
      <style>{`
        @keyframes radarRing {
          0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.2; }
          50% { opacity: 0.45; }
          100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.1; }
        }
        @keyframes pulseWave {
          0% { transform: scale(0.95); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes scanLaser {
          0% { top: 0%; }
          50% { top: 96%; }
          100% { top: 0%; }
        }
        @keyframes toastEnter {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .anim-radar-ring {
          animation: radarRing 6s ease-in-out infinite alternate;
        }
        .anim-radar-ring-2 {
          animation: radarRing 8s ease-in-out infinite alternate-reverse;
        }
        .anim-pulse-wave {
          animation: pulseWave 1.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .anim-scan-laser {
          animation: scanLaser 2.6s ease-in-out infinite;
        }
        .anim-toast {
          animation: toastEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-radar-ring,
          .anim-radar-ring-2,
          .anim-pulse-wave,
          .anim-scan-laser {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
