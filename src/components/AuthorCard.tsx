import Link from "next/link";
import { authorYears, type Author } from "@/lib/authors";

/** Карточка автора (E-E-A-T): фото, имя, роль, 1–2 строки био и ссылка на страницу автора. */
export default function AuthorCard({ author, note, className = "" }: { author: Author; note?: string; className?: string }) {
  return (
    <aside className={`card p-5 flex gap-4 items-start ${className}`} aria-label="Автор">
      {/* eslint-disable-next-line @next/next/no-img-element -- статичная картинка 512×512, оптимизация не нужна */}
      <img src={author.photo} alt={author.name} width={72} height={72} loading="lazy" decoding="async" className="w-[72px] h-[72px] rounded-full object-cover border border-line shrink-0" />
      <div className="min-w-0">
        <p className="mono">{note ?? "автор"}</p>
        <p className="font-semibold text-lg mt-0.5">
          <Link href={`/avtory/${author.slug}`} className="hover:text-accent">{author.name}</Link>
          <span className="text-muted font-normal text-sm"> · {author.role}, {authorYears(author)} лет практики</span>
        </p>
        <p className="text-sm text-muted mt-1">{author.short}</p>
        <p className="text-sm mt-2"><Link href={`/avtory/${author.slug}`} className="text-accent underline">Об авторе и методике</Link></p>
      </div>
    </aside>
  );
}
