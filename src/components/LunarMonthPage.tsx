import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import MoonPhase from "@/components/MoonPhase";
import { inSignRu, mskTime } from "@/lib/astro/calendar";
import { formatDateRu, todayKey } from "@/lib/daily";
import { PHASES } from "@/lib/moon";
import { eclipseKindRu, isLinkedMonth, lunarMonth, MONTH_NOTES, monthLabel, nextMonth, prevMonth, type LunarMonth } from "@/lib/moon-month";

const PHASE_RU = { "new-moon": "Новолуние", "first-quarter": "Первая четверть", "full-moon": "Полнолуние", "last-quarter": "Последняя четверть" } as const;
const WEEKDAY = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

const dayMonth = (key: string) => formatDateRu(key, { day: "numeric", month: "long" });
const dayNum = (key: string) => Number(key.slice(8));

function firstOf(m: LunarMonth, kind: "new-moon" | "full-moon") {
  return m.phases.find((p) => p.kind === kind) ?? null;
}

/** «9 и 24 ноября» / «9 ноября». */
function datesList(keys: string[], gen: string): string {
  if (!keys.length) return "";
  const nums = keys.map(dayNum);
  return nums.length === 1 ? `${nums[0]} ${gen}` : `${nums.slice(0, -1).join(", ")} и ${nums.at(-1)} ${gen}`;
}

function eclipseText(m: LunarMonth): string {
  return m.eclipses
    .map((e) => `${dayMonth(e.day)} — ${eclipseKindRu(e.kind)} ${e.type === "solar" ? "солнечное" : "лунное"} затмение`)
    .join("; ");
}

export function lunarMonthMetadata(key: string): Metadata {
  const L = monthLabel(key);
  const m = lunarMonth(key);
  const nm = m.phases.filter((p) => p.kind === "new-moon").map((p) => p.day);
  const fm = m.phases.filter((p) => p.kind === "full-moon").map((p) => p.day);
  const dates = [nm.length ? `новолуние ${datesList(nm, L.gen)}` : "", fm.length ? `полнолуние ${datesList(fm, L.gen)}` : ""].filter(Boolean).join(", ");
  let description = `Лунный календарь на ${L.nom} ${L.year} года: лунный день, фаза и знак Луны на каждый день${dates ? `, ${dates}` : ""}.`;
  for (const tail of [m.eclipses.length ? " Затмения месяца." : " Растущая и убывающая Луна.", " Ответы на частые вопросы.", " Даты фаз."]) {
    if (description.length + tail.length <= 160 && description.length < 140) description += tail;
  }
  return {
    title: `Лунный календарь на ${L.nom} ${L.year} — фазы и лунные дни`,
    description,
    alternates: { canonical: `/lunnyy-kalendar/${key}` },
  };
}

export default function LunarMonthPage({ month }: { month: string }) {
  const L = monthLabel(month);
  const m = lunarMonth(month);
  const today = todayKey();
  const prev = prevMonth(month);
  const next = nextMonth(month);
  const nm = firstOf(m, "new-moon");
  const fm = firstOf(m, "full-moon");
  const phaseDays = new Map(m.phases.map((p) => [p.day, p]));
  const eclipseDays = new Map(m.eclipses.map((e) => [e.day, e]));
  const waxing = m.spans.filter((s) => s.waxing);
  const waning = m.spans.filter((s) => !s.waxing);
  const span = (s: { from: string; to: string }) => (s.from === s.to ? `${dayNum(s.from)}` : `${dayNum(s.from)}–${dayNum(s.to)}`);
  const title = `${L.nom[0].toUpperCase()}${L.nom.slice(1)} ${L.year}`;

  const faq = [
    nm && { q: `Когда новолуние ${L.loc} ${L.year} года?`, a: `${dayMonth(nm.day)} в ${mskTime(nm.iso)} по Москве, Луна ${inSignRu(nm.sign)}. В дни около новолуния принято планировать и отдыхать, а начинать новое — уже на растущей Луне.` },
    fm && { q: `Когда полнолуние ${L.loc} ${L.year} года?`, a: `${dayMonth(fm.day)} в ${mskTime(fm.iso)} по Москве, Луна ${inSignRu(fm.sign)}. Полнолуние — кульминация цикла: хорошо завершать начатое и не торопиться с резкими решениями.` },
    {
      q: `Есть ли затмения ${L.loc} ${L.year}?`,
      a: m.eclipses.length ? `Да: ${eclipseText(m)}. Затмения приходятся на новолуние (солнечные) или полнолуние (лунные), и в астрологии эти дни советуют проводить спокойно.` : `Нет, ${L.loc} ${L.year} года затмений нет. Ближайшие затмения отмечены в календарях соседних месяцев.`,
    },
    waxing.length > 0 && {
      q: `В какие дни ${L.gen} Луна растёт?`,
      a: `${L.loc[0].toUpperCase()}${L.loc.slice(1)} ${L.year} года растущая Луна — ${waxing.map(span).join(" и ")} ${L.gen}, убывающая — ${waning.map(span).join(" и ")} ${L.gen}. Растущую Луну традиционно выбирают для начинаний и стрижки, убывающую — для уборки и завершения дел.`,
    },
  ].filter((x): x is { q: string; a: string } => Boolean(x));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/lunnyy-kalendar", label: "Лунный календарь" }, { href: `/lunnyy-kalendar/${month}`, label: title }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Лунный календарь на {L.nom} {L.year}</h1>
      <p className="text-muted mt-3 max-w-3xl text-lg">
        {L.loc[0].toUpperCase()}
        {L.loc.slice(1)} {L.year} года {m.days.length} {m.days.length === 31 ? "день" : "дней"}, и Луна проходит {m.signs} {m.signs >= 5 ? "знаков" : "знака"} зодиака.
        {nm && <> Новолуние — {dayMonth(nm.day)} {inSignRu(nm.sign)}.</>}
        {fm && <> Полнолуние — {dayMonth(fm.day)} {inSignRu(fm.sign)}.</>}
        {m.eclipses.length > 0 && <> Затмения: {eclipseText(m)}.</>}
      </p>

      <section className="mt-8" aria-labelledby="key-dates">
        <h2 id="key-dates" className="text-2xl mb-3">Главные даты месяца</h2>
        <dl className="card overflow-hidden grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {m.phases.map((p) => (
            <div key={p.iso} className="bg-surface p-4">
              <dt className="mono">{PHASE_RU[p.kind]}</dt>
              <dd className="display text-xl mt-1">
                <Link href={`/lunnyy-kalendar/${p.day}`} className="hover:text-accent-text">{dayMonth(p.day)}</Link>
              </dd>
              <dd className="text-sm text-muted">
                {mskTime(p.iso)} МСК · Луна {inSignRu(p.sign)}
              </dd>
            </div>
          ))}
          {m.eclipses.map((e) => (
            <div key={e.iso} className="bg-surface p-4">
              <dt className="mono">{e.type === "solar" ? "Солнечное" : "Лунное"} затмение</dt>
              <dd className="display text-xl mt-1">
                <Link href={`/lunnyy-kalendar/${e.day}`} className="hover:text-accent-text">{dayMonth(e.day)}</Link>
              </dd>
              <dd className="text-sm text-muted">
                {eclipseKindRu(e.kind)}, пик в {mskTime(e.iso)} МСК
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10" aria-labelledby="all-days">
        <h2 id="all-days" className="text-2xl mb-3">Все дни {L.gen}</h2>
        <div className="overflow-x-auto card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th scope="col" className="p-2 sm:p-3 font-normal">Дата</th>
                <th scope="col" className="p-2 sm:p-3 font-normal">Лунный день</th>
                <th scope="col" className="p-2 sm:p-3 font-normal">Фаза</th>
                <th scope="col" className="p-2 sm:p-3 font-normal">Луна в знаке</th>
              </tr>
            </thead>
            <tbody>
              {m.days.map((d) => {
                const ev = phaseDays.get(d.key);
                const ecl = eclipseDays.get(d.key);
                const isToday = d.key === today;
                return (
                  <tr key={d.key} className={`border-t border-line ${isToday ? "bg-accent/10" : ""}`} aria-current={isToday ? "date" : undefined}>
                    <td className="p-2 sm:p-3 whitespace-nowrap">
                      <Link href={`/lunnyy-kalendar/${d.key}`} className="text-accent-text underline">
                        {dayMonth(d.key)}
                      </Link>
                      <span className="text-muted">, {WEEKDAY[new Date(`${d.key}T12:00:00Z`).getUTCDay()]}</span>
                      {isToday && <span className="text-muted"> · сегодня</span>}
                    </td>
                    <td className="p-2 sm:p-3">{d.lunarDay}-й</td>
                    <td className="p-2 sm:p-3">
                      <span className="flex items-center gap-2">
                        <MoonPhase age={d.age} size={20} className="shrink-0" />
                        <span>
                          {PHASES[d.phase].name}
                          {ev && <strong className="block text-accent-text">{PHASES[d.phase].name === PHASE_RU[ev.kind] ? "точно" : PHASE_RU[ev.kind]} в {mskTime(ev.iso)}</strong>}
                          {ecl && <strong className="block text-accent-text">{eclipseKindRu(ecl.kind)} {ecl.type === "solar" ? "солнечное" : "лунное"} затмение</strong>}
                        </span>
                      </span>
                    </td>
                    <td className="p-2 sm:p-3">
                      <Link href={`/astrologiya/luna-v-znake/${d.sign.slug}`} className="hover:text-accent-text">{d.sign.name}</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted mt-2">Лунный день и фаза — на 12:00 по Москве, как на страницах дней; моменты фаз и затмений — точное московское время.</p>
      </section>

      <section className="prose mt-10">
        <h2>Растущая и убывающая Луна {L.loc}</h2>
        <p>
          Растущая Луна {L.loc} {L.year} года — {waxing.map(span).join(" и ")} {L.gen}, убывающая — {waning.map(span).join(" и ")} {L.gen}. На растущей Луне традиционно начинают дела, знакомятся, стригутся, чтобы волосы росли быстрее, и сажают то, что тянется вверх. Убывающая Луна подходит для уборки, завершения проектов, разбора долгов и работы с корнеплодами.
        </p>
        <p>{MONTH_NOTES[L.month - 1]}</p>
        <p>
          Что значит каждая фаза, разобрано в статье <Link href="/astrologiya/fazy-luny-znachenie">фазы Луны и их значение</Link>, а как совмещать календарь с обычной жизнью — в материале <Link href="/astrologiya/lunnyy-kalendar-kak-polzovatsya">как пользоваться лунным календарём</Link>. Через какой знак проходит Луна прямо сейчас, показывает страница <Link href="/astrologiya/luna-v-znake">Луна в знаке</Link>{nm && <>, а в новолуние можно провести <Link href="/praktiki/ritual-na-novolunie">ритуал на новолуние</Link></>}.
        </p>
      </section>

      <nav className="mt-8 flex flex-wrap gap-2 justify-between text-sm" aria-label="Соседние месяцы">
        {isLinkedMonth(prev, today) ? <Link href={`/lunnyy-kalendar/${prev}`} className="btn btn-ghost">← {monthLabel(prev).nom} {monthLabel(prev).year}</Link> : <span />}
        <Link href="/lunnyy-kalendar" className="btn btn-ghost">Лунный календарь на сегодня</Link>
        {isLinkedMonth(next, today) ? <Link href={`/lunnyy-kalendar/${next}`} className="btn btn-ghost">{monthLabel(next).nom} {monthLabel(next).year} →</Link> : <span />}
      </nav>

      <Faq items={faq} />
    </div>
  );
}
