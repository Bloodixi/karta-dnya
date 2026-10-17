/** Страницы месяцев лунного календаря (/lunnyy-kalendar/2026-11): дни месяца по src/lib/moon.ts (как на страницах дней),
 *  точные моменты фаз и затмения — по astronomy-engine (src/lib/astro/engine.ts), время — московское. */
import * as Astro from "astronomy-engine";
import { moonQuarters, moonSign as engineMoonSign } from "./astro/engine";
import type { SignSlug } from "./astro/types";
import { monthDays, type DayInfo } from "./moon";

export const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Месяц: именительный («ноябрь»), родительный («ноября»), предложный («в ноябре»). */
export const MONTH_NAMES: { nom: string; gen: string; loc: string }[] = [
  { nom: "январь", gen: "января", loc: "в январе" },
  { nom: "февраль", gen: "февраля", loc: "в феврале" },
  { nom: "март", gen: "марта", loc: "в марте" },
  { nom: "апрель", gen: "апреля", loc: "в апреле" },
  { nom: "май", gen: "мая", loc: "в мае" },
  { nom: "июнь", gen: "июня", loc: "в июне" },
  { nom: "июль", gen: "июля", loc: "в июле" },
  { nom: "август", gen: "августа", loc: "в августе" },
  { nom: "сентябрь", gen: "сентября", loc: "в сентябре" },
  { nom: "октябрь", gen: "октября", loc: "в октябре" },
  { nom: "ноябрь", gen: "ноября", loc: "в ноябре" },
  { nom: "декабрь", gen: "декабря", loc: "в декабре" },
];

/** Постоянный набор статических месяцев; к нему добавляется скользящее окно от текущего месяца. */
const STATIC_FROM = "2026-09";
const STATIC_TO = "2027-12";

function addMonths(key: string, n: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function rangeKeys(from: string, to: string): string[] {
  const out: string[] = [];
  for (let k = from; k <= to; k = addMonths(k, 1)) out.push(k);
  return out;
}

/** Месяцы, на которые ссылаемся и которые отдаём в sitemap: прошлый, текущий и три следующих. */
export function lunarMonthWindow(today: string): string[] {
  const cur = today.slice(0, 7);
  return rangeKeys(addMonths(cur, -1), addMonths(cur, 3));
}

/** Все месяцы, которые собираются при сборке. */
export function lunarMonthStaticKeys(today: string): string[] {
  return [...new Set([...rangeKeys(STATIC_FROM, STATIC_TO), ...lunarMonthWindow(today)])].sort();
}

/** Месяц, на который можно поставить ссылку (соседние месяцы, блок «По месяцам»). */
export function isLinkedMonth(key: string, today: string): boolean {
  return lunarMonthStaticKeys(today).includes(key);
}

export function monthLabel(key: string): { nom: string; gen: string; loc: string; year: number; month: number } {
  const [year, month] = key.split("-").map(Number);
  return { ...MONTH_NAMES[month - 1], year, month };
}

export function prevMonth(key: string): string {
  return addMonths(key, -1);
}
export function nextMonth(key: string): string {
  return addMonths(key, 1);
}

export type PhaseEvent = { kind: "new-moon" | "first-quarter" | "full-moon" | "last-quarter"; iso: string; day: string; sign: SignSlug };
export type EclipseEvent = { type: "solar" | "lunar"; kind: string; iso: string; day: string; sign: SignSlug };

const MSK = 3 * 3_600_000;
const mskDay = (d: Date) => new Date(d.getTime() + MSK).toISOString().slice(0, 10);

/** Начало и конец месяца по Москве в UTC. */
function monthBounds(key: string): { from: Date; to: Date } {
  const [y, m] = key.split("-").map(Number);
  return { from: new Date(Date.UTC(y, m - 1, 1) - MSK), to: new Date(Date.UTC(y, m, 1) - MSK - 1) };
}

const ECLIPSE_KIND_RU: Record<string, string> = { total: "полное", partial: "частное", annular: "кольцеобразное", penumbral: "полутеневое" };

export function eclipseKindRu(kind: string): string {
  return ECLIPSE_KIND_RU[kind] ?? kind;
}

function eclipses(from: Date, to: Date): EclipseEvent[] {
  const out: EclipseEvent[] = [];
  for (let e = Astro.SearchLunarEclipse(from); e.peak.date.getTime() <= to.getTime(); e = Astro.NextLunarEclipse(e.peak)) {
    out.push({ type: "lunar", kind: e.kind, iso: e.peak.date.toISOString(), day: mskDay(e.peak.date), sign: engineMoonSign(e.peak.date) });
  }
  for (let e = Astro.SearchGlobalSolarEclipse(from); e.peak.date.getTime() <= to.getTime(); e = Astro.NextGlobalSolarEclipse(e.peak)) {
    out.push({ type: "solar", kind: e.kind, iso: e.peak.date.toISOString(), day: mskDay(e.peak.date), sign: engineMoonSign(e.peak.date) });
  }
  return out.sort((a, b) => a.iso.localeCompare(b.iso));
}

export type LunarMonth = {
  key: string;
  days: DayInfo[];
  phases: PhaseEvent[];
  eclipses: EclipseEvent[];
  /** Отрезки растущей и убывающей Луны внутри месяца (по возрасту Луны на московский полдень, как на страницах дней). */
  spans: { waxing: boolean; from: string; to: string }[];
  signs: number;
};

export function lunarMonth(key: string): LunarMonth {
  const { year, month } = monthLabel(key);
  const days = monthDays(year, month);
  const { from, to } = monthBounds(key);
  const phases = moonQuarters(from, to).map((e) => ({ kind: e.kind as PhaseEvent["kind"], iso: e.date, day: mskDay(new Date(e.date)), sign: e.sign! }));
  const spans: LunarMonth["spans"] = [];
  for (const d of days) {
    const waxing = d.age < 29.530588853 / 2;
    const last = spans.at(-1);
    if (last && last.waxing === waxing) last.to = d.key;
    else spans.push({ waxing, from: d.key, to: d.key });
  }
  return { key, days, phases, eclipses: eclipses(from, to), spans, signs: new Set(days.map((d) => d.sign.slug)).size };
}

/** Короткая заметка о месяце: чем он обычно занят в саду и дома. Пишется руками, по одной на месяц года. */
export const MONTH_NOTES: string[] = [
  "Январь — месяц тихого старта: после праздников удобно сверять планы с фазами Луны и не браться за всё сразу. Для дачников это время заказывать семена и проверять запасы.",
  "Февраль короткий, и лунный цикл почти совпадает с ним по длине. На подоконниках начинают первые посевы рассады, а дома — разбирают зимние завалы перед весной.",
  "Март — время первых тёплых дней и рассады. Растущую Луну обычно отдают посевам и новым делам, убывающую — уборке после зимы и обрезке.",
  "Апрель — один из самых насыщенных месяцев для сада и огорода: посевы, пересадка, подготовка грядок. В лунном календаре на него смотрят чаще всего.",
  "Май — высадка рассады в грунт и активная работа на участке. Полнолуние и новолуние традиционно оставляют для отдыха, а не для пересадки.",
  "Июнь — длинные дни и короткие ночи. Растения растут быстро, и календарь помогает выбрать дни для полива, подкормки и прополки.",
  "Июль — середина лета, первые урожаи. Убывающую Луну отдают сбору корнеплодов и заготовкам, растущую — уходу за тем, что ещё зреет.",
  "Август — время урожая и заготовок, а для многих — возвращение из отпуска. Удобный месяц, чтобы подвести итоги лета и наметить планы на осень.",
  "Сентябрь — сбор урожая, посадка озимых и возвращение к рабочему ритму. Новолуние этого месяца часто используют, чтобы поставить цели на осень.",
  "Октябрь — подготовка сада к зиме и уютные домашние дела. Убывающая Луна подходит для уборки участка, растущая — для посадки луковичных и озимых.",
  "Ноябрь — тёмный и спокойный месяц. Работы в саду почти нет, зато удобно планировать, разбирать дома лишнее и восстанавливать силы.",
  "Декабрь — подведение итогов года и подготовка к праздникам. На него приходится зимнее солнцестояние, самая долгая ночь года, после которой день начинает расти.",
];
