export const SITE = {
  name: "Карта дня",
  tagline: "Таро, астрология, нумерология и сонник — понятным языком",
  url: process.env.SITE_URL || "https://karta-dnya.ru",
  locale: "ru_RU",
  description:
    "Эзотерический портал: карта дня, гороскоп на сегодня, значения карт Таро, число судьбы, сонник, камни-талисманы и практики для спокойной жизни.",
};

export type SectionKey = "taro" | "astrologiya" | "numerologiya" | "sonnik" | "praktiki" | "kamni";

export const SECTIONS: Record<SectionKey, { title: string; short: string; description: string; emoji: string }> = {
  taro: {
    title: "Таро",
    short: "Таро",
    emoji: "🃏",
    description: "Значения всех 78 карт, расклады для новичков, карта дня и ответы на частые вопросы о гадании.",
  },
  astrologiya: {
    title: "Астрология",
    short: "Астрология",
    emoji: "✨",
    description: "Гороскоп на сегодня, характер знаков зодиака, совместимость и влияние планет на повседневность.",
  },
  numerologiya: {
    title: "Нумерология",
    short: "Нумерология",
    emoji: "🔢",
    description: "Число судьбы, значение чисел и даты рождения, простые расчёты с понятными объяснениями.",
  },
  sonnik: {
    title: "Сонник",
    short: "Сонник",
    emoji: "🌙",
    description: "Толкование снов по популярным символам: к чему снится вода, змея, зубы, полёт и сотни других образов.",
  },
  praktiki: {
    title: "Практики",
    short: "Практики",
    emoji: "🕯️",
    description: "Медитации, ритуалы на новолуние, работа с намерением и простые привычки для внутреннего равновесия.",
  },
  kamni: {
    title: "Камни и талисманы",
    short: "Камни",
    emoji: "💎",
    description: "Свойства минералов, камни по знаку зодиака, как выбирать, носить и очищать талисманы.",
  },
};

export const SECTION_KEYS = Object.keys(SECTIONS) as SectionKey[];

export const TOOLS = [
  { href: "/karta-dnya", title: "Карта дня", text: "Одна карта Таро на сегодня и короткое толкование", emoji: "🃏" },
  { href: "/goroskop", title: "Гороскоп на сегодня", text: "Для каждого знака: общий фон, любовь, дела, совет", emoji: "✨" },
  { href: "/chislo-sudby", title: "Число судьбы", text: "Рассчитать по дате рождения за секунду", emoji: "🔢" },
  { href: "/sonnik", title: "Сонник", text: "Найти символ сна и прочитать толкование", emoji: "🌙" },
  { href: "/sovmestimost", title: "Совместимость", text: "Два знака, процент и разбор пары", emoji: "💞" },
  { href: "/goroskop/zavtra", title: "Гороскоп на завтра", text: "Чтобы подготовиться заранее", emoji: "🌅" },
  { href: "/taro/da-net", title: "Таро да или нет", text: "Одна карта на закрытый вопрос", emoji: "🔮" },
  { href: "/lunnyy-kalendar", title: "Лунный календарь", text: "Лунный день, фаза, стрижка и посадки", emoji: "🌙" },
];
