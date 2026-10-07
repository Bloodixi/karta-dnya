import Link from "next/link";
import { SECTIONS, SECTION_KEYS, SITE } from "@/lib/site";
import ThemeToggle from "./ThemeToggle";
import MobileMenu from "./MobileMenu";

const MENU_TOOLS = [
  { href: "/karta-dnya", title: "Карта дня" },
  { href: "/goroskop", title: "Гороскоп" },
  { href: "/lunnyy-kalendar", title: "Лунный календарь" },
  { href: "/sovmestimost", title: "Совместимость" },
];

export default function Header() {
  return (
    <header className="border-b border-line bg-bg/85 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-6xl px-4 py-2 md:py-3 flex items-center gap-x-6 gap-y-2 md:flex-wrap">
        <Link href="/" className="display text-xl tracking-tight inline-flex items-center gap-2 min-h-11 whitespace-nowrap">
          <span aria-hidden="true" className="inline-block w-2.5 h-2.5 bg-gold rotate-45" /> {SITE.name}
        </Link>
        <nav className="hidden md:flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" aria-label="Разделы">
          {SECTION_KEYS.map((k) => (
            <Link key={k} href={`/${k}`} className="hover:text-ink">
              {SECTIONS[k].short}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <ThemeToggle />
          {/* Обёртка скрывает кнопки на телефоне: у .btn свой display, он перебивает hidden на самой ссылке. */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/karta-dnya" className="btn btn-ghost !py-1.5 !px-3">
              Карта дня
            </Link>
            <Link href="/goroskop" className="btn !py-1.5 !px-3">
              Гороскоп
            </Link>
          </div>
          <MobileMenu
            sections={SECTION_KEYS.map((k) => ({ href: `/${k}`, title: SECTIONS[k].short, icon: SECTIONS[k].icon }))}
            tools={MENU_TOOLS}
          />
        </div>
      </div>
    </header>
  );
}
