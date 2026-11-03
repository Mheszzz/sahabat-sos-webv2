import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

/**
 * CustomSelect
 * Komponen dropdown select modern dengan styling terpadu Tailwind,
 * dukungan keyboard, penanganan click-outside, dan tampilan opsi yang rapi.
 *
 * Props:
 * - value: string | number
 * - onChange: (val: any) => void
 * - options: Array<{ value: any, label: string, icon?: any, badge?: string|number }> | Array<string>
 * - placeholder?: string
 * - icon?: React.ReactNode (ikon di sisi kiri trigger)
 * - align?: 'left' | 'right'
 * - menuWidth?: string (contoh: 'w-52')
 * - clearable?: boolean
 * - onClear?: () => void
 * - disabled?: boolean
 * - className?: string
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Pilih opsi',
  icon = null,
  align = 'left',
  menuWidth = 'min-w-[180px]',
  clearable = false,
  onClear = null,
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalisasi options ke format objek { value, label }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return opt;
    }
    return { value: opt, label: String(opt) };
  });

  // Cari label opsi yang terpilih
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;
  const isSelected = value !== '' && value !== null && value !== undefined;

  // Tutup dropdown saat klik di luar area
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex h-9 items-center justify-between gap-2 rounded-xl border px-3 text-[12px] font-semibold transition-all cursor-pointer select-none
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400' : ''}
          ${isOpen
            ? 'border-[#0b6f61] bg-white text-[#0b6f61] shadow-xs ring-2 ring-[#0b6f61]/15'
            : isSelected && value !== ''
              ? 'border-[#0b6f61]/40 bg-emerald-50/40 text-slate-800 hover:border-[#0b6f61]'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100/70 hover:border-slate-300'
          }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {icon && (
            <span className={`shrink-0 transition-colors ${isOpen || (isSelected && value !== '') ? 'text-[#0b6f61]' : 'text-slate-400'}`}>
              {icon}
            </span>
          )}
          <span className="truncate max-w-[140px] text-left">
            {displayLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {clearable && isSelected && value !== '' && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e)}
              title="Reset pilihan"
              className="p-0.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={13}
            className={`transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#0b6f61]' : 'text-slate-400'
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute top-full mt-1.5 z-30 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-900/10 p-1 outline-none animate-in fade-in zoom-in-95 duration-100 ${menuWidth} ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
            {normalizedOptions.map((opt) => {
              const isItemActive = opt.value === value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="option"
                  aria-selected={isItemActive}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-left transition-colors cursor-pointer select-none
                    ${isItemActive
                      ? 'bg-[#0b6f61]/10 text-[#0b6f61] font-bold'
                      : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900'
                    }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="shrink-0 text-slate-400">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {opt.badge != null && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {opt.badge}
                      </span>
                    )}
                    {isItemActive && (
                      <Check size={13} className="text-[#0b6f61] stroke-[2.5]" />
                    )}
                  </div>
                </button>
              );
            })}

            {normalizedOptions.length === 0 && (
              <div className="px-3 py-2 text-[11px] text-slate-400 text-center">
                Tidak ada pilihan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
