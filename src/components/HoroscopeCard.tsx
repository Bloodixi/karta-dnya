import Link from "next/link";
import { formatDateRu, type Horoscope } from "@/lib/daily";

/** Строка «Что на небе» вида «Факт: пояснение» → выделенный факт и мягкое пояснение. */
function splitFact(s: string): { fact: string; note: string } {
  const colon = s.indexOf(": ");
  if (colon > 0) return { fact: s.slice(0, colon), note: s.slice(colon + 2) };
  const dash = s.indexOf(" — ");
  return dash > 0 ? { fact: s.slice(0, dash), note: s.slice(dash + 3) } : { fact: s, note: "" };
}

export default function HoroscopeCard({ h, title }: { h: Horoscope; title?: string }) {
  const astro = h.source === "astro";
  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl">{title || h.label}</h2>
        <span className="chip">настроение: {h.mood}</span>
      </div>
      <p className="mt-3 text-lg">{h.general}</p>
      {astro && h.sky.length > 0 && (
        <div className="mt-5 rounded border border-line bg-sunk px-4 py-3">
          <div>
            <p className="mono">Что на небе</p>
            <ul className="mt-2 grid gap-1.5 text-sm">
              {h.sky.map((s) => {
                const { fact, note } = splitFact(s);
                return (
                  <li key={s} className="flex gap-2">
                    <span aria-hidden="true" className="mt-[0.55em] inline-block w-1.5 h-1.5 bg-gold rotate-45 shrink-0" />
                    <span><span className="font-semibold">{fact}</span>{note && <span className="text-muted"> — {note}</span>}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3 mt-5 text-sm">
        <div>
          <p className="font-semibold">Любовь <span className="stars">{"★".repeat(h.score.love)}</span></p>
          <p className="text-muted mt-1">{h.love}</p>
        </div>
        <div>
          <p className="font-semibold">Работа и деньги <span className="stars">{"★".repeat(h.score.career)}</span></p>
          <p className="text-muted mt-1">{h.career}</p>
        </div>
        <div>
          <p className="font-semibold">Самочувствие <span className="stars">{"★".repeat(h.score.energy)}</span></p>
          <p className="text-muted mt-1">{h.health}</p>
        </div>
      </div>
      <p className="mt-5 border-l-2 border-gold pl-3 italic">{h.advice}</p>
      {astro && (
        <p className="mono-text mt-4 normal-case">
          Рассчитано на {formatDateRu(h.key)}, 12:00 МСК по положениям планет · <Link href="/astrologiya/kak-my-schitaem" className="text-accent underline">как мы считаем</Link>
        </p>
      )}
    </section>
  );
}
