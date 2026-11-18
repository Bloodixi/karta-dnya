import { getStones, getZodiac, readJsonData, type Stone, type Zodiac } from "@/lib/content";
import { digitsSum, isValidDate } from "@/lib/numerology";

/** Тексты для страниц «камни знака»: почему подходят, как носить, с чего начать, для женщины/мужчины и порядок главных камней. */
export type StoneSign = { main: string[]; why: string; wear: string; tip: string; forWomen?: string; forMen?: string };
export const getStoneSigns = () => readJsonData<Record<string, StoneSign>>("stone-signs.json", {});

export const ELEMENTS = ["Огонь", "Земля", "Воздух", "Вода"] as const;

export const ELEMENT_NOTES: Record<string, string> = {
  Огонь: "Знакам Огня традиционно подбирают тёплые и яркие камни — красные, золотистые, прозрачные: они вторят энергии знака. Для равновесия к ним добавляют один заземляющий минерал.",
  Земля: "Знакам Земли подходят зелёные и коричневые непрозрачные камни: нефрит, малахит, яшма, агат. Они подчёркивают практичность и дают ощущение опоры, которое эти знаки ценят.",
  Воздух: "Воздушным знакам советуют лёгкие, светлые и голубые камни: они поддерживают общение и ясность мысли и не утяжеляют. Хороши прозрачные кристаллы и камни «для слова».",
  Вода: "Водным знакам подбирают мягкие молочные, голубые и переливающиеся камни — лунный камень, жемчуг, аквамарин, опал. Они созвучны чуткости и интуиции этих знаков.",
};

/** Камни знака: сначала главные (из stone-signs.json), затем остальные в порядке каталога. */
export function stonesForSign(slug: string): Stone[] {
  const main = getStoneSigns()[slug]?.main ?? [];
  const rank = (s: Stone) => { const i = main.indexOf(s.slug); return i < 0 ? 99 : i; };
  return getStones().filter((s) => s.zodiac.includes(slug)).sort((a, b) => rank(a) - rank(b));
}

export const stonesForNumber = (n: number): Stone[] => getStones().filter((s) => s.numbers.includes(n));

/** Мастер-числа 11, 22, 33 для подбора камня сводятся к 2, 4, 6. */
export const baseNumber = (n: number): number => (n > 9 ? digitsSum(n) : n);

export const NUMBER_NOTES: Record<number, string> = {
  1: "начало, воля, самостоятельность — камни ясности и энергии",
  2: "чуткость, партнёрство, интуиция — мягкие «лунные» камни",
  3: "общение, оптимизм, творчество — камни лёгкости и вдохновения",
  4: "порядок, опора, терпение — камни устойчивости",
  5: "движение, перемены, любопытство — камни гибкости и внимания",
  6: "забота, гармония, дом — сердечные камни",
  7: "поиск, анализ, уединение — камни тишины и интуиции",
  8: "воля, результат, ответственность — камни силы и защиты",
  9: "завершение, служение, мудрость — камни тепла и принятия",
};

/** Знак зодиака по дню и месяцу (границы как в zodiac.json). */
const BOUNDS: [string, number][] = [["kozerog", 19], ["vodoley", 18], ["ryby", 20], ["oven", 19], ["telets", 20], ["bliznetsy", 20], ["rak", 22], ["lev", 22], ["deva", 22], ["vesy", 22], ["skorpion", 21], ["strelets", 21]];

export function signByDate(month: number, day: number): Zodiac | null {
  const [ending, last] = BOUNDS[month - 1];
  const slug = day <= last ? ending : BOUNDS[month % 12][0];
  return getZodiac().find((z) => z.slug === slug) ?? null;
}

/** Параметр ?d=ГГГГ-ММ-ДД → дата или null (невалидная/отсутствует). */
export function parseDateParam(d: string | string[] | undefined): { year: number; month: number; day: number; key: string } | null {
  const s = Array.isArray(d) ? d[0] : d;
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [year, month, day] = s.split("-").map(Number);
  if (!isValidDate(day, month, year)) return null;
  return { year, month, day, key: s };
}

const STONE_TASK_RULES: { task: string; note: string; kws: string[] }[] = [
  { task: "Любовь и отношения", note: "тепло в общении, мягкость и внимание к близким", kws: ["любов", "нежност", "верност", "тепло", "отношен", "женствен", "принят", "сострадан", "уют", "мягкост", "страст", "открыт", "дружелюб"] },
  { task: "Деньги и карьера", note: "деловая собранность, решимость и доведение задач до результата", kws: ["делов", "успех", "удач", "решител", "целеустремл", "дисциплин", "порядок", "упорств", "мотивац", "энерг", "трудолюб", "практичност"] },
  { task: "Защита и опора", note: "личные границы, заземление и устойчивость в нагрузках", kws: ["защит", "заземлен", "опор", "стойкост", "выдержк", "силы", "сила", "оберег", "устойчивост", "границ", "собранност", "смелост", "уверенност"] },
  { task: "Спокойствие и ясность", note: "ровный эмоциональный фон, сон и ясная голова", kws: ["спокойств", "покой", "равновес", "интуиц", "ясност", "гармон", "тишин", "умиротвор", "баланс", "чистот"] },
];

/** Подборка камней знака под жизненные задачи (по 1–2 минерала в каждой строке). */
export function stoneTasksForSign(stones: Stone[]): { task: string; note: string; picked: Stone[] }[] {
  return STONE_TASK_RULES.map((rule) => {
    const matched = stones.filter((s) => s.properties.some((p) => rule.kws.some((k) => p.toLowerCase().includes(k))));
    const picked = (matched.length > 0 ? matched : stones).slice(0, 2);
    return { task: rule.task, note: rule.note, picked };
  });
}
