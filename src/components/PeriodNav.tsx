import Link from "next/link";
import { PERIODS, PERIOD_KEYS, type PeriodKey } from "@/lib/daily";
import ActiveIntoView from "./ActiveIntoView";

/**
 * Переключатель периодов: для знака — /goroskop/<znak>/<period>, для общего списка — /goroskop/<period>.
 * На телефоне — одна строка с горизонтальной прокруткой (без переноса в три ряда), активный период виден сразу; зона нажатия ≥ 40 px.
 */
export default function PeriodNav({ current, sign }: { current: PeriodKey; sign?: string }) {
  const href = (p: PeriodKey) => {
    if (sign) return p === "segodnya" ? `/goroskop/${sign}` : `/goroskop/${sign}/${p}`;
    return p === "segodnya" ? "/goroskop" : `/goroskop/${p}`;
  };
  return (
    <ActiveIntoView
      label="Период гороскопа"
      className="-mx-4 px-4 flex gap-2 overflow-x-auto snap-x scroll-px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible"
    >
      {PERIOD_KEYS.map((p) => {
        const on = p === current;
        return (
          <Link
            key={p}
            href={href(p)}
            aria-current={on ? "page" : undefined}
            className={`btn shrink-0 snap-start whitespace-nowrap justify-center min-h-10 !py-2 !px-3.5 ${
              on ? "" : "btn-ghost !border-line !text-muted hover:!border-accent hover:!text-accent-ink"
            }`}
          >
            {PERIODS[p].title}
          </Link>
        );
      })}
    </ActiveIntoView>
  );
}
