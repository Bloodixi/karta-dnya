import { readJsonData } from "./content";

export type ClockFaq = { q: string; a: string };
export type ClockNumber = {
  slug: string; time: string; kind: "double" | "mirror"; title: string; keywords: string[]; short: string;
  meaning: string; love: string; money: string; advice: string; sum: number; faq: ClockFaq[];
};

export const getClockNumbers = () => readJsonData<ClockNumber[]>("clock-numbers.json", []);
export const findClock = (slug: string): ClockNumber | null => getClockNumbers().find((c) => c.slug === slug) || null;

/** Значения цифр в «ангельской нумерологии»: из них складывается смысл любой комбинации на часах. */
export const DIGITS: Record<number, { title: string; text: string }> = {
  0: { title: "Потенциал", text: "Чистый лист и завершённый цикл одновременно: всё ещё впереди, и выбор за вами." },
  1: { title: "Начало", text: "Воля, инициатива, первый шаг. Время действовать от своего имени." },
  2: { title: "Партнёрство", text: "Баланс, терпение, диалог. Решения лучше принимать вместе." },
  3: { title: "Творчество", text: "Общение, идеи, лёгкость. Хорошо выражать себя и делиться." },
  4: { title: "Опора", text: "Порядок, труд, устойчивость. Фундамент важнее скорости." },
  5: { title: "Перемены", text: "Свобода, движение, новый опыт. Не держитесь за старое из привычки." },
  6: { title: "Дом", text: "Забота, семья, ответственность за близких. Тепло важнее правоты." },
  7: { title: "Поиск", text: "Интуиция, уединение, вопросы о смысле. Ответ приходит в тишине." },
  8: { title: "Ресурсы", text: "Деньги, влияние, ответственность. Что посеяно, то и вернётся." },
  9: { title: "Завершение", text: "Итоги, мудрость, отпускание. Закрыть, чтобы освободить место новому." },
};

export function digitsOf(time: string): number[] {
  return time.replace(":", "").split("").map(Number);
}

export function reduceDigit(n: number): number {
  while (n > 9) n = String(n).split("").reduce((s, d) => s + Number(d), 0);
  return n;
}

/** Что сделать, когда заметили время: по одному спокойному шагу на каждую цифру. */
export const DIGIT_STEPS: Record<number, string> = {
  0: "Оставьте пару минут тишины без телефона и задач: так легче понять, чего вы на самом деле хотите.",
  1: "Сделайте первый маленький шаг в деле, которое давно откладываете: письмо, звонок, запись в план.",
  2: "Спросите мнение близкого человека или коллеги, прежде чем решать в одиночку.",
  3: "Скажите вслух или запишите идею, которая крутится в голове: ей нужно выйти наружу.",
  4: "Наведите порядок в одной небольшой области: на столе, в расписании, в списке дел.",
  5: "Попробуйте что-то новое в привычном маршруте дня: другую дорогу, другое кафе, новую тему разговора.",
  6: "Уделите время дому и близким: короткий звонок родным или ужин без спешки.",
  7: "Побудьте наедине с собой: прогулка, дневник или просто тихий чай помогут услышать себя.",
  8: "Посмотрите на свои ресурсы трезво: время, силы, деньги. Что из этого вы тратите не туда?",
  9: "Завершите одно незаконченное дело или отпустите то, что давно потеряло смысл.",
};

const rev = (s: string) => s.split("").reverse().join("");

/** Время без двоеточия, как его часто ищут: 12:21 → 1221. */
export const compactTime = (time: string) => time.replace(":", "");

/** Соседи по смыслу: зеркальные и перевёрнутые варианты (12:12 ↔ 12:21 ↔ 21:12 ↔ 21:21), затем время с той же суммой цифр. */
export function relatedClocks(c: ClockNumber, all = getClockNumbers()): { mirror: ClockNumber[]; sameSum: ClockNumber[] } {
  const [h, m] = c.time.split(":");
  const cand = [`${h}:${h}`, `${h}:${rev(h)}`, `${m}:${m}`, `${m}:${h}`, `${rev(h)}:${rev(h)}`, `${rev(h)}:${h}`, `${rev(m)}:${rev(m)}`, `${m}:${rev(m)}`];
  const bySlug = new Map(all.map((x) => [x.time, x]));
  const mirror = Array.from(new Set(cand)).filter((t) => t !== c.time && bySlug.has(t)).map((t) => bySlug.get(t)!);
  const taken = new Set([c.time, ...mirror.map((x) => x.time)]);
  const sameSum = all.filter((x) => !taken.has(x.time) && reduceDigit(x.sum) === reduceDigit(c.sum)).slice(0, 6);
  return { mirror, sameSum };
}

/** Первое предложение текста (для коротких ответов в FAQ и description). */
export function firstSentence(text: string): string {
  const m = text.match(/^.+?[.!?](?=\s|$)/);
  return (m ? m[0] : text).trim();
}

/** Шаги «что делать, если видите это время»: цифры комбинации + итоговая цифра суммы. */
export function clockSteps(c: ClockNumber): string[] {
  const digits = Array.from(new Set([...digitsOf(c.time), reduceDigit(c.sum)]));
  return digits.slice(0, 3).map((d) => DIGIT_STEPS[d]);
}

/** Title без суффикса бренда: под запросы «12:21 на часах», «значение», «что значит», «в любви». */
export const clockTitle = (c: ClockNumber) => `${c.time} на часах: значение, что значит в любви`;

/** Description 120–160 символов с формулировками запросов. */
export function clockDescription(c: ClockNumber): string {
  const kind = c.kind === "double" ? "одинаковых" : "зеркальных";
  const base = `Что значит ${c.time} (${compactTime(c.time)}) на часах: значение ${kind} цифр в ангельской нумерологии, ${c.time} в любви и работе, что делать и совет на день.`;
  if (base.length <= 160) return base;
  return `Что значит ${c.time} на часах: значение ${kind} цифр в ангельской нумерологии, ${c.time} в любви и работе, что делать и совет.`;
}

/** FAQ страницы: вопросы из данных + общие под запросы «в любви», «что делать», «сумма цифр». */
export function clockFaq(c: ClockNumber): ClockFaq[] {
  const sum = reduceDigit(c.sum);
  const extra: ClockFaq[] = [
    { q: `Что значит ${c.time} на часах в любви?`, a: `${firstSentence(c.love)} ${c.advice}`.trim() },
    { q: `Что делать, если часто видишь ${c.time}?`, a: `Остановитесь на секунду и отметьте, о чём вы думали в этот момент: в этом и смысл подсказки. ${clockSteps(c)[0]}` },
    { q: `Какое число даёт ${c.time} в нумерологии?`, a: `Сумма цифр ${c.time} равна ${c.sum}${c.sum !== sum ? `, а сведённая к одной цифре — ${sum}` : ""}: ${DIGITS[sum].title.toLowerCase()}. ${DIGITS[sum].text}` },
  ];
  const hasDo = c.faq.some((f) => /что делать/i.test(f.q));
  const seen = new Set<string>();
  return [...c.faq, ...extra.filter((f) => !(hasDo && /^Что делать/.test(f.q)))].filter((f) => {
    const k = f.q.toLowerCase().replace(/[^а-яё0-9]/g, "");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
