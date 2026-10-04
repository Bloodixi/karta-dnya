import Link from "next/link";
import { PERIODS, PERIOD_KEYS, type PeriodKey } from "@/lib/daily";

/** Переключатель периодов: для знака — /goroskop/<znak>/<period>, для общего списка — /goroskop/<period>. */
export default function PeriodNav({ current, sign }: { current: PeriodKey; sign?: string }) {
  const href = (p: PeriodKey) => {
    if (sign) return p === "segodnya" ? `/goroskop/${sign}` : `/goroskop/${sign}/${p}`;
    return p === "segodnya" ? "/goroskop" : `/goroskop/${p}`;
  };
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Период гороскопа">
      {PERIOD_KEYS.map((p) => (
        <Link key={p} href={href(p)} className={`btn !py-1.5 !px-3 text-sm ${p === current ? "" : "btn-ghost"}`} aria-current={p === current ? "page" : undefined}>
          {PERIODS[p].title}
        </Link>
      ))}
    </nav>
  );
}
