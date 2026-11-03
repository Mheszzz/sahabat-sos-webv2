import { statusClassMap, statusDotMap } from '../../utils/theme';

const pulsingStatuses = new Set(['Sedang Bertugas', 'belum ditangani', 'Belum Tertangani', 'SOS Darurat', 'Online']);

export default function Badge({
  children,
  variant,
  showDot = false,
  className = '',
  isPill = false,
  customColor = null,
}) {
  const baseColor = customColor || statusClassMap[variant] || statusClassMap.default;
  const dotColor = statusDotMap[variant] || 'bg-slate-400';
  const radiusClass = isPill ? 'rounded-full' : 'rounded-md';
  const paddingClass = isPill ? 'px-2.5 py-1' : 'px-2 py-0.5';
  const shouldPulse = pulsingStatuses.has(variant);

  const displayLabel = children || (
    typeof variant === 'string'
      ? (variant === 'belum ditangani' || variant === 'belum tertangani' ? 'Belum Ditangani'
        : variant === 'ditangani' || variant === 'proses' || variant === 'sedang ditangani' || variant === 'sedang_ditangani' ? 'Ditangani'
        : variant === 'selesai' ? 'Selesai'
        : variant === 'batal' || variant === 'dibatalkan' ? 'Dibatalkan'
        : variant)
      : variant
  );

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${paddingClass} ${radiusClass} text-[11px] font-bold border whitespace-nowrap flex-shrink-0 ${baseColor} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor} ${shouldPulse ? 'animate-pulse' : ''}`} />
      )}
      <span className="whitespace-nowrap">{displayLabel}</span>
    </span>
  );
}

