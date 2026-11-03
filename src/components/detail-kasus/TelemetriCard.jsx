import {
  Smartphone, Radio, AlertTriangle, Battery, BatteryCharging,
  Wifi, WifiOff, MapPin, Watch, HeartPulse
} from 'lucide-react';

/**
 * TelemetriCard
 * Menampilkan telemetri perangkat korban & integrasi IoT Tuya fisik:
 * - Status baterai HP & indikator pengisian daya (charging)
 * - Peringatan baterai kritis (< 20%)
 * - Sinyal jaringan, akurasi koordinat GPS
 * - Status baterai & cloud online tombol darurat IoT Tuya
 */
export default function TelemetriCard({
  deviceInfo,
  isSos = true,
}) {
  if (!isSos) return null;

  if (!deviceInfo) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs shrink-0 space-y-1.5">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Smartphone size={12} className="text-slate-500" />
            Telemetri Perangkat &amp; IoT
          </span>
          <span className="text-[9.5px] font-semibold text-slate-500">Tidak Terhubung</span>
        </div>
        <div className="py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
          <p className="text-[11px] font-medium text-slate-600 italic">Data telemetri tidak tersedia</p>
        </div>
      </div>
    );
  }

  const isBatteryLow = deviceInfo.battery_level != null && deviceInfo.battery_level < 20;
  const isCharging = Boolean(deviceInfo.mobile?.is_charging);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs shrink-0 space-y-2">
      {/* Header & Status Pemicu */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Smartphone size={12} className="text-[#0b6f61]" />
          Telemetri Perangkat &amp; IoT
        </span>
        {deviceInfo.trigger_source === 'smartwatch_fall_detection' || deviceInfo.smartwatch?.fall_detected ? (
          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
            <AlertTriangle size={10} className="text-rose-600" />
            Deteksi Jatuh Smartwatch
          </span>
        ) : deviceInfo.trigger_source === 'smartband_heart_rate' || (deviceInfo.smartwatch?.heart_rate != null && deviceInfo.trigger_source?.includes('heart_rate')) ? (
          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
            <HeartPulse size={10} className="text-rose-600" />
            Sensor Detak Jantung
          </span>
        ) : deviceInfo.trigger_source === 'smartwatch_button' || deviceInfo.smartwatch ? (
          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
            <Watch size={10} className="text-sky-700" />
            Smartwatch / Smartband
          </span>
        ) : deviceInfo.tuya ? (
          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Radio size={10} className="text-emerald-700" />
            IoT Tuya Terhubung
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Aplikasi Mobile
          </span>
        )}
      </div>

      {/* Smart Warning: Peringatan Baterai Kritis (<20%) */}
      {isBatteryLow && !isCharging && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-2 flex items-start gap-2 text-rose-800">
          <AlertTriangle size={14} className="shrink-0 text-rose-600 mt-0.5" />
          <div className="text-[10.5px] leading-tight">
            <span className="font-bold">Baterai HP Korban Kritis ({deviceInfo.battery_level}%)</span>
            <p className="text-[9.5px] text-rose-700 mt-0.5">
              Ponsel tidak sedang diisi daya. Kontak berpotensi terputus segera, prioritaskan panggilan telepon atau penanganan cepat!
            </p>
          </div>
        </div>
      )}

      {/* Grid 1: Smartphone Korban */}
      <div className="space-y-1">
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600 block">
          1. Smartphone Korban
        </span>
        <div className="grid grid-cols-4 gap-1.5 text-[11px]">
          {/* Baterai HP */}
          <div className={`p-1.5 rounded-xl border flex items-center gap-1.5 ${
            isBatteryLow
              ? 'bg-rose-50/70 border-rose-200 text-rose-900'
              : deviceInfo.battery_level != null && deviceInfo.battery_level < 50
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          }`}>
            {isCharging ? (
              <BatteryCharging size={14} className="text-emerald-600 shrink-0" />
            ) : (
              <Battery size={14} className={isBatteryLow ? 'text-rose-600 shrink-0' : 'text-[#0b6f61] shrink-0'} />
            )}
            <div className="min-w-0">
              <span className="text-[8px] font-bold text-slate-500 block uppercase leading-none">Baterai HP</span>
              <span className="font-black text-[11px] leading-tight block">
                {deviceInfo.battery_level != null ? `${deviceInfo.battery_level}%` : '-'}
              </span>
              <span className="text-[8px] font-semibold text-slate-600 leading-none truncate block">
                {isCharging ? 'Sedang Diisi' : (deviceInfo.battery_status || 'Normal')}
              </span>
            </div>
          </div>

          {/* Sinyal Jaringan */}
          <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100 flex items-center gap-1.5">
            {deviceInfo.is_online === true ? (
              <Wifi size={14} className="text-emerald-600 shrink-0" />
            ) : deviceInfo.is_online === false ? (
              <WifiOff size={14} className="text-rose-600 shrink-0" />
            ) : (
              <Radio size={14} className="text-slate-500 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-[8px] font-bold text-slate-500 block uppercase leading-none">Jaringan</span>
              <span className={`font-black text-[10.5px] leading-tight block truncate ${
                deviceInfo.is_online === true
                  ? 'text-emerald-800'
                  : deviceInfo.is_online === false
                  ? 'text-rose-700'
                  : 'text-slate-700'
              }`}>
                {deviceInfo.signal_strength || (deviceInfo.is_online === true ? 'Online' : deviceInfo.is_online === false ? 'Offline' : '-')}
              </span>
              <span className="text-[8px] font-semibold text-slate-600 leading-none truncate block">
                {deviceInfo.is_online === true ? 'Terhubung' : deviceInfo.is_online === false ? 'Terputus' : 'Tidak tersedia'}
              </span>
            </div>
          </div>

          {/* Akurasi GPS */}
          <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100 flex items-center gap-1.5">
            <MapPin size={14} className="text-sky-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-[8px] font-bold text-slate-500 block uppercase leading-none">Akurasi GPS</span>
              <span className="font-bold text-slate-800 text-[10.5px] leading-tight block truncate">
                {deviceInfo.mobile?.gps_accuracy != null ? `± ${deviceInfo.mobile.gps_accuracy}m` : 'Presisi Tinggi'}
              </span>
              <span className="text-[8px] font-semibold text-slate-600 leading-none truncate block">
                Terkunci GPS
              </span>
            </div>
          </div>

          {/* Model HP */}
          <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            <span className="text-[8px] font-bold text-slate-500 block uppercase leading-none mb-0.5">Model Ponsel</span>
            <span className="font-bold text-slate-800 truncate block text-[10px] leading-tight" title={deviceInfo.device_model || '-'}>
              {deviceInfo.mobile?.model || deviceInfo.device_model || '-'}
            </span>
            <span className="text-[8px] font-medium text-slate-600 truncate block leading-none mt-0.5">
              {deviceInfo.mobile?.os_version || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid 2: Perangkat Tombol Tuya IoT (Jika Terdeteksi) */}
      {deviceInfo.tuya && (
        <div className="space-y-1 pt-1.5 border-t border-slate-100">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Radio size={10} className="text-emerald-600" />
              2. Tombol Darurat IoT Tuya
            </span>
            <span className="text-[8.5px] font-normal text-slate-600">
              Pemicu: <strong className="text-emerald-800">{deviceInfo.tuya.trigger_type || 'Tombol Fisik'}</strong>
            </span>
          </span>
          <div className="grid grid-cols-4 gap-1.5 text-[11px]">
            {/* Baterai Tuya */}
            <div className={`p-1.5 rounded-xl border flex items-center gap-1.5 ${
              (deviceInfo.tuya.battery_level ?? 100) < 20
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50/50 border-emerald-100 text-slate-800'
            }`}>
              <Battery size={14} className={
                (deviceInfo.tuya.battery_level ?? 100) < 20 ? 'text-amber-600 shrink-0' : 'text-emerald-600 shrink-0'
              } />
              <div className="min-w-0">
                <span className="text-[8px] font-bold text-slate-500 block uppercase leading-none">Baterai IoT</span>
                <span className="font-black text-[11px] leading-tight block">
                  {deviceInfo.tuya.battery_level != null ? `${deviceInfo.tuya.battery_level}%` : 'Normal'}
                </span>
                <span className="text-[8px] font-semibold text-slate-600 leading-none truncate block">
                  CR2032 Coin
                </span>
              </div>
            </div>

            {/* Sinyal Tuya */}
            <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100 flex items-center gap-1.5">
              <Wifi size={14} className={deviceInfo.tuya.is_online ? 'text-emerald-600 shrink-0' : 'text-rose-600 shrink-0'} />
              <div className="min-w-0">
                <span className="text-[8px] font-bold text-slate-500 block uppercase leading-none">Sinyal IoT</span>
                <span className="font-black text-slate-800 text-[10.5px] leading-tight block truncate">
                  {deviceInfo.tuya.signal_strength || 'Bagus'}
                </span>
                <span className="text-[8px] font-semibold text-slate-600 leading-none truncate block">
                  {deviceInfo.tuya.is_online ? 'Cloud ON' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Nama Tombol */}
            <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100 col-span-2">
              <span className="text-[8px] font-bold text-slate-500 block uppercase leading-none mb-0.5">Nama &amp; Lokasi Tombol</span>
              <span className="font-bold text-slate-800 truncate block text-[10px] leading-tight" title={deviceInfo.tuya.device_name}>
                {deviceInfo.tuya.device_name || 'Tombol Darurat SOS'}
              </span>
              <span className="font-mono text-[7.5px] text-slate-500 truncate block leading-none mt-0.5">
                ID: {deviceInfo.tuya.device_id || 'tuya_device'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grid 3: Perangkat Smartwatch & Biometrik Korban (Jika Terdeteksi) */}
      {deviceInfo.smartwatch && (
        <div className="space-y-1 pt-1.5 border-t border-slate-100">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Watch size={10} className="text-sky-600" />
              {deviceInfo.tuya ? '3.' : '2.'} Smartwatch / Smartband &amp; Biometrik
            </span>
            <span className="text-[8.5px] font-normal text-slate-600">
              Pemicu: <strong className={deviceInfo.smartwatch.fall_detected ? 'text-rose-700 font-bold' : 'text-sky-800'}>
                {deviceInfo.smartwatch.trigger_type || (deviceInfo.smartwatch.fall_detected ? 'Deteksi Jatuh Jam' : (deviceInfo.smartwatch.heart_rate != null ? 'Sensor Detak Jantung' : 'Tombol SOS Jam'))}
              </strong>
            </span>
          </span>
          <div className="grid grid-cols-4 gap-1.5 text-[11px]">
            {/* Detak Jantung / BPM */}
            <div className={`p-1.5 rounded-xl border flex items-center gap-1.5 ${
              deviceInfo.smartwatch.heart_rate != null && (deviceInfo.smartwatch.heart_rate > 120 || deviceInfo.smartwatch.heart_rate < 50)
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-rose-50/40 border-rose-100 text-slate-800'
            }`}>
              <HeartPulse size={14} className="text-rose-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[8px] font-bold text-slate-500 block uppercase leading-none">Denyut Nadi</span>
                <span className="font-black text-[11px] leading-tight block">
                  {deviceInfo.smartwatch.heart_rate != null ? `${deviceInfo.smartwatch.heart_rate} BPM` : 'N/A'}
                </span>
                <span className="text-[8px] font-semibold text-slate-600 leading-none truncate block">
                  {deviceInfo.smartwatch.heart_rate != null ? (deviceInfo.smartwatch.heart_rate > 120 ? 'Tinggi' : deviceInfo.smartwatch.heart_rate < 50 ? 'Rendah' : 'Normal') : 'Sensor Jam'}
                </span>
              </div>
            </div>

            {/* Status Jatuh */}
            <div className={`p-1.5 rounded-xl border flex items-center gap-1.5 ${
              deviceInfo.smartwatch.fall_detected
                ? 'bg-rose-100 border-rose-300 text-rose-900 font-bold'
                : 'bg-slate-50 border-slate-100 text-slate-700'
            }`}>
              <AlertTriangle size={14} className={deviceInfo.smartwatch.fall_detected ? 'text-rose-700 shrink-0' : 'text-slate-400 shrink-0'} />
              <div className="min-w-0">
                <span className="text-[8px] font-bold text-slate-500 block uppercase leading-none">Deteksi Jatuh</span>
                <span className={`font-black text-[10.5px] leading-tight block truncate ${deviceInfo.smartwatch.fall_detected ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {deviceInfo.smartwatch.fall_detected ? 'JATUH!' : 'Aman'}
                </span>
                <span className="text-[8px] font-semibold text-slate-600 leading-none truncate block">
                  Akselerometer
                </span>
              </div>
            </div>

            {/* Baterai Jam */}
            <div className={`p-1.5 rounded-xl border flex items-center gap-1.5 ${
              deviceInfo.smartwatch.battery_level != null && deviceInfo.smartwatch.battery_level < 20
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50/50 border-emerald-100 text-slate-800'
            }`}>
              <Battery size={14} className={
                deviceInfo.smartwatch.battery_level != null && deviceInfo.smartwatch.battery_level < 20 ? 'text-amber-600 shrink-0' : 'text-sky-600 shrink-0'
              } />
              <div className="min-w-0">
                <span className="text-[8px] font-bold text-slate-500 block uppercase leading-none">Baterai Jam</span>
                <span className="font-black text-[11px] leading-tight block">
                  {deviceInfo.smartwatch.battery_level != null ? `${deviceInfo.smartwatch.battery_level}%` : 'Normal'}
                </span>
                <span className="text-[8px] font-semibold text-slate-600 leading-none truncate block">
                  {deviceInfo.smartwatch.battery_status || (deviceInfo.smartwatch.battery_level != null ? 'Normal' : 'Terhubung')}
                </span>
              </div>
            </div>

            {/* Model & Koneksi Jam */}
            <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <span className="text-[8px] font-bold text-slate-500 block uppercase leading-none mb-0.5">Model Jam</span>
              <span className="font-bold text-slate-800 truncate block text-[10px] leading-tight" title={deviceInfo.smartwatch.device_name}>
                {deviceInfo.smartwatch.device_model || deviceInfo.smartwatch.device_name || 'Smartband'}
              </span>
              <span className="text-[7.5px] font-semibold text-sky-700 truncate block leading-none mt-0.5">
                BLE / Health Connect
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
