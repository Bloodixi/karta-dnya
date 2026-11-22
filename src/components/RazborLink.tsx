"use client";

import Link from "next/link";
import { reachGoal } from "@/components/MetrikaCounter";
import { cleanName, parseDate } from "@/lib/numerology";

/** Адрес лендинга разбора; /razbor принимает дату как ?d=ГГГГ-ММ-ДД и имя как &n=… и сразу показывает бесплатную часть. */
export function razborHref(date?: string, name?: string): string {
  const d = parseDate(date);
  if (!d) return "/razbor";
  const clean = cleanName(name);
  return `/razbor?d=${d.iso}${clean ? `&n=${encodeURIComponent(clean)}` : ""}#razbor-teaser`;
}

/** Вход в разбор: ссылка с целью «razbor_cta_click» и параметром from (откуда пришли). */
export default function RazborLink({ from, date, name, className, children }: { from: string; date?: string; name?: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={razborHref(date, name)} className={className} onClick={() => reachGoal("razbor_cta_click", { from })}>
      {children}
    </Link>
  );
}
