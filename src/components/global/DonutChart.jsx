export default function DonutChart({ items = [], total }) {
  const calculatedTotal = total ?? items.reduce((sum, item) => sum + (item.count || item.total || item.jumlah || 0), 0);
  const cx = 60, cy = 60, r = 44, stroke = 12;
  const circumference = 2 * Math.PI * r;

  let accumulatedDash = 0;
  const slices = items.map(item => {
    const dashLength = (item.pct / 100) * circumference;
    const slice = {
      ...item,
      dash: dashLength,
      offset: accumulatedDash,
    };
    accumulatedDash += dashLength;
    return slice;
  });

  return (
    <div className="flex items-center gap-6 flex-wrap sm:flex-nowrap">
      {/* Donut SVG */}
      <div className="relative w-[124px] h-[124px] shrink-0 mx-auto sm:mx-0">
        <svg width="124" height="124" viewBox="0 0 120 120" className="transform -rotate-90">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={stroke}
          />
          {slices.map((slice, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={slice.color}
              strokeWidth={stroke}
              strokeDasharray={`${slice.dash} ${circumference - slice.dash}`}
              strokeDashoffset={-slice.offset}
              strokeLinecap="butt"
              className="transition-all duration-300"
            />
          ))}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[20px] font-black text-slate-900 leading-none tracking-tight">
            {calculatedTotal}
          </span>
          <span className="text-[9px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Total Kasus
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 grid grid-cols-1 gap-y-1.5 w-full">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.label}</span>
            </div>
            <span className="font-bold text-slate-800 shrink-0">{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
