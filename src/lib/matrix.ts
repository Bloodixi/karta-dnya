/** Матрица судьбы: классическая методика (метод Ладини), арканы 1–22. */
import { digitsSum } from "./numerology";
import { readJsonData, getTarot } from "./content";

export type MatrixArcana = { n: number; name: string; keywords: string[]; short: string; essence: string; plus: string; minus: string; love: string; career: string; advice: string };

export const getMatrixArcana = () => readJsonData<MatrixArcana[]>("matrix-arcana.json", []);
export const findMatrixArcana = (n: number) => getMatrixArcana().find((a) => a.n === n) || null;
export const ARCANA_NUMBERS = Array.from({ length: 22 }, (_, i) => i + 1);

/** Сводит число к диапазону 1–22: всё, что больше 22, заменяется суммой цифр. */
export function toArcana(n: number): number {
  let x = Math.abs(Math.trunc(n));
  while (x > 22) x = digitsSum(x);
  return x === 0 ? 22 : x;
}

export type Matrix = { a: number; b: number; c: number; d: number; e: number; steps: string[] };

/** Основные точки матрицы: A — день, B — месяц, C — год, D = A+B+C, E (центр) = A+B+C+D. */
export function calcMatrix(day: number, month: number, year: number): Matrix {
  const a = toArcana(day);
  const b = toArcana(month);
  const c = toArcana(year);
  const dRaw = a + b + c;
  const d = toArcana(dRaw);
  const eRaw = a + b + c + d;
  const e = toArcana(eRaw);
  return {
    a, b, c, d, e,
    steps: [
      `A (день): ${day}${day > 22 ? ` → ${a}` : ""}`,
      `B (месяц): ${month}`,
      `C (год): ${String(year).split("").join(" + ")} = ${digitsSum(year)}${digitsSum(year) > 22 ? ` → ${c}` : ""}`,
      `D = ${a} + ${b} + ${c} = ${dRaw}${dRaw > 22 ? ` → ${d}` : ""}`,
      `E = ${a} + ${b} + ${c} + ${d} = ${eRaw}${eRaw > 22 ? ` → ${e}` : ""}`,
    ],
  };
}

export const POSITIONS: { key: "a" | "b" | "c" | "d" | "e"; letter: string; title: string; text: string; anchor: string }[] = [
  { key: "a", letter: "A", title: "День рождения: визитная карточка", anchor: "vizitka", text: "Качества, с которыми человек приходит в жизнь и которые первыми замечают окружающие: природный стиль поведения и то, что даётся без усилий." },
  { key: "b", letter: "B", title: "Месяц рождения: таланты", anchor: "talanty", text: "Способности и внутренний ресурс: к чему тянет, что получается легко и через какие занятия человек раскрывается." },
  { key: "c", letter: "C", title: "Год рождения: деньги и дело", anchor: "dengi", text: "Тема, через которую строится материальная сторона жизни: стиль работы, способ проявить себя в деле и накопить опыт." },
  { key: "d", letter: "D", title: "Сумма трёх: жизненные уроки", anchor: "uroki", text: "Повторяющиеся ситуации и уроки, а также способ, которым человек учится принимать зрелые решения." },
  { key: "e", letter: "E", title: "Центр: характер и зона комфорта", anchor: "centr", text: "Главная энергия матрицы: суть личности, баланс всех точек и состояние, в котором человеку спокойно и естественно." },
];

/** Тексты аркана по позициям матрицы (content/data/matrix-positions.json). */
export type MatrixPositions = {
  n: number; desc: string; vizitka: string; centr: string; talanty: string;
  prednaznachenie: { lichnoe: string; socialnoe: string; planetarnoe: string };
  dengi: string; otnosheniya: string; zdorove: string; zhenshchina: string; muzhchina: string;
};
export const getMatrixPositions = () => readJsonData<MatrixPositions[]>("matrix-positions.json", []);
export const findMatrixPositions = (n: number) => getMatrixPositions().find((a) => a.n === n) || null;

/** Блоки страницы аркана: якорь и заголовок (порядок вывода). */
export const POSITION_BLOCKS: { id: string; label: string }[] = [
  { id: "vizitka", label: "в визитной карточке" },
  { id: "centr", label: "в центре матрицы" },
  { id: "talanty", label: "в талантах" },
  { id: "prednaznachenie", label: "в предназначении" },
  { id: "dengi", label: "в деньгах и работе" },
  { id: "otnosheniya", label: "в отношениях" },
  { id: "zdorove", label: "в здоровье" },
  { id: "zhenshchina", label: "для женщины" },
  { id: "muzhchina", label: "для мужчины" },
];

/** Личное предназначение: небо (B + D) + земля (A + C). */
export function calcPurpose(m: Matrix) {
  const sky = toArcana(m.b + m.d);
  const earth = toArcana(m.a + m.c);
  return { sky, earth, personal: toArcana(sky + earth) };
}

/** Совместимость: арканы обоих и общий аркан пары (сумма центров). */
export function calcPair(m1: Matrix, m2: Matrix) {
  const pair = toArcana(m1.e + m2.e);
  const rows = POSITIONS.map((p) => ({ ...p, v1: m1[p.key], v2: m2[p.key], sum: toArcana(m1[p.key] + m2[p.key]) }));
  return { pair, rows };
}

/** Карта Таро для аркана: 1–21 по номеру, 22 — Шут (карта 0). */
export function tarotFor(n: number) {
  const num = n === 22 ? 0 : n;
  return getTarot().find((c) => c.arcana === "major" && c.number === num) || null;
}
