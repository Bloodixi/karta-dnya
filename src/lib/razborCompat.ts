/**
 * Платная «Совместимость пары по датам рождения»: документ в формате разбора (Section/Block — его рисует RazborView)
 * из банка content/data/razbor/compat/*.json. Детерминированно: одни и те же даты и год расчёта дают один и тот же текст.
 * Пара — любая (влюблённые, супруги, друзья, родственники, коллеги): тексты на «вы», без предположения пола и брака.
 */
import { readJsonData } from "./content";
import { destinyNumber, personalYear, toCore } from "./numerology";
import { envPrice, type Block, type RazborDoc, type RazborTeaser, type Section } from "./razbor";

export const COMPAT = {
  title: "Совместимость пары по датам рождения",
  short: "Совместимость пары",
  price: envPrice(process.env.COMPAT_PRICE, 390),
};

/**
 * Версия банка совместимости — как RAZBOR_VERSION: записывается в ссылку и metadata платежа.
 * Перед правкой текстов, меняющей выдачу: скопировать compat/*.json в compat/v<N>/ и увеличить номер.
 */
export const COMPAT_VERSION = 1;

export type Person = { d: number; m: number; y: number; name?: string };
/** Две даты, год и месяц расчёта (личные годы — на год yr), версия текстов. */
export type CompatInput = { a: Person; b: Person; yr: number; mo: number; v?: number };

type Pair = { title: string; overall: string; love: string; home: string; conflict: string; strength: string; advice: string[] };

function bank(v = COMPAT_VERSION) {
  const dir = v >= COMPAT_VERSION ? "razbor/compat" : `razbor/compat/v${v}`;
  return {
    pair: readJsonData<Record<string, Pair> | null>(`${dir}/pair.json`, null),
    yearPair: readJsonData<Record<string, string> | null>(`${dir}/year-pair.json`, null),
  };
}

/** 45 ключей «a.b» при a ≤ b. */
export const PAIR_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((a) => [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((b) => b >= a).map((b) => `${a}.${b}`));

/**
 * Банк текстов на месте — все 45 пар в обоих файлах. Пока его нет, совместимость не продаётся:
 * бесплатная часть собирается из нейтральной заглушки, форма оплаты закрыта.
 */
export function compatReady(): boolean {
  const b = bank();
  return PAIR_KEYS.every((k) => b.pair?.[k]?.overall && b.yearPair?.[k]);
}

/** Нейтральный текст, пока банка нет (файлы пишутся отдельно): документ собирается, но продажа закрыта compatReady. */
const STUB_PAIR: Pair = {
  title: "Два разных ритма",
  overall:
    "У вашей пары есть свои сильные стороны и свои зоны работы. Числа судьбы показывают, в каком темпе каждый из вас привык действовать и что для каждого важно.\n\nКогда вы замечаете эти различия и проговариваете их, они перестают мешать и начинают дополнять друг друга.",
  love: "Близость складывается из внимания к мелочам: как каждый из вас показывает заботу и что воспринимает как заботу. Спросите друг друга об этом прямо.",
  home: "В общих делах помогает договорённость о ролях: кто за что отвечает и как вы решаете, если планы расходятся.",
  conflict: "Спорить проще, когда разговор идёт о конкретной ситуации, а не о характере. Делайте паузу, если разговор накалился, и возвращайтесь к нему в спокойный момент.",
  strength: "Ваша сила — в том, что вы видите вещи с разных сторон и можете подстраховать друг друга.",
  advice: [
    "Раз в неделю находите время для разговора без телефонов и спешки.",
    "Договоритесь, как каждый из вас просит о помощи, — так просьбы не будут звучать как упрёки.",
    "Отмечайте вслух, что у вас получается вместе.",
  ],
};
const STUB_YEAR = "Ваши личные годы задают разный темп. Сверяйте планы в начале каждого сезона и оставляйте друг другу место для своих дел.";

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (p: Person) => `${pad(p.d)}.${pad(p.m)}.${p.y}`;

const paras = (text: string | undefined): Block[] =>
  (text ?? "")
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ kind: "p" as const, text: t }));

/** Первые n предложений текста (без разметки внутри — тексты банка её не содержат). */
export function firstSentences(text: string, n: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return (flat.match(/[^.!?…]+[.!?…]+(?=\s|$)/g) ?? [flat]).slice(0, n).join("").trim();
}

/** Ключ пары: базовые цифры 1–9 (мастер-числа 11/22/33 → 2/4/6), «a.b» при a ≤ b. */
export function compatKey(x: number, y: number): string {
  const [a, b] = [toCore(x), toCore(y)].sort((p, q) => p - q);
  return `${a}.${b}`;
}

/** Порядок и названия разделов — для оглавления закрытой части. */
export const COMPAT_TOC: { id: string; title: string }[] = [
  { id: "chisla", title: "Ваши числа" },
  { id: "obraz", title: "Образ пары" },
  { id: "lyubov", title: "Любовь и близость" },
  { id: "byt", title: "Быт и общие дела" },
  { id: "spory", title: "Где вы спорите и как договариваться" },
  { id: "sila", title: "Сила пары" },
  { id: "god", title: "Ваш общий год" },
  { id: "sovety", title: "Три совета" },
];

/** Подписи двух людей: имя или «Первый»/«Второй» (имена в заказе обязательны, в бесплатной части — нет). */
export const compatNames = (i: CompatInput) => ({ A: i.a.name || "Первый", B: i.b.name || "Второй" });

function numbers(i: CompatInput) {
  return {
    da: destinyNumber(i.a.d, i.a.m, i.a.y),
    db: destinyNumber(i.b.d, i.b.m, i.b.y),
    ya: personalYear(i.a.d, i.a.m, i.yr),
    yb: personalYear(i.b.d, i.b.m, i.yr),
  };
}

export function buildCompat(i: CompatInput): RazborDoc {
  const b = bank(i.v ?? COMPAT_VERSION);
  const n = numbers(i);
  const { A, B } = compatNames(i);
  const key = compatKey(n.da.number, n.db.number);
  const yearKey = compatKey(n.ya.number, n.yb.number);
  const pair = b.pair?.[key] ?? STUB_PAIR;
  const year = b.yearPair?.[yearKey] ?? STUB_YEAR;
  const core = (x: number) => (toCore(x) !== x ? `${x} (базовая цифра ${toCore(x)})` : String(x));

  const sections: Section[] = [
    {
      id: "chisla",
      title: "Ваши числа",
      subtitle: `${A} и ${B}`,
      blocks: [
        {
          kind: "facts",
          items: [
            { label: `${A}: число судьбы`, value: String(n.da.number), hint: fmt(i.a) },
            { label: `${B}: число судьбы`, value: String(n.db.number), hint: fmt(i.b) },
            { label: `${A}: личный год ${i.yr}`, value: String(n.ya.number) },
            { label: `${B}: личный год ${i.yr}`, value: String(n.yb.number) },
          ],
        },
        {
          kind: "details",
          summary: "Как посчитано",
          blocks: [
            { kind: "p", text: "Всё считается только по датам рождения — без времени и места рождения." },
            {
              kind: "list",
              items: [
                `**Число судьбы — ${A}:** сумма всех цифр даты, пока не останется одна цифра (11, 22 и 33 не сворачиваются): ${n.da.steps.join(" → ")}.`,
                `**Число судьбы — ${B}:** ${n.db.steps.join(" → ")}.`,
                `**Личный год ${i.yr}** — день и месяц рождения плюс год расчёта, каждое свёрнуто до одной цифры: ${A} — ${n.ya.steps.join(" → ")}; ${B} — ${n.yb.steps.join(" → ")}.`,
                `**Образ пары** читается по базовым цифрам чисел судьбы: ${core(n.da.number)} и ${core(n.db.number)}. Мастер-числа 11, 22 и 33 читаются как 2, 4 и 6.`,
                `**Общий год** — по сочетанию личных годов: ${n.ya.number} и ${n.yb.number}.`,
              ],
            },
          ],
        },
      ],
    },
    { id: "obraz", title: `Образ пары: ${pair.title}`, subtitle: `Числа судьбы ${n.da.number} и ${n.db.number}`, blocks: paras(pair.overall) },
    { id: "lyubov", title: "Любовь и близость", blocks: paras(pair.love) },
    { id: "byt", title: "Быт и общие дела", blocks: paras(pair.home) },
    { id: "spory", title: "Где вы спорите и как договариваться", blocks: paras(pair.conflict) },
    { id: "sila", title: "Сила пары", blocks: paras(pair.strength) },
    { id: "god", title: `Ваш общий ${i.yr} год`, subtitle: `Личные годы: ${A} — ${n.ya.number}, ${B} — ${n.yb.number}`, blocks: paras(year) },
    { id: "sovety", title: "Три совета", blocks: [{ kind: "list", items: pair.advice.slice(0, 3) }] },
  ];
  return { title: COMPAT.title, who: `${A} и ${B}`, date: `${fmt(i.a)} и ${fmt(i.b)}`, sections };
}

/** Бесплатная часть: ваши числа, образ пары и первые два предложения его описания; остальное — оглавлением. */
export function buildCompatTeaser(i: CompatInput): RazborTeaser {
  const doc = buildCompat(i);
  const get = (id: string) => doc.sections.find((s) => s.id === id)!;
  const obraz = get("obraz");
  const first = obraz.blocks.map((x) => (x.kind === "p" ? x.text : "")).join(" ");
  const shown = new Set(["chisla", "obraz"]);
  return {
    who: doc.who,
    date: doc.date,
    sections: [get("chisla"), { ...obraz, blocks: [{ kind: "p", text: firstSentences(first, 2) }] }],
    locked: COMPAT_TOC.filter((t) => !shown.has(t.id)),
    months_hidden: 0,
  };
}
