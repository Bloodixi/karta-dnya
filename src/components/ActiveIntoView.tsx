"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Горизонтально прокручиваемая полоса, которая при открытии страницы сдвигается так, чтобы элемент с aria-current был виден.
 * Сдвигаем только scrollLeft самой полосы — страница по вертикали не прыгает.
 * Если полоса не помещается, её край, за которым ещё есть элементы, плавно гаснет (mask-image) — подсказка, что ленту можно прокрутить.
 */
export default function ActiveIntoView({ className, label, children }: { className?: string; label: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const cur = nav.querySelector<HTMLElement>("[aria-current]");
    if (cur && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2);
    const update = () => {
      const max = nav.scrollWidth - nav.clientWidth;
      setEdges({ left: max > 1 && nav.scrollLeft > 4, right: max > 1 && nav.scrollLeft < max - 4 });
    };
    update();
    nav.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      nav.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  const fade = edges.left || edges.right
    ? `linear-gradient(to right, ${edges.left ? "transparent 0, #000 28px" : "#000 0"}, ${edges.right ? "#000 calc(100% - 40px), transparent 100%" : "#000 100%"})`
    : undefined;
  const style: CSSProperties | undefined = fade ? { maskImage: fade, WebkitMaskImage: fade } : undefined;
  return (
    <nav ref={ref} className={className} aria-label={label} style={style}>
      {children}
    </nav>
  );
}
