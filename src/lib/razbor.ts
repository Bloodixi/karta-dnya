/** Платный «Нумерологический разбор по дате рождения»: сборка документа из банка текстов content/data/razbor/*.json.
 *  Детерминированно: одна и та же дата и год расчёта дают один и тот же текст. */
import { readJsonData } from "./content";
import { birthdayNumber, destinyNumber, digitsSum, personalMonth, personalYear, reduceNumber, reduceSimple, toCore } from "./numerology";
import { pythagoras } from "./pythagoras";

/** Цена из переменной окружения: целое число рублей больше нуля, иначе — значение по умолчанию. */
export function envPrice(v: string | undefined, def: number): number {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : def;
}

export const RAZBOR = {
  title: "Нумерологический разбор по дате рождения",
  short: "Разбор по дате рождения",
  price: envPrice(process.env.RAZBOR_PRICE, 490),
};

/**
 * Версия банка текстов. Записывается в заказ и ссылку: купленный разбор не меняется, когда банк переписан.
 * Перед правкой текстов, меняющей выдачу: скопировать текущие content/data/razbor/*.json в razbor/v<N>/ и увеличить номер.
 */
export const RAZBOR_VERSION = 5;

/** Что лежит в заказе и в ссылке на разбор. yr — год расчёта личного года, mo — месяц, с которого идёт помесячный прогноз, v — версия текстов (в старых ссылках и платежах её нет — это 1). */
export type RazborInput = { d: number; m: number; y: number; name?: string; yr: number; mo: number; v?: number };

type Destiny = { title: string; essence: string; strengths: string; shadows: string; calling: string };
type DestinyLife = { love: string; work: string; advice: string[]; easy: number[]; hard: number[]; pairNote: string };
type PyCell = { title: string; intro: string; levels: string[] };
type Year = { title: string; theme: string; first: string; second: string; advice: string };
/** Фразы «Сведения» (с версии 2): по числу судьбы, дню рождения, самой сильной и пустой ячейке квадрата. */
/** Пики жизни (с версии 3): число периода и смысл позиции периода. */
type Pinnacles = { pinnacle: Record<string, { title: string; text: string; short: string }>; stage: Record<string, string> };
type Svod = { destiny: Record<string, string>; birthday: Record<string, string>; strong: Record<string, string>; weak: Record<string, string>; noweak: string };
/** С версии 4: суть одной фразой («Главное о тебе», памятка) и советы по ячейке, году и периоду. */
type Gist = { destiny: Record<string, string>; year: Record<string, string>; cell: Record<string, string> };
type Advice = { cell: Record<string, string[]>; year: Record<string, string[]>; period: Record<string, string[]> };
/** Категории месяцев для памятки (month-cat.json, с версии 4). */
type MonthCat = "start" | "plan" | "bonds" | "show" | "work" | "change" | "rest";

export type Block =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "facts"; items: { label: string; value: string; hint?: string }[] }
  | { kind: "grid"; cells: { digit: number; count: number; title: string }[]; work: number[] }
  | { kind: "months"; items: { label: string; number: number; text: string }[] }
  /** Свёрнутый блок (с версии 4 — «Как посчитано»); на печати раскрыт. */
  | { kind: "details"; summary: string; blocks: Block[] };

export type Section = { id: string; title: string; subtitle?: string; blocks: Block[] };
export type RazborDoc = { title: string; who: string; date: string; sections: Section[] };
/** months_hidden — сколько месяцев прогноза не показано в бесплатной части (для заглушки на лендинге). */
export type RazborTeaser = { who: string; date: string; sections: Section[]; locked: { id: string; title: string }[]; months_hidden: number };

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
    /** С версии 3: пики жизни и возрастные абзацы («год.группа», «судьба.группа»). */
    pinnacles: readJsonData<Pinnacles | null>(`${dir}/pinnacle.json`, null),
    yearAge: readJsonData<Record<string, string>>(`${dir}/year-age.json`, {}),
    loveAge: readJsonData<Record<string, string>>(`${dir}/love-age.json`, {}),
    workAge: readJsonData<Record<string, string>>(`${dir}/work-age.json`, {}),
    /** С версии 4: поздний год (июль–декабрь), категории месяцев, суть, пары чисел, месяц × судьба, советы. Файла может не быть — тогда прежняя логика. */
    yearLate: readJsonData<Record<string, { rest: string; bridge: string }>>(`${dir}/year-late.json`, {}),
    monthCat: readJsonData<Record<string, MonthCat>>(`${dir}/month-cat.json`, {}),
    gist: readJsonData<Gist | null>(`${dir}/gist.json`, null),
    pair: readJsonData<Record<string, string>>(`${dir}/pair.json`, {}),
    monthDestiny: readJsonData<Record<string, string>>(`${dir}/month-destiny.json`, {}),
    /** С версии 5: второй вариант «Для тебя» (личный месяц встречается в прогнозе дважды) и фраза для месяцев «наметить, запускать позже». */
    monthDestiny2: readJsonData<Record<string, string>>(`${dir}/month-destiny2.json`, {}),
    monthDestinyPlan: readJsonData<Record<string, string>>(`${dir}/month-destiny-plan.json`, {}),
    advice: readJsonData<Advice | null>(`${dir}/advice.json`, null),
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
  return { destiny, birthday, py, pyNext, square: pythagoras(i.d, i.m, i.y), age: ageAt(i), pinnacles: pinnacles(i.d, i.m, i.y, destiny.number) };
}

/** Полных лет на месяц расчёта (день рождения внутри месяца считаем прошедшим). */
export function ageAt(i: RazborInput): number {
  return i.yr - i.y - (i.m > i.mo ? 1 : 0);
}

/** Возрастная группа для возрастных абзацев. */
export type AgeBand = "young" | "build" | "mature" | "senior";
export const ageBand = (age: number): AgeBand => (age < 25 ? "young" : age < 40 ? "build" : age < 60 ? "mature" : "senior");
const years = (n: number) => `${n} ${plural(n, "год", "года", "лет")}`;

/** Четыре пика жизни: первый до (36 − число судьбы) лет, второй и третий по 9 лет, четвёртый — дальше. 11 сохраняется. */
export function pinnacles(d: number, m: number, y: number, destiny: number) {
  const M = reduceSimple(m), D = reduceSimple(d), Y = reduceSimple(digitsSum(y));
  const p1 = reduceNumber(M + D), p2 = reduceNumber(D + Y), p3 = reduceNumber(reduceSimple(p1) + reduceSimple(p2)), p4 = reduceNumber(M + Y);
  const e1 = 36 - toCore(destiny);
  return {
    parts: { M, D, Y },
    list: [
      { n: 1, number: p1, from: 0, to: e1, calc: `месяц ${M} + день ${D}` },
      { n: 2, number: p2, from: e1, to: e1 + 9, calc: `день ${D} + год ${Y}` },
      { n: 3, number: p3, from: e1 + 9, to: e1 + 18, calc: `первый ${p1} + второй ${p2}` },
      { n: 4, number: p4, from: e1 + 18, to: null as number | null, calc: `месяц ${M} + год ${Y}` },
    ],
  };
}

/** Порядок и названия разделов полного разбора — для оглавления в тизере и на лендинге. */
export const RAZBOR_TOC: { id: string; title: string }[] = [
  { id: "chisla", title: "Твои числа" },
  { id: "svod", title: "Главное о тебе" },
  { id: "period", title: "Твой период жизни" },
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

/** С версии 4: группы памятки по month-cat.json («личный год.личный месяц»); без файла — по номеру личного месяца. */
const CAT_LABELS: [MonthCat, string][] = [
  ["start", "Начинать новое"],
  ["plan", "Наметить новое, запускать позже"],
  ["bonds", "Договариваться, отношения, дом"],
  ["show", "Общаться и показывать себя"],
  ["work", "Порядок и деловые вопросы"],
  ["change", "Перемены и поездки"],
  ["rest", "Отдых, обдумывание, завершение"],
];
const CAT_BY_NUMBER: MonthCat[] = ["start", "start", "bonds", "show", "work", "change", "bonds", "rest", "work", "rest"];

/** «одна единица», «две пятёрки», «шесть девяток»: количество цифр в ячейке словами (1–6, дальше — цифрой). */
const DIGIT_NAMES: [string, string, string][] = [
  ["единица", "единицы", "единиц"],
  ["двойка", "двойки", "двоек"],
  ["тройка", "тройки", "троек"],
  ["четвёрка", "четвёрки", "четвёрок"],
  ["пятёрка", "пятёрки", "пятёрок"],
  ["шестёрка", "шестёрки", "шестёрок"],
  ["семёрка", "семёрки", "семёрок"],
  ["восьмёрка", "восьмёрки", "восьмёрок"],
  ["девятка", "девятки", "девяток"],
];
const COUNT_WORDS = ["", "одна", "две", "три", "четыре", "пять", "шесть"];
function countDigits(digit: number, count: number): string {
  const [one, few, many] = DIGIT_NAMES[digit - 1];
  return `${COUNT_WORDS[count] ?? count} ${plural(count, one, few, many)}`;
}

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

const v3 = (i: RazborInput) => (i.v ?? RAZBOR_VERSION) >= 3;

/** «Как посчитано»: все числа разбора с расчётом. */
function calcBlocks(i: RazborInput, n: Nums, folded = false): Block[] {
  const bd = digitsSum(i.d);
  const birthday = i.d === n.birthday.number ? `${i.d} — уже одна цифра или мастер-число` : `${String(i.d).split("").join(" + ")} = ${bd}${bd !== n.birthday.number ? ` → ${n.birthday.number}` : ""}`;
  const pm = personalMonth(n.py.number, i.mo);
  const raw = n.py.number + i.mo;
  const [w1, w2, w3, w4] = n.square.work;
  const f = n.square.digits.find((x) => x !== 0)!;
  return [
    { kind: "p", text: `${folded ? "" : "**Как посчитано.** "}Всё считается только по дате рождения — без имени и времени.` },
    {
      kind: "list",
      items: [
        `**Число судьбы** — сумма всех цифр даты, пока не останется одна цифра (11, 22 и 33 не сворачиваются): ${n.destiny.steps.join(" → ")}.`,
        `**Число дня рождения** — день месяца: ${birthday}.`,
        `**Личный год ${i.yr}** — день и месяц рождения плюс год расчёта, каждое свёрнуто до одной цифры: ${n.py.steps.join(" → ")}. Следующий, ${i.yr + 1}, — ${n.pyNext.steps.join(" → ")}.`,
        `**Личный месяц** — личный год плюс номер календарного месяца: например, ${MONTHS[i.mo - 1]} ${i.yr} — ${n.py.number} + ${i.mo} = ${raw}${raw > 9 ? ` → ${pm}` : ""}.`,
        ...(n.age >= 0 && v3(i) ? [`**Период жизни** — четыре «пика» по дате рождения: первый длится до ${36 - toCore(n.destiny.number)} ${(36 - toCore(n.destiny.number)) % 10 === 1 ? "года" : "лет"} (36 минус число судьбы), второй и третий — по 9 лет, четвёртый — дальше. Числа: ${n.pinnacles.list.map((p) => `${p.calc} → ${p.number}`).join("; ")}.`] : []),
        `**Квадрат Пифагора** — цифры даты ${n.square.digits.join(" ")}. Первое рабочее число — их сумма, ${w1}; второе — сумма его цифр, ${w2}; третье — первое минус удвоенная первая цифра даты: ${w1} − ${2 * f} = ${w3}; четвёртое — сумма цифр третьего, ${w4}. В квадрат раскладываются все цифры даты и рабочих чисел.`,
      ],
    },
  ];
}

/** Текущий пик по возрасту (age ≥ 0). */
const currentPinnacle = (n: Nums) => n.pinnacles.list.find((p) => p.to === null || n.age < p.to)!;

/** «Твой период жизни»: в каком из четырёх пиков человек сейчас и что дальше. */
function periodSection(i: RazborInput, n: Nums, P: Pinnacles, v4 = false): Section {
  const list = n.pinnacles.list, curIdx = list.findIndex((p) => p.to === null || n.age < p.to), cur = list[curIdx], next = list[curIdx + 1];
  /** С версии 4: четвёртый период до 60 лет — без «до конца жизни» (stage["4early"]). */
  const stage = (v4 && cur.n === 4 && n.age < 60 && P.stage["4early"]) || P.stage[String(cur.n)];
  const t = P.pinnacle[String(cur.number)], nt = next ? P.pinnacle[String(next.number)] : null;
  /** «с 31 года», «до 44 лет»: родительный падеж после «с/до». */
  const gen = (x: number) => `${x} ${x % 10 === 1 && x % 100 !== 11 ? "года" : "лет"}`;
  const span = (p: (typeof list)[number]) => (p.to === null ? `с ${gen(p.from)}` : p.from === 0 ? `до ${gen(p.to)}` : `с ${p.from} до ${gen(p.to)}`);
  const who = i.name ? `${i.name}, тебе` : "Тебе";
  return {
    id: "period",
    title: `Твой период жизни: ${cur.number} — ${t?.title ?? ""}`,
    subtitle: `${cur.n}-й из четырёх периодов, ${span(cur)}`,
    blocks: [
      {
        kind: "facts",
        items: list.map((p) => ({ label: `${p.n}-й период`, value: String(p.number), hint: `${span(p)}${p === cur ? " · сейчас" : ""}` })),
      },
      { kind: "p", text: `**${who} ${years(n.age)}.** ${stage ?? ""}` },
      ...paras(t?.text),
      ...(next && nt ? [{ kind: "p" as const, text: `**Дальше: ${span(next)} — период числа ${next.number}, «${nt.title}».** ${nt.short}` }] : []),
    ],
  };
}

/** «Сведение»: характер по числу судьбы и дню рождения, опора и пробел квадрата, число судьбы в текущем личном году. */
function svodSection(i: RazborInput, n: Nums, svod: Svod, yearText: string | undefined, omitStrong = false): Section {
  const key = String(n.destiny.number);
  const { strong, weak } = squareFocus(n.square.counts);
  const intro = i.name ? `**${i.name}, ${fmt(i)}.**` : `**${fmt(i)}.**`;
  return {
    id: "svod",
    title: "Сведение: как числа работают вместе",
    subtitle: "Не отдельные описания, а один характер и один год",
    blocks: [
      { kind: "p", text: `${intro} ${svod.destiny[key] ?? ""} ${svod.birthday[String(i.d)] ?? ""}`.trim() },
      { kind: "p", text: `${omitStrong ? "" : svod.strong[String(strong)] ?? ""} ${weak.length ? svod.weak[String(weak[0])] ?? "" : svod.noweak}`.trim() },
      ...lead(`Твой ${i.yr} год.`, yearText),
    ],
  };
}

/** Базовая цифра 1–9: мастер-число → его база, двузначное → сумма цифр. */
const coreDigit = (x: number) => reduceSimple(toCore(x));

/** С версии 4: «Главное о тебе» — три строки сути, прежние абзацы сведения и «где числа спорят». */
function mainSection(i: RazborInput, n: Nums, b: ReturnType<typeof bank>): Section {
  // с версии 5 опора по квадрату звучит один раз — в строке «Опора», без повтора в абзаце сведения
  const base = svodSection(i, n, b.svod!, b.svodYear[`${n.destiny.number}.${n.py.number}`], (i.v ?? RAZBOR_VERSION) >= 5 && !!b.gist);
  const { strong } = squareFocus(n.square.counts);
  const g = b.gist;
  const join = (...xs: (string | undefined)[]) => xs.filter(Boolean).join(" ");
  const opora = join(g?.destiny[String(n.destiny.number)], g?.cell[String(strong)]);
  const year = g?.year[String(n.py.number)];
  const period = n.age >= 0 && b.pinnacles ? b.pinnacles.pinnacle[String(currentPinnacle(n).number)]?.short : undefined;
  const items = [opora && `**Опора.** ${opora}`, year && `**Год ${i.yr}.** ${year}`, period && `**Период жизни.** ${period}`].filter((x): x is string => !!x);
  const [a, c] = [coreDigit(n.destiny.number), coreDigit(n.birthday.number)].sort((x, y) => x - y);
  return {
    id: "svod",
    title: "Главное о тебе",
    blocks: [...(items.length ? [{ kind: "list" as const, items }] : []), ...base.blocks, ...lead("Где твои числа спорят.", b.pair[`${a}.${c}`])],
  };
}

export function buildRazbor(i: RazborInput): RazborDoc {
  const v = i.v ?? RAZBOR_VERSION;
  const b = bank(v);
  /** Сведение, расчёты, памятка и 81 текст месяцев — с версии 2; старые заказы собираются как раньше. */
  const v2 = v >= 2;
  /** С версии 4: «Главное о тебе», поздний год, категории месяцев, «Для тебя» в месяцах, советы из разных чисел, расчёт свёрнут. */
  const v4 = v >= 4;
  /** С версии 5: «Для тебя» без повторов и без «запускай» в плановые месяцы, без дублей опоры и совета года. */
  const v5 = v >= 5;
  const n = numbers(i);
  const band = ageBand(n.age);
  const key = String(n.destiny.number);
  const dz = b.destiny[key];
  const life = b.life[key];
  const bd = b.birthday[String(i.d)];
  const yr = b.year[String(n.py.number)];
  const yrNext = b.year[String(n.pyNext.number)];
  const coreNote = toCore(n.destiny.number) !== n.destiny.number ? ` (мастер-число, базовая цифра ${toCore(n.destiny.number)})` : "";

  const months: { label: string; number: number; text: string }[] = [];
  /** Личный год каждого месяца прогноза — для категорий памятки. */
  const monthYears: number[] = [];
  const seenPm: Record<number, number> = {};
  for (let k = 0; k < 12; k++) {
    const mIdx = (i.mo - 1 + k) % 12;
    const year = i.yr + Math.floor((i.mo - 1 + k) / 12);
    const pyN = year === i.yr ? n.py.number : n.pyNext.number;
    const pm = personalMonth(pyN, mIdx + 1);
    let text = (v2 && b.monthYear[`${pyN}.${pm}`]) || b.month[String(pm)] || "";
    const plan = v5 && b.monthCat[`${pyN}.${pm}`] === "plan" ? b.monthDestinyPlan[key] : undefined;
    const again = v5 && (seenPm[pm] = (seenPm[pm] ?? 0) + 1) > 1 ? b.monthDestiny2[`${key}.${pm}`] : undefined;
    const forYou = v4 ? plan || again || b.monthDestiny[`${key}.${pm}`] : undefined;
    if (forYou) text = `${text}\n\n**Для тебя.** ${forYou}`;
    months.push({ label: `${MONTHS[mIdx]} ${year}`, number: pm, text });
    monthYears.push(pyN);
  }
  const late = v4 && i.mo >= 7 ? b.yearLate[String(n.py.number)] : undefined;

  const pyLevels = (count: number) => (count === 0 ? 0 : Math.min(3, count));

  /** С версии 4: два совета числа судьбы + сильная ячейка + личный год + текущий период; чего нет — добирается из числа судьбы. */
  const fiveTips = (): string[] => {
    const own = life?.advice ?? [];
    const A = b.advice;
    const pick = [
      own[0],
      own[1],
      A?.cell[String(squareFocus(n.square.counts).strong)]?.[0],
      A?.year[String(n.py.number)]?.[0],
      n.age >= 0 ? A?.period[String(currentPinnacle(n).number)]?.[0] : undefined,
    ];
    const out: string[] = [];
    for (const t of [...pick, ...own.slice(2)]) if (t && !out.includes(t) && out.length < 5) out.push(t);
    return out;
  };

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
        ...(v4
          ? [{ kind: "details" as const, summary: "Как посчитано", blocks: calcBlocks(i, n, true) }]
          : v2
            ? calcBlocks(i, n)
            : [{ kind: "p" as const, text: `Расчёт числа судьбы: ${n.destiny.steps.join(" → ")}.` }]),
      ],
    },
    ...(v2 && b.svod ? [v4 ? mainSection(i, n, b) : svodSection(i, n, b.svod, b.svodYear[`${key}.${n.py.number}`])] : []),
    ...(v >= 3 && b.pinnacles && n.age >= 0 ? [periodSection(i, n, b.pinnacles, v4)] : []),
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
          const head = v4
            ? `${cell.title} — ${c ? `${countDigits(d, c)} (${String(d).repeat(c)})` : "ни одной цифры"}.`
            : `${cell.title} — ${c ? `${String(d).repeat(c)} (${c} ${plural(c, "цифра", "цифры", "цифр")})` : "ячейка пустая"}.`;
          return [{ kind: "p", text: `**${head}** ${cell.levels[pyLevels(c)] ?? ""}` }];
        }),
      ],
    },
    {
      id: "lyubov",
      title: "Любовь и отношения",
      blocks: [
        ...paras(life?.love),
        ...(v >= 3 ? lead(`Сейчас, в ${years(n.age)}.`, b.loveAge[`${key}.${band}`]) : []),
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
    { id: "rabota", title: "Работа и дело", blocks: [...paras(life?.work), ...(v >= 3 ? lead(`Сейчас, в ${years(n.age)}.`, b.workAge[`${key}.${band}`]) : [])] },
    {
      id: "god",
      title: `Личный год ${i.yr}: ${n.py.number} — ${yr?.title ?? ""}`,
      blocks: [...paras(yr?.theme), ...(v >= 3 ? lead("В твоём возрасте.", b.yearAge[`${n.py.number}.${band}`]) : []), ...(late
        ? [{ kind: "p" as const, text: `**Что успеть до конца года.** ${late.rest}` }, { kind: "p" as const, text: `**Как подготовиться к ${i.yr + 1}.** ${late.bridge}` }]
        : [{ kind: "p" as const, text: `**Первое полугодие.** ${yr?.first ?? ""}` }, { kind: "p" as const, text: `**Второе полугодие.** ${yr?.second ?? ""}` }]), ...(late && v5 ? [] : [{ kind: "p" as const, text: `**Совет года.** ${yr?.advice ?? ""}` }])],
    },
    { id: "mesyacy", title: "Прогноз на 12 месяцев", subtitle: "Личный месяц — тон, в котором проще действовать", blocks: [{ kind: "months", items: months }] },
    { id: "sledgod", title: `Следующий год ${i.yr + 1}: ${n.pyNext.number} — ${yrNext?.title ?? ""}`, blocks: [
        ...paras(yrNext?.theme),
        ...(v2 ? lead("Как это ложится на твоё число.", b.svodYear[`${key}.${n.pyNext.number}`]) : []),
        ...(v >= 3 && ageBand(n.age + 1) !== band ? lead("В новом возрасте.", b.yearAge[`${n.pyNext.number}.${ageBand(n.age + 1)}`]) : []),
        { kind: "p", text: `**Совет года.** ${yrNext?.advice ?? ""}` },
      ],
    },
    { id: "sovety", title: "Пять советов", blocks: [{ kind: "list", items: v4 ? fiveTips() : life?.advice ?? [] }] },
  ];

  if (v2) {
    const { strong, weak } = squareFocus(n.square.counts);
    const groups = (
      v4
        ? CAT_LABELS.map(([cat, label]) => ({
            label,
            months: months.filter((m, k) => (b.monthCat[`${monthYears[k]}.${m.number}`] ?? CAT_BY_NUMBER[m.number]) === cat).map((m) => m.label),
          }))
        : MONTH_GROUPS.map((g) => ({ label: g.label, months: months.filter((m) => g.numbers.includes(m.number)).map((m) => m.label) }))
    ).filter((g) => g.months.length);
    const yearGist = v4 ? b.gist?.year[String(n.py.number)] : undefined;
    sections.push({
      id: "pamyatka",
      title: "Памятка на год",
      subtitle: [i.name, fmt(i)].filter(Boolean).join(" · "),
      blocks: [
        {
          kind: "list",
          items: [
            `**Число судьбы ${n.destiny.number}** — ${dz?.title ?? ""}. Опора по квадрату — ${(b.py[String(strong)]?.title ?? "").toLowerCase()}${weak.length ? `; развивать — ${weak.map((d) => (b.py[String(d)]?.title ?? "").toLowerCase()).join(", ")}` : ""}.`,
            v5 ? `**${i.yr}: ${yr?.title ?? ""}.**` : `**${i.yr}: ${yr?.title ?? ""}.** ${yearGist ?? firstSentence(yr?.advice ?? "")}`,
            ...(v >= 3 && b.pinnacles ? (() => { const c = currentPinnacle(n); return [`**Период жизни — ${c.number}, «${b.pinnacles.pinnacle[String(c.number)]?.title ?? ""}»**${c.to === null ? "." : `, до ${c.to} ${c.to % 10 === 1 && c.to % 100 !== 11 ? "года" : "лет"}.`}`]; })() : []),
            ...groups.map((g) => `**${g.label}:** ${g.months.join(", ")}.`),
            `**Главный совет.** ${life?.advice?.[0] ?? ""}`,
          ],
        },
      ],
    });
  }

  return { title: RAZBOR.title, who: i.name ? i.name : "", date: fmt(i), sections };
}

/** Сколько месяцев прогноза открыто в бесплатной части. */
const TEASER_MONTHS = 3;

/** Бесплатная часть: числа (расчёт свёрнут), начало «сути», тема личного года одной фразой, три ближайших месяца и оглавление закрытых разделов. */
export function buildTeaser(i: RazborInput): RazborTeaser {
  const doc = buildRazbor(i);
  const get = (id: string) => doc.sections.find((s) => s.id === id)!;
  const sut = get("sut");
  const god = get("god");
  const mes = get("mesyacy");
  const godFirst = god.blocks.find((x) => x.kind === "p") as { kind: "p"; text: string } | undefined;
  const all = mes.blocks.flatMap((x) => (x.kind === "months" ? x.items : []));
  const open = all.slice(0, TEASER_MONTHS);
  const shown = new Set(["chisla", "sut", "god"]);
  return {
    who: doc.who,
    date: doc.date,
    sections: [
      get("chisla"),
      { ...sut, blocks: sut.blocks.slice(0, 2) },
      { ...god, blocks: godFirst ? [{ kind: "p", text: firstSentence(godFirst.text) }] : [] },
      { ...mes, blocks: [{ kind: "months", items: open }] },
    ],
    locked: RAZBOR_TOC.filter((t) => !shown.has(t.id)),
    months_hidden: all.length - open.length,
  };
}

/** Год и месяц расчёта по Москве на момент покупки. */
export function nowMsk(): { yr: number; mo: number } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "numeric" }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { yr: get("year"), mo: get("month") };
}
