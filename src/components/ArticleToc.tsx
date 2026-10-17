"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";

export type ArticleTocItem = { id: string; title: string };

/** Отступ сверху, на котором заголовок считается «текущим»: шапка сайта (~70 px) и немного воздуха. */
const ACTIVE_OFFSET = 120;

/** Id раздела, до которого дочитали: последний h2, чей верх уже выше линии под шапкой. В самом конце страницы — последний раздел. */
function useActiveHeading(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = id;
        else break;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom && current && ids.length) current = ids[ids.length - 1];
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ids]);
  return active;
}

/**
 * Оглавление статьи с подсветкой текущего раздела.
 * `rail` — боковая колонка на десктопе: активный пункт отмечен акцентной чертой поверх линии слева.
 * В мобильном раскрывающемся блоке переход по пункту закрывает блок.
 */
export default function ArticleToc({ items, rail = false }: { items: ArticleTocItem[]; rail?: boolean }) {
  // Стабильный массив id, пока не изменился состав разделов: иначе подписка на прокрутку перезапускалась бы на каждом рендере.
  const key = items.map((t) => t.id).join("\n");
  const ids = useMemo(() => (key ? key.split("\n") : []), [key]);
  const active = useActiveHeading(ids);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const details = e.currentTarget.closest("details");
    if (details) details.open = false;
  };

  return (
    <ol className="mt-2 space-y-1.5 text-sm">
      {items.map((t) => {
        const on = t.id === active;
        return (
          <li key={t.id} className="relative">
            {rail && (
              <span
                aria-hidden="true"
                className={`absolute -left-[17px] top-0 bottom-0 w-0.5 bg-accent motion-safe:transition-opacity motion-safe:duration-200 ${on ? "opacity-100" : "opacity-0"}`}
              />
            )}
            <a
              href={`#${t.id}`}
              onClick={onClick}
              aria-current={on ? "location" : undefined}
              className={`leading-snug block py-0.5 motion-safe:transition-colors ${on ? "text-ink" : "text-muted hover:text-ink"}`}
            >
              {!rail && <span aria-hidden="true" className={`inline-block w-3 ${on ? "text-accent-text" : "text-transparent"}`}>•</span>}
              {t.title}
            </a>
          </li>
        );
      })}
    </ol>
  );
}
