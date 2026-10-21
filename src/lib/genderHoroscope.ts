import type { PeriodKey } from "./daily";

/** Константы блоков «Для женщины» / «Для мужчины» (без чтения файлов — можно импортировать откуда угодно).
 *  Тексты собирает компонент GenderHoroscope из content/data/horoscope-gender.json. */

export type Gender = "woman" | "man";
export type Sphere = "love" | "work" | "self";

/** Периоды, где на странице знака есть блоки (и куда ведут ссылки с хабов). */
export const GENDER_PERIODS: PeriodKey[] = ["segodnya", "zavtra", "nedelya", "mesyats"];

export const GENDER_INFO: Record<Gender, { title: string; anchor: string; short: string }> = {
  woman: { title: "Для женщины", anchor: "zhenshchina", short: "для женщины" },
  man: { title: "Для мужчины", anchor: "muzhchina", short: "для мужчины" },
};

export const SPHERE_LABEL: Record<Sphere, string> = { love: "Отношения", work: "Работа", self: "Забота о себе" };
