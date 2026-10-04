import Link from "next/link";
import type { ArticleMeta } from "@/lib/content";
import { SECTIONS } from "@/lib/site";

export default function ArticleCard({ a, showSection = false }: { a: ArticleMeta; showSection?: boolean }) {
  return (
    <Link href={`/${a.section}/${a.slug}`} className="card card-hover p-5 flex flex-col gap-2">
      {showSection && (
        <span className="chip self-start">
          {SECTIONS[a.section].emoji} {SECTIONS[a.section].short}
        </span>
      )}
      <h3 className="text-lg font-semibold leading-snug">{a.title}</h3>
      <p className="text-muted text-sm line-clamp-3">{a.description}</p>
      <p className="text-xs text-muted mt-auto">{a.readingMinutes} мин чтения</p>
    </Link>
  );
}
