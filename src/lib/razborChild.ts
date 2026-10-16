/**
 * Платный «Детский разбор по дате рождения» — для родителя: документ в формате разбора (Section/Block, рисует RazborView)
 * из банка content/data/razbor/child/*.json. К родителю — на «ты», о ребёнке — в третьем лице по имени.
 * Без медицины и диагнозов, без «ребёнок обязан» и сравнения с другими детьми.
 */
import { readJsonData } from "./content";
import { birthdayNumber, destinyNumber, toCore } from "./numerology";
import { pythagoras } from "./pythagoras";
import { ageAt, envPrice, type Block, type RazborDoc, type RazborInput, type RazborTeaser, type Section } from "./razbor";
import { firstSentences } from "./razborCompat";

export const CHILD = {
  title: "Детский разбор по дате рождения",
  short: "Детский разбор",
  price: envPrice(process.env.CHILD_PRICE, 490),
};

/** Версия банка детского разбора (как RAZBOR_VERSION). Банк прежних версий — child/v<N>/. */
export const CHILD_VERSION = 1;

/** Детский разбор — до 18 лет (на месяц расчёта). */
export const CHILD_MAX_AGE = 17;

type ChildDestiny = { title: string; nature: string; strengths: string; support: string; careful: string; talents: string };
type ChildSquare = { title: string; levels: string[] };

export type AgeGroup = "baby" | "preschool" | "school" | "teen";
export const ageGroup = (age: number): AgeGroup => (age <= 3 ? "baby" : age <= 6 ? "preschool" : age <= 11 ? "school" : "teen");

const N12 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "11", "22", "33"];

function bank(v = CHILD_VERSION) {
  const dir = v >= CHILD_VERSION ? "razbor/child" : `razbor/child/v${v}`;
  return {
    destiny: readJsonData<Record<string, ChildDestiny> | null>(`${dir}/destiny.json`, null),
    age: readJsonData<Record<string, string> | null>(`${dir}/age.json`, null),
    square: readJsonData<Record<string, ChildSquare> | null>(`${dir}/square.json`, null),
  };
}

/** Банк на месте: все 12 чисел, 9 ячеек и возраст для 1–9 во всех группах. Пока нет — детский разбор не продаётся. */
export function childReady(): boolean {
  const b = bank();
  const groups: AgeGroup[] = ["baby", "preschool", "school", "teen"];
  return (
    N12.every((k) => b.destiny?.[k]?.nature) &&
    N12.slice(0, 9).every((k) => b.square?.[k]?.levels?.length === 4 && groups.every((g) => b.age?.[`${k}.${g}`]))
  );
}

/** Нейтральные тексты, пока банка нет: страница собирается, продажа закрыта childReady. */
const STUB: ChildDestiny = {
  title: "Свой характер",
  nature: "У каждого ребёнка свой темп и свой способ узнавать мир. Числа даты рождения подсказывают, на что обратить внимание, — а лучше всего ребёнка знаешь ты.",
  strengths: "Сильные стороны лучше всего видны в том, чем ребёнок занимается сам, без подсказок.",
  support: "Поддержка — это внимание к тому, что получается, спокойный режим и время, проведённое вместе. Хвали за старание, а не только за результат.",
  careful: "Бережно относись к усталости и к тому, что ребёнку пока даётся непросто. Ему нужно время, чтобы освоиться.",
  talents: "Присмотрись к занятиям, к которым ребёнок возвращается сам: в них часто прячутся будущие увлечения.",
};
const STUB_CELL: ChildSquare = { title: "Качество", levels: ["", "", "", ""] };

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (i: RazborInput) => `${pad(i.d)}.${pad(i.m)}.${i.y}`;
const plural = (n: number, one: string, few: string, many: string) =>
  n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many;
/** «до года», «1 год», «5 лет». */
export const childAgeText = (age: number) => (age < 1 ? "меньше года" : `${age} ${plural(age, "год", "года", "лет")}`);

const paras = (text: string | undefined): Block[] =>
  (text ?? "")
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ kind: "p" as const, text: t }));

/** Предложения абзацев: первое предложение каждого абзаца, затем остальные по порядку. */
function sentencesOf(text: string | undefined): string[] {
  const ps = (text ?? "").split(/\n{2,}/).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
  const split = (p: string) => (p.match(/[^.!?…]+[.!?…]+(?=\s|$)/g) ?? [p]).map((s) => s.trim()).filter((s) => s.length >= 40);
  const all = ps.map(split);
  return [...all.map((s) => s[0]).filter(Boolean), ...all.flatMap((s) => s.slice(1))];
}

/** Пять советов родителю: три из «Как поддержать», два из «На что не давить»; недостающее добирается из обоих. */
function fiveTips(dz: ChildDestiny): string[] {
  const sup = sentencesOf(dz.support);
  const car = sentencesOf(dz.careful);
  const out: string[] = [];
  for (const t of [...sup.slice(0, 3), ...car.slice(0, 2), ...sup.slice(3), ...car.slice(2)]) if (!out.includes(t) && out.length < 5) out.push(t);
  return out;
}

export const CHILD_TOC: { id: string; title: string }[] = [
  { id: "chisla", title: "Числа ребёнка" },
  { id: "harakter", title: "Характер" },
  { id: "sily", title: "Сильные стороны" },
  { id: "podderzhka", title: "Как поддержать" },
  { id: "berezhno", title: "На что не давить" },
  { id: "talanty", title: "К чему присмотреться" },
  { id: "vozrast", title: "Возраст сейчас" },
  { id: "kvadrat", title: "Квадрат Пифагора" },
  { id: "sovety", title: "Пять советов родителю" },
];

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function buildChild(i: RazborInput): RazborDoc {
  const b = bank(i.v ?? CHILD_VERSION);
  const destiny = destinyNumber(i.d, i.m, i.y);
  const bd = birthdayNumber(i.d);
  const sq = pythagoras(i.d, i.m, i.y);
  const age = Math.max(0, ageAt(i));
  const group = ageGroup(age);
  const key = String(destiny.number);
  const dz = b.destiny?.[key] ?? STUB;
  const Who = i.name || "Ребёнок";
  const ageText = b.age?.[`${key}.${group}`] ?? b.age?.[`${toCore(destiny.number)}.${group}`] ?? "";
  const cell = (d: number) => b.square?.[String(d)] ?? STUB_CELL;
  const level = (c: number) => (c === 0 ? 0 : Math.min(3, c));
  const coreNote = toCore(destiny.number) !== destiny.number ? ` (мастер-число, базовая цифра ${toCore(destiny.number)})` : "";

  const sections: Section[] = [
    {
      id: "chisla",
      title: i.name ? `Числа: ${i.name}` : "Числа ребёнка",
      blocks: [
        {
          kind: "facts",
          items: [
            { label: "Число судьбы", value: String(destiny.number), hint: dz.title + coreNote },
            { label: "Число дня рождения", value: String(bd.number), hint: `${i.d}-е число` },
            { label: "Возраст", value: String(age), hint: `${childAgeText(age)} на ${pad(i.mo)}.${i.yr}` },
          ],
        },
        {
          kind: "details",
          summary: "Как посчитано",
          blocks: [
            { kind: "p", text: "Всё считается только по дате рождения — без времени и места рождения." },
            {
              kind: "list",
              items: [
                `**Число судьбы** — сумма всех цифр даты, пока не останется одна цифра (11, 22 и 33 не сворачиваются): ${destiny.steps.join(" → ")}.`,
                `**Число дня рождения** — день месяца, свёрнутый до одной цифры (11 и 22 сохраняются): ${bd.number}.`,
                `**Квадрат Пифагора** — цифры даты ${sq.digits.join(" ")} и рабочие числа ${sq.work.join(", ")}, разложенные по девяти ячейкам.`,
              ],
            },
          ],
        },
      ],
    },
    { id: "harakter", title: `Характер: ${dz.title}`, subtitle: `Число судьбы ${destiny.number}`, blocks: paras(dz.nature) },
    { id: "sily", title: "Сильные стороны", blocks: paras(dz.strengths) },
    { id: "podderzhka", title: "Как поддержать", subtitle: "Похвала, режим, игры и учёба", blocks: paras(dz.support) },
    { id: "berezhno", title: "На что не давить", blocks: paras(dz.careful) },
    { id: "talanty", title: "К чему присмотреться", subtitle: "Занятия и кружки", blocks: paras(dz.talents) },
    { id: "vozrast", title: `${Who} сейчас: ${childAgeText(age)}`, blocks: ageText ? paras(ageText) : [{ kind: "p", text: `Возраст на месяц расчёта — ${childAgeText(age)}.` }] },
    {
      id: "kvadrat",
      title: "Квадрат Пифагора",
      subtitle: `Рабочие числа: ${sq.work.join(", ")}`,
      blocks: [
        { kind: "grid", work: sq.work, cells: DIGITS.map((d) => ({ digit: d, count: sq.counts[d], title: cell(d).title })) },
        ...DIGITS.flatMap((d): Block[] => {
          const c = cell(d);
          const n = sq.counts[d];
          const text = c.levels[level(n)];
          if (!text) return [];
          return [{ kind: "p", text: `**${c.title} — ${n ? String(d).repeat(n) : "ячейка пустая"}.** ${text}` }];
        }),
      ],
    },
    { id: "sovety", title: "Пять советов родителю", blocks: [{ kind: "list", items: fiveTips(dz) }] },
  ];
  return { title: CHILD.title, who: i.name ? i.name : "", date: fmt(i), sections };
}

/** Бесплатная часть: числа ребёнка и начало раздела «Характер»; остальное — оглавлением. */
export function buildChildTeaser(i: RazborInput): RazborTeaser {
  const doc = buildChild(i);
  const get = (id: string) => doc.sections.find((s) => s.id === id)!;
  const h = get("harakter");
  const first = h.blocks.map((x) => (x.kind === "p" ? x.text : "")).join(" ");
  const shown = new Set(["chisla", "harakter"]);
  return {
    who: doc.who,
    date: doc.date,
    sections: [get("chisla"), { ...h, blocks: [{ kind: "p", text: firstSentences(first, 2) }] }],
    locked: CHILD_TOC.filter((t) => !shown.has(t.id)),
    months_hidden: 0,
  };
}
