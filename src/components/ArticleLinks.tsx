import Link from "next/link";
import { articlesFor } from "@/lib/article-links";

/** Блок «Подробнее по теме»: 1–3 статьи для страницы-инструмента по карте src/lib/article-links.ts. */
export default function ArticleLinks({ path, title = "Подробнее по теме", className = "max-w-3xl" }: { path: string | string[]; title?: string; className?: string }) {
  const items = articlesFor(path);
  if (!items.length) return null;
  return (
    <section className={`mt-10 ${className}`.trim()} aria-labelledby="article-links">
      <h2 id="article-links" className="text-2xl mb-3">{title}</h2>
      <ul className="card divide-y divide-line">
        {items.map((a) => (
          <li key={a.section + a.slug}>
            <Link href={`/${a.section}/${a.slug}`} className="flex items-baseline justify-between gap-3 px-4 py-3 min-h-11 hover:text-accent-text">
              <span className="font-semibold leading-snug">{a.title}</span>
              <span className="mono shrink-0">{a.readingMinutes} мин</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
