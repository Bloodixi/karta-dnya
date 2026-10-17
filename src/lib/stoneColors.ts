/** Цветовые группы для фильтра витрины камней. Камень попадает в группу по основным цветам из поля color
 *  (до оговорок «с …», «также», «реже», «иногда»), поэтому «синий с белыми прожилками» — только синий. */
export type ColorGroup = { key: string; label: string; swatch: string; stems: string[] };

export const COLOR_GROUPS: ColorGroup[] = [
  { key: "fioletovye", label: "Фиолетовые", swatch: "#7d5aa6", stems: ["фиолет", "сирен"] },
  { key: "rozovye", label: "Розовые", swatch: "#e2a4b8", stems: ["розов"] },
  { key: "krasnye", label: "Красные", swatch: "#a8323a", stems: ["красн", "алы", "малинов", "оранжев", "винн", "огненн"] },
  { key: "zheltye", label: "Жёлтые", swatch: "#d6a73c", stems: ["жёлт", "желт", "золот", "медов"] },
  { key: "zelenye", label: "Зелёные", swatch: "#3f8a5c", stems: ["зелён", "зелен", "мятн", "оливк"] },
  { key: "sinie", label: "Синие", swatch: "#3d64a8", stems: ["голуб", "син", "бирюз", "морск"] },
  { key: "korichnevye", label: "Коричневые", swatch: "#7a5236", stems: ["коричн", "бур"] },
  { key: "chernye", label: "Чёрные и серые", swatch: "#2a2a2e", stems: ["чёрн", "черн", "сер", "дымчат"] },
  { key: "svetlye", label: "Светлые", swatch: "#ecebf0", stems: ["бел", "молочн", "прозрачн", "бесцвет", "кремов"] },
];

/** Основная часть описания цвета: «тёмно-синий с белыми прожилками» → «тёмно-синий». */
const primaryColor = (color: string) => color.toLowerCase().split(/\s(?:с|также|реже|редко|иногда)\s/)[0];

export function stoneColorKeys(color: string): string[] {
  const c = primaryColor(color);
  return COLOR_GROUPS.filter((g) => g.stems.some((s) => c.includes(s))).map((g) => g.key);
}
