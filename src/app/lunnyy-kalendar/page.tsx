import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import MoonPhase from "@/components/MoonPhase";
import MoonStrip from "@/components/MoonStrip";
import Starfield from "@/components/Starfield";
import TelegramDaily from "@/components/TelegramDaily";
import Faq from "@/components/Faq";
import { formatDateRu, shiftKey, todayKey } from "@/lib/daily";
import { dayInfo, LUNAR_DAYS, monthDays, PHASES } from "@/lib/moon";
import { moonIllumination, mskNoon } from "@/lib/astro/engine";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Лунный календарь на сегодня: лунный день и фаза Луны",
  description: "Лунный календарь на сегодня и на месяц: фаза Луны, лунный день, знак Луны, благоприятные дни для стрижки, посадок и важных дел.",
  alternates: { canonical: "/lunnyy-kalendar" },
};

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const FAQ = [
  { q: "Как считается лунный день?", a: "Лунный день начинается с восхода Луны; в календаре на сайте он определяется по возрасту Луны на московский полдень, как в большинстве массовых календарей." },
  { q: "Почему в месяце бывает 29 или 30 лунных дней?", a: "Лунный цикл длится 29,53 суток, поэтому 30-й день случается не каждый месяц и обычно короткий." },
  { q: "Когда лучше стричься по лунному календарю?", a: "Традиционно на растущей Луне и в «сильные» лунные дни; на 9, 15, 23 и 29 день стрижку обычно откладывают." },
];

const plural = (n: number, one: string, few: string, many: string) =>
  n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many;

/** Ближайший день (не раньше завтра), с которого начинается фаза `phase`. */
function nextPhaseStart(today: string, phase: "new" | "full"): { key: string; inDays: number } | null {
  let prev = dayInfo(today).phase;
  for (let i = 1; i <= 31; i++) {
    const key = shiftKey(today, i);
    const cur = dayInfo(key).phase;
    if (cur === phase && prev !== phase) return { key, inDays: i };
    prev = cur;
  }
  return null;
}

export default function LunarPage() {
  const key = todayKey();
  const today = dayInfo(key);
  const [y, m] = key.split("-").map(Number);
  const days = monthDays(y, m);
  const ld = LUNAR_DAYS[today.lunarDay];
  const ph = PHASES[today.phase];
  const monthName = formatDateRu(key, { month: "long", year: "numeric" });
  // Освещённость — тем же расчётом и на тот же момент (12:00 МСК), что на «Луне в знаке», целым процентом.
  const illum = Math.round(moonIllumination(mskNoon(key)));
  // Смещение первого числа под строку «Пн…Вс» (неделя с понедельника).
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const upcoming = [
    { label: "Полнолуние", next: nextPhaseStart(key, "full") },
    { label: "Новолуние", next: nextPhaseStart(key, "new") },
  ]
    .filter((u): u is { label: string; next: { key: string; inDays: number } } => u.next !== null)
    .sort((a, b) => a.next.inDays - b.next.inDays);
  const tips = [
    { t: "Благоприятно", v: ld.good },
    { t: "Лучше избегать", v: ld.avoid },
    { t: "Стрижка", v: ld.hair },
    { t: "Сад и огород", v: ld.garden },
  ];
  return (
    <div>
      {/* Ночная шапка: крупная Луна текущей фазы и лента фаз на 30 дней. Тень Луны — «ночная» в обеих темах. */}
      <section className="night" style={{ "--moon-shadow": "#34323a" } as React.CSSProperties}>
        <Starfield />
        <div className="relative mx-auto max-w-6xl px-4 pt-6 pb-14 md:pb-16">
          <div className="[&_.text-ink]:text-[var(--night-ink)] [&_a:hover]:text-[var(--night-ink)]">
            <Breadcrumbs items={[{ href: "/lunnyy-kalendar", label: "Лунный календарь" }]} />
          </div>
          <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr] items-center mt-4 md:mt-2">
            <div className="order-2 md:order-1">
              <p className="mono mb-4">сегодня · {formatDateRu(key, { weekday: "long" })} · {today.lunarDay}-й лунный день</p>
              <h1 className="text-3xl md:text-5xl leading-[1.1]">Лунный календарь на {formatDateRu(key)}</h1>
              <p className="display text-xl md:text-2xl mt-4 text-[var(--accent-soft)]">{ph.name}</p>
              <p className="text-muted mt-3 max-w-xl md:text-lg">{ph.text}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="chip">символ дня: {ld.symbol}</span>
                <Link href={`/goroskop/${today.sign.slug}`} className="chip hover:border-[var(--gold)] hover:text-[var(--night-ink)]">Луна в знаке {today.sign.name}</Link>
              </div>
              {upcoming.length > 0 && (
                <dl className="mt-6 grid grid-cols-2 gap-px max-w-md border border-[var(--night-line)] rounded-[4px] overflow-hidden bg-[var(--night-line)]">
                  {upcoming.map((u) => (
                    <div key={u.label} className="bg-[var(--night)]">
                      <Link href={`/lunnyy-kalendar/${u.next.key}`} className="block p-3 hover:bg-[var(--night-2)]">
                        <dt className="mono">{u.label}</dt>
                        <dd className="display text-lg mt-1">{formatDateRu(u.next.key, { day: "numeric", month: "long" })}</dd>
                        <dd className="text-xs text-muted">через {u.next.inDays} {plural(u.next.inDays, "день", "дня", "дней")}</dd>
                      </Link>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            <div className="order-1 md:order-2 justify-self-center grid justify-items-center">
              <div className="relative grid place-items-center">
                <div aria-hidden="true" className="absolute inset-[-22%] rounded-full bg-[radial-gradient(closest-side,rgba(207,195,227,0.2),rgba(207,195,227,0.05)_62%,transparent)]" />
                <div aria-hidden="true" className="absolute inset-[-8%] rounded-full border border-[var(--gold)] opacity-35" />
                <MoonPhase age={today.age} size={260} className="relative w-36 h-36 sm:w-52 sm:h-52 md:w-64 md:h-64" title={`${ph.name}, освещённость ${illum}%`} />
              </div>
              <p className="mono mt-6 text-center">освещённость {illum}% · на 12:00 МСК</p>
            </div>
          </div>
          <div className="mt-10">
            <h2 className="mono mb-3">Луна на 30 дней</h2>
            <MoonStrip today={key} />
          </div>
        </div>
      </section>
      <div className="night-edge" />

      <div className="mx-auto max-w-6xl px-4 py-8">
      <section aria-labelledby="today-tips">
        <h2 id="today-tips" className="text-2xl mb-3">{today.lunarDay}-й лунный день: что делать</h2>
        <div className="card overflow-hidden grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {tips.map((x) => (
            <div key={x.t} className="bg-surface p-4">
              <p className="mono mb-1">{x.t}</p>
              <p>{x.v}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted mt-3">Подробнее о дне — на странице <Link href={`/lunnyy-kalendar/${key}`} className="text-accent-text underline">{formatDateRu(key, { day: "numeric", month: "long" })}</Link>.</p>
      </section>
      <TelegramDaily campaign="lunnyy-kalendar" text="Лунный день, фаза и карта дня — каждое утро в 8:00 по Москве. Коротко и без рекламы." />

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Календарь на {monthName}</h2>
        <div className="hidden sm:grid grid-cols-7 gap-2 mb-2" aria-hidden="true">
          {WEEKDAYS.map((w) => <p key={w} className="mono text-center">{w}</p>)}
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {Array.from({ length: lead }, (_, i) => <div key={`lead-${i}`} className="hidden sm:block" aria-hidden="true" />)}
          {days.map((d) => {
            const isToday = d.key === key;
            return (
              <Link key={d.key} href={`/lunnyy-kalendar/${d.key}`} aria-current={isToday ? "date" : undefined} className={`card card-hover p-2 text-center ${isToday ? "ring-2 ring-accent !bg-accent/10" : ""}`}>
                <p className={`text-xs ${isToday ? "font-semibold text-accent-text" : "text-muted"}`}>{Number(d.key.slice(8))}{isToday && <span className="sr-only">, сегодня</span>}</p>
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
    </div>
  );
}
