import type { IconName } from "@/components/Icons";

export const SITE = {
  name: "Карта дня",
  tagline: "Таро, астрология, нумерология и сонник — понятным языком",
  url: process.env.SITE_URL || "https://karta-dnya.ru",
  locale: "ru_RU",
  description:
    "Эзотерический портал: карта дня, гороскоп на сегодня, значения карт Таро, число судьбы, сонник, камни-талисманы и практики для спокойной жизни.",
};

export type SectionKey = "taro" | "astrologiya" | "numerologiya" | "sonnik" | "praktiki" | "kamni";

export const SECTIONS: Record<SectionKey, { title: string; short: string; seoTitle?: string; description: string; emoji: string; icon: IconName }> = {
  taro: {
    title: "Таро",
    seoTitle: "Таро: значения карт, расклады и гадания онлайн",
    short: "Таро",
    emoji: "🃏",
    icon: "card",
    description: "Значения всех 78 карт, расклады для новичков, карта дня и ответы на частые вопросы о гадании.",
  },
  astrologiya: {
    title: "Астрология",
    short: "Астрология",
    emoji: "✨",
    icon: "star",
    description: "Гороскоп на сегодня, характер знаков зодиака, совместимость и влияние планет на повседневность.",
  },
  numerologiya: {
    title: "Нумерология",
    short: "Нумерология",
    emoji: "🔢",
    icon: "hash",
    description: "Число судьбы, значение чисел и даты рождения, простые расчёты с понятными объяснениями.",
  },
  sonnik: {
    title: "Сонник",
    short: "Сонник",
    emoji: "🌙",
    icon: "moon",
    description: "Толкование снов по популярным символам: к чему снится вода, змея, зубы, полёт и сотни других образов.",
  },
  praktiki: {
    title: "Практики",
    seoTitle: "Практики: медитации, ритуалы и работа с намерением",
    short: "Практики",
    emoji: "🕯️",
    icon: "candle",
    description: "Медитации, ритуалы на новолуние, работа с намерением и простые привычки для внутреннего равновесия.",
  },
  kamni: {
    title: "Камни и талисманы",
    short: "Камни",
    emoji: "💎",
    icon: "gem",
    description: "Свойства минералов, камни по знаку зодиака, как выбирать, носить и очищать талисманы.",
  },
};

export const SECTION_KEYS = Object.keys(SECTIONS) as SectionKey[];

/** Предел длины <title> вместе с суффиксом «— Карта дня» из layout. */
export const TITLE_MAX = 65;

/**
 * Title для generateMetadata: короткий — с суффиксом бренда по шаблону layout; длиннее 53 символов,
 * но помещающийся в 65 — без суффикса (`absolute`); совсем длинный режется по последнему знаку препинания.
 */
export function pageTitle(title: string): string | { absolute: string } {
  const t = title.trim();
  const suffix = ` — ${SITE.name}`.length;
  if (t.length + suffix <= TITLE_MAX) return t;
  if (t.length <= TITLE_MAX) return { absolute: t };
  const limit = TITLE_MAX - suffix;
  const cut = Math.max(...[":", ";", " —", ","].map((p) => t.lastIndexOf(p, limit)));
  if (cut >= 25) return t.slice(0, cut).trim();
  const space = t.lastIndexOf(" ", TITLE_MAX);
  return { absolute: t.slice(0, space > 25 ? space : TITLE_MAX).trim() };
}

export const TOOLS: { href: string; title: string; text: string; emoji: string; icon: IconName }[] = [
  { href: "/karta-dnya", title: "Карта дня", text: "Одна карта Таро на сегодня и короткое толкование", emoji: "🃏", icon: "card" },
  { href: "/goroskop", title: "Гороскоп на сегодня", text: "Для каждого знака: общий фон, любовь, дела, совет", emoji: "✨", icon: "sun" },
  { href: "/chislo-sudby", title: "Число судьбы", text: "Рассчитать по дате рождения за секунду", emoji: "🔢", icon: "hash" },
  { href: "/sonnik", title: "Сонник", text: "Найти символ сна и прочитать толкование", emoji: "🌙", icon: "moon" },
  { href: "/sovmestimost", title: "Совместимость", text: "Два знака, процент и разбор пары", emoji: "💞", icon: "hearts" },
  { href: "/goroskop/zavtra", title: "Гороскоп на завтра", text: "Чтобы подготовиться заранее", emoji: "🌅", icon: "sunrise" },
  { href: "/taro/da-net", title: "Таро да или нет", text: "Одна карта на закрытый вопрос", emoji: "🔮", icon: "ball" },
  { href: "/lunnyy-kalendar", title: "Лунный календарь", text: "Лунный день, фаза, стрижка и посадки", emoji: "🌙", icon: "calendar" },
  { href: "/astrologiya/natalnaya-karta", title: "Натальная карта", text: "Планеты, дома и Асцендент по дате, времени и месту рождения", emoji: "✨", icon: "star" },
];
