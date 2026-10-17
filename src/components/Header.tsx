import Image from "next/image";
import Link from "next/link";
import { SECTIONS, SECTION_KEYS, SITE } from "@/lib/site";
import ThemeToggle from "./ThemeToggle";
import MobileMenu from "./MobileMenu";
import Icon, { type IconName } from "./Icons";

const MENU_TOOLS: { href: string; title: string; icon: IconName; paid?: string }[] = [
  { href: "/karta-dnya", title: "Карта дня", icon: "card" },
  { href: "/goroskop", title: "Гороскоп", icon: "sun" },
  { href: "/lunnyy-kalendar", title: "Лунный календарь", icon: "calendar" },
  { href: "/sovmestimost", title: "Совместимость", icon: "hearts" },
  { href: "/chislo-sudby", title: "Число судьбы", icon: "hash" },
  { href: "/taro/da-net", title: "Да или нет", icon: "ball" },
  { href: "/razbor", title: "Разбор по дате рождения", icon: "scroll", paid: "личный документ" },
];

export default function Header() {
  return (
    <header className="border-b border-line bg-bg/85 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-6xl px-4 py-2 md:py-3 flex items-center gap-x-6 gap-y-2 md:flex-wrap">
        <Link href="/" className="display text-xl tracking-tight inline-flex items-center gap-2 min-h-11 whitespace-nowrap">
          <Image src="/logo-56.webp" alt="" width={28} height={28} className="rounded-md" priority /> {SITE.name}
        </Link>
        <nav className="hidden md:flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" aria-label="Разделы">
          {SECTION_KEYS.map((k) => (
            <Link key={k} href={`/${k}`} className="py-1 hover:text-ink">
              {SECTIONS[k].short}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          {/* На самых узких экранах (<360px) лупы в шапке нет — поиск остаётся в нижней панели. */}
          <span className="contents max-[359px]:hidden">
            <Link href="/poisk" aria-label="Поиск по сайту" title="Поиск" className="icon-badge !w-11 !h-11 md:!w-9 md:!h-9 shrink-0 hover:border-accent hover:text-accent">
              <Icon name="search" size={18} />
            </Link>
          </span>
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
