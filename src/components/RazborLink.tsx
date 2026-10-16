"use client";

import Link from "next/link";
import { reachGoal } from "@/components/MetrikaCounter";
import { parseDate } from "@/lib/numerology";

/** Адрес лендинга разбора; /razbor принимает дату как ?d=ГГГГ-ММ-ДД и сразу показывает бесплатную часть. */
export function razborHref(date?: string): string {
  const d = parseDate(date);
  return d ? `/razbor?d=${d.iso}#razbor-teaser` : "/razbor";
}

/** Вход в разбор: ссылка с целью «razbor_cta_click» и параметром from (откуда пришли). */
export default function RazborLink({ from, date, className, children }: { from: string; date?: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={razborHref(date)} className={className} onClick={() => reachGoal("razbor_cta_click", { from })}>
      {children}
    </Link>
  );
}
