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
