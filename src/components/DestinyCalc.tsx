"use client";

import Link from "next/link";
import { useState } from "react";
import { todayIso } from "@/components/NumerologyFields";
import RazborLink from "@/components/RazborLink";
import ScrollToResult from "@/components/ScrollToResult";
import type { NumerologyNumber } from "@/lib/content";
import { destinyNumber, isValidDate } from "@/lib/numerology";

export default function DestinyCalc({ numbers }: { numbers: NumerologyNumber[] }) {
  const [date, setDate] = useState("");
  const [result, setResult] = useState<{ number: number; steps: string[] } | null>(null);
  const [error, setError] = useState("");
  const [runs, setRuns] = useState(0);

  function calc(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const [y, m, d] = date.split("-").map(Number);
    if (date > todayIso()) {
      setError("Дата рождения не может быть в будущем.");
      setResult(null);
      return;
    }
    if (!isValidDate(d, m, y)) {
      setError("Введите настоящую дату рождения.");
      setResult(null);
      return;
    }
    setError("");
    setResult(destinyNumber(d, m, y));
    setRuns((n) => n + 1);
  }

  const info = result ? numbers.find((n) => n.number === result.number) : null;
  return (
    <div className="card p-6">
      <form onSubmit={calc} className="flex flex-wrap gap-3 items-end">
        <label className="grid gap-1 text-sm w-full sm:w-auto">
          Дата рождения
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            min="1900-01-01"
            max={todayIso()}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "destiny-error" : undefined}
            className="border border-line rounded-lg px-3 py-2 bg-surface min-w-0 min-h-11 w-full sm:w-48 aria-[invalid=true]:border-danger"
          />
        </label>
        <button type="submit" className="btn min-h-11">Рассчитать</button>
      </form>
      {error && <p id="destiny-error" role="alert" className="text-sm mt-3 text-danger">{error}</p>}
      <ScrollToResult key={runs} id="destiny-result" when={runs > 0 && !!result} />
      {result && (
        <div className="mt-6 scroll-mt-24" id="destiny-result">
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
          <p className="mt-5 text-sm text-muted">
            Число судьбы — одна из частей полного разбора по дате.{" "}
            <RazborLink from="chislo-sudby-kalkulyator" date={date} className="text-accent-text underline">Бесплатная часть разбора по этой дате</RazborLink>
          </p>
        </div>
      )}
    </div>
  );
}
