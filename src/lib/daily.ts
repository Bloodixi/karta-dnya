import fs from "node:fs";
import path from "node:path";
import { getHoroscopeBank, getTarot, getZodiac, type TarotCard, type Zodiac } from "./content";
import type { HoroscopeText } from "./astro/types";

/** Детерминированный генератор: одна и та же дата → тот же результат у всех посетителей, без базы данных. */
export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

const MSK = 3 * 3600 * 1000;

export function todayKey(d = new Date()): string {
  // Московское время: сайт для русскоязычной аудитории, день меняется в полночь по Москве.
  return new Date(d.getTime() + MSK).toISOString().slice(0, 10);
}

export function shiftKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function formatDateRu(key: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("ru-RU", { ...opts, timeZone: "UTC" });
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function pickMany<T>(arr: T[], seed: number, n: number): T[] {
  const out: T[] = [];
  const used = new Set<number>();
  for (let i = 0; i < n && used.size < arr.length; i++) {
    let idx = hash(`${seed}:${i}`) % arr.length;
    while (used.has(idx)) idx = (idx + 1) % arr.length;
    used.add(idx);
    out.push(arr[idx]);
  }
  return out;
}

export function cardOfDay(dateKey = todayKey()): { card: TarotCard; reversed: boolean } | null {
  const cards = getTarot();
  if (!cards.length) return null;
  const h = hash("card:" + dateKey);
  return { card: cards[h % cards.length], reversed: (h >>> 8) % 4 === 0 };
}

// ---------- периоды ----------

export type PeriodKey = "segodnya" | "zavtra" | "vchera" | "nedelya" | "mesyats" | "god";

export const PERIODS: Record<PeriodKey, { title: string; genitive: string; sentences: number; revalidate: number }> = {
  segodnya: { title: "на сегодня", genitive: "сегодняшнего дня", sentences: 1, revalidate: 1800 },
  zavtra: { title: "на завтра", genitive: "завтрашнего дня", sentences: 1, revalidate: 1800 },
  vchera: { title: "на вчера", genitive: "вчерашнего дня", sentences: 1, revalidate: 1800 },
  nedelya: { title: "на неделю", genitive: "недели", sentences: 2, revalidate: 3600 },
  mesyats: { title: "на месяц", genitive: "месяца", sentences: 3, revalidate: 3600 },
  god: { title: "на год", genitive: "года", sentences: 4, revalidate: 3600 },
};

export const PERIOD_KEYS = Object.keys(PERIODS) as PeriodKey[];

/** Ключ периода: день → дата, неделя → понедельник, месяц → первое число. */
export function periodKey(period: PeriodKey, dateKey = todayKey()): string {
  if (period === "zavtra") return shiftKey(dateKey, 1);
  if (period === "vchera") return shiftKey(dateKey, -1);
  if (period === "nedelya") {
    const [y, m, d] = dateKey.split("-").map(Number);
    const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // 0 = понедельник
    return shiftKey(dateKey, -dow);
  }
  if (period === "mesyats") return dateKey.slice(0, 8) + "01";
  if (period === "god") return dateKey.slice(0, 4) + "-01-01";
  return dateKey;
}

export function periodLabel(period: PeriodKey, dateKey = todayKey()): string {
  const key = periodKey(period, dateKey);
  if (period === "nedelya") return `${formatDateRu(key, { day: "numeric", month: "long" })} – ${formatDateRu(shiftKey(key, 6), { day: "numeric", month: "long" })}`;
  if (period === "mesyats") return formatDateRu(key, { month: "long", year: "numeric" });
  if (period === "god") return `${key.slice(0, 4)} год`;
  return formatDateRu(key);
}

export type Horoscope = {
  sign: Zodiac; period: PeriodKey; key: string; label: string;
  general: string; love: string; career: string; health: string; advice: string; mood: string;
  score: { love: number; career: number; energy: number };
  /** «Что на небе»: 3–5 фактов простыми словами (пусто у текстов из банка фраз). */
  sky: string[];
  /** astro — текст гороскопа 3.0 из content/data/horoscopes (транзиты + редактура); bank — запасной банк фраз. */
  source: "astro" | "bank";
};

// ---------- гороскоп 3.0: готовые тексты из content/data/horoscopes/<период>/<ключ>.json ----------

const HOROSCOPES_DIR = path.join(process.cwd(), "content", "data", "horoscopes");
/** Кэш чтения файлов периода на процесс: ключ «период/дата» → тексты по знаку (null — файла нет). */
const horoscopeFiles = new Map<string, Map<string, HoroscopeText> | null>();
/** Дневные периоды взаимозаменяемы по ключу: «завтра» на 6-е и «сегодня» на 7-е — одна и та же дата. */
const DAY_PERIODS: PeriodKey[] = ["segodnya", "zavtra", "vchera"];

function readHoroscopeFile(period: PeriodKey, key: string): Map<string, HoroscopeText> | null {
  const id = `${period}/${key}`;
  const hit = horoscopeFiles.get(id);
  if (hit !== undefined) return hit;
  let out: Map<string, HoroscopeText> | null = null;
  try {
    const arr = JSON.parse(fs.readFileSync(path.join(HOROSCOPES_DIR, period, `${key}.json`), "utf8")) as HoroscopeText[];
    if (Array.isArray(arr) && arr.length) out = new Map(arr.filter((t) => t && typeof t.sign === "string").map((t) => [t.sign, t]));
  } catch {
    out = null;
  }
  if (horoscopeFiles.size > 256) horoscopeFiles.clear();
  horoscopeFiles.set(id, out);
  return out;
}

/** Текст гороскопа 3.0 для знака: файл своего периода, для дней — любой дневной файл с той же датой;
 *  из нескольких предпочитается отредактированный моделью (model ≠ draft), иначе первый найденный черновик. */
export function astroHoroscopeText(sign: string, period: PeriodKey, key: string): HoroscopeText | null {
  const order = DAY_PERIODS.includes(period) ? [period, ...DAY_PERIODS.filter((p) => p !== period)] : [period];
  let draft: HoroscopeText | null = null;
  for (const p of order) {
    const t = readHoroscopeFile(p, key)?.get(sign);
    if (!t || !t.general || !t.love || !t.career || !t.health) continue;
    if (t.model && t.model !== "draft") return t;
    draft ??= t;
  }
  return draft;
}

export function horoscopeFor(sign: Zodiac, period: PeriodKey = "segodnya", dateKey = todayKey()): Horoscope | null {
  const key = periodKey(period, dateKey);
  const astro = astroHoroscopeText(sign.slug, period, key);
  if (astro) {
    return {
      sign, period, key, label: periodLabel(period, dateKey),
      general: astro.general, love: astro.love, career: astro.career, health: astro.health,
      advice: astro.advice, mood: astro.mood,
      score: { love: astro.scores.love, career: astro.scores.career, energy: astro.scores.energy },
      sky: Array.isArray(astro.sky) ? astro.sky : [],
      source: "astro",
    };
  }
  const bank = getHoroscopeBank();
  if (!bank.general.length) return null;
  const n = PERIODS[period].sentences;
  const s = (field: string) => hash(`${sign.slug}:${period}:${key}:${field}`);
  const take = (arr: string[], field: string) => pickMany(arr, s(field), n).join(" ");
  const base = s("base");
  return {
    sign, period, key, label: periodLabel(period, dateKey),
    general: take(bank.general, "general"),
    love: take(bank.love, "love"),
    career: take(bank.career, "career"),
    health: take(bank.health, "health"),
    advice: pick(bank.advice, s("advice")),
    mood: pick(bank.mood, s("mood")),
    score: { love: 2 + (base % 4), career: 2 + ((base >>> 4) % 4), energy: 2 + ((base >>> 8) % 4) },
    sky: [],
    source: "bank",
  };
}

export function allHoroscopes(period: PeriodKey = "segodnya", dateKey = todayKey()): Horoscope[] {
  return getZodiac().map((z) => horoscopeFor(z, period, dateKey)).filter((h): h is Horoscope => !!h);
}
