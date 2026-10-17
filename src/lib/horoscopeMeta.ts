import { formatDateRu, periodKey, shiftKey, todayKey, type PeriodKey } from "./daily";

/**
 * Заголовки и описания страниц гороскопа с датами периода.
 * title без суффикса « — Карта дня» укладывается в 58 знаков, description — в 140–160
 * при любой дате и любом знаке.
 */

const dm = (key: string) => formatDateRu(key, { day: "numeric", month: "long" });
const monthName = (key: string) => formatDateRu(key, { month: "long" });

/** «19–25 октября» или «26 октября – 1 ноября». */
export function weekRange(dateKey = todayKey()): string {
  const from = periodKey("nedelya", dateKey);
  const to = shiftKey(from, 6);
  return from.slice(5, 7) === to.slice(5, 7) ? `${Number(from.slice(8))}–${dm(to)}` : `${dm(from)} – ${dm(to)}`;
}

/** Короткая подпись периода для title и description: «на завтра, 18 октября», «на неделю 19–25 октября», «на ноябрь 2026», «на 2026 год». */
export function periodPhrase(period: PeriodKey, dateKey = todayKey()): string {
  const key = periodKey(period, dateKey);
  switch (period) {
    case "segodnya": return `на сегодня, ${dm(key)}`;
    case "zavtra": return `на завтра, ${dm(key)}`;
    case "vchera": return `на вчера, ${dm(key)}`;
    case "nedelya": return `на неделю ${weekRange(dateKey)}`;
    case "mesyats": return `на ${monthName(key)} ${key.slice(0, 4)}`;
    case "god": return `на ${key.slice(0, 4)} год`;
  }
}

/** Подпись периода внутри фразы: у дат — запятая после даты («на завтра, 18 октября, для знака…»). */
const inPhrase = (period: PeriodKey, dateKey: string) => {
  const p = periodPhrase(period, dateKey);
  return period === "segodnya" || period === "zavtra" || period === "vchera" ? `${p},` : p;
};

const SIGN_DESC: Record<PeriodKey, string> = {
  segodnya: "любовь, работа и деньги, самочувствие и совет дня. Характер знака, сильные стороны и совместимость",
  zavtra: "общий фон дня, любовь, работа и деньги, самочувствие и совет, чтобы спокойно подготовиться заранее",
  vchera: "общий фон прошедшего дня, любовь, работа и деньги, самочувствие и совет. Сравните с тем, как всё было",
  nedelya: "общий фон недели, любовь, работа и деньги, самочувствие и совет",
  mesyats: "главные темы месяца, любовь, работа и деньги, самочувствие и совет",
  god: "главные темы года, любовь, работа и деньги, силы и отдых, движение планет и совет",
};

const HUB_DESC: Record<PeriodKey, string> = {
  segodnya: "общий фон дня, любовь, работа и деньги, самочувствие и короткий совет",
  zavtra: "общий фон дня, любовь, работа и деньги, самочувствие и короткий совет на день",
  vchera: "общий фон прошедшего дня, любовь, работа и деньги, самочувствие и совет",
  nedelya: "общий фон недели, любовь, работа и деньги, самочувствие и совет",
  mesyats: "главные темы месяца, любовь, работа и деньги, самочувствие и совет",
  god: "главные темы года, любовь, работа и деньги, силы и отдых, движение планет и совет",
};

/** Хвосты для добивки описания до 140 знаков (длина зависит от даты и имени знака). */
const TAILS: Record<PeriodKey, string[]> = {
  segodnya: [" Обновляется каждый день."],
  zavtra: [" Обновляется каждый день."],
  vchera: [" Обновляется каждый день."],
  nedelya: [" Что на небе в эти дни.", " Обновляется еженедельно.", " Читайте спокойно."],
  mesyats: [" Что на небе в этом месяце.", " Обновляется ежемесячно.", " Читайте спокойно."],
  god: [" Обновляется каждый год."],
};

/** Добавляет хвосты, пока описание короче 140 знаков и хвост помещается в 160. */
function fit(base: string, tails: string[]): string {
  let out = base;
  for (const t of tails) {
    if (out.length >= 140) break;
    if ((out + t).length <= 160) out += t;
  }
  return out;
}

export function signMeta(name: string, period: PeriodKey, dateKey = todayKey()): { title: string; description: string } {
  const title = period === "segodnya" ? `${name}: гороскоп на сегодня и характеристика знака` : `${name}: гороскоп ${periodPhrase(period, dateKey)}`;
  const description = fit(`Гороскоп ${inPhrase(period, dateKey)} для знака ${name}: ${SIGN_DESC[period]}.`, TAILS[period]);
  return { title, description };
}

export function hubMeta(period: PeriodKey, dateKey = todayKey()): { title: string; description: string } {
  const phrase = inPhrase(period, dateKey);
  const long = `Гороскоп ${phrase} для всех знаков зодиака`;
  const title = long.length <= 56 ? long : `Гороскоп ${phrase} для всех знаков`;
  const description = fit(`Гороскоп ${inPhrase(period, dateKey)} для всех 12 знаков зодиака: ${HUB_DESC[period]}.`, [" Выберите свой знак.", ...TAILS[period]]);
  return { title, description };
}
