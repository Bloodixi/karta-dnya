import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import { SECTION_KEYS, type SectionKey } from "./site";

const ROOT = path.join(process.cwd(), "content");
const ARTICLES = path.join(ROOT, "articles");
const DATA = path.join(ROOT, "data");

export type Faq = { q: string; a: string };
export type ArticleMeta = {
  slug: string;
  section: SectionKey;
  title: string;
  description: string;
  date: string;
  tags: string[];
  faq: Faq[];
  readingMinutes: number;
};
export type Article = ArticleMeta & { html: string; text: string };

export function readJsonData<T>(name: string, fallback: T): T {
  return readJson(name, fallback);
}

function readJson<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8")) as T;
  } catch {
    return fallback;
  }
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function listArticleFiles(section: SectionKey): string[] {
  const dir = path.join(ARTICLES, section);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
}

function parseMeta(section: SectionKey, file: string): ArticleMeta & { body: string } {
  const raw = fs.readFileSync(path.join(ARTICLES, section, file), "utf8");
  const { data, content } = matter(raw);
  return {
    slug: file.replace(/\.md$/, ""),
    section,
    title: String(data.title || file),
    description: String(data.description || ""),
    date: String(data.date || ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    faq: Array.isArray(data.faq) ? data.faq.filter((x: Faq) => x && x.q && x.a) : [],
    readingMinutes: Math.max(1, Math.round(wordCount(content) / 180)),
    body: content,
  };
}

export function getArticles(section?: SectionKey): ArticleMeta[] {
  const sections = section ? [section] : SECTION_KEYS;
  const items: ArticleMeta[] = [];
  for (const s of sections) {
    for (const f of listArticleFiles(s)) {
      const { body: _body, ...meta } = parseMeta(s, f);
      void _body;
      items.push(meta);
    }
  }
  return items.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getArticle(section: SectionKey, slug: string): Promise<Article | null> {
  const file = `${slug}.md`;
  if (!fs.existsSync(path.join(ARTICLES, section, file))) return null;
  const { body, ...meta } = parseMeta(section, file);
  const html = String(await remark().use(remarkGfm).use(remarkHtml, { sanitize: true }).process(body));
  return { ...meta, html, text: body };
}

// ---------- данные ----------

export type TarotCard = {
  slug: string; name: string; arcana: "major" | "minor"; number: number; suit: string | null; suitName: string | null;
  keywords: string[]; upright: string; reversed: string; love: string; career: string; advice: string; description: string;
};
export type Zodiac = {
  slug: string; name: string; symbol: string; dates: string; element: string; quality: string; planet: string; keywords: string[];
  description: string; strengths: string[]; weaknesses: string[]; love: string; career: string; health: string;
  compatibility: { best: string[]; hard: string[] }; stone: string; color: string; luckyNumbers: number[];
};
export type HoroscopeBank = { general: string[]; love: string[]; career: string[]; health: string[]; advice: string[]; mood: string[] };
export type NumerologyNumber = { number: number; title: string; keywords: string[]; description: string; love: string; career: string; challenge: string };
export type Dream = { slug: string; word: string; short: string; meaning: string; variants: { when: string; means: string }[]; mood: string };
export type Stone = { slug: string; name: string; color: string; chakra: string; zodiac: string[]; numbers: number[]; properties: string[]; description: string; howToUse: string; care: string };

export type TarotExtra = { yesno: string; yesnoWhy: string; health: string; positions: { past: string; present: string; future: string }; combos: { with: string; means: string }[]; dayCard: string };
export const getTarot = () => readJson<TarotCard[]>("tarot.json", []);
export const getTarotExtra = () => readJson<Record<string, TarotExtra>>("tarot-extra.json", {});
export const findTarotExtra = (slug: string): TarotExtra | null => getTarotExtra()[slug] || null;
export type SpreadPosition = { name: string; meaning: string };
export type Spread = {
  slug: string; title: string; query: string; theme: string; short: string; intro: string[];
  positions: SpreadPosition[]; howTo: string[]; faq: Faq[];
  /** Если задан — расклад живёт на отдельной странице (например /taro/tri-karty), своя страница в каталоге не создаётся. */
  href?: string;
};
export const getSpreads = () => readJson<Spread[]>("spreads.json", []);
export const findSpread = (slug: string): Spread | null => getSpreads().find((s) => s.slug === slug && !s.href) || null;
export const spreadHref = (s: Spread) => s.href || `/taro/rasklady/${s.slug}`;
export const getZodiac = () => readJson<Zodiac[]>("zodiac.json", []);
export const getHoroscopeBank = () => readJson<HoroscopeBank>("horoscope-bank.json", { general: [], love: [], career: [], health: [], advice: [], mood: [] });
export const getNumerology = () => readJson<NumerologyNumber[]>("numerology.json", []);
export const getDreams = () => readJson<Dream[]>("dreams.json", []).sort((a, b) => a.word.localeCompare(b.word, "ru"));
export const getStones = () => readJson<Stone[]>("stones.json", []);
export type DreamImage = { file: string; thumb: string; model: string };
export const getDreamImages = () => readJson<Record<string, DreamImage>>("dream-images.json", {});
export const findDreamImage = (slug: string): DreamImage | null => getDreamImages()[slug] || null;
export type StoneImage = { file: string; thumb: string; author: string; license: string; source: string };
export const getStoneImages = () => readJson<Record<string, StoneImage>>("stone-images.json", {});
export const findStoneImage = (slug: string): StoneImage | null => getStoneImages()[slug] || null;

export const findTarot = (slug: string) => getTarot().find((c) => c.slug === slug) || null;
export const findZodiac = (slug: string) => getZodiac().find((z) => z.slug === slug) || null;
export const findDream = (slug: string) => getDreams().find((d) => d.slug === slug) || null;
export const findStone = (slug: string) => getStones().find((s) => s.slug === slug) || null;
