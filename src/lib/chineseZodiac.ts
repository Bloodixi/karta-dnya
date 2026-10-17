import { readJsonData, type Faq } from "./content";

/** Китайский гороскоп: 12 животных, 5 стихий, таблица дат китайского Нового года (content/data/chinese-zodiac.json). */

export type ElementKey = "wood" | "fire" | "earth" | "metal" | "water";

export type ChineseAnimal = {
  slug: string;
  name: string;
  alias: string;
  gen: string;
  hanzi: string;
  order: number;
  polarity: "ян" | "инь";
  element: string;
  hours: string;
  /** Женский род названия: «Огненная Коза», но «Огненный Тигр». */
  fem: boolean;
  summary: string;
  description: string;
  character: string[];
  strengths: string[];
  growth: string[];
  love: string;
  work: string;
  compatText: string;
  elements: Record<ElementKey, string>;
  stones: string[];
  colors: string[];
  numbers: number[];
  faq: Faq[];
};

export type ChineseElement = { key: ElementKey; name: string; adjM: string; adjF: string; color: string; digits: string; text: string };

export type Forecast2027 = { slug: string; text: string };

type Data = {
  animals: ChineseAnimal[];
  elements: ChineseElement[];
  /** Начало года (китайский Новый год, дата по Пекину): «1990» → «1990-01-27». Сверено с астрономическим расчётом и таблицей Википедии. */
  newYears: Record<string, string>;
  year2027: Forecast2027[];
};

const DATA = readJsonData<Data>("chinese-zodiac.json", { animals: [], elements: [], newYears: {}, year2027: [] });

export const getChineseAnimals = () => [...DATA.animals].sort((a, b) => a.order - b.order);
export const findChineseAnimal = (slug: string) => DATA.animals.find((a) => a.slug === slug);
export const getChineseElements = () => DATA.elements;
export const getForecast2027 = () => DATA.year2027;
export const getNewYears = () => DATA.newYears;

export const FIRST_YEAR = Math.min(...Object.keys(DATA.newYears).map(Number));
export const LAST_YEAR = Math.max(...Object.keys(DATA.newYears).map(Number));

/** Животное года по григорианскому номеру китайского года: 1900, 1912… — Крыса (порядок 1). */
export function animalOrder(year: number): number {
  return (((year - 4) % 12) + 12) % 12 + 1;
}

/** Стихия года по небесному стволу: 4–5 на конце — Дерево, 6–7 — Огонь, 8–9 — Земля, 0–1 — Металл, 2–3 — Вода. */
export function elementKey(year: number): ElementKey {
  const keys: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  return keys[Math.floor((((year - 4) % 10) + 10) % 10 / 2)];
}

export function animalForYear(year: number): ChineseAnimal | undefined {
  const order = animalOrder(year);
  return DATA.animals.find((a) => a.order === order);
}

export function elementForYear(year: number): ChineseElement | undefined {
  const key = elementKey(year);
  return DATA.elements.find((e) => e.key === key);
}

/** Годы животного в пределах таблицы: [год, дата начала, дата конца]. */
export function yearsOf(order: number): { year: number; start: string; end: string }[] {
  const out: { year: number; start: string; end: string }[] = [];
  for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) {
    if (animalOrder(y) !== order) continue;
    const next = DATA.newYears[String(y + 1)];
    out.push({ year: y, start: DATA.newYears[String(y)], end: next ? prevDay(next) : "" });
  }
  return out;
}

function prevDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export type ChineseSign = { year: number; animal: ChineseAnimal; element: ChineseElement; start: string; end: string; shifted: boolean };

/** Китайский год для даты рождения ГГГГ-ММ-ДД: до Нового года по лунному календарю действует прошлый год. Вне таблицы — null. */
export function chineseSign(iso: string): ChineseSign | null {
  const y = Number(iso.slice(0, 4));
  const start = DATA.newYears[String(y)];
  if (!start) return null;
  const shifted = iso < start;
  const year = shifted ? y - 1 : y;
  const own = DATA.newYears[String(year)];
  const next = DATA.newYears[String(year + 1)];
  const animal = animalForYear(year);
  const element = elementForYear(year);
  if (!own || !animal || !element) return null;
  return { year, animal, element, start: own, end: next ? prevDay(next) : "", shifted };
}

/* ---------- Совместимость ---------- */

const TRINES = [[1, 5, 9], [2, 6, 10], [3, 7, 11], [4, 8, 12]];
const SECRET = [[1, 2], [3, 12], [4, 11], [5, 10], [6, 9], [7, 8]];

export type CompatLevel = "best" | "friend" | "neutral" | "hard";

/** Традиционная совместимость: союзники по тройке, «тайный друг», противоположный знак (через шесть) — сложная пара. */
export function compatLevel(a: number, b: number): CompatLevel {
  if (a === b) return "neutral";
  if (TRINES.some((t) => t.includes(a) && t.includes(b))) return "best";
  if (SECRET.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return "friend";
  if (Math.abs(a - b) === 6) return "hard";
  return "neutral";
}

export const COMPAT_LABELS: Record<CompatLevel, string> = {
  best: "союзник по тройке",
  friend: "тайный друг",
  neutral: "ровные отношения",
  hard: "противоположный знак",
};

/** «Огненная Коза», «Водяной Тигр». */
export function signName(element: ChineseElement | undefined, animal: ChineseAnimal): string {
  return element ? `${animal.fem ? element.adjF : element.adjM} ${animal.name}` : animal.name;
}

/** «6 февраля 2027» из ГГГГ-ММ-ДД. */
export function formatRuDate(iso: string, withYear = true): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  return `${d} ${months[m - 1]}${withYear ? ` ${y}` : ""}`;
}
