"use client";

import { useState } from "react";
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
  return (
    <div className="card p-6">
      <form onSubmit={(e) => { e.preventDefault(); const [y, m, d] = date.split("-").map(Number); if (!isValidDate(d, m, y)) { setError("Введите настоящую дату рождения."); setRes(null); return; } setError(""); setRes(compute(d, m, y)); }} className="flex flex-wrap gap-3 items-end">
        <label className="grid gap-1 text-sm">Дата рождения<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required min="1900-01-01" className="border border-line rounded-lg px-3 py-2 bg-surface" /></label>
        <button type="submit" className="btn">Рассчитать</button>
      </form>
      {error && <p className="text-sm mt-3 text-red-600">{error}</p>}
      {res && (
        <div className="mt-6">
          <p className="text-sm text-muted">Рабочие числа: {res.work.join(", ")}</p>
          <div className="grid grid-cols-3 gap-2 max-w-sm mt-4">
            {[1, 4, 7, 2, 5, 8, 3, 6, 9].map((n) => (
              <div key={n} className="card p-3 text-center">
                <p className="display text-xl">{res.counts[n] ? String(n).repeat(res.counts[n]) : "—"}</p>
                <p className="text-xs text-muted">{CELLS[n - 1].title}</p>
              </div>
            ))}
          </div>
          <div className="prose mt-6">
            <h3>Расшифровка</h3>
            <ul>
              {CELLS.map((c) => {
                const k = res.counts[c.digit];
                const lvl = k === 0 ? 0 : Math.min(3, k);
                return <li key={c.digit}><strong>{c.title} ({k ? String(c.digit).repeat(k) : "пусто"})</strong> — {c.levels[lvl]}.</li>;
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
