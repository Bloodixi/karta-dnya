import Link from "next/link";
import { todayKey } from "@/lib/daily";
import { FORECAST_YEAR } from "@/lib/horoscopeYear";

/**
 * Ссылка на подробный гороскоп на 2027 год: с /goroskop, страниц знаков и вкладки «Год».
 * Показывается, пока год прогноза не закончился.
 */
export default function Year2027Teaser({ sign, name, className = "mt-4" }: { sign?: string; name?: string; className?: string }) {
  if (Number(todayKey().slice(0, 4)) > FORECAST_YEAR) return null;
  const href = sign ? `/goroskop/${sign}/${FORECAST_YEAR}` : `/goroskop/${FORECAST_YEAR}`;
  return (
    <Link href={href} className={`card block p-4 hover:border-accent ${className}`}>
      <span className="mono">год {FORECAST_YEAR}</span>
      <span className="block font-semibold mt-1">
        {name ? `${name}: гороскоп на ${FORECAST_YEAR} год →` : `Гороскоп на ${FORECAST_YEAR} год для всех знаков →`}
      </span>
      <span className="block text-sm text-muted mt-1">Любовь, работа и деньги, силы и отдых, прогноз по сезонам и лучшие месяцы года.</span>
    </Link>
  );
}
