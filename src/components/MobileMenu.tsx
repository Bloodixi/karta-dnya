"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon, { type IconName } from "./Icons";

type Item = { href: string; title: string; icon: IconName };

/** Меню разделов для телефона: кнопка в шапке раскрывает панель под ней. Закрывается при переходе, по Escape и касанием вне панели.
 *  Пока меню открыто: страница затемнена подложкой (поверх неё и нижней панели), прокрутка страницы заблокирована. */
export default function MobileMenu({ sections, tools }: { sections: Item[]; tools: Item[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);

  // Закрыть при смене страницы.
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: PointerEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    // Блокировка прокрутки страницы под меню.
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    // Шапку поднимаем над подложкой и нижней панелью (у шапки z-20, у TabBar z-30, у подложки z-[35]).
    const header = root.current?.closest("header");
    const prevZ = header?.style.zIndex ?? "";
    if (header) header.style.zIndex = "40";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      html.style.overflow = prevOverflow;
      if (header) header.style.zIndex = prevZ;
    };
  }, [open]);

  return (
    <div ref={root} className="md:hidden">
      {/* Подложка в body: у шапки backdrop-filter, внутри неё fixed не растянется на весь экран. */}
      {open && createPortal(<div aria-hidden="true" className="md:hidden fixed inset-0 z-[35] bg-night/50" />, document.body)}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Закрыть меню" : "Открыть меню разделов"}
        className="icon-badge !w-11 !h-11 cursor-pointer text-ink"
      >
        <Icon name={open ? "close" : "menu"} size={20} />
      </button>
      <div
        id="mobile-menu"
        hidden={!open}
        className="absolute left-0 right-0 top-full border-b border-line bg-surface shadow-[0_12px_24px_-12px_rgb(0_0_0/0.25)] max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain"
      >
        <nav aria-label="Меню разделов" className="mx-auto max-w-6xl px-4 pt-3 pb-5">
          <ul className="grid grid-cols-2 gap-2">
            {sections.map((s) => {
              const active = pathname === s.href || pathname.startsWith(s.href + "/");
              return (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-[2px] border px-3 text-[0.98rem] ${active ? "border-accent text-accent-text" : "border-line text-ink"}`}
                  >
                    <Icon name={s.icon} size={20} className="shrink-0 text-accent" />
                    {s.title}
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mono mt-5 mb-2">Инструменты</p>
          <ul className="grid grid-cols-2 gap-2">
            {tools.map((t) => {
              const active = pathname === t.href;
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-[2px] border px-3 text-[0.95rem] ${active ? "border-accent text-accent-text" : "border-line text-ink"}`}
                  >
                    <Icon name={t.icon} size={20} className="shrink-0 text-accent" />
                    {t.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
