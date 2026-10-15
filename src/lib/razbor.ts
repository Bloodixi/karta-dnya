/** Платный «Нумерологический разбор по дате рождения»: сборка документа из банка текстов content/data/razbor/*.json.
 *  Детерминированно: одна и та же дата и год расчёта дают один и тот же текст. */
import { readJsonData } from "./content";
import { birthdayNumber, destinyNumber, personalMonth, personalYear, toCore } from "./numerology";
import { pythagoras } from "./pythagoras";

export const RAZBOR = {
  title: "Нумерологический разбор по дате рождения",
  short: "Разбор по дате рождения",
  price: Number(process.env.RAZBOR_PRICE || 290),
};

/** Что лежит в заказе и в ссылке на разбор. yr — год расчёта личного года, mo — месяц, с которого идёт помесячный прогноз. */
export type RazborInput = { d: number; m: number; y: number; name?: string; yr: number; mo: number };

type Destiny = { title: string; essence: string; strengths: string; shadows: string; calling: string };
type DestinyLife = { love: string; work: string; advice: string[]; easy: number[]; hard: number[]; pairNote: string };
type PyCell = { title: string; intro: string; levels: string[] };
type Year = { title: string; theme: string; first: string; second: string; advice: string };

export type Block =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "facts"; items: { label: string; value: string; hint?: string }[] }
  | { kind: "grid"; cells: { digit: number; count: number; title: string }[]; work: number[] }
  | { kind: "months"; items: { label: string; number: number; text: string }[] };

export type Section = { id: string; title: string; subtitle?: string; blocks: Block[] };
export type RazborDoc = { title: string; who: string; date: string; sections: Section[] };
export type RazborTeaser = { who: string; date: string; sections: Section[]; locked: { id: string; title: string }[] };

const MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

const paras = (text: string | undefined): Block[] =>
  (text ?? "")
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ kind: "p" as const, text: t }));

function bank() {
  return {
    destiny: readJsonData<Record<string, Destiny>>("razbor/destiny.json", {}),
    life: readJsonData<Record<string, DestinyLife>>("razbor/destiny-life.json", {}),
    birthday: readJsonData<Record<string, string>>("razbor/birthday.json", {}),
    py: readJsonData<Record<string, PyCell>>("razbor/pythagoras.json", {}),
    year: readJsonData<Record<string, Year>>("razbor/year.json", {}),
    month: readJsonData<Record<string, string>>("razbor/month.json", {}),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (i: RazborInput) => `${pad(i.d)}.${pad(i.m)}.${i.y}`;
const plural = (n: number, one: string, few: string, many: string) =>
  n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many;

function numbers(i: RazborInput) {
  const destiny = destinyNumber(i.d, i.m, i.y);
  const birthday = birthdayNumber(i.d);
  const py = personalYear(i.d, i.m, i.yr);
  const pyNext = personalYear(i.d, i.m, i.yr + 1);
  return { destiny, birthday, py, pyNext, square: pythagoras(i.d, i.m, i.y) };
}

/** Порядок и названия разделов полного разбора — для оглавления в тизере и на лендинге. */
export const RAZBOR_TOC: { id: string; title: string }[] = [
  { id: "chisla", title: "Твои числа" },
  { id: "sut", title: "Число судьбы: суть" },
  { id: "sily", title: "Сильные стороны" },
  { id: "teni", title: "Тени и ловушки" },
  { id: "prizvanie", title: "Призвание" },
  { id: "talant", title: "Талант дня рождения" },
  { id: "kvadrat", title: "Квадрат Пифагора: 9 качеств" },
  { id: "lyubov", title: "Любовь и отношения" },
  { id: "rabota", title: "Работа и дело" },
  { id: "god", title: "Личный год" },
  { id: "mesyacy", title: "Прогноз на 12 месяцев" },
  { id: "sledgod", title: "Следующий год" },
  { id: "sovety", title: "Пять советов" },
];

export function buildRazbor(i: RazborInput): RazborDoc {
  const b = bank();
  const n = numbers(i);
  const key = String(n.destiny.number);
  const dz = b.destiny[key];
  const life = b.life[key];
  const bd = b.birthday[String(i.d)];
  const yr = b.year[String(n.py.number)];
  const yrNext = b.year[String(n.pyNext.number)];
  const coreNote = toCore(n.destiny.number) !== n.destiny.number ? ` (мастер-число, базовая цифра ${toCore(n.destiny.number)})` : "";

  const months: { label: string; number: number; text: string }[] = [];
  for (let k = 0; k < 12; k++) {
    const mIdx = (i.mo - 1 + k) % 12;
    const year = i.yr + Math.floor((i.mo - 1 + k) / 12);
    const pyN = year === i.yr ? n.py.number : n.pyNext.number;
    const pm = personalMonth(pyN, mIdx + 1);
    months.push({ label: `${MONTHS[mIdx]} ${year}`, number: pm, text: b.month[String(pm)] ?? "" });
  }

  const pyLevels = (count: number) => (count === 0 ? 0 : Math.min(3, count));

  const sections: Section[] = [
    {
      id: "chisla",
      title: "Твои числа",
      blocks: [
        {
          kind: "facts",
          items: [
            { label: "Число судьбы", value: String(n.destiny.number), hint: (dz?.title ?? "") + coreNote },
            { label: "Число дня рождения", value: String(n.birthday.number), hint: `${i.d}-е число` },
            { label: `Личный год ${i.yr}`, value: String(n.py.number), hint: yr?.title },
            { label: `Личный год ${i.yr + 1}`, value: String(n.pyNext.number), hint: yrNext?.title },
          ],
        },
        { kind: "p", text: `Расчёт числа судьбы: ${n.destiny.steps.join(" → ")}.` },
      ],
    },
    { id: "sut", title: `Число судьбы ${n.destiny.number}: ${dz?.title ?? ""}`, blocks: paras(dz?.essence) },
    { id: "sily", title: "Сильные стороны", blocks: paras(dz?.strengths) },
    { id: "teni", title: "Тени и ловушки", subtitle: "Что мешает, когда сил мало", blocks: paras(dz?.shadows) },
    { id: "prizvanie", title: "Призвание", blocks: paras(dz?.calling) },
    { id: "talant", title: `Талант дня рождения: ${i.d}-е число`, blocks: paras(bd) },
    {
      id: "kvadrat",
      title: "Квадрат Пифагора: 9 качеств",
      subtitle: `Рабочие числа: ${n.square.work.join(", ")}`,
      blocks: [
        {
          kind: "grid",
          work: n.square.work,
          cells: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => ({ digit: d, count: n.square.counts[d], title: b.py[String(d)]?.title ?? "" })),
        },
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((d): Block[] => {
          const cell = b.py[String(d)];
          const c = n.square.counts[d];
          if (!cell) return [];
          const head = `${cell.title} — ${c ? `${String(d).repeat(c)} (${c} ${plural(c, "цифра", "цифры", "цифр")})` : "ячейка пустая"}.`;
          return [{ kind: "p", text: `**${head}** ${cell.levels[pyLevels(c)] ?? ""}` }];
        }),
      ],
    },
    {
      id: "lyubov",
      title: "Любовь и отношения",
      blocks: [
        ...paras(life?.love),
        ...paras(life?.pairNote),
        {
          kind: "facts",
          items: [
            { label: "Легко с числами", value: (life?.easy ?? []).join(", ") || "—" },
            { label: "Требует терпения", value: (life?.hard ?? []).join(", ") || "—" },
          ],
        },
      ],
    },
    { id: "rabota", title: "Работа и дело", blocks: paras(life?.work) },
    {
      id: "god",
      title: `Личный год ${i.yr}: ${n.py.number} — ${yr?.title ?? ""}`,
      blocks: [...paras(yr?.theme), { kind: "p", text: `**Первое полугодие.** ${yr?.first ?? ""}` }, { kind: "p", text: `**Второе полугодие.** ${yr?.second ?? ""}` }, { kind: "p", text: `**Совет года.** ${yr?.advice ?? ""}` }],
    },
    { id: "mesyacy", title: "Прогноз на 12 месяцев", subtitle: "Личный месяц — тон, в котором проще действовать", blocks: [{ kind: "months", items: months }] },
    { id: "sledgod", title: `Следующий год ${i.yr + 1}: ${n.pyNext.number} — ${yrNext?.title ?? ""}`, blocks: [...paras(yrNext?.theme), { kind: "p", text: `**Совет года.** ${yrNext?.advice ?? ""}` }] },
    { id: "sovety", title: "Пять советов", blocks: [{ kind: "list", items: life?.advice ?? [] }] },
  ];

  return { title: RAZBOR.title, who: i.name ? i.name : "", date: fmt(i), sections };
}

/** Бесплатная часть: числа, начало «сути», тема личного года одной фразой и оглавление закрытых разделов. */
export function buildTeaser(i: RazborInput): RazborTeaser {
  const doc = buildRazbor(i);
  const get = (id: string) => doc.sections.find((s) => s.id === id)!;
  const sut = get("sut");
  const god = get("god");
  const firstSentence = (s: string) => (s.match(/^[^.!?]+[.!?]/)?.[0] ?? s).trim();
  const godFirst = god.blocks.find((x) => x.kind === "p") as { kind: "p"; text: string } | undefined;
  const shown = new Set(["chisla", "sut", "god"]);
  return {
    who: doc.who,
    date: doc.date,
    sections: [
      get("chisla"),
      { ...sut, blocks: sut.blocks.slice(0, 2) },
      { ...god, blocks: godFirst ? [{ kind: "p", text: firstSentence(godFirst.text) }] : [] },
    ],
    locked: RAZBOR_TOC.filter((t) => !shown.has(t.id)),
  };
}

/** Год и месяц расчёта по Москве на момент покупки. */
export function nowMsk(): { yr: number; mo: number } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "numeric" }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { yr: get("year"), mo: get("month") };
}
