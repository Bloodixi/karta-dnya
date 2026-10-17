import Link from "next/link";
import type { PeriodKey } from "@/lib/daily";
import ActiveIntoView from "./ActiveIntoView";

/** Порядок и короткие подписи вкладок: на 390 px первые пять помещаются целиком, «вчера» — последней, за прокруткой. */
const TABS: { key: PeriodKey; label: string }[] = [
  { key: "segodnya", label: "Сегодня" },
  { key: "zavtra", label: "Завтра" },
  { key: "nedelya", label: "Неделя" },
  { key: "mesyats", label: "Месяц" },
  { key: "god", label: "Год" },
  { key: "vchera", label: "Вчера" },
];

/**
 * Переключатель периодов: для знака — /goroskop/<znak>/<period>, для общего списка — /goroskop/<period>.
 * На телефоне — одна строка с горизонтальной прокруткой (без переноса), активный период виден сразу,
 * край ленты гаснет, пока за ним есть вкладки; зона нажатия ≥ 40 px. Без current ни одна вкладка не выделена.
 */
export default function PeriodNav({ current, sign }: { current?: PeriodKey; sign?: string }) {
  const href = (p: PeriodKey) => {
    if (sign) return p === "segodnya" ? `/goroskop/${sign}` : `/goroskop/${sign}/${p}`;
    return p === "segodnya" ? "/goroskop" : `/goroskop/${p}`;
  };
  return (
    <ActiveIntoView
      label="Период гороскопа"
      className="-mx-4 px-4 flex gap-1.5 overflow-x-auto snap-x scroll-px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0 sm:gap-2 sm:flex-wrap sm:overflow-visible"
    >
      {TABS.map(({ key, label }) => {
        const on = key === current;
        return (
          <Link
            key={key}
            href={href(key)}
            aria-current={on ? "page" : undefined}
            className={`btn shrink-0 snap-start whitespace-nowrap justify-center min-h-10 !py-2 !px-3 sm:!px-3.5 ${
              on ? "" : "btn-ghost !border-line !text-muted hover:!border-accent hover:!text-accent-ink"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </ActiveIntoView>
  );
}
