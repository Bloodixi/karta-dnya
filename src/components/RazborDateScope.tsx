"use client";

import { createContext, Suspense, useContext, useState } from "react";
import { useSearchParams } from "next/navigation";
import RazborCta from "@/components/RazborCta";
import { parseDate } from "@/lib/numerology";

/**
 * Дата для приглашения к разбору на статических страницах: из поля даты калькулятора внутри области
 * (событие change всплывает до обёртки, сам калькулятор не меняется) или из адреса `?d=ГГГГ-ММ-ДД`.
 * Так «Бесплатная часть по твоей дате» сразу открывает /razbor с этой датой.
 */
const DateCtx = createContext("");

export default function RazborDateScope({ children }: { children: React.ReactNode }) {
  const [typed, setTyped] = useState("");
  function onChange(e: React.FormEvent<HTMLDivElement>) {
    const el = e.target;
    if (el instanceof HTMLInputElement && el.type === "date") setTyped(parseDate(el.value)?.iso ?? "");
  }
  return (
    <DateCtx.Provider value={typed}>
      <div className="contents" onChange={onChange}>
        {children}
      </div>
    </DateCtx.Provider>
  );
}

function FromUrl({ from, className, typed }: { from: string; className?: string; typed: string }) {
  const url = parseDate(useSearchParams().get("d") ?? undefined)?.iso ?? "";
  return <RazborCta from={from} className={className} date={typed || url || undefined} />;
}

/** RazborCta с датой из области RazborDateScope или из адреса страницы. */
export function ScopedRazborCta({ from, className }: { from: string; className?: string }) {
  const typed = useContext(DateCtx);
  return (
    <Suspense fallback={<RazborCta from={from} className={className} date={typed || undefined} />}>
      <FromUrl from={from} className={className} typed={typed} />
    </Suspense>
  );
}
