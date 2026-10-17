"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isValidDate } from "@/lib/numerology";

/**
 * Дата рождения с маской дд.мм.гггг: цифровая клавиатура на телефоне, точки ставятся сами.
 * Системный календарь Android открывается на сегодняшнем дне, и до 1990 года приходится долго листать —
 * поэтому дату вводят цифрами. Форма по-прежнему отправляет поле `name` в формате ГГГГ-ММ-ДД (скрытое поле).
 */

const ISO_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

/** Значение из адреса (ГГГГ-ММ-ДД или что угодно) → текст в поле. */
function toText(v: string | undefined): string {
  const s = (v ?? "").trim();
  const m = ISO_RE.exec(s);
  if (m) return `${m[3].padStart(2, "0")}.${m[2].padStart(2, "0")}.${m[1]}`;
  return format(s.replace(/\D/g, "").slice(0, 8), false);
}

/** Цифры → дд.мм.гггг; grow — пользователь дописывает, тогда точка после дня и месяца ставится сразу. */
function format(digits: string, grow: boolean): string {
  const d = digits.slice(0, 2), m = digits.slice(2, 4), y = digits.slice(4, 8);
  let out = d;
  if (digits.length > 2 || (grow && digits.length === 2)) out += ".";
  out += m;
  if (digits.length > 4 || (grow && digits.length === 4)) out += ".";
  return out + y;
}

/** Текст поля → ГГГГ-ММ-ДД, если дата полная и настоящая. */
function toIso(text: string): string {
  const digits = text.replace(/\D/g, "");
  if (digits.length !== 8) return "";
  const d = Number(digits.slice(0, 2)), m = Number(digits.slice(2, 4)), y = Number(digits.slice(4, 8));
  return isValidDate(d, m, y) ? `${y}-${digits.slice(2, 4)}-${digits.slice(0, 2)}` : "";
}

/** Текст ошибки для подсказки браузера при отправке (пусто — всё в порядке). */
function problem(text: string, required: boolean, min: string, max: string): string {
  const digits = text.replace(/\D/g, "");
  if (!digits) return required ? "Введите дату рождения: день, месяц и год." : "";
  if (digits.length < 8) return "Введите дату полностью: дд.мм.гггг, например 07.03.1990.";
  const y = digits.slice(4, 8), m = digits.slice(2, 4), d = digits.slice(0, 2);
  // сравнение строк ГГГГ-ММ-ДД до проверки календаря: год из будущего — понятная ошибка, а не «такой даты нет»
  if (`${y}-${m}-${d}` > max) return "Дата рождения не может быть в будущем.";
  if (`${y}-${m}-${d}` < min) return "Проверьте год рождения.";
  if (!toIso(text)) return "Такой даты нет — проверьте день и месяц.";
  return "";
}

export default function BirthDateInput({
  name,
  defaultValue,
  required = true,
  invalid = false,
  describedBy,
  min = "1900-01-01",
  max,
  className,
  onIso,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  min?: string;
  /** Верхняя граница (сегодня по МСК), считается на сервере — без расхождения при гидратации. */
  max: string;
  className?: string;
  /** Сообщает дату ГГГГ-ММ-ДД (или пусто, пока она неполная) — для черновика формы. */
  onIso?: (iso: string) => void;
}) {
  const [text, setText] = useState(() => toText(defaultValue));
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const error = problem(text, required, min, max);

  // подсказка браузера при отправке формы; проверяется и до первого ввода (пустое обязательное поле)
  useLayoutEffect(() => {
    ref.current?.setCustomValidity(error);
  }, [error]);

  // после переформатирования курсор остаётся после той же цифры, а не прыгает в конец
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && caret.current !== null && document.activeElement === el) el.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  }, [text]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // вставка в формате ГГГГ-ММ-ДД (из другого поля или ссылки)
    if (ISO_RE.test(raw.trim())) {
      setText(toText(raw));
      return;
    }
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    const pos = e.target.selectionStart ?? raw.length;
    const before = raw.slice(0, pos).replace(/\D/g, "").length;
    const next = format(digits, raw.length > text.length);
    // позиция курсора: после `before` цифр с учётом точек
    let seen = 0, at = 0;
    while (at < next.length && seen < before) {
      if (/\d/.test(next[at])) seen++;
      at++;
    }
    if (at < next.length && next[at] === "." && before > 0 && raw.length > text.length) at++;
    caret.current = pos >= raw.length ? next.length : at;
    setText(next);
  }

  const iso = toIso(text);
  const report = useRef(onIso);
  useLayoutEffect(() => {
    report.current = onIso;
  });
  useEffect(() => {
    report.current?.(iso);
  }, [iso]);
  const showError = invalid || (touched && !!error);
  return (
    <>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="bday"
        placeholder="дд.мм.гггг"
        maxLength={10}
        value={text}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        required={required}
        aria-invalid={showError || undefined}
        aria-describedby={describedBy}
        className={className}
      />
      {/* то, что форма отправляет: ГГГГ-ММ-ДД, как раньше у поля type="date" */}
      <input type="hidden" name={name} value={iso} />
    </>
  );
}
