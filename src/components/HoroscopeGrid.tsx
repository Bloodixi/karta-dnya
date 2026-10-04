import Link from "next/link";
import type { Horoscope, PeriodKey } from "@/lib/daily";

export default function HoroscopeGrid({ items, period }: { items: Horoscope[]; period: PeriodKey }) {
  if (!items.length) return <p className="mt-6 text-muted">Гороскоп готовится.</p>;
  const href = (slug: string) => (period === "segodnya" ? `/goroskop/${slug}` : `/goroskop/${slug}/${period}`);
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((h) => (
        <Link key={h.sign.slug} href={href(h.sign.slug)} className="card card-hover p-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{h.sign.symbol}</span>
            <div>
              <p className="font-semibold text-lg">{h.sign.name}</p>
              <p className="text-xs text-muted">{h.sign.dates}</p>
            </div>
            <span className="ml-auto chip">{h.mood}</span>
          </div>
          <p className="text-sm mt-3 line-clamp-3">{h.general}</p>
          <p className="text-xs text-muted mt-3">
            Любовь <span className="stars">{"★".repeat(h.score.love)}</span> · Дела <span className="stars">{"★".repeat(h.score.career)}</span> · Энергия <span className="stars">{"★".repeat(h.score.energy)}</span>
          </p>
        </Link>
      ))}
    </div>
  );
}
