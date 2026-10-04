import Link from "next/link";
import { SECTIONS, SECTION_KEYS, SITE } from "@/lib/site";

export default function Header() {
  return (
    <header className="border-b border-line bg-surface/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link href="/" className="display text-xl font-semibold tracking-tight">
          <span className="text-gold">✦</span> {SITE.name}
        </Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" aria-label="Разделы">
          {SECTION_KEYS.map((k) => (
            <Link key={k} href={`/${k}`} className="hover:text-ink">
              {SECTIONS[k].short}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex gap-2 text-sm">
          <Link href="/karta-dnya" className="btn btn-ghost !py-1.5 !px-3">
            Карта дня
          </Link>
          <Link href="/goroskop" className="btn !py-1.5 !px-3">
            Гороскоп
          </Link>
        </div>
      </div>
    </header>
  );
}
