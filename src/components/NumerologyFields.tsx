/** Поля форм нумерологии (серверные, без состояния): дата и текст. */
const INPUT = "border border-line rounded-lg px-3 py-2 bg-surface min-w-0";

export function DateField({ name, label, defaultValue, required = true }: { name: string; label: string; defaultValue?: string; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input type="date" name={name} defaultValue={defaultValue} required={required} min="1900-01-01" className={INPUT} />
    </label>
  );
}

export function TextField({ name, label, defaultValue, placeholder, required = false, maxLength = 60 }: { name: string; label: string; defaultValue?: string; placeholder?: string; required?: boolean; maxLength?: number }) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input type="text" name={name} defaultValue={defaultValue} placeholder={placeholder} required={required} maxLength={maxLength} autoComplete="given-name" className={INPUT} />
    </label>
  );
}

export function NumberField({ name, label, defaultValue, min, max }: { name: string; label: string; defaultValue?: number; min: number; max: number }) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input type="number" name={name} defaultValue={defaultValue} min={min} max={max} className={INPUT + " w-28"} />
    </label>
  );
}

export function FormError({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="text-sm mt-3 text-red-600">{text}</p>;
}

/** Ссылка на текущий расчёт для шаринга. */
export function ShareLink({ path }: { path: string }) {
  return (
    <p className="text-xs text-muted mt-4 break-all">
      Ссылка на этот расчёт: <span className="mono-text">{path}</span>
    </p>
  );
}
