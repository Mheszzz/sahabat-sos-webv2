export default function FilterPills({ items, value, onChange, className = '' }) {
  return (
    <div className={`filter-pills ${className}`} role="tablist">
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`filter-pill ${active ? 'is-active' : ''} ${item.tone ? `tone-${item.tone}` : ''}`}
          >
            {item.dot && <span className={`status-dot ${item.dot}`} />}
            <span>{item.label}</span>
            {item.count != null && (
              <span className={`filter-pill-count ${active ? 'is-active' : ''}`}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
