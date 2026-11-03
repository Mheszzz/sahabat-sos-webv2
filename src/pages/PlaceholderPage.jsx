export default function PlaceholderPage({ title }) {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">??</span>
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-sm text-slate-400">Halaman ini sedang dalam pengembangan. Fitur lengkap akan segera tersedia.</p>
      </div>
    </div>
  );
}
