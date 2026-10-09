import Link from "next/link";
import type { ArticleMeta } from "@/lib/content";
import { SECTIONS } from "@/lib/site";
import Icon from "./Icons";

export default function ArticleCard({ a, showSection = false }: { a: ArticleMeta; showSection?: boolean }) {
  return (
    <Link href={`/${a.section}/${a.slug}`} className="card card-hover overflow-hidden flex flex-col">
      {a.cover && (
        // eslint-disable-next-line @next/next/no-img-element -- next/image без оптимизации не даёт srcset
        <img src={a.cover.thumb} width={600} height={338} alt="" loading="lazy" decoding="async" className="w-full h-auto block aspect-video object-cover border-b border-line" />
      )}
      <div className="p-5 flex flex-col gap-2 flex-1">
        {showSection && (
          <span className="chip self-start">
            <Icon name={SECTIONS[a.section].icon} size={14} /> {SECTIONS[a.section].short}
          </span>
        )}
        <h3 className="text-lg font-semibold leading-snug">{a.title}</h3>
        <p className="text-muted text-sm line-clamp-3">{a.description}</p>
        <p className="text-xs text-muted mt-auto">{a.readingMinutes} мин чтения</p>
      </div>
    </Link>
  );
}
