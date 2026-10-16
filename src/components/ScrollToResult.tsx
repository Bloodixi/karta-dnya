"use client";

import { useEffect, useRef } from "react";

/**
 * После отправки GET-формы страница открывается вверху, а результат — ниже экрана.
 * Если `when`, один раз после монтирования плавно прокручивает к элементу `id`,
 * оставляя место под липкую шапку. Уважает prefers-reduced-motion.
 * Для повторной прокрутки при новых параметрах на той же странице дайте компоненту `key`.
 */
export default function ScrollToResult({ id, when }: { id: string; when: boolean }) {
  const done = useRef(false);

  useEffect(() => {
    if (!when || done.current) return;
    const el = document.getElementById(id);
    if (!el) return;
    done.current = true;

    const header = document.querySelector<HTMLElement>("body > header");
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const offset = Math.max(margin, (header?.offsetHeight ?? 0) + 16);
    const top = el.getBoundingClientRect().top;
    // Результат уже на виду в верхней части экрана — не дёргаем страницу.
    if (top >= offset && top < window.innerHeight * 0.4) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Небольшая задержка: даём отрисоваться раскладке и шрифтам.
    const t = window.setTimeout(() => {
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "instant" : "smooth" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [id, when]);

  return null;
}
