import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { allHoroscopes, formatDateRu, todayKey } from "@/lib/daily";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Гороскоп на сегодня для всех знаков зодиака",
  description: "Точный гороскоп на сегодня для каждого знака зодиака: общий фон дня, любовь, работа и деньги, самочувствие и совет. Обновляется ежедневно.",
  alternates: { canonical: "/goroskop" },
};

export default function HoroscopePage() {
  const date = todayKey();
  const items = allHoroscopes(date);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/goroskop", label: "Гороскоп" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Гороскоп на сегодня, {formatDateRu(date)}</h1>
      <p className="text-muted mt-2 max-w-2xl">Короткий прогноз для каждого знака: настроение дня, любовь, дела и один совет. Выберите знак, чтобы прочитать подробнее.</p>
      {items.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((h) => (
            <Link key={h.sign.slug} href={`/goroskop/${h.sign.slug}`} className="card card-hover p-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{h.sign.symbol}</span>
                <div>
                  <p className="font-semibold text-lg">{h.sign.name}</p>
                  <p className="text-xs text-muted">{h.sign.dates}</p>
                </div>
                <span className="ml-auto chip">{h.mood}</span>
              </div>
              <p className="text-sm mt-3 line-clamp-3">{h.general}</p>
              <p className="text-xs text-muted mt-3">Любовь <span className="stars">{"★".repeat(h.score.love)}</span> · Дела <span className="stars">{"★".repeat(h.score.career)}</span> · Энергия <span className="stars">{"★".repeat(h.score.energy)}</span></p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-muted">Гороскоп готовится.</p>
      )}
    </div>
  );
}
