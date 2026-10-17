import Link from "next/link";
import MoonPhase from "@/components/MoonPhase";
import { formatDateRu, shiftKey } from "@/lib/daily";
import { dayInfo, moonWindow, PHASES, type PhaseKey } from "@/lib/moon";

/** Главные фазы, начало которых отмечаем в ленте золотой точкой. */
const KEY_PHASES: PhaseKey[] = ["new", "first-quarter", "full", "last-quarter"];

/** Лента фаз Луны на `days` дней (с двух дней до сегодня), для ночной шапки. Горизонтальная прокрутка со snap. */
export default function MoonStrip({ today, days = 30, before = 2 }: { today: string; days?: number; before?: number }) {
  const win = moonWindow(today);
  const keys = Array.from({ length: days }, (_, i) => shiftKey(today, i - before));
  const infos = keys.map((k) => dayInfo(k));
  return (
    <div className="relative">
      <ol
        aria-label={`Фазы Луны на ${days} дней`}
        className="-mx-4 px-4 flex gap-2 overflow-x-auto snap-x snap-mandatory scroll-px-4 pb-3 pt-1 [scrollbar-width:thin] [scrollbar-color:var(--night-line)_transparent]"
      >
        {infos.map((d, i) => {
          const isToday = d.key === today;
          const prev = i > 0 ? infos[i - 1].phase : dayInfo(shiftKey(d.key, -1)).phase;
          const keyStart = KEY_PHASES.includes(d.phase) && prev !== d.phase;
          const dayNum = Number(d.key.slice(8));
          const top = dayNum === 1 ? formatDateRu(d.key, { month: "short" }).replace(".", "") : formatDateRu(d.key, { weekday: "short" });
          const inner = (
            <>
              <span className={`mono text-[0.62rem]! ${isToday ? "text-[var(--accent-soft)]!" : ""}`}>{isToday ? "сегодня" : top}</span>
              <span className={`display text-lg leading-none ${isToday ? "text-[var(--night-ink)]" : ""}`}>{dayNum}</span>
              <MoonPhase age={d.age} size={30} className="my-0.5" />
              <span className="text-[0.68rem] leading-none text-[var(--night-muted)]">{d.lunarDay} л.д.</span>
              <span aria-hidden="true" className={`mt-0.5 h-1.5 w-1.5 rounded-full ${keyStart ? "bg-[var(--gold)]" : "bg-transparent"}`} />
              <span className="sr-only">
                {formatDateRu(d.key, { day: "numeric", month: "long" })}: {PHASES[d.phase].name}
                {isToday ? ", сегодня" : ""}
              </span>
            </>
          );
          const cls = `w-full h-full flex flex-col items-center gap-1 rounded-[4px] border px-1 pt-2 pb-1.5 transition-colors ${
            isToday
              ? "border-[var(--accent-soft)] bg-[rgba(179,162,204,0.12)]"
              : "border-[var(--night-line)] bg-[rgba(255,255,255,0.02)] hover:border-[var(--gold)]"
          }`;
          const linkable = d.key >= win.from && d.key <= win.to;
          return (
            <li key={d.key} className="snap-start shrink-0 w-[62px]" title={keyStart ? PHASES[d.phase].name : undefined}>
              {linkable ? (
                <Link href={`/lunnyy-kalendar/${d.key}`} aria-current={isToday ? "date" : undefined} className={cls}>
                  {inner}
                </Link>
              ) : (
                <span className={cls}>{inner}</span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mono text-[0.62rem]! mt-2 flex items-center gap-2">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
        начало фазы: новолуние, четверть, полнолуние
      </p>
    </div>
  );
}
