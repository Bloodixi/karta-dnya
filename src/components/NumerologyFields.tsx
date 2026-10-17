import BirthDateInput from "@/components/BirthDateInput";
import ShareButtons from "@/components/ShareButtons";

/** Поля форм нумерологии (серверные, без состояния): дата и текст. */
const FIELD = "border border-line rounded-lg px-3 py-2 bg-surface min-w-0 min-h-11 aria-[invalid=true]:border-danger";
const INPUT = FIELD + " w-full sm:w-48";
const LABEL = "grid gap-1 text-sm w-full sm:w-auto";

/** Сегодняшняя дата по Москве в формате ГГГГ-ММ-ДД: верхняя граница даты рождения. */
export function todayIso(): string {
  return new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10);
}

/** Текст ошибки даты: для полной даты из будущего — отдельный, иначе общий `fallback`. */
export function dateErrorText(raw: string | string[] | undefined, fallback: string): string {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (s && /^\d{4}-\d{2}-\d{2}$/.test(s.trim()) && s.trim() > todayIso()) return "Дата рождения не может быть в будущем.";
  return fallback;
}

/** id текста ошибки формы: поле с aria-invalid ссылается на него через aria-describedby. */
export const FORM_ERROR_ID = "form-error";

/**
 * Дата рождения: ввод цифрами по маске дд.мм.гггг (BirthDateInput), форма отправляет `name` как ГГГГ-ММ-ДД.
 * Системный календарь на Android открывается на сегодняшнем дне — до нужного года долго листать.
 */
export function DateField({ name, label, defaultValue, required = true, invalid = false }: { name: string; label: string; defaultValue?: string; required?: boolean; invalid?: boolean }) {
  return (
    <label className={LABEL}>
      {label}
      <BirthDateInput
        name={name}
        defaultValue={defaultValue}
        required={required}
        max={todayIso()}
        invalid={invalid}
        describedBy={invalid ? FORM_ERROR_ID : undefined}
        className={INPUT + " tabular-nums"}
      />
    </label>
  );
}

export function TextField({ name, label, defaultValue, placeholder, required = false, maxLength = 60 }: { name: string; label: string; defaultValue?: string; placeholder?: string; required?: boolean; maxLength?: number }) {
  return (
    <label className={LABEL}>
      {label}
      <input type="text" name={name} defaultValue={defaultValue} placeholder={placeholder} required={required} maxLength={maxLength} autoComplete="given-name" className={INPUT} />
    </label>
  );
}

export function NumberField({ name, label, defaultValue, min, max }: { name: string; label: string; defaultValue?: number; min: number; max: number }) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input type="number" name={name} defaultValue={defaultValue} min={min} max={max} className={FIELD + " w-28"} />
    </label>
  );
}

export function FormError({ text, id = FORM_ERROR_ID }: { text?: string; id?: string }) {
  if (!text) return null;
  return <p id={id} role="alert" className="text-sm mt-3 text-danger">{text}</p>;
}

/** Кнопки «Скопировать ссылку» и «Поделиться» для текущего расчёта. */
export function ShareLink({ path }: { path: string }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="mono">Ссылка на этот расчёт</span>
      <ShareButtons url={path} />
    </div>
  );
}
