import { getHoroscopeBank, getTarot, getZodiac, type TarotCard, type Zodiac } from "./content";

/** Детерминированный генератор: одна и та же дата → тот же результат у всех посетителей, без базы данных. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function todayKey(d = new Date()): string {
  // Московское время: сайт для русскоязычной аудитории, день меняется в полночь по Москве.
  const msk = new Date(d.getTime() + 3 * 3600 * 1000);
  return msk.toISOString().slice(0, 10);
}

export function formatDateRu(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function cardOfDay(dateKey = todayKey()): { card: TarotCard; reversed: boolean } | null {
  const cards = getTarot();
  if (!cards.length) return null;
  const h = hash("card:" + dateKey);
  return { card: cards[h % cards.length], reversed: (h >>> 8) % 4 === 0 };
}

export type Horoscope = { sign: Zodiac; date: string; general: string; love: string; career: string; health: string; advice: string; mood: string; score: { love: number; career: number; energy: number } };

export function horoscopeFor(sign: Zodiac, dateKey = todayKey()): Horoscope | null {
  const bank = getHoroscopeBank();
  if (!bank.general.length) return null;
  const base = hash(`${sign.slug}:${dateKey}`);
  const s = (n: number) => hash(`${sign.slug}:${dateKey}:${n}`);
  return {
    sign,
    date: dateKey,
    general: pick(bank.general, s(1)),
    love: pick(bank.love, s(2)),
    career: pick(bank.career, s(3)),
    health: pick(bank.health, s(4)),
    advice: pick(bank.advice, s(5)),
    mood: pick(bank.mood, s(6)),
    score: { love: 2 + (base % 4), career: 2 + ((base >>> 4) % 4), energy: 2 + ((base >>> 8) % 4) },
  };
}

export function allHoroscopes(dateKey = todayKey()): Horoscope[] {
  return getZodiac().map((z) => horoscopeFor(z, dateKey)).filter((h): h is Horoscope => !!h);
}
