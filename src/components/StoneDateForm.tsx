"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isValidDate } from "@/lib/numerology";

/** Форма «камень по дате рождения»: результат считает сервер по ?d=ГГГГ-ММ-ДД, форма работает и без JS (GET). */
/** `invalid` — сервер не смог разобрать дату из адреса (текст ошибки выводит страница с id `stone-date-error`). */
export default function StoneDateForm({ initial = "", invalid = false }: { initial?: string; invalid?: boolean }) {
  const router = useRouter();
  const [date, setDate] = useState(initial);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const serverError = invalid && !touched;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const [y, m, d] = date.split("-").map(Number);
    if (!isValidDate(d, m, y)) {
      setError("Введите настоящую дату рождения.");
      return;
    }
    setError("");
    router.push(`/kamni/po-date-rozhdeniya?d=${date}`);
  }

  return (
    <form method="get" action="/kamni/po-date-rozhdeniya" onSubmit={submit} className="card p-6 flex flex-wrap gap-3 items-end">
      <label className="grid gap-1 text-sm">
        Дата рождения
        <input
          type="date"
          name="d"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setTouched(true);
            setError("");
          }}
          required
          min="1900-01-01"
          aria-invalid={error || serverError ? true : undefined}
          aria-describedby={error ? "stone-form-error" : serverError ? "stone-date-error" : undefined}
          className={`border rounded-lg px-3 py-2 bg-surface ${error || serverError ? "border-danger" : "border-line"}`}
        />
      </label>
      <button type="submit" className="btn">Подобрать камень</button>
      {error && <p id="stone-form-error" role="alert" className="w-full text-sm text-danger">{error}</p>}
    </form>
  );
}
