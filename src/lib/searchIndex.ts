/** Сборка индекса поиска по сайту (только сервер, читает content/). Отдаётся статическим файлом /poisk-index.json. */
import { getArticles, getDreams, getNumerology, getRunes, getSpreads, getStones, getTarot, getZodiac, readJsonData, spreadHref } from "@/lib/content";
import { getClockNumbers } from "@/lib/clock";
import { PERIODS, PERIOD_KEYS } from "@/lib/daily";
import { getMoonSigns } from "@/lib/moonSigns";
import { getAffirmationTopics } from "@/lib/affirmations";
import { normalize, type SearchIndex, type SearchRow } from "@/lib/search";
import { NUMEROLOGY_TOOLS, SECTIONS, SECTION_KEYS, SECTION_TOOLS, TOOLS } from "@/lib/site";

/** Платные разборы и страницы, которых нет в списках инструментов. */
const EXTRA_TOOLS: { href: string; title: string; kw: string }[] = [
  { href: "/razbor", title: "Разбор по дате рождения", kw: "нумерологический разбор личный документ pdf купить" },
  { href: "/sovmestimost-razbor", title: "Разбор совместимости пары", kw: "совместимость по дате рождения пара партнер разбор" },
  { href: "/razbor-rebenka", title: "Разбор ребёнка по дате рождения", kw: "детский разбор ребенок дети" },
  { href: "/matrica-sudby/sovmestimost", title: "Совместимость по матрице судьбы", kw: "матрица пара партнер" },
  { href: "/matrica-sudby/arkany", title: "Арканы матрицы судьбы", kw: "матрица 22 аркана значения" },
  { href: "/taro/karty", title: "Значения всех карт Таро", kw: "78 карт колода таро" },
  { href: "/runy", title: "Значение всех рун", kw: "футарк 24 руны" },
  { href: "/kamni", title: "Каталог камней", kw: "минералы талисманы самоцветы" },
];

export function buildSearchIndex(): SearchIndex {
  const sections: string[] = [];
  const sec = (name: string) => {
    let i = sections.indexOf(name);
    if (i < 0) i = sections.push(name) - 1;
    return i;
  };
  const items: SearchRow[] = [];
  const seen = new Set<string>();
  const add = (title: string, url: string, section: string, ...kw: (string | undefined | null | false)[]) => {
    if (seen.has(url)) return;
    seen.add(url);
    const words = Array.from(new Set(normalize(kw.filter(Boolean).join(" ")).split(" ").filter((w) => w.length > 1)));
    items.push([title, url, sec(section), words.join(" ")]);
  };

  // Инструменты — первыми: при равном счёте их показываем выше.
  const TOOL = "Инструменты";
  for (const t of TOOLS) add(t.title, t.href, TOOL, t.text, "онлайн");
  for (const t of NUMEROLOGY_TOOLS) add(t.title, t.href, TOOL, t.text, "нумерология");
  for (const t of EXTRA_TOOLS) add(t.title, t.href, TOOL, t.kw);
  for (const k of SECTION_KEYS) for (const t of SECTION_TOOLS[k] ?? []) add(t.title, t.href, TOOL, SECTIONS[k].title);

  for (const k of SECTION_KEYS) add(SECTIONS[k].title, `/${k}`, "Разделы", SECTIONS[k].description);

  // Гороскопы: хабы периодов и знаки.
  const HORO = "Гороскоп";
  for (const p of PERIOD_KEYS) add(`Гороскоп ${PERIODS[p].title}`, p === "segodnya" ? "/goroskop" : `/goroskop/${p}`, HORO, "все знаки зодиака прогноз");
  const zodiac = getZodiac();
  for (const z of zodiac) add(`${z.name}: гороскоп на сегодня`, `/goroskop/${z.slug}`, HORO, z.dates, z.element, z.planet, "знак зодиака характер", z.keywords.join(" "));
  for (let i = 0; i < zodiac.length; i++)
    for (let j = i; j < zodiac.length; j++) {
      const a = zodiac[i], b = zodiac[j];
      add(`${a.name} и ${b.name}: совместимость`, `/sovmestimost/${a.slug}-${b.slug}`, "Совместимость", "пара любовь отношения");
    }
  for (const m of getMoonSigns()) add(m.title, `/astrologiya/luna-v-znake/${m.slug}`, "Астрология", "луна знак");

  for (const c of getTarot())
    add(c.name, `/taro/karty/${c.slug}`, "Карты Таро", c.arcana === "major" ? "старший аркан" : `младший аркан ${c.suitName ?? ""}`, "карта таро значение", c.keywords.join(" "));
  for (const s of getSpreads()) add(s.title, spreadHref(s), "Расклады Таро", "расклад таро", s.theme, s.query);

  for (const r of getRunes()) add(`Руна ${r.name}`, `/runy/${r.slug}`, "Руны", r.orig, r.translation, "значение руны футарк", r.keywords.join(" "));

  for (const s of getStones()) add(s.name, `/kamni/${s.slug}`, "Камни", "камень талисман свойства", s.color, s.properties.join(" "));
  for (const z of zodiac) add(`Камни для знака ${z.name}`, `/kamni/po-znaku-zodiaka/${z.slug}`, "Камни", "камень по знаку зодиака талисман");

  for (const d of getDreams()) add(d.word, `/sonnik/${d.slug}`, "Сонник", "сонник к чему снится сон толкование");

  for (const n of getNumerology()) add(`Число судьбы ${n.number}: ${n.title}`, `/chislo-sudby/${n.number}`, "Числа", "число судьбы нумерология значение", n.keywords.join(" "));
  for (const c of getClockNumbers()) add(`${c.time} на часах: ${c.title}`, `/numerologiya/chisla-na-chasah/${c.slug}`, "Числа", "числа на часах одинаковые зеркальные", c.keywords.join(" "));
  const arcana = readJsonData<{ n: number; name: string; keywords: string[] }[]>("matrix-arcana.json", []);
  for (const a of arcana) add(`Аркан ${a.n} в матрице судьбы: ${a.name}`, `/matrica-sudby/arkany/${a.n}`, "Матрица судьбы", "матрица судьбы аркан", a.keywords.join(" "));

  for (const t of getAffirmationTopics()) add(t.name, `/praktiki/affirmacii/${t.slug}`, "Практики", "аффирмации", t.short);

  for (const a of getArticles()) add(a.title, `/${a.section}/${a.slug}`, "Статьи", SECTIONS[a.section].title, a.tags.join(" "));

  return { v: 1, sections, items };
}
