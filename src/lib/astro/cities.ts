/** Офлайн-геокодинг для натальной карты: поиск по справочнику content/data/astro/cities.json с учётом «ё/е»,
 *  латинской раскладки и транслитерации. Чистые функции без доступа к файлам — работают и в браузере. */

export interface City {
  name: string;
  country: string;  // ISO-код
  lat: number;
  lon: number;
  tz: string;       // IANA
  alt?: string[];   // старые и альтернативные названия
}

export interface IndexedCity extends City {
  slug: string;     // уникальный латинский идентификатор для URL (?c=moskva)
  keys: string[];   // нормализованные строки для поиска
}

export const COUNTRY_NAMES: Record<string, string> = {
  RU: "Россия", BY: "Беларусь", KZ: "Казахстан", UA: "Украина", UZ: "Узбекистан", AM: "Армения", GE: "Грузия", MD: "Молдова",
  KG: "Киргизия", AZ: "Азербайджан", TJ: "Таджикистан", TM: "Туркменистан", LV: "Латвия", LT: "Литва", EE: "Эстония",
  US: "США", GB: "Великобритания", DE: "Германия", FR: "Франция", IT: "Италия", ES: "Испания", PT: "Португалия", PL: "Польша",
  CZ: "Чехия", AT: "Австрия", CH: "Швейцария", NL: "Нидерланды", BE: "Бельгия", SE: "Швеция", NO: "Норвегия", FI: "Финляндия",
  DK: "Дания", GR: "Греция", TR: "Турция", CY: "Кипр", IL: "Израиль", AE: "ОАЭ", EG: "Египет", CN: "Китай", JP: "Япония",
  KR: "Южная Корея", IN: "Индия", TH: "Таиланд", VN: "Вьетнам", SG: "Сингапур", ID: "Индонезия", MY: "Малайзия", AU: "Австралия",
  NZ: "Новая Зеландия", CA: "Канада", MX: "Мексика", BR: "Бразилия", AR: "Аргентина", CL: "Чили", CO: "Колумбия", PE: "Перу",
  ZA: "ЮАР", NG: "Нигерия", KE: "Кения", MA: "Марокко", IR: "Иран", IQ: "Ирак", SA: "Саудовская Аравия", PK: "Пакистан",
  BD: "Бангладеш", PH: "Филиппины", HU: "Венгрия", RO: "Румыния", BG: "Болгария", RS: "Сербия", HR: "Хорватия", SK: "Словакия",
  SI: "Словения", IE: "Ирландия", IS: "Исландия", MN: "Монголия", QA: "Катар", LB: "Ливан", JO: "Иордания", TW: "Тайвань",
  HK: "Гонконг", ET: "Эфиопия", TZ: "Танзания", GH: "Гана", DZ: "Алжир", TN: "Тунис", CU: "Куба", VE: "Венесуэла", UY: "Уругвай",
  EC: "Эквадор", BO: "Боливия", LK: "Шри-Ланка", NP: "Непал", MM: "Мьянма", KH: "Камбоджа", KP: "Северная Корея", ME: "Черногория",
  MK: "Северная Македония", BA: "Босния и Герцеговина", AL: "Албания", LU: "Люксембург", MT: "Мальта", AF: "Афганистан",
};

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** Латинская раскладка QWERTY → ЙЦУКЕН (набрали «vjcrdf», имея в виду «москва»). */
const LAYOUT: Record<string, string> = {
  q: "й", w: "ц", e: "у", r: "к", t: "е", y: "н", u: "г", i: "ш", o: "щ", p: "з", "[": "х", "]": "ъ",
  a: "ф", s: "ы", d: "в", f: "а", g: "п", h: "р", j: "о", k: "л", l: "д", ";": "ж", "'": "э",
  z: "я", x: "ч", c: "с", v: "м", b: "и", n: "т", m: "ь", ",": "б", ".": "ю",
};

/** Нижний регистр, ё → е, дефисы → пробелы, лишние пробелы убраны. */
export function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е").replace(/[-–—_]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Транслитерация кириллицы в латиницу для слагов и поиска по латинскому вводу. */
export function translit(s: string): string {
  return normalize(s).split("").map((ch) => TRANSLIT[ch] ?? ch).join("");
}

/** Слаг для URL: латиница, цифры и дефисы. */
export function slugify(s: string): string {
  return translit(s).replace(/[^a-z0-9 ]+/g, "").trim().replace(/ /g, "-");
}

export function fromLatinLayout(s: string): string {
  return s.toLowerCase().split("").map((ch) => LAYOUT[ch] ?? ch).join("");
}

/** Готовит справочник к поиску: уникальные слаги и нормализованные ключи. */
export function indexCities(list: City[]): IndexedCity[] {
  const used = new Map<string, number>();
  return list.map((c) => {
    let slug = slugify(c.name) || "city";
    const n = used.get(slug) ?? 0;
    used.set(slug, n + 1);
    if (n > 0) slug = `${slug}-${c.country.toLowerCase()}${n > 1 ? `-${n}` : ""}`;
    const names = [c.name, ...(c.alt ?? [])];
    const keys = Array.from(new Set(names.flatMap((nm) => [normalize(nm), translit(nm)]).filter(Boolean)));
    return { ...c, slug, keys };
  });
}

function score(city: IndexedCity, q: string): number {
  let best = 0;
  for (const k of city.keys) {
    if (k === q) return 100;
    if (k.startsWith(q)) best = Math.max(best, 80);
    else if (k.split(" ").some((w) => w.startsWith(q))) best = Math.max(best, 60);
    else if (k.includes(q)) best = Math.max(best, 40);
  }
  return best;
}

/** Поиск по подстроке: исходный запрос, транслит и вариант, набранный в латинской раскладке. Крупные страны СНГ — выше. */
export function searchCities(index: IndexedCity[], query: string, limit = 8): IndexedCity[] {
  const raw = normalize(query);
  if (raw.length < 2) return [];
  const variants = Array.from(new Set([raw, translit(raw), normalize(fromLatinLayout(raw))].filter((v) => v.length >= 2)));
  const scored: { city: IndexedCity; s: number }[] = [];
  for (const city of index) {
    let s = 0;
    for (const v of variants) s = Math.max(s, score(city, v));
    if (s > 0) scored.push({ city, s: s + (city.country === "RU" ? 2 : 0) });
  }
  return scored
    .sort((a, b) => b.s - a.s || a.city.name.length - b.city.name.length || a.city.name.localeCompare(b.city.name, "ru"))
    .slice(0, limit)
    .map((x) => x.city);
}

export function findCityBySlug(index: IndexedCity[], slug: string): IndexedCity | undefined {
  return index.find((c) => c.slug === slug);
}

/** Подпись города для списка подсказок: «Москва, Россия». */
export function cityLabel(c: City): string {
  return `${c.name}, ${COUNTRY_NAMES[c.country] ?? c.country}`;
}
