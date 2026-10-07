/** Нумерология: число судьбы, число дня рождения, числа имени, личный год, счастливые числа. */
export function digitsSum(n: number): number {
  return String(Math.abs(n)).split("").reduce((s, d) => s + Number(d), 0);
}

export const MASTER_NUMBERS = [11, 22, 33] as const;
export const CORE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const ALL_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;

export function isMaster(n: number): boolean {
  return n === 11 || n === 22 || n === 33;
}

/** Сворачивает до одной цифры, сохраняя мастер-числа 11, 22, 33. */
export function reduceNumber(n: number): number {
  while (n > 9 && !isMaster(n)) n = digitsSum(n);
  return n;
}

/** Сворачивает до 1–9 без учёта мастер-чисел. */
export function reduceSimple(n: number): number {
  while (n > 9) n = digitsSum(n);
  return n;
}

/** Базовая цифра мастер-числа: 11 → 2, 22 → 4, 33 → 6. */
export function toCore(n: number): number {
  return n === 11 ? 2 : n === 22 ? 4 : n === 33 ? 6 : n;
}

function reduceWithSteps(total: number, keepMaster = true): { number: number; steps: string[] } {
  const steps: string[] = [];
  let n = total;
  while (n > 9 && !(keepMaster && isMaster(n))) {
    const next = digitsSum(n);
    steps.push(`${String(n).split("").join(" + ")} = ${next}`);
    n = next;
  }
  return { number: n, steps };
}

/** Число судьбы (жизненного пути): сумма всех цифр даты рождения. */
export function destinyNumber(day: number, month: number, year: number): { number: number; steps: string[] } {
  const all = `${day}${month}${year}`.split("").map(Number);
  const total = all.reduce((a, b) => a + b, 0);
  const r = reduceWithSteps(total);
  return { number: r.number, steps: [`${all.join(" + ")} = ${total}`, ...r.steps] };
}

/** Альтернативный способ: день, месяц и год сворачиваются по отдельности, затем складываются. */
export function destinyByParts(day: number, month: number, year: number): { number: number; parts: number[]; steps: string[] } {
  const parts = [reduceNumber(day), reduceNumber(month), reduceNumber(year)];
  const total = parts.reduce((a, b) => a + b, 0);
  const r = reduceWithSteps(total);
  return { number: r.number, parts, steps: [`${parts.join(" + ")} = ${total}`, ...r.steps] };
}

/** Число дня рождения: день месяца, свёрнутый с сохранением 11 и 22. */
export function birthdayNumber(day: number): { number: number; raw: number } {
  return { number: reduceNumber(day), raw: day };
}

export function isValidDate(day: number, month: number, year: number): boolean {
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

export type BirthDate = { d: number; m: number; y: number; iso: string };

/** Разбор даты из строки ГГГГ-ММ-ДД (значение input[type=date] или параметр URL). */
export function parseDate(value: string | string[] | undefined): BirthDate | null {
  const s = Array.isArray(value) ? value[0] : value;
  if (!s) return null;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!isValidDate(d, mo, y)) return null;
  return { d, m: mo, y, iso: `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
}

export function formatDate(b: BirthDate): string {
  return `${String(b.d).padStart(2, "0")}.${String(b.m).padStart(2, "0")}.${b.y}`;
}

/* ---------- Имя ---------- */

/** Таблица для кириллицы (система Пифагора по порядку алфавита). */
export const CYRILLIC_TABLE: Record<number, string> = {
  1: "АИСЪ",
  2: "БЙТЫ",
  3: "ВКУЬ",
  4: "ГЛФЭ",
  5: "ДМХЮ",
  6: "ЕНЦЯ",
  7: "ЁОЧ",
  8: "ЖПШ",
  9: "ЗРЩ",
};

/** Таблица для латиницы (пифагорейская). */
const LATIN_TABLE: Record<number, string> = {
  1: "AJS",
  2: "BKT",
  3: "CLU",
  4: "DMV",
  5: "ENW",
  6: "FOX",
  7: "GPY",
  8: "HQZ",
  9: "IR",
};

const VOWELS = new Set("АЕЁИОУЫЭЮЯAEIOUY".split(""));

const LETTER_VALUE: Record<string, number> = {};
for (const table of [CYRILLIC_TABLE, LATIN_TABLE]) {
  for (const [v, letters] of Object.entries(table)) for (const ch of letters) LETTER_VALUE[ch] = Number(v);
}

export type NameLetter = { ch: string; value: number; vowel: boolean };
export type NamePart = { total: number; number: number; steps: string[] };
export type NameResult = { clean: string; letters: NameLetter[]; expression: NamePart; soul: NamePart; personality: NamePart };

function sumPart(letters: NameLetter[]): NamePart {
  const total = letters.reduce((s, l) => s + l.value, 0);
  const r = reduceWithSteps(total);
  const expr = letters.length ? `${letters.map((l) => l.value).join(" + ")} = ${total}` : "0";
  return { total, number: total === 0 ? 0 : r.number, steps: [expr, ...r.steps] };
}

/** Чистит имя (буквы и пробелы), ограничивает длину. */
export function cleanName(value: string | string[] | undefined): string {
  const s = Array.isArray(value) ? value[0] : value;
  if (!s) return "";
  return s
    .replace(/[^A-Za-zА-Яа-яЁё\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/** Число имени (выражения), число души (гласные) и число личности (согласные). */
export function nameNumbers(name: string): NameResult | null {
  const clean = cleanName(name);
  const letters: NameLetter[] = [];
  for (const ch of clean.toUpperCase()) {
    const value = LETTER_VALUE[ch];
    if (!value) continue;
    letters.push({ ch, value, vowel: VOWELS.has(ch) });
  }
  if (!letters.length) return null;
  return {
    clean,
    letters,
    expression: sumPart(letters),
    soul: sumPart(letters.filter((l) => l.vowel)),
    personality: sumPart(letters.filter((l) => !l.vowel)),
  };
}

/* ---------- Личный год ---------- */

/** Личный год: день + месяц рождения + год, свёрнутые до 1–9. */
export function personalYear(day: number, month: number, year: number): { number: number; steps: string[] } {
  const d = reduceSimple(day);
  const m = reduceSimple(month);
  const y = reduceSimple(digitsSum(year));
  const total = d + m + y;
  const r = reduceWithSteps(total, false);
  return { number: r.number, steps: [`${d} + ${m} + ${y} = ${total}`, ...r.steps] };
}

/** Личный месяц: личный год + номер месяца, свёрнутые до 1–9. */
export function personalMonth(py: number, month: number): number {
  return reduceSimple(py + month);
}

/** Текущий год по Москве. */
export function currentYearMsk(): number {
  return Number(new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", year: "numeric" }).format(new Date()));
}

/* ---------- Счастливые числа ---------- */

export type LuckyResult = { main: number; birthday: number; monthDay: number; series: number[]; days: number[] };

/** Счастливое число по дате: число судьбы, сведённое к 1–9, плюс производные ряды. */
export function luckyNumbers(day: number, month: number, year: number): LuckyResult {
  const main = reduceSimple(destinyNumber(day, month, year).number);
  const birthday = reduceSimple(day);
  const monthDay = reduceSimple(day + month);
  const series: number[] = [];
  for (let n = main; n <= 99; n += 9) series.push(n);
  const days = series.filter((n) => n >= 1 && n <= 31);
  return { main, birthday, monthDay, series, days };
}

/* ---------- Совместимость ---------- */

export function pairKey(a: number, b: number): string {
  const x = toCore(a);
  const y = toCore(b);
  return x <= y ? `${x}-${y}` : `${y}-${x}`;
}

export const NUMBER_WORDS: Record<number, string> = {
  1: "единица",
  2: "двойка",
  3: "тройка",
  4: "четвёрка",
  5: "пятёрка",
  6: "шестёрка",
  7: "семёрка",
  8: "восьмёрка",
  9: "девятка",
  11: "одиннадцать",
  22: "двадцать два",
  33: "тридцать три",
};
