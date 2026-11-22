"use client";

import Link from "next/link";
import { reachGoal } from "@/components/MetrikaCounter";
import { formatDate, parseDate } from "@/lib/numerology";

/** Адрес платной совместимости; /sovmestimost-razbor принимает даты как ?a=…&b=… (ГГГГ-ММ-ДД) и сразу показывает бесплатную часть. */
export function compatHref(a?: string, b?: string): string {
  const x = parseDate(a);
  const y = parseDate(b);
  if (x && y) return `/sovmestimost-razbor?a=${x.iso}&b=${y.iso}#teaser`;
  return x ? `/sovmestimost-razbor?a=${x.iso}#forma` : "/sovmestimost-razbor";
}

/**
 * Приглашение к платной совместимости пары. from — метка страницы для цели «razbor_cta_click» (product: compat).
 * Если страница знает даты — подставляем их, и /sovmestimost-razbor сразу покажет бесплатную часть.
 */
export default function CompatCta({ from, a, b, className = "mt-10" }: { from: string; a?: string; b?: string; className?: string }) {
  const x = parseDate(a);
  const y = parseDate(b);
  const ctaLabel = x && y ? `Открыть разбор пары ${formatDate(x)} и ${formatDate(y)}` : x ? `Проверить пару для ${formatDate(x)}` : "Бесплатная часть для пары";
  return (
    <aside className={`card p-5 md:p-6 max-w-3xl flex flex-col sm:flex-row sm:items-center gap-4 ${className}`}>
      <div className="flex-1">
        <p className="display text-xl">Совместимость пары по датам рождения</p>
        <p className="text-sm text-muted mt-1">Образ вашей пары, любовь, быт, где вы спорите и как договариваться, ваш общий год — одним связным текстом.</p>
      </div>
      <Link href={compatHref(a, b)} className="btn self-start sm:self-center sm:whitespace-nowrap" onClick={() => reachGoal("razbor_cta_click", { from, product: "compat" })}>
        {ctaLabel}
      </Link>
    </aside>
  );
}
