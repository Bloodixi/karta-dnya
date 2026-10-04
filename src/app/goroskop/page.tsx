import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import PeriodNav from "@/components/PeriodNav";
import HoroscopeGrid from "@/components/HoroscopeGrid";
import { allHoroscopes, formatDateRu, todayKey } from "@/lib/daily";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Гороскоп на сегодня для всех знаков зодиака",
  description: "Точный гороскоп на сегодня для каждого знака зодиака: общий фон дня, любовь, работа и деньги, самочувствие и совет. Обновляется ежедневно.",
  alternates: { canonical: "/goroskop" },
};

export default function HoroscopePage() {
  const date = todayKey();
  const items = allHoroscopes("segodnya", date);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/goroskop", label: "Гороскоп" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Гороскоп на сегодня, {formatDateRu(date)}</h1>
      <p className="text-muted mt-2 max-w-2xl">Короткий прогноз для каждого знака: настроение дня, любовь, дела и один совет. Выберите знак, чтобы прочитать подробнее, или переключите период.</p>
      <div className="mt-4"><PeriodNav current="segodnya" /></div>
      <HoroscopeGrid items={items} period="segodnya" />
    </div>
  );
}
