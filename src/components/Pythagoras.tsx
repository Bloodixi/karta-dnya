"use client";

import { useState } from "react";
import { todayIso } from "@/components/NumerologyFields";
import RazborLink from "@/components/RazborLink";
import ScrollToResult from "@/components/ScrollToResult";
import { isValidDate } from "@/lib/numerology";
import { pythagoras } from "@/lib/pythagoras";

const CELLS: { digit: number; title: string; levels: string[] }[] = [
  { digit: 1, title: "Характер и воля", levels: ["мягкий, уступчивый характер", "спокойная уверенность, умеет настоять", "сильная воля, лидер по природе", "очень сильный характер, тяжело идёт на уступки"] },
  { digit: 2, title: "Энергия", levels: ["энергии мало, нужен отдых и бережный режим", "ровная энергия, хватает на свои дела", "много энергии, заряжает других", "энергии в избытке, важно её направлять"] },
  { digit: 3, title: "Интерес к знаниям", levels: ["учится по необходимости", "любознательность, тяга к точности", "аналитический склад, любит разбираться до конца", "научный ум, склонность к перфекционизму"] },
  { digit: 4, title: "Здоровье", levels: ["здоровье требует внимания и профилактики", "крепкое здоровье в молодости", "очень крепкое здоровье", "выносливость выше среднего"] },
  { digit: 5, title: "Логика и интуиция", levels: ["решения приходят через чувство, логика учится", "хорошая логика, умеет планировать", "сильная интуиция и логика вместе", "ясновидческая интуиция по традиции"] },
  { digit: 6, title: "Труд и мастерство", levels: ["больше тяготеет к умственному труду", "руки умелые, любит делать сам", "мастер в ремесле, тяга к практике", "труд как призвание"] },
  { digit: 7, title: "Удача и талант", levels: ["удачу приходится создавать усилием", "удача на стороне, таланты есть", "ярко выраженный талант", "везение, которое важно не растратить"] },
  { digit: 8, title: "Чувство долга", levels: ["долг понимает по-своему, ценит свободу", "ответственный, держит слово", "сильное чувство долга к семье и делу", "гиперответственность, стоит беречь себя"] },
  { digit: 9, title: "Память и ум", levels: ["память избирательная, важны заметки", "хорошая память и сообразительность", "очень хорошая память, схватывает на лету", "феноменальная память"] },
];

const compute = pythagoras;

export default function Pythagoras() {
  const [date, setDate] = useState("");
  const [res, setRes] = useState<ReturnType<typeof compute> | null>(null);
  const [error, setError] = useState("");
  const [runs, setRuns] = useState(0);

  function calc(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const [y, m, d] = date.split("-").map(Number);
    if (date > todayIso()) { setError("Дата рождения не может быть в будущем."); setRes(null); return; }
    if (!isValidDate(d, m, y)) { setError("Введите настоящую дату рождения."); setRes(null); return; }
    setError("");
    setRes(compute(d, m, y));
    setRuns((n) => n + 1);
  }

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
            aria-describedby={error ? "pythagoras-error" : undefined}
            className="border border-line rounded-lg px-3 py-2 bg-surface min-w-0 min-h-11 w-full sm:w-48 aria-[invalid=true]:border-danger"
          />
        </label>
        <button type="submit" className="btn min-h-11">Рассчитать</button>
      </form>
      {error && <p id="pythagoras-error" role="alert" className="text-sm mt-3 text-danger">{error}</p>}
      <ScrollToResult key={runs} id="pythagoras-result" when={runs > 0 && !!res} />
      {res && (
        <div className="mt-6 scroll-mt-24" id="pythagoras-result">
          <p className="text-sm text-muted">Рабочие числа: {res.work.join(", ")}</p>
          <div className="mt-4 grid gap-6 md:grid-cols-2 md:items-start">
            <div className="grid grid-cols-3 gap-2 max-w-md">
              {[1, 4, 7, 2, 5, 8, 3, 6, 9].map((n) => {
                const k = res.counts[n];
                const tone = !k ? "border-dashed! bg-transparent! text-muted" : k >= 3 ? "border-accent!" : "";
                return (
                  <div key={n} className={`card p-2 sm:p-3 text-center aspect-square flex flex-col items-center justify-center gap-1 ${tone}`}>
                    <p className="display text-2xl sm:text-3xl leading-none break-all">{k ? String(n).repeat(k) : "—"}</p>
                    <p className="text-xs text-muted leading-snug">{CELLS[n - 1].title}</p>
                  </div>
                );
              })}
            </div>
            <div className="prose">
              <h3 className="md:mt-0!">Расшифровка</h3>
              <ul>
                {CELLS.map((c) => {
                  const k = res.counts[c.digit];
                  const lvl = k === 0 ? 0 : Math.min(3, k);
                  return <li key={c.digit}><strong>{c.title} ({k ? String(c.digit).repeat(k) : "пусто"})</strong> — {c.levels[lvl]}.</li>;
                })}
              </ul>
            </div>
          </div>
          <p className="mt-5 text-sm text-muted">
            Квадрат Пифагора входит в полный разбор вместе с числом судьбы и личным годом.{" "}
            <RazborLink from="kvadrat-pifagora-kalkulyator" date={date} className="text-accent-text underline">Бесплатная часть разбора по этой дате</RazborLink>
          </p>
        </div>
      )}
    </div>
  );
}
