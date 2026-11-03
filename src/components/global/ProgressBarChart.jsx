export default function ProgressBarChart({ items }) {
  return (
    <div className="space-y-4 pt-1">
      {items.map((item, idx) => (
        <div key={idx} className="space-y-1.5">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-semibold text-slate-700">{item.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-medium">{item.count} kasus</span>
              <span className="font-bold text-slate-800 min-w-[32px] text-right">{item.pct}%</span>
            </div>
          </div>

          {/* Progress track */}
          <div className="h-2 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${item.pct}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
