import Link from "next/link";
import ZodiacSign from "./ZodiacSign";
import type { Horoscope, PeriodKey } from "@/lib/daily";

const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

/** «23 сентября — 22 октября» → «23.09–22.10» (для узких ячеек); если формат не распознан — null. */
function shortDates(dates: string): string | null {
  const parts = dates.split(/\s*[—–-]\s*/).map((p) => p.trim().match(/^(\d{1,2})\s+(\S+)$/));
  if (parts.length !== 2 || parts.some((m) => !m || MONTHS.indexOf(m[2]) < 0)) return null;
  return parts.map((m) => `${m![1].padStart(2, "0")}.${String(MONTHS.indexOf(m![2]) + 1).padStart(2, "0")}`).join("–");
}

/**
 * Даты знака без рваных переносов: каждая половина не разрывается, тире не начинает строку.
 * short — на телефоне короткий формат «23.09–22.10», с sm — полный.
 */
export function SignDates({ dates, short = false }: { dates: string; short?: boolean }) {
  const [from, to] = dates.split(/\s*[—–]\s*/);
  const full = to ? (
    <>
      <span className="whitespace-nowrap">{from}{"\u00a0—"}</span> <span className="whitespace-nowrap">{to}</span>
    </>
  ) : (
    dates
  );
  const s = short ? shortDates(dates) : null;
  if (!s) return full;
  return (
    <>
      <span className="sm:hidden whitespace-nowrap">{s}</span>
      <span className="hidden sm:inline">{full}</span>
    </>
  );
}

/** «Метка ★★★☆☆» одной строкой: заполненные звёзды акцентом, пустые — цветом линий. */
function Score({ label, n }: { label: string; n: number }) {
  const v = Math.max(0, Math.min(5, Math.round(n)));
  return (
    <span className="whitespace-nowrap">
      {label}{" "}
      <span role="img" aria-label={`${v} из 5`}>
        <span className="text-accent" aria-hidden="true">{"★".repeat(v)}</span>
        <span className="text-line" aria-hidden="true">{"★".repeat(5 - v)}</span>
      </span>
    </span>
  );
}

export default function HoroscopeGrid({ items, period }: { items: Horoscope[]; period: PeriodKey }) {
  if (!items.length) return <p className="mt-6 text-muted">Гороскоп готовится.</p>;
  const href = (slug: string) => (period === "segodnya" ? `/goroskop/${slug}` : `/goroskop/${slug}/${period}`);
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((h) => (
        <Link key={h.sign.slug} href={href(h.sign.slug)} className="card card-hover p-5">
          <div className="flex items-center gap-3">
            <ZodiacSign symbol={h.sign.symbol} element={h.sign.element} slug={`grid-${h.sign.slug}`} size={48} className="shrink-0" />
            <div>
              <p className="font-semibold text-lg">{h.sign.name}</p>
              <p className="text-xs text-muted"><SignDates dates={h.sign.dates} /></p>
            </div>
            <span className="ml-auto chip">{h.mood}</span>
          </div>
          <p className="text-sm mt-3 line-clamp-3">{h.general}</p>
          <p className="text-xs text-muted mt-3">
            <Score label="Любовь" n={h.score.love} /> · <Score label="Дела" n={h.score.career} /> · <Score label="Энергия" n={h.score.energy} />
          </p>
        </Link>
      ))}
    </div>
  );
}
