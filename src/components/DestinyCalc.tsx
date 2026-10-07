"use client";

import Link from "next/link";
import { useState } from "react";
import type { NumerologyNumber } from "@/lib/content";
import { destinyNumber, isValidDate } from "@/lib/numerology";

export default function DestinyCalc({ numbers }: { numbers: NumerologyNumber[] }) {
  const [date, setDate] = useState("");
  const [result, setResult] = useState<{ number: number; steps: string[] } | null>(null);
  const [error, setError] = useState("");

  function calc(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const [y, m, d] = date.split("-").map(Number);
    if (!isValidDate(d, m, y)) {
      setError("Введите настоящую дату рождения.");
      setResult(null);
      return;
    }
    setError("");
    setResult(destinyNumber(d, m, y));
  }

  const info = result ? numbers.find((n) => n.number === result.number) : null;
  return (
    <div className="card p-6">
      <form onSubmit={calc} className="flex flex-wrap gap-3 items-end">
        <label className="grid gap-1 text-sm">
          Дата рождения
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="border border-line rounded-lg px-3 py-2 bg-surface" min="1900-01-01" />
        </label>
        <button type="submit" className="btn">Рассчитать</button>
      </form>
      {error && <p className="text-sm mt-3 text-red-600">{error}</p>}
      {result && (
        <div className="mt-6">
          <p className="text-sm text-muted">Расчёт: {result.steps.join(" → ")}</p>
          <p className="display text-5xl mt-2">
            {result.number}
            {info && <span className="text-2xl text-muted"> · {info.title}</span>}
          </p>
          {info ? (
            <div className="prose mt-4">
              <p className="flex flex-wrap gap-2 not-prose">{info.keywords.map((k) => <span key={k} className="chip">{k}</span>)}</p>
              <p>{info.description}</p>
              <h3>В любви</h3>
              <p>{info.love}</p>
              <h3>В работе</h3>
              <p>{info.career}</p>
              <h3>Над чем работать</h3>
              <p>{info.challenge}</p>
              <p><Link href={`/chislo-sudby/${info.number}`}>Подробнее о числе {info.number}: совместимость, сильные стороны, частые вопросы</Link></p>
            </div>
          ) : (
            <p className="text-muted mt-3">Описание числа готовится.</p>
          )}
        </div>
      )}
    </div>
  );
}
