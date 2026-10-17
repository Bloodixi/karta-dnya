"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Горизонтально прокручиваемая полоса, которая при открытии страницы сдвигается так, чтобы элемент с aria-current был виден.
 * Сдвигаем только scrollLeft самой полосы — страница по вертикали не прыгает.
 */
export default function ActiveIntoView({ className, label, children }: { className?: string; label: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = ref.current;
    const cur = nav?.querySelector<HTMLElement>("[aria-current]");
    if (!nav || !cur || nav.scrollWidth <= nav.clientWidth) return;
    const left = cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2;
    nav.scrollLeft = Math.max(0, left);
  }, []);
  return (
    <nav ref={ref} className={className} aria-label={label}>
      {children}
    </nav>
  );
}
