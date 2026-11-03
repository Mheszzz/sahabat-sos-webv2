export default function PageHeader({
  title,
  description,
  actions,
  as: Heading = 'h1',
  extraClasses = '',
}) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${extraClasses}`}>
      <div className="min-w-0">
        <Heading className="text-[24px] sm:text-[26px] font-black tracking-tight text-slate-900 leading-tight line-clamp-2">
          {title}
        </Heading>
        {description && (
          <p className="mt-1 text-[14px] font-medium text-slate-500 line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
