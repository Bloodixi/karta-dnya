function LockIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted">
      <rect x="5" y="11" width="14" height="10" rx="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/** Закрытые разделы платного документа (совместимость, детский разбор) — оглавлением с замком. */
export default function RazborLocked({ items, label }: { items: { id: string; title: string }[]; label: string }) {
  return (
    <div className="card p-5 mt-8 max-w-3xl razbor-locked">
      <p className="mono mb-3">{label}</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-sm">
            <LockIcon /> {t.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ошибка формы оплаты рядом с кнопками. */
export function PayError({ text }: { text?: string }) {
  return text ? (
    <p role="alert" className="text-sm mt-4 border-l-2 border-accent pl-3">
      {text}
    </p>
  ) : null;
}
