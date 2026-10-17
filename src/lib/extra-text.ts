import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import type { Faq } from "./content";

/**
 * Дополнительный текст к странице-инструменту: Markdown с frontmatter `faq`.
 * `content/tools/<name>.md` — тексты бывших статей, поглощённых инструментами (старые адреса — 301 в next.config.ts);
 */
export type ExtraText = { html: string; faq: Faq[] };

const DIRS = {
  tools: path.join(process.cwd(), "content", "tools"),
} as const;

export async function getExtraText(kind: keyof typeof DIRS, name: string): Promise<ExtraText | null> {
  if (!/^[a-z0-9-]+$/.test(name)) return null;
  const file = path.join(DIRS[kind], `${name}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const html = String(await remark().use(remarkGfm).use(remarkHtml, { sanitize: true }).process(content));
  const faq = Array.isArray(data.faq) ? (data.faq as Faq[]).filter((x) => x && x.q && x.a) : [];
  return { html, faq };
}

/** Вопросы страницы + вопросы текста без повторов (по началу вопроса). */
export function mergeFaq(own: Faq[], extra: Faq[] | undefined): Faq[] {
  const key = (q: string) => q.toLowerCase().replace(/[^а-яёa-z0-9]/g, "").slice(0, 24);
  const seen = new Set(own.map((x) => key(x.q)));
  return [...own, ...(extra ?? []).filter((x) => !seen.has(key(x.q)))];
}
