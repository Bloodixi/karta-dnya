"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "./Icons";

const TABS: { href: string; title: string; icon: IconName }[] = [
  { href: "/karta-dnya", title: "Карта дня", icon: "card" },
  { href: "/goroskop", title: "Гороскоп", icon: "sun" },
  { href: "/lunnyy-kalendar", title: "Луна", icon: "calendar" },
  { href: "/sonnik", title: "Сонник", icon: "moon" },
];

/** Нижняя панель на телефоне: ежедневные разделы под большим пальцем. На десктопе скрыта. */
export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Быстрые переходы"
      className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[0.75rem] leading-none ${active ? "text-accent" : "text-muted"}`}
              >
                <Icon name={t.icon} size={22} />
                <span>{t.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
