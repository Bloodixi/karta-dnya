import { getArticles, getDreams, getNumerology, getRunes, getSpreads, getStones, getTarot, getZodiac, readJsonData } from "@/lib/content";
import { allPairs, canonicalPairSlug } from "@/lib/compat";
import { getClockNumbers } from "@/lib/clock";
import { PERIOD_KEYS, todayKey } from "@/lib/daily";
import { FORECAST_YEAR } from "@/lib/horoscopeYear";
import { moonWindowKeys } from "@/lib/moon";
import { SITE, type SectionKey } from "@/lib/site";
import { getAuthors } from "@/lib/authors";
import { getMoonSigns } from "@/lib/moonSigns";
import { lunarMonthWindow } from "@/lib/moon-month";
import { getAffirmationTopics } from "@/lib/affirmations";
import { getChineseAnimals } from "@/lib/chineseZodiac";

/** Карта сайта по разделам: /sitemap.xml — индекс, /sitemaps/<раздел>.xml — дочерние карты.
 *  lastmod: у ежедневных страниц — сегодня по Москве, у остальных — дата последнего коммита их маршрута и данных
 *  (content/data/lastmod.json, пишет scripts/lastmod.mjs перед сборкой), у статей — дата коммита файла статьи. */
export type SitemapEntry = { url: string; lastmod: string; changefreq: "daily" | "weekly" | "monthly" | "yearly"; priority: number };

export const SITEMAP_SECTIONS = ["glavnoe", "goroskop", "lunnyy-kalendar", "taro", "sonnik", "sovmestimost", "numerologiya", "matrica-sudby", "kamni", "runy", "astrologiya", "praktiki", "stati"] as const;
export type SitemapSection = (typeof SITEMAP_SECTIONS)[number];

const FILE_DATES = readJsonData<Record<string, string>>("lastmod.json", {});
const FALLBACK = Object.values(FILE_DATES).sort().at(-1) ?? "2026-10-14";

/** Самая поздняя правка среди файлов, чьи пути начинаются с одного из префиксов. */
function changed(...prefixes: string[]): string {
  let best = "";
  for (const [f, d] of Object.entries(FILE_DATES)) if (d > best && prefixes.some((p) => f.startsWith(p))) best = d;
  return best || FALLBACK;
}
const app = (p: string) => `src/app/${p}`;
const data = (f: string) => `content/data/${f}`;

export function sitemapSection(section: SitemapSection): SitemapEntry[] {
  const today = todayKey();
  const u = (p: string) => `${SITE.url}${p}`;
  const out: SitemapEntry[] = [];
  const add = (path: string, lastmod: string, changefreq: SitemapEntry["changefreq"], priority: number) => out.push({ url: u(path), lastmod, changefreq, priority });
  const daily = (path: string, priority: number) => add(path, today, "daily", priority);
  const hub = (key: SectionKey, extra: string[] = []) => add(`/${key}`, changed(app("[section]/page.tsx"), app(`${key}/page.tsx`), ...extra), "weekly", 0.8);

  switch (section) {
    case "glavnoe":
      daily("/", 1);
      daily("/karta-dnya", 0.9);
      add("/privacy", changed(app("privacy")), "yearly", 0.1);
      add("/oferta", changed(app("oferta")), "yearly", 0.2);
      add("/vozvrat", changed(app("vozvrat")), "yearly", 0.2);
      add("/poisk", changed(app("poisk")), "monthly", 0.3);
      for (const a of getAuthors()) add(`/avtory/${a.slug}`, changed(app("avtory"), data("authors.json")), "monthly", 0.5);
      break;
    case "goroskop": {
      daily("/goroskop", 0.9);
      const periods = PERIOD_KEYS.filter((p) => p !== "segodnya");
      for (const p of periods) daily(`/goroskop/${p}`, 0.8);
      for (const z of getZodiac()) {
        daily(`/goroskop/${z.slug}`, 0.8);
        for (const p of periods) daily(`/goroskop/${z.slug}/${p}`, 0.7);
      }
      // Подробный гороскоп на год вперёд: /goroskop/2027 и /goroskop/<знак>/2027.
      const year = changed(app("goroskop/2027"), app("goroskop/[sign]/2027"), data(`horoscopes/god/${FORECAST_YEAR}-01-01`));
      add(`/goroskop/${FORECAST_YEAR}`, year, "monthly", 0.8);
      for (const z of getZodiac()) add(`/goroskop/${z.slug}/${FORECAST_YEAR}`, year, "monthly", 0.7);
      break;
    }
    case "lunnyy-kalendar": {
      daily("/lunnyy-kalendar", 0.9);
      const page = changed(app("lunnyy-kalendar/[date]"), "src/lib/moon.ts");
      // день недалёкого прошлого и будущего не меняется; его lastmod — правка шаблона (или сам день, если он позже)
      for (const k of moonWindowKeys(today)) add(`/lunnyy-kalendar/${k}`, k > page && k <= today ? k : page, "monthly", 0.6);
      for (const k of lunarMonthWindow(today)) add(`/lunnyy-kalendar/${k}`, page, "weekly", 0.7);
      break;
    }
    case "taro": {
      hub("taro");
      const cards = changed(app("taro/karty"), data("tarot.json"), data("tarot-extra.json"), data("tarot-long.json"));
      add("/taro/karty", cards, "monthly", 0.8);
      add("/taro/da-net", changed(app("taro/da-net")), "monthly", 0.8);
      add("/taro/tri-karty", changed(app("taro/tri-karty")), "monthly", 0.8);
      add("/taro/na-zhelanie", changed(app("taro/na-zhelanie"), "src/lib/wish.ts"), "monthly", 0.8);
      add("/taro/arkany/starshie", changed(app("taro/arkany")), "monthly", 0.7);
      add("/taro/arkany/mladshie", changed(app("taro/arkany")), "monthly", 0.7);
      const spreads = changed(app("taro/rasklady"), data("spreads.json"));
      add("/taro/rasklady", spreads, "monthly", 0.8);
      for (const s of getSpreads()) if (!s.href) add(`/taro/rasklady/${s.slug}`, spreads, "monthly", 0.7);
      for (const c of getTarot()) add(`/taro/karty/${c.slug}`, cards, "monthly", 0.6);
      break;
    }
    case "sonnik": {
      hub("sonnik", [app("sonnik"), data("dreams.json")]);
      const dreams = changed(app("[section]/[slug]"), data("dreams.json"), data("dream-images.json"));
      for (const d of getDreams()) add(`/sonnik/${d.slug}`, dreams, "monthly", 0.6);
      break;
    }
    case "sovmestimost": {
      const pairs = changed(app("sovmestimost"), "src/lib/compat.ts");
      add("/sovmestimost", pairs, "monthly", 0.8);
      for (const pr of allPairs()) if (pr.slug === canonicalPairSlug(pr.a, pr.b)) add(`/sovmestimost/${pr.slug}`, pairs, "monthly", 0.6); // зеркальные пары — canonical на основную
      break;
    }
    case "numerologiya": {
      hub("numerologiya");
      const num = changed(app("chislo-sudby"), data("numerology.json"));
      add("/chislo-sudby", num, "monthly", 0.8);
      for (const n of getNumerology()) add(`/chislo-sudby/${n.number}`, num, "monthly", 0.7);
      add("/kvadrat-pifagora", changed(app("kvadrat-pifagora")), "monthly", 0.8);
      add("/razbor", changed(app("razbor/page.tsx"), "src/lib/razbor.ts"), "monthly", 0.8);
      add("/razbor/primer", changed(app("razbor/primer"), "src/lib/razbor.ts", "src/components/RazborView.tsx"), "monthly", 0.6);
      add("/sovmestimost-razbor", changed(app("sovmestimost-razbor"), "src/lib/razborCompat.ts"), "monthly", 0.8);
      add("/razbor-rebenka", changed(app("razbor-rebenka"), "src/lib/razborChild.ts"), "monthly", 0.8);
      add("/sovmestimost-razbor/primer", changed(app("sovmestimost-razbor/primer"), "src/lib/razborCompat.ts", "src/components/RazborView.tsx"), "monthly", 0.6);
      add("/razbor-rebenka/primer", changed(app("razbor-rebenka/primer"), "src/lib/razborChild.ts", "src/components/RazborView.tsx"), "monthly", 0.6);
      const clock = changed(app("numerologiya/chisla-na-chasah"), data("clock-numbers.json"));
      add("/numerologiya/chisla-na-chasah", clock, "monthly", 0.8);
      for (const c of getClockNumbers()) add(`/numerologiya/chisla-na-chasah/${c.slug}`, clock, "monthly", 0.6);
      const tools: [string, string][] = [["po-date-rozhdeniya", "numerology-birthday.json"], ["sovmestimost", "numerology-compat.json"], ["chislo-imeni", "numerology-name.json"],
        ["lichnyy-god", "numerology-year.json"], ["schastlivoe-chislo", "numerology-lucky.json"], ["master-chisla", "numerology.json"],
        ["sovmestimost-imen", "numerology-name-compat.json"], ["2027", "numerology-2027.json"]];
      for (const [p, f] of tools) add(`/numerologiya/${p}`, changed(app(`numerologiya/${p}`), data(f)), "monthly", 0.8);
      break;
    }
    case "matrica-sudby": {
      const arc = changed(app("matrica-sudby/arkany"), data("matrix-arcana.json"), "src/lib/matrix.ts");
      add("/matrica-sudby", changed(app("matrica-sudby/page.tsx"), "src/lib/matrix.ts"), "monthly", 0.8);
      add("/matrica-sudby/arkany", arc, "monthly", 0.8);
      add("/matrica-sudby/sovmestimost", changed(app("matrica-sudby/sovmestimost"), "src/lib/matrix.ts"), "monthly", 0.8);
      for (let n = 1; n <= 22; n++) add(`/matrica-sudby/arkany/${n}`, arc, "monthly", 0.6);
      break;
    }
    case "kamni": {
      hub("kamni", [data("stones.json")]);
      const stones = changed(app("[section]/[slug]"), data("stones.json"), data("stone-images.json"));
      for (const s of getStones()) add(`/kamni/${s.slug}`, stones, "monthly", 0.6);
      const bySign = changed(app("kamni/po-znaku-zodiaka"), data("stone-signs.json"), "src/lib/stones.ts");
      add("/kamni/po-znaku-zodiaka", bySign, "monthly", 0.8);
      add("/kamni/po-date-rozhdeniya", changed(app("kamni/po-date-rozhdeniya"), "src/lib/stones.ts"), "monthly", 0.8);
      for (const z of getZodiac()) add(`/kamni/po-znaku-zodiaka/${z.slug}`, bySign, "monthly", 0.7);
      break;
    }
    case "runy": {
      hub("runy", [app("runy/page.tsx"), data("runes.json")]);
      daily("/runy/runa-dnya", 0.9);
      const runes = changed(app("runy/[slug]"), data("runes.json"));
      for (const r of getRunes()) add(`/runy/${r.slug}`, runes, "monthly", 0.7);
      break;
    }
    case "astrologiya": {
      hub("astrologiya");
      for (const p of ["natalnaya-karta", "voshodyaschiy-znak", "kak-my-schitaem"]) add(`/astrologiya/${p}`, changed(app(`astrologiya/${p}`), "src/lib/astro"), "monthly", p === "kak-my-schitaem" ? 0.6 : 0.8);
      add("/astrologiya/retrogradnyy-merkuriy", changed(app("astrologiya/retrogradnyy-merkuriy"), "src/lib/astro"), "weekly", 0.8);
      daily("/astrologiya/luna-v-znake", 0.8);
      daily("/astrologiya/tranzity", 0.8);
      const ms = changed(app("astrologiya/luna-v-znake/["), data("astro/moon-signs.json"));
      for (const m of getMoonSigns()) add(`/astrologiya/luna-v-znake/${m.slug}`, ms, "weekly", 0.6);
      const cz = changed(app("kitayskiy-goroskop"), data("chinese-zodiac.json"), "src/lib/chineseZodiac.ts");
      add("/kitayskiy-goroskop", cz, "monthly", 0.8);
      add("/kitayskiy-goroskop/2027", cz, "monthly", 0.8);
      for (const a of getChineseAnimals()) add(`/kitayskiy-goroskop/${a.slug}`, cz, "monthly", 0.7);
      break;
    }
    case "praktiki": {
      hub("praktiki");
      const aff = changed(app("praktiki/affirmacii"), data("affirmations.json"));
      add("/praktiki/affirmacii", aff, "weekly", 0.8);
      daily("/praktiki/affirmacii/dnya", 0.8);
      for (const t of getAffirmationTopics()) add(`/praktiki/affirmacii/${t.slug}`, aff, "monthly", 0.7);
      break;
    }
    case "stati": {
      const taken = new Set(SITEMAP_SECTIONS.filter((s) => s !== "stati").flatMap((s) => sitemapSection(s).map((e) => e.url)));
      for (const a of getArticles()) {
        const url = u(`/${a.section}/${a.slug}`);
        if (taken.has(url)) continue; // статья, которую заменила отдельная страница (например, ретроградный Меркурий)
        const file = FILE_DATES[`content/articles/${a.section}/${a.slug}.md`];
        out.push({ url, lastmod: [file, a.date].filter(Boolean).sort().at(-1) || today, changefreq: "monthly", priority: 0.7 });
      }
      break;
    }
  }
  return out;
}

export function sitemapXml(entries: SitemapEntry[]): string {
  const rows = entries.map((e) => `<url><loc>${e.url}</loc><lastmod>${e.lastmod}</lastmod><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
}

export function sitemapIndexXml(): string {
  const rows = SITEMAP_SECTIONS.map((s) => {
    const last = sitemapSection(s).map((e) => e.lastmod).sort().at(-1);
    return `<sitemap><loc>${SITE.url}/sitemaps/${s}.xml</loc>${last ? `<lastmod>${last}</lastmod>` : ""}</sitemap>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</sitemapindex>\n`;
}
