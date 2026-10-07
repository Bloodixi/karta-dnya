"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isValidDate } from "@/lib/numerology";

/** Форма «камень по дате рождения»: результат считает сервер по ?d=ГГГГ-ММ-ДД, форма работает и без JS (GET). */
export default function StoneDateForm({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [date, setDate] = useState(initial);
  const [error, setError] = useState("");

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
        <input type="date" name="d" value={date} onChange={(e) => setDate(e.target.value)} required min="1900-01-01" className="border border-line rounded-lg px-3 py-2 bg-surface" />
      </label>
      <button type="submit" className="btn">Подобрать камень</button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
