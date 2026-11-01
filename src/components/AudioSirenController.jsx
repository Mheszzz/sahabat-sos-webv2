import { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Radio } from 'lucide-react';
import echo from '../api/libs/echo';
import { adminService } from '../api/services/adminService';
import { kasusAktifService } from '../api/services/kasusAktifService';
import { startPoskoSiren, stopPoskoSiren } from '../utils/audioAlert';

/**
 * AudioSirenController
 * Komponen pemantauan audio darurat Command Center.
 * Mendengarkan WebSocket:
 *  - command-center: .SOSCreated, .SOSUpdateStatus
 *  - posko-channel: .PoskoSireneTriggered
 *
 * Hanya muncul di header saat ada sirine/SOS aktif yang sedang berbunyi
 * agar operator dapat mengheningkan atau mematikan suara sirine.
 */
export default function AudioSirenController({ className = '' }) {
  const [sirenActive, setSirenActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastMessage, setLastMessage] = useState('');

  // Mute / Heningkan audio sirine
  const handleMute = useCallback(() => {
    stopPoskoSiren();
    setIsMuted(true);
  }, []);

  // Matikan sirine posko sepenuhnya
  const handleStopSiren = useCallback(async () => {
    setIsSubmitting(true);
    stopPoskoSiren();
    setSirenActive(false);
    setIsMuted(false);
    try {
      await adminService.triggerSirenePosko({
        action: 'off',
        pesan: 'Sirene posko diheningkan oleh operator',
      });
    } catch (e) {
      console.warn('Gagal broadcast sirene off:', e);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  useEffect(() => {
    // 1. Channel command-center untuk panggilan SOS baru dan status update
    const cmdChannel = echo.private('command-center');

    const handleSosCreated = (data) => {
      console.log('🚨 SOSCreated diterima di AudioSirenController:', data);
      setSirenActive(true);
      setIsMuted(false);
      setLastMessage(`Sinyal SOS Baru Masuk: #${data?.id_kasus || data?.id || 'Darurat'}`);
      startPoskoSiren();
    };

    const checkAndSyncSirenStatus = async () => {
      try {
        // Periksa apakah masih ada SOS aktif lain yang BELUM ditangani
        const res = await kasusAktifService.getSOS({ status: 'belum ditangani', per_page: 5 });
        const rawSos = res?.data?.data || (Array.isArray(res?.data) ? res.data : []);
        const unhandledSos = rawSos.filter((s) => {
          const statusStr = (s.status_raw || s.status || '').toLowerCase().trim();
          return [
            'belum ditangani',
            'belum_ditangani',
            'belum tertangani',
            'belum_tertangani',
            'aktif',
            'pending',
            'menunggu',
          ].includes(statusStr);
        });

        if (unhandledSos.length === 0) {
          // Sudah tidak ada SOS yang belum ditangani (semua sudah ditangani / selesai / batal),
          // otomatis hentikan sirine dan sembunyikan banner
          stopPoskoSiren();
          setSirenActive(false);
          setIsMuted(false);
          setLastMessage('');
        } else {
          // Masih ada SOS lain yang belum ditangani
          const nextSos = unhandledSos[0];
          setLastMessage(`Sinyal SOS Belum Ditangani: #${nextSos.id_kasus || nextSos.id || 'Darurat'}`);
        }
      } catch (err) {
        // Fallback jika pemanggilan API gagal: segera hentikan sirine
        console.warn('Gagal sinkronisasi status SOS belum ditangani:', err);
        stopPoskoSiren();
        setSirenActive(false);
        setIsMuted(false);
        setLastMessage('');
      }
    };

    const handleSosUpdateStatus = async (data) => {
      console.log('🔄 SOSUpdateStatus diterima di AudioSirenController:', data);
      const st = (data?.status_sos || data?.status_raw || data?.status || '').toLowerCase().trim();
      // Status yang menandakan kasus SOS telah ditangani atau diakhiri
      const isHandledOrEnded = [
        'ditangani',
        'proses',
        'dalam penanganan',
        'selesai',
        'batal',
        'dibatalkan',
      ].includes(st);

      if (isHandledOrEnded) {
        await checkAndSyncSirenStatus();
      }
    };

    // Sinkronkan juga saat ada pembaruan kasus lokal dari antarmuka web
    const onLocalKasusUpdated = () => {
      checkAndSyncSirenStatus();
    };
    window.addEventListener('kasus-updated', onLocalKasusUpdated);

    cmdChannel.listen('.SOSCreated', handleSosCreated);
    cmdChannel.listen('SOSCreated', handleSosCreated);
    cmdChannel.listen('.SOSUpdateStatus', handleSosUpdateStatus);
    cmdChannel.listen('SOSUpdateStatus', handleSosUpdateStatus);

    // 2. Channel posko-channel untuk alarm sirene posko massal
    const poskoChannel = echo.private('posko-channel');
    const handlePoskoSirene = (data) => {
      console.log('🔊 PoskoSireneTriggered diterima:', data);
      const isActive = data?.sirene_active === true || data?.action === 'on' || data?.action === 'trigger';
      if (isActive) {
        setSirenActive(true);
        setIsMuted(false);
        setLastMessage(data?.pesan || 'Sirene Darurat Posko Berbunyi!');
        startPoskoSiren();
      } else {
        stopPoskoSiren();
        setSirenActive(false);
        setIsMuted(false);
      }
    };
    poskoChannel.listen('.PoskoSireneTriggered', handlePoskoSirene);
    poskoChannel.listen('PoskoSireneTriggered', handlePoskoSirene);

    return () => {
      window.removeEventListener('kasus-updated', onLocalKasusUpdated);
      try {
        cmdChannel.stopListening('.SOSCreated', handleSosCreated);
        cmdChannel.stopListening('SOSCreated', handleSosCreated);
        cmdChannel.stopListening('.SOSUpdateStatus', handleSosUpdateStatus);
        cmdChannel.stopListening('SOSUpdateStatus', handleSosUpdateStatus);
        poskoChannel.stopListening('.PoskoSireneTriggered', handlePoskoSirene);
        poskoChannel.stopListening('PoskoSireneTriggered', handlePoskoSirene);
      } catch (err) {
        console.warn('Gagal membersihkan listener audio sirene:', err);
      }
      stopPoskoSiren();
    };
  }, []);

  // Hanya render banner kontrol jika sirine sedang aktif berbunyi
  if (!sirenActive) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 text-white shadow-md animate-pulse"
        title={lastMessage || 'Peringatan Darurat Aktif'}
      >
        <div className="flex items-center gap-1.5">
          <Radio size={14} className="animate-spin text-white" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {isMuted ? 'Sirine Diheningkan' : 'Sirine Berbunyi!'}
          </span>
        </div>

        <div className="h-4 w-px bg-red-400" />

        {/* Tombol Heningkan (Mute Audio) */}
        {!isMuted ? (
          <button
            type="button"
            onClick={handleMute}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-red-700 text-[11px] font-bold hover:bg-red-50 transition-colors cursor-pointer"
            title="Heningkan suara sirine sementara"
          >
            <VolumeX size={12} />
            <span>Heningkan</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              startPoskoSiren();
              setIsMuted(false);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-800 text-white text-[11px] font-bold hover:bg-red-900 transition-colors cursor-pointer"
            title="Nyalakan suara sirine kembali"
          >
            <Volume2 size={12} />
            <span>Bunyikan</span>
          </button>
        )}

        {/* Tombol Matikan Penuh */}
        <button
          type="button"
          onClick={handleStopSiren}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-900 text-white text-[11px] font-bold hover:bg-black/40 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          title="Matikan peringatan sirine posko"
        >
          <span>{isSubmitting ? 'Mematikan...' : 'Matikan'}</span>
        </button>
      </div>
    </div>
  );
}
