import { inSignRu, mskDate, retroPeriodsByYears, type RetroPeriod } from "@/lib/astro/calendar";
import type { SignSlug } from "@/lib/astro/types";

const MONTHS_NOM = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const MSK = 3 * 3_600_000;
const msk = (iso: string) => new Date(new Date(iso).getTime() + MSK);

/** Ближайший период: идущий сейчас или следующий. */
export function nearestPeriod(periods: RetroPeriod[], now: Date): RetroPeriod | undefined {
  return periods.find((p) => new Date(p.end).getTime() > now.getTime());
}

/** «октябрь–ноябрь 2026», «июнь–июль 2027», «март 2028». */
export function periodMonths(p: RetroPeriod): string {
  const a = msk(p.start), b = msk(p.end);
  const y = b.getUTCFullYear();
  if (a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === y) return `${MONTHS_NOM[a.getUTCMonth()]} ${y}`;
  const first = a.getUTCFullYear() === y ? MONTHS_NOM[a.getUTCMonth()] : `${MONTHS_NOM[a.getUTCMonth()]} ${a.getUTCFullYear()}`;
  return `${first}–${MONTHS_NOM[b.getUTCMonth()]} ${y}`;
}

/** «с 24 октября по 13 ноября 2026». */
export function periodSpan(p: RetroPeriod): string {
  const sameYear = msk(p.start).getUTCFullYear() === msk(p.end).getUTCFullYear();
  return `с ${mskDate(p.start, !sameYear)} по ${mskDate(p.end, true)}`;
}

export function signsRu(p: RetroPeriod): string {
  return p.startSign === p.endSign ? inSignRu(p.startSign) : `${inSignRu(p.startSign)} и ${inSignRu(p.endSign)}`;
}

/** Ретроградная Венера, которая пересекается с периодом Меркурия (в 2026 году — осенью, в Скорпионе и Весах). */
export function venusOverlap(p: RetroPeriod): RetroPeriod | undefined {
  const y = msk(p.start).getUTCFullYear();
  const s = new Date(p.start).getTime(), e = new Date(p.end).getTime();
  return retroPeriodsByYears("venus", y, y + 1).find((v) => new Date(v.start).getTime() < e && new Date(v.end).getTime() > s);
}

/** О чём период в конкретном знаке: тема и пара спокойных советов. */
const SIGN_FOCUS: Partial<Record<SignSlug, { theme: string; tips: string[] }>> = {
  skorpion: {
    theme: "Скорпион — знак глубины, общих ресурсов и доверия. В эти недели всплывают недоговорённости, старые обязательства и вопросы, которые давно хотелось обсудить начистоту.",
    tips: [
      "Разберите общие расходы, долги и подписки: что можно закрыть, что — пересмотреть.",
      "Говорите о важном спокойно и без нажима: в Скорпионе слова легко звучат резче, чем задумано.",
      "Не спешите с выводами о людях по одному сообщению — переспросите лично.",
    ],
  },
  ryby: {
    theme: "В Рыбах Меркурий мыслит образами, а не списками: легко что-то забыть, перепутать время или понять намёк не так.",
    tips: ["Записывайте договорённости и время встреч.", "Оставьте место для отдыха, творчества и тишины — это хорошая пора для них."],
  },
  vodoley: {
    theme: "В Водолее период касается друзей, сообществ и техники: всплывают общие планы, старые переписки, настройки и подписки.",
    tips: ["Сделайте резервные копии и обновите пароли заранее.", "Вернитесь к отложенным общим проектам, не начиная новых."],
  },
  rak: {
    theme: "В Раке период поворачивает к дому и семье: хочется вернуться к старым разговорам с близкими, разобрать вещи, вспомнить прошлое.",
    tips: ["Хорошее время для уборки, ремонта мелочей и семейных встреч.", "Обсуждения с родными ведите мягко, без счёта старых обид."],
  },
  bliznetsy: {
    theme: "В Близнецах Меркурий у себя дома: много сообщений, поездок и мелких дел, и именно в них чаще всего случаются накладки.",
    tips: ["Перечитывайте письма перед отправкой.", "Закладывайте запас времени на дорогу и пересадки."],
  },
  vesy: {
    theme: "В Весах период касается партнёрства и договорённостей: возвращаются вопросы, которые обсуждали, но так и не решили.",
    tips: ["Доведите до конца старые переговоры, прежде чем открывать новые.", "Ищите компромисс, а не победителя в споре."],
  },
};

export function signFocus(sign: SignSlug) {
  return SIGN_FOCUS[sign];
}

/** Общие спокойные советы на любой период. */
export const CALM_TIPS = [
  "Возвращайтесь к отложенному: дописать, доделать, разобрать почту и бумаги — то, для чего и нужны эти недели.",
  "Документы и договоры можно подписывать, но перечитайте условия и сверьте даты, суммы и имена.",
  "Технику, билеты и маршруты проверьте заранее, оставьте запас времени.",
  "Крупные покупки и важные запуски, если есть выбор, удобнее назначить после окончания периода.",
];
