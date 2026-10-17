"use client";

import { useEffect, useRef } from "react";

/**
 * Тонкая полоса прогресса чтения у верхнего края окна: доля прочитанного текста `#targetId`
 * (от начала текста до момента, когда его конец поднимается к низу экрана).
 * Ширина меняется через transform без анимации — при prefers-reduced-motion ничего не «плывёт».
 */
export default function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = document.getElementById(targetId);
    const b = bar.current;
    if (!el || !b) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : r.top < 0 ? 1 : 0;
      b.style.transform = `scaleX(${p})`;
      b.parentElement!.style.opacity = p > 0 && p < 1 ? "1" : p >= 1 ? "0.6" : "0";
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
  }, [targetId]);
  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-30 h-[3px] pointer-events-none opacity-0 motion-safe:transition-opacity motion-safe:duration-300">
      <div ref={bar} className="h-full origin-left bg-linear-to-r from-accent-soft via-accent to-gold" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}
