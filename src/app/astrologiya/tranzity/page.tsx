import type { Metadata } from "next";
import Link from "next/link";
import AuthorCard from "@/components/AuthorCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import MoonPhase from "@/components/MoonPhase";
import { horoscopeAuthor } from "@/lib/authors";
import { aspectRows, inSignRu, intoSignRu, monthEvents, mskDate, mskDateTime, mskTime, PHASE_EVENT_RU } from "@/lib/astro/calendar";
import { BODY_NAMES_RU, mskNoon, SIGN_NAMES_RU, sky } from "@/lib/astro/engine";
import { getAstroData } from "@/lib/astro/interpret";
import type { Faq as FaqItem } from "@/lib/content";
import { formatDateRu, todayKey } from "@/lib/daily";
import { PHASES } from "@/lib/moon";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Транзиты планет сегодня: аспекты дня и события месяца",
  description: "Транзиты на сегодня: планеты в знаках, точные аспекты дня и их характер, ретроградные планеты, переходы планет и фазы Луны на месяц вперёд. Расчёт на 12:00 МСК.",
  alternates: { canonical: "/astrologiya/tranzity" },
};

const FAQ: FaqItem[] = [
  { q: "Что такое транзит в астрологии?", a: "Текущее положение планеты на небе и её отношение к другим планетам или к точкам натальной карты. Общие транзиты — те, что одинаковы для всех: аспекты между планетами, переходы в знаки, ретроградность и фазы Луны. Именно они перечислены на этой странице." },
  { q: "Что значит орбис и «сходящийся» аспект?", a: "Орбис — отклонение от точного угла в градусах: чем он меньше, тем аспект заметнее. Сходящийся аспект ещё только приближается к точному, расходящийся — уже позади своего пика и ослабевает." },
  { q: "Как читать характер аспекта?", a: "Трин и секстиль традиционно считаются гармоничными — темы планет поддерживают друг друга; квадрат и оппозиция — напряжёнными, они требуют усилия и дают толчок; соединение нейтрально и зависит от самих планет." },
  { q: "Как транзиты попадают в гороскоп знака?", a: "Для каждого знака планеты раскладываются по солярным домам, аспекты взвешиваются по точности и темпу планет, и сильнейшие события становятся основой текста. Подробно — на странице «Как мы считаем»." },
];

export default function TransitsPage() {
  const key = todayKey();
  const now = mskNoon(key);
  const s = sky(now);
  const data = getAstroData();
  const rows = aspectRows(s);
  const retro = s.positions.filter((p) => p.retrograde);
  const ev = monthEvents(now, 31);
  const phase = PHASES[s.moon.phase];
  const author = horoscopeAuthor();
  const natureClass = (n: string) => (n === "harmonious" ? "text-accent" : n === "tense" ? "text-gold" : "text-muted");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/astrologiya", label: "Астрология" }, { href: "/astrologiya/tranzity", label: "Транзиты" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Транзиты планет на {formatDateRu(key)}</h1>
      <p className="text-muted mt-2 max-w-2xl">Небо дня для всех знаков: где стоят планеты, какие аспекты точны сегодня, кто ретрограден, и что ждёт в ближайший месяц. Из этих данных складываются наши гороскопы.</p>
      <p className="mono-text mt-2 normal-case">Рассчитано на {formatDateRu(key)}, 12:00 МСК · <Link href="/astrologiya/kak-my-schitaem" className="text-accent underline">как мы считаем</Link></p>

      <section className="mt-8 grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="card p-6">
          <h2 className="text-2xl">Планеты в знаках</h2>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 text-sm">
            {s.positions.map((p) => (
              <li key={p.body} className="flex justify-between gap-3 border-b border-line py-1.5">
                <span className="font-semibold">{BODY_NAMES_RU[p.body]}</span>
                <span className="text-muted">{Math.floor(p.degree)}° {SIGN_NAMES_RU[p.sign]}{p.retrograde ? " · R" : ""}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-6 text-center">
          <MoonPhase age={s.moon.age} size={120} className="mx-auto" title={phase.name} />
          <p className="mt-3 font-semibold">{phase.name}</p>
          <p className="text-sm text-muted">Луна {inSignRu(s.positions.find((p) => p.body === "moon")!.sign)} · освещённость {s.moon.illumination}%{s.moon.voidOfCourse ? " · без курса" : ""}</p>
          <p className="text-sm mt-2"><Link href="/astrologiya/luna-v-znake" className="text-accent underline">Луна в знаке</Link> · <Link href="/lunnyy-kalendar" className="text-accent underline">лунный день</Link></p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Аспекты дня</h2>
        {rows.length ? (
          <div className="prose overflow-x-auto" style={{ maxWidth: "none" }}>
            <table style={{ display: "table" }}>
              <thead><tr><th>Аспект</th><th>Характер</th><th>Орбис</th><th>Что значит</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.a}-${r.b}`}>
                    <td className="whitespace-nowrap"><strong>{r.aName}</strong> {data.aspects[r.kind]?.withText ?? r.kindName} <strong>{r.bName}</strong></td>
                    <td className={natureClass(r.nature)}>{r.natureName}</td>
                    <td className="whitespace-nowrap">{r.orb}°{r.applying ? " ↘" : " ↗"}</td>
                    <td>{r.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-muted">Точных мажорных аспектов сегодня нет.</p>}
        <p className="text-sm text-muted">Стрелка ↘ — аспект сходится (усиливается), ↗ — расходится. Орбис: отклонение от точного угла.</p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Ретроградные планеты сейчас</h2>
        {retro.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {retro.map((p) => {
              const end = ev.retro.find((e) => e.kind === "retro-end" && e.body === p.body);
              return (
                <div key={p.body} className="card p-4">
                  <p className="font-semibold">{BODY_NAMES_RU[p.body]} {p.body === "venus" ? "ретроградна" : "ретрограден"} {inSignRu(p.sign)}</p>
                  <p className="text-sm text-muted mt-1">{end ? `Директ ${mskDateTime(end.date, true)}` : "Разворот позже чем через месяц"}</p>
                  <p className="text-sm mt-2">{data.planets[p.body]?.retroShort}</p>
                </div>
              );
            })}
          </div>
        ) : <p className="text-muted">Сегодня все планеты движутся прямо.</p>}
        <p className="text-sm mt-3"><Link href="/astrologiya/retrogradnyy-merkuriy" className="text-accent underline">Календарь ретроградного Меркурия на два года</Link></p>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl mb-3">Планеты меняют знак: месяц вперёд</h2>
          {ev.planetIngresses.length || ev.retro.length ? (
            <ul className="grid gap-2 text-sm">
              {[...ev.planetIngresses, ...ev.retro].sort((a, b) => a.date.localeCompare(b.date)).map((e) => (
                <li key={`${e.kind}-${e.body}-${e.date}`} className="card p-3 flex gap-3">
                  <span className="mono-text whitespace-nowrap">{mskDate(e.date)}</span>
                  <span>
                    {e.kind === "ingress" && <>{BODY_NAMES_RU[e.body]} переходит {intoSignRu(e.sign!)} в {mskTime(e.date)} — {data.planets[e.body]?.themes[0]}: {data.signs[e.sign!]?.ingressText}</>}
                    {e.kind === "retro-start" && <>{BODY_NAMES_RU[e.body]} разворачивается в ретроградное движение {inSignRu(e.sign!)} в {mskTime(e.date)}</>}
                    {e.kind === "retro-end" && <>{BODY_NAMES_RU[e.body]} возвращается к прямому движению {inSignRu(e.sign!)} в {mskTime(e.date)}</>}
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="text-muted">В ближайший месяц планеты остаются в своих знаках.</p>}
        </div>
        <div>
          <h2 className="text-2xl mb-3">Фазы и знаки Луны: месяц вперёд</h2>
          <ul className="grid gap-2 text-sm">
            {ev.phases.map((e) => (
              <li key={`${e.kind}-${e.date}`} className="card p-3 flex gap-3 border-gold">
                <span className="mono-text whitespace-nowrap">{mskDate(e.date)}</span>
                <span><strong>{PHASE_EVENT_RU[e.kind]}</strong> {inSignRu(e.sign!)} в {mskTime(e.date)}</span>
              </li>
            ))}
          </ul>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-accent underline">Все переходы Луны по знакам ({ev.moonIngresses.length})</summary>
            <ul className="grid gap-1 text-sm mt-2">
              {ev.moonIngresses.map((e) => (
                <li key={e.date} className="flex gap-3 border-b border-line py-1">
                  <span className="mono-text whitespace-nowrap">{mskDate(e.date)}, {mskTime(e.date)}</span>
                  <Link href={`/astrologiya/luna-v-znake/${e.sign}`} className="hover:text-accent">Луна {intoSignRu(e.sign!)}</Link>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </section>

      {author && <AuthorCard author={author} className="mt-10" />}

      <Faq items={FAQ} />

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Что это значит для вашего знака</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/goroskop" className="btn btn-ghost">Гороскоп на сегодня</Link>
          <Link href="/goroskop/nedelya" className="btn btn-ghost">На неделю</Link>
          <Link href="/goroskop/mesyats" className="btn btn-ghost">На месяц</Link>
          <Link href="/goroskop/god" className="btn btn-ghost">На год</Link>
          <Link href="/astrologiya/natalnaya-karta" className="btn btn-ghost">Натальная карта</Link>
        </div>
      </section>
    </div>
  );
}
