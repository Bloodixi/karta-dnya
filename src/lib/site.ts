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
  { href: "/numerologiya/po-date-rozhdeniya", title: "Нумерология по дате рождения", text: "Число судьбы, дня рождения, имени и личный год в одном расчёте", emoji: "🔢", icon: "hash" },
];

/** Инструменты раздела «Нумерология»: порядок — для хаба и блока перелинковки. */
export const NUMEROLOGY_TOOLS: { href: string; title: string; text: string }[] = [
  { href: "/numerologiya/po-date-rozhdeniya", title: "Нумерология по дате рождения", text: "Все числа даты и имени в одном расчёте" },
  { href: "/chislo-sudby", title: "Число судьбы", text: "Калькулятор и значения чисел 1–9, 11, 22, 33" },
  { href: "/matrica-sudby", title: "Матрица судьбы", text: "Арканы по дате рождения и центр матрицы" },
  { href: "/numerologiya/sovmestimost", title: "Совместимость по дате рождения", text: "Две даты, процент и разбор пары чисел" },
  { href: "/numerologiya/chislo-imeni", title: "Число имени", text: "Число выражения, души и личности по буквам" },
  { href: "/numerologiya/lichnyy-god", title: "Личный год", text: "Какой год цикла идёт у вас сейчас" },
  { href: "/numerologiya/schastlivoe-chislo", title: "Счастливое число", text: "Ваше число удачи, дни и ряд чисел" },
  { href: "/numerologiya/master-chisla", title: "Мастер-числа 11, 22, 33", text: "Что они значат и есть ли они у вас" },
  { href: "/kvadrat-pifagora", title: "Квадрат Пифагора", text: "Психоматрица по дате рождения" },
  { href: "/numerologiya/chisla-na-chasah", title: "Числа на часах", text: "Одинаковые и зеркальные сочетания" },
];

/** Инструменты и хабы раздела: кнопки под заголовком на странице раздела. */
export const SECTION_TOOLS: Partial<Record<SectionKey, { href: string; title: string }[]>> = {
  taro: [{ href: "/karta-dnya", title: "Карта дня" }, { href: "/taro/rasklady", title: "Расклады онлайн" }, { href: "/taro/da-net", title: "Таро да или нет" }, { href: "/taro/tri-karty", title: "Три карты" }, { href: "/taro/karty", title: "Значения всех карт" }, { href: "/taro/arkany/starshie", title: "Старшие арканы" }, { href: "/taro/arkany/mladshie", title: "Младшие арканы" }],
  astrologiya: [{ href: "/goroskop", title: "Гороскоп на сегодня" }, { href: "/goroskop/zavtra", title: "На завтра" }, { href: "/goroskop/god", title: "На год" }, { href: "/astrologiya/natalnaya-karta", title: "Натальная карта" }, { href: "/astrologiya/voshodyaschiy-znak", title: "Восходящий знак" }, { href: "/astrologiya/retrogradnyy-merkuriy", title: "Ретроградный Меркурий" }, { href: "/astrologiya/luna-v-znake", title: "Луна в знаке" }, { href: "/astrologiya/tranzity", title: "Транзиты" }, { href: "/sovmestimost", title: "Совместимость" }, { href: "/lunnyy-kalendar", title: "Лунный календарь" }],
  numerologiya: NUMEROLOGY_TOOLS.map((t) => ({ href: t.href, title: t.title })),
  sonnik: [{ href: "/sonnik", title: "Все символы сонника" }],
  praktiki: [{ href: "/praktiki/affirmacii", title: "Аффирмации" }, { href: "/praktiki/affirmacii/dnya", title: "Аффирмация дня" }, { href: "/praktiki/affirmacii/na-dengi", title: "На деньги" }, { href: "/praktiki/affirmacii/na-zdorovie", title: "На здоровье" }, { href: "/praktiki/affirmacii/dlya-zhenschin", title: "Для женщин" }, { href: "/praktiki/affirmacii/utrennie", title: "Утренние" }],
  kamni: [{ href: "/kamni", title: "Каталог камней" }, { href: "/kamni/po-znaku-zodiaka", title: "Камни по знаку зодиака" }, { href: "/kamni/po-date-rozhdeniya", title: "Камень по дате рождения" }],
};
