import { getArticle, getArticles, type Article } from "./content";
import { SITE, type SectionKey } from "./site";

/** RSS для Дзена по https://dzen.ru/help/ru/website/rss-modify.html: полная статья в content:encoded,
 *  только разрешённые теги, обложка JPEG ≥700 px (webp Дзен не берёт — /rss/dzen/<slug>.jpg). */

const MAX_ITEMS = 100;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function cdata(s: string): string {
  return `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

const cell = (s: string) => s.replace(/<\/?t[hd][^>]*>/g, "").trim();

/** Таблица → список: «<b>первая ячейка</b> — заголовок: значение; …» (таблиц в Дзене нет). */
function tableToList(table: string): string {
  const rows = [...table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => cell(c[1])));
  if (rows.length < 2) return "";
  const [head, ...body] = rows;
  const items = body.map((r) => {
    const rest = r.slice(1).map((v, i) => (r.length > 2 && head[i + 1] ? `${head[i + 1].toLowerCase()}: ${v}` : v));
    return `<li><b>${r[0]}</b> — ${rest.join("; ")}</li>`;
  });
  return `<ul>${items.join("")}</ul>`;
}

/** HTML статьи (remark-html) → подмножество тегов Дзена, ссылки абсолютные. */
export function dzenHtml(html: string): string {
  return html
    .replace(/<table>[\s\S]*?<\/table>/g, tableToList)
    .replace(/<(\/?)strong>/g, "<$1b>")
    .replace(/<(\/?)em>/g, "<$1i>")
    .replace(/<(\/?)del>/g, "<$1s>")
    .replace(/<\/?(code|pre|span)[^>]*>/g, "")
    .replace(/<hr\s*\/?>/g, "")
    .replace(/<(\/?)h[56]([^>]*)>/g, "<$1h4$2>")
    .replace(/<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>/g, "<li>$1</li>")
    .replace(/href="\/(?!\/)/g, `href="${SITE.url}/`)
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function body(a: Article): string {
  const url = `${SITE.url}/${a.section}/${a.slug}`;
  const faq = a.faq.length
    ? `<h2>Частые вопросы</h2>${a.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}`
    : "";
  const img = a.cover ? `<figure><img src="${SITE.url}/rss/dzen/${a.slug}.jpg" alt="${esc(a.title)}"></figure>` : "";
  return `<h1>${esc(a.title)}</h1>${img}${dzenHtml(a.html)}${faq}<p>Статья и калькуляторы на сайте: <a href="${url}">${SITE.name}</a>.</p>`;
}

/** Дата статьи (YYYY-MM-DD) → RFC 822, 09:00 по Москве. */
function pubDate(date: string): string {
  const d = new Date(`${date}T09:00:00+03:00`);
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString().replace("GMT", "+0000");
}

export async function dzenFeed(now = new Date()): Promise<string> {
  const metas = getArticles()
    .filter((m) => m.date && new Date(`${m.date}T09:00:00+03:00`) <= now)
    .slice(0, MAX_ITEMS);
  const items: string[] = [];
  for (const m of metas) {
    const a = await getArticle(m.section as SectionKey, m.slug);
    if (!a) continue;
    const url = `${SITE.url}/${a.section}/${a.slug}`;
    items.push(`<item>
<title>${esc(a.title)}</title>
<link>${url}</link>
<pdalink>${url}</pdalink>
<guid>${url}</guid>
<pubDate>${pubDate(a.date)}</pubDate>
<media:rating scheme="urn:simple">nonadult</media:rating>
<category>format-article</category>
<category>index</category>
<category>comment-all</category>
${a.cover ? `<enclosure url="${SITE.url}/rss/dzen/${a.slug}.jpg" type="image/jpeg"/>` : ""}
<description>${cdata(a.description)}</description>
<content:encoded>${cdata(body(a))}</content:encoded>
</item>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:georss="http://www.georss.org/georss">
<channel>
<title>${esc(SITE.name)}</title>
<link>${SITE.url}</link>
<description>Статьи о таро, астрологии, нумерологии и камнях</description>
<language>ru</language>
${items.join("\n")}
</channel>
</rss>
`;
}
