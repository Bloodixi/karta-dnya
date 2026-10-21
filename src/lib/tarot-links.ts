import { getTarot, type TarotCard } from "./content";
import { reduceDigit } from "./clock";
import { hash } from "./daily";

/** Старшие арканы, которые традиционно связывают со знаками зодиака (система Золотой Зари). */
export const ZODIAC_ARCANA: Record<string, string> = {
  oven: "imperator",
  telets: "ierofant",
  bliznetsy: "vlyublennye",
  rak: "kolesnitsa",
  lev: "sila",
  deva: "otshelnik",
  vesy: "spravedlivost",
  skorpion: "smert",
  strelets: "umerennost",
  kozerog: "dyavol",
  vodoley: "zvezda",
  ryby: "luna",
};

export const TAROT_SUITS = ["zhezly", "kubki", "mechi", "pentakli"] as const;

/** Карта Таро дня для знака: одна на дату и знак, у всех посетителей одинаковая. */
export function signCardOfDay(sign: string, dateKey: string): TarotCard | null {
  const cards = getTarot();
  if (!cards.length) return null;
  return cards[hash(`card:${dateKey}:${sign}`) % cards.length];
}

/** Карты числа: старший аркан с номером суммы (0–21) и младшие арканы того же достоинства (1–14, иначе сокращённая цифра). */
export function cardsOfNumber(sum: number): { major: TarotCard | null; minors: TarotCard[]; minorNumber: number } {
  const cards = getTarot();
  let n = sum;
  while (n > 21) n = reduceDigit(n);
  const major = cards.find((c) => c.arcana === "major" && c.number === n) || null;
  const minorNumber = n >= 1 && n <= 14 ? n : reduceDigit(n);
  const minors = minorNumber > 0
    ? TAROT_SUITS.map((s) => cards.find((c) => c.suit === s && c.number === minorNumber)).filter((c): c is TarotCard => !!c)
    : [];
  return { major, minors, minorNumber };
}
