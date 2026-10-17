"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "./Icons";

/** Сонник: закрытый глаз (сон), в стиле линейных иконок Icons.tsx. Полумесяц занят «Луной». */
function SleepIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 10c2.4 3.2 5.4 4.8 9 4.8s6.6-1.6 9-4.8" />
      <path d="M6.2 13.4 4.8 15.6M12 14.8v2.6M17.8 13.4l1.4 2.2" />
      <path d="M15.5 3.5h3l-3 3h3" />
    </svg>
  );
}

const TABS: { href: string; title: string; icon: IconName | "sleep" }[] = [
  { href: "/karta-dnya", title: "Карта дня", icon: "card" },
  { href: "/goroskop", title: "Гороскоп", icon: "sun" },
  { href: "/lunnyy-kalendar", title: "Луна", icon: "moon" },
  { href: "/sonnik", title: "Сонник", icon: "sleep" },
  { href: "/poisk", title: "Поиск", icon: "search" },
];

/** Нижняя панель на телефоне: ежедневные разделы под большим пальцем. На десктопе скрыта. */
export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Быстрые переходы"
      className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[0.75rem] leading-none ${
                  active
                    ? "text-accent-text font-medium before:absolute before:inset-x-4 before:top-0 before:h-0.5 before:rounded-full before:bg-accent"
                    : "text-muted"
                }`}
              >
                {t.icon === "sleep" ? <SleepIcon size={22} /> : <Icon name={t.icon} size={22} />}
                <span>{t.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
