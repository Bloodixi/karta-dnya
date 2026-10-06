import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import MoonPhase from "@/components/MoonPhase";
import Faq from "@/components/Faq";
import { formatDateRu, todayKey } from "@/lib/daily";
import { dayInfo, LUNAR_DAYS, monthDays, PHASES } from "@/lib/moon";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Лунный календарь на сегодня: лунный день и фаза Луны",
  description: "Лунный календарь на сегодня и на месяц: фаза Луны, лунный день, знак Луны, благоприятные дни для стрижки, посадок и важных дел.",
  alternates: { canonical: "/lunnyy-kalendar" },
};

const FAQ = [
  { q: "Как считается лунный день?", a: "Лунный день начинается с восхода Луны; в календаре на сайте он определяется по возрасту Луны на московский полдень, как в большинстве массовых календарей." },
  { q: "Почему в месяце бывает 29 или 30 лунных дней?", a: "Лунный цикл длится 29,53 суток, поэтому 30-й день случается не каждый месяц и обычно короткий." },
  { q: "Когда лучше стричься по лунному календарю?", a: "Традиционно на растущей Луне и в «сильные» лунные дни; на 9, 15, 23 и 29 день стрижку обычно откладывают." },
];

export default function LunarPage() {
  const key = todayKey();
  const today = dayInfo(key);
  const [y, m] = key.split("-").map(Number);
  const days = monthDays(y, m);
  const ld = LUNAR_DAYS[today.lunarDay];
  const ph = PHASES[today.phase];
  const monthName = formatDateRu(key, { month: "long", year: "numeric" });
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/lunnyy-kalendar", label: "Лунный календарь" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Лунный календарь на {formatDateRu(key)}</h1>
      <div className="card p-6 mt-6 grid gap-6 md:grid-cols-[160px_1fr] items-center">
        <div className="text-center">
          <MoonPhase age={today.age} size={140} className="mx-auto" title={ph.name} />
          <p className="text-sm text-muted mt-2">освещённость {today.illumination}%</p>
        </div>
        <div>
          <p className="text-2xl display">{today.lunarDay}-й лунный день · {ph.name}</p>
          <p className="text-muted">Луна в знаке <Link href={`/goroskop/${today.sign.slug}`} className="text-accent underline">{today.sign.name}</Link> · символ дня: {ld.symbol}</p>
          <p className="mt-3">{ph.text}</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
            <div className="card p-3"><p className="font-semibold">Благоприятно</p><p className="text-muted">{ld.good}</p></div>
            <div className="card p-3"><p className="font-semibold">Лучше избегать</p><p className="text-muted">{ld.avoid}</p></div>
            <div className="card p-3"><p className="font-semibold">Стрижка</p><p className="text-muted">{ld.hair}</p></div>
            <div className="card p-3"><p className="font-semibold">Сад и огород</p><p className="text-muted">{ld.garden}</p></div>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Календарь на {monthName}</h2>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {days.map((d) => {
            const isToday = d.key === key;
            return (
              <Link key={d.key} href={`/lunnyy-kalendar/${d.key}`} className={`card card-hover p-2 text-center ${isToday ? "border-gold" : ""}`}>
                <p className="text-xs text-muted">{Number(d.key.slice(8))}</p>
                <MoonPhase age={d.age} size={34} className="mx-auto my-1" />
                <p className="text-xs">{d.lunarDay} л.д.</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="prose mt-10">
        <h2>Как пользоваться лунным календарём</h2>
        <p>Растущая Луна, от новолуния до полнолуния, подходит для начинаний, роста и накопления: стартовать проекты, стричься для быстрого роста волос, сажать то, что растёт над землёй. Убывающая Луна помогает завершать, очищать и отпускать: уборка, лечение, корнеплоды, разбор долгов. Полнолуние и новолуние лучше оставить для отдыха и планирования. Подробнее в статье <Link href="/astrologiya/lunnyy-kalendar-kak-polzovatsya">как пользоваться фазами Луны</Link>.</p>
      </section>
      <Faq items={FAQ} />
    </div>
  );
}
