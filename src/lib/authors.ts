import { readJsonData } from "./content";
import { SITE } from "./site";

export type Author = {
  slug: string;
  name: string;
  role: string;
  since: number;
  photo: string;
  short: string;
  bio: string;
  principles: string[];
  focus: string[];
};

export const getAuthors = () => readJsonData<Author[]>("authors.json", []);
export const findAuthor = (slug: string): Author | null => getAuthors().find((a) => a.slug === slug) || null;

/** Автор гороскопов и материалов раздела «Астрология» (псевдоним практикующего астролога). */
export const HOROSCOPE_AUTHOR_SLUG = "darya-lavrenteva";
export const horoscopeAuthor = (): Author | null => findAuthor(HOROSCOPE_AUTHOR_SLUG) ?? getAuthors()[0] ?? null;

/** Стаж в годах на текущий год. */
export function authorYears(a: Author, now = new Date()): number {
  return Math.max(1, now.getUTCFullYear() - a.since);
}

/** JSON-LD Person для автора: на странице автора — полная, в Article/гороскопах — краткая. */
export function authorJsonLd(a: Author, full = false): Record<string, unknown> {
  const base: Record<string, unknown> = {
    "@type": "Person",
    name: a.name,
    url: `${SITE.url}/avtory/${a.slug}`,
    jobTitle: a.role,
    image: `${SITE.url}${a.photo}`,
  };
  if (!full) return base;
  return {
    ...base,
    description: a.short,
    knowsAbout: a.focus,
    worksFor: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}
