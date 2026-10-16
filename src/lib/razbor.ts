/** Платный «Нумерологический разбор по дате рождения»: сборка документа из банка текстов content/data/razbor/*.json.
 *  Детерминированно: одна и та же дата и год расчёта дают один и тот же текст. */
import { readJsonData } from "./content";
import { birthdayNumber, destinyNumber, digitsSum, personalMonth, personalYear, toCore } from "./numerology";
import { pythagoras } from "./pythagoras";

export const RAZBOR = {
  title: "Нумерологический разбор по дате рождения",
  short: "Разбор по дате рождения",
  price: Number(process.env.RAZBOR_PRICE || 290),
};

/**
 * Версия банка текстов. Записывается в заказ и ссылку: купленный разбор не меняется, когда банк переписан.
 * Перед правкой текстов, меняющей выдачу: скопировать текущие content/data/razbor/*.json в razbor/v<N>/ и увеличить номер.
 */
export const RAZBOR_VERSION = 2;

/** Что лежит в заказе и в ссылке на разбор. yr — год расчёта личного года, mo — месяц, с которого идёт помесячный прогноз, v — версия текстов (в старых ссылках и платежах её нет — это 1). */
export type RazborInput = { d: number; m: number; y: number; name?: string; yr: number; mo: number; v?: number };

type Destiny = { title: string; essence: string; strengths: string; shadows: string; calling: string };
type DestinyLife = { love: string; work: string; advice: string[]; easy: number[]; hard: number[]; pairNote: string };
type PyCell = { title: string; intro: string; levels: string[] };
type Year = { title: string; theme: string; first: string; second: string; advice: string };
/** Фразы «Сведения» (с версии 2): по числу судьбы, дню рождения, самой сильной и пустой ячейке квадрата. */
type Svod = { destiny: Record<string, string>; birthday: Record<string, string>; strong: Record<string, string>; weak: Record<string, string>; noweak: string };

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

/** Банк текстов версии v: текущая — в content/data/razbor/, прежние — в razbor/v<N>/. */
function bank(v = RAZBOR_VERSION) {
  const dir = v >= RAZBOR_VERSION ? "razbor" : `razbor/v${v}`;
  return {
    destiny: readJsonData<Record<string, Destiny>>(`${dir}/destiny.json`, {}),
    life: readJsonData<Record<string, DestinyLife>>(`${dir}/destiny-life.json`, {}),
    birthday: readJsonData<Record<string, string>>(`${dir}/birthday.json`, {}),
    py: readJsonData<Record<string, PyCell>>(`${dir}/pythagoras.json`, {}),
    year: readJsonData<Record<string, Year>>(`${dir}/year.json`, {}),
    month: readJsonData<Record<string, string>>(`${dir}/month.json`, {}),
    /** С версии 2: месяц внутри года («личный год.личный месяц»), число судьбы в году («судьба.год»), фразы сведения. */
    monthYear: readJsonData<Record<string, string>>(`${dir}/month-year.json`, {}),
    svodYear: readJsonData<Record<string, string>>(`${dir}/svod-year.json`, {}),
    svod: readJsonData<Svod | null>(`${dir}/svod.json`, null),
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
  { id: "svod", title: "Сведение: как числа работают вместе" },
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
  { id: "pamyatka", title: "Памятка на год" },
];

/** Группы личных месяцев для памятки: в какие месяцы что делать проще. */
const MONTH_GROUPS: { label: string; numbers: number[] }[] = [
  { label: "Начинать новое", numbers: [1] },
  { label: "Договариваться, отношения, дом", numbers: [2, 6] },
  { label: "Общаться и показывать себя", numbers: [3] },
  { label: "Работа, порядок, деловые вопросы", numbers: [4, 8] },
  { label: "Перемены и поездки", numbers: [5] },
  { label: "Отдых, обдумывание, завершение", numbers: [7, 9] },
];

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const firstSentence = (s: string) => (s.match(/^[^.!?]+[.!?]/)?.[0] ?? s).trim();

/** Абзацы текста, первый — с жирным заголовком в начале. */
const lead = (label: string, text: string | undefined): Block[] => {
  const ps = paras(text);
  if (ps[0]?.kind === "p") ps[0] = { kind: "p", text: `**${label}** ${ps[0].text}` };
  return ps;
};

type Nums = ReturnType<typeof numbers>;

/** Самая заполненная ячейка квадрата (при равенстве — меньшая цифра) и пустые ячейки (не больше двух). */
function squareFocus(counts: Record<number, number>) {
  const max = Math.max(...DIGITS.map((d) => counts[d]));
  return { strong: DIGITS.find((d) => counts[d] === max)!, weak: DIGITS.filter((d) => !counts[d]).slice(0, 2) };
}

/** «Как посчитано»: все числа разбора с расчётом. */
function calcBlocks(i: RazborInput, n: Nums): Block[] {
  const bd = digitsSum(i.d);
  const birthday = i.d === n.birthday.number ? `${i.d} — уже одна цифра или мастер-число` : `${String(i.d).split("").join(" + ")} = ${bd}${bd !== n.birthday.number ? ` → ${n.birthday.number}` : ""}`;
  const pm = personalMonth(n.py.number, i.mo);
  const raw = n.py.number + i.mo;
  const [w1, w2, w3, w4] = n.square.work;
  const f = n.square.digits.find((x) => x !== 0)!;
  return [
    { kind: "p", text: "**Как посчитано.** Всё считается только по дате рождения — без имени и времени." },
    {
      kind: "list",
      items: [
        `**Число судьбы** — сумма всех цифр даты, пока не останется одна цифра (11, 22 и 33 не сворачиваются): ${n.destiny.steps.join(" → ")}.`,
        `**Число дня рождения** — день месяца: ${birthday}.`,
        `**Личный год ${i.yr}** — день и месяц рождения плюс год расчёта, каждое свёрнуто до одной цифры: ${n.py.steps.join(" → ")}. Следующий, ${i.yr + 1}, — ${n.pyNext.steps.join(" → ")}.`,
        `**Личный месяц** — личный год плюс номер календарного месяца: например, ${MONTHS[i.mo - 1]} ${i.yr} — ${n.py.number} + ${i.mo} = ${raw}${raw > 9 ? ` → ${pm}` : ""}.`,
        `**Квадрат Пифагора** — цифры даты ${n.square.digits.join(" ")}. Первое рабочее число — их сумма, ${w1}; второе — сумма его цифр, ${w2}; третье — первое минус удвоенная первая цифра даты: ${w1} − ${2 * f} = ${w3}; четвёртое — сумма цифр третьего, ${w4}. В квадрат раскладываются все цифры даты и рабочих чисел.`,
      ],
    },
  ];
}

/** «Сведение»: характер по числу судьбы и дню рождения, опора и пробел квадрата, число судьбы в текущем личном году. */
function svodSection(i: RazborInput, n: Nums, svod: Svod, yearText: string | undefined): Section {
  const key = String(n.destiny.number);
  const { strong, weak } = squareFocus(n.square.counts);
  const intro = i.name ? `**${i.name}, ${fmt(i)}.**` : `**${fmt(i)}.**`;
  return {
    id: "svod",
    title: "Сведение: как числа работают вместе",
    subtitle: "Не отдельные описания, а один характер и один год",
    blocks: [
      { kind: "p", text: `${intro} ${svod.destiny[key] ?? ""} ${svod.birthday[String(i.d)] ?? ""}`.trim() },
      { kind: "p", text: `${svod.strong[String(strong)] ?? ""} ${weak.length ? svod.weak[String(weak[0])] ?? "" : svod.noweak}`.trim() },
      ...lead(`Твой ${i.yr} год.`, yearText),
    ],
  };
}

export function buildRazbor(i: RazborInput): RazborDoc {
  const v = i.v ?? RAZBOR_VERSION;
  const b = bank(v);
  /** Сведение, расчёты, памятка и 81 текст месяцев — с версии 2; старые заказы собираются как раньше. */
  const v2 = v >= 2;
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
    const text = (v2 && b.monthYear[`${pyN}.${pm}`]) || b.month[String(pm)] || "";
    months.push({ label: `${MONTHS[mIdx]} ${year}`, number: pm, text });
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
        ...(v2 ? calcBlocks(i, n) : [{ kind: "p" as const, text: `Расчёт числа судьбы: ${n.destiny.steps.join(" → ")}.` }]),
      ],
    },
    ...(v2 && b.svod ? [svodSection(i, n, b.svod, b.svodYear[`${key}.${n.py.number}`])] : []),
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
    { id: "sledgod", title: `Следующий год ${i.yr + 1}: ${n.pyNext.number} — ${yrNext?.title ?? ""}`, blocks: [
        ...paras(yrNext?.theme),
        ...(v2 ? lead("Как это ложится на твоё число.", b.svodYear[`${key}.${n.pyNext.number}`]) : []),
        { kind: "p", text: `**Совет года.** ${yrNext?.advice ?? ""}` },
      ],
    },
    { id: "sovety", title: "Пять советов", blocks: [{ kind: "list", items: life?.advice ?? [] }] },
  ];

  if (v2) {
    const { strong, weak } = squareFocus(n.square.counts);
    const groups = MONTH_GROUPS.map((g) => ({ label: g.label, months: months.filter((m) => g.numbers.includes(m.number)).map((m) => m.label) })).filter((g) => g.months.length);
    sections.push({
      id: "pamyatka",
      title: "Памятка на год",
      subtitle: [i.name, fmt(i)].filter(Boolean).join(" · "),
      blocks: [
        {
          kind: "list",
          items: [
            `**Число судьбы ${n.destiny.number}** — ${dz?.title ?? ""}. Опора по квадрату — ${(b.py[String(strong)]?.title ?? "").toLowerCase()}${weak.length ? `; развивать — ${weak.map((d) => (b.py[String(d)]?.title ?? "").toLowerCase()).join(", ")}` : ""}.`,
            `**${i.yr}: ${yr?.title ?? ""}.** ${firstSentence(yr?.advice ?? "")}`,
            ...groups.map((g) => `**${g.label}:** ${g.months.join(", ")}.`),
            `**Главный совет.** ${life?.advice?.[0] ?? ""}`,
          ],
        },
      ],
    });
  }

  return { title: RAZBOR.title, who: i.name ? i.name : "", date: fmt(i), sections };
}

/** Бесплатная часть: числа, начало «сути», тема личного года одной фразой и оглавление закрытых разделов. */
export function buildTeaser(i: RazborInput): RazborTeaser {
  const doc = buildRazbor(i);
  const get = (id: string) => doc.sections.find((s) => s.id === id)!;
  const sut = get("sut");
  const god = get("god");
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
