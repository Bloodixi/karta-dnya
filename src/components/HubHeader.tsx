import Link from "next/link";
import type { ReactNode } from "react";
import { IconBadge, type IconName } from "./Icons";

/** Общая шапка хаба раздела: иконка раздела, H1, лид и ряд chip-ссылок (на телефоне занимают одну-две строки, а не экран кнопок). */
export default function HubHeader({ icon, title, lede, links = [], className = "" }: { icon?: IconName; title: ReactNode; lede?: ReactNode; links?: { href: string; title: string }[]; className?: string }) {
  return (
    <header className={className}>
      <div className="flex items-center gap-3 sm:gap-4">
        {icon && <IconBadge name={icon} className="!w-12 !h-12 sm:!w-14 sm:!h-14 shrink-0" />}
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight min-w-0">{title}</h1>
      </div>
      {lede && <p className="text-muted mt-3 max-w-2xl text-lg">{lede}</p>}
      {links.length > 0 && (
        <nav aria-label="Инструменты раздела" className="mt-4 flex flex-wrap gap-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="chip hover:text-ink hover:border-gold">
              {l.title}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
