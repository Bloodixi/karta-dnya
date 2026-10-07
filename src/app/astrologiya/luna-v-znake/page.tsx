import type { Metadata } from "next";
import Link from "next/link";
import AuthorCard from "@/components/AuthorCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import MoonPhase from "@/components/MoonPhase";
import { horoscopeAuthor } from "@/lib/authors";
import { inSignRu, intoSignRu, moonIngresses, mskDate, mskDateTime, mskTime } from "@/lib/astro/calendar";
import { mskNoon, SIGN_NAMES_RU, sky } from "@/lib/astro/engine";
import { getAstroData } from "@/lib/astro/interpret";
import { SIGNS } from "@/lib/astro/types";
import { getMoonSigns } from "@/lib/moonSigns";
import { formatDateRu, todayKey } from "@/lib/daily";
import { PHASES } from "@/lib/moon";
import type { Faq as FaqItem } from "@/lib/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Луна в знаке зодиака сегодня и календарь на месяц",
  description: "В каком знаке Луна сегодня, когда перейдёт в следующий, фаза Луны и таблица переходов по знакам на месяц вперёд. Что значит Луна в каждом знаке.",
  alternates: { canonical: "/astrologiya/luna-v-znake" },
};

const FAQ: FaqItem[] = [
  { q: "Сколько Луна находится в одном знаке?", a: "Около двух с половиной суток: полный круг по зодиаку Луна проходит за 27,3 дня. Поэтому за месяц она успевает побывать во всех двенадцати знаках, а переходы случаются каждые два-три дня." },
  { q: "Чем Луна в знаке отличается от лунного дня?", a: "Лунный день считается от новолуния и описывает фазу цикла, а знак Луны — её положение на зодиакальном круге. Это два независимых ритма: в один и тот же лунный день Луна может быть в любом знаке." },
  { q: "Что такое Луна без курса?", a: "Отрезок перед выходом Луны из знака, когда она уже не образует точных аспектов к планетам. Традиционно в это время не начинают важных дел; длится от нескольких минут до суток." },
  { q: "На какое время рассчитаны переходы?", a: "На московское время по современным эфемеридам с точностью до минуты. В других часовых поясах дата перехода может сдвинуться на сутки." },
];

export default function MoonInSignPage() {
  const key = todayKey();
  const now = mskNoon(key);
  const s = sky(now);
  const moon = s.positions.find((p) => p.body === "moon")!;
  const data = getAstroData();
  const ms = getMoonSigns();
  const list = moonIngresses(now, 31);
  const exit = list[0];
  const phase = PHASES[s.moon.phase];
  const author = horoscopeAuthor();
  const current = ms.find((m) => m.slug === moon.sign);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/astrologiya", label: "Астрология" }, { href: "/astrologiya/luna-v-znake", label: "Луна в знаке" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Луна в знаке сегодня, {formatDateRu(key)}</h1>
      <p className="text-muted mt-2 max-w-2xl">Знак Луны меняется каждые два-три дня и задаёт эмоциональный фон для всех. Ниже — где Луна сейчас, когда перейдёт дальше и календарь переходов на месяц.</p>

      <div className="card p-6 mt-6 grid gap-6 md:grid-cols-[160px_1fr] items-center">
        <div className="text-center">
          <MoonPhase age={s.moon.age} size={140} className="mx-auto" title={phase.name} />
          <p className="text-sm text-muted mt-2">освещённость {s.moon.illumination}%</p>
        </div>
        <div>
          <p className="mono">сейчас</p>
          <p className="text-2xl display mt-1">Луна {inSignRu(moon.sign)} · {phase.name.toLowerCase()}</p>
          <p className="text-muted mt-1">
            {Math.floor(moon.degree)}° {SIGN_NAMES_RU[moon.sign]}
            {exit && <> · переходит {intoSignRu(exit.sign)} {mskDateTime(exit.date)}</>}
            {s.moon.voidOfCourse && <> · Луна без курса</>}
          </p>
          <p className="mt-3">{current?.meaning ?? data.signs[moon.sign]?.moonText}</p>
          <p className="mt-3 text-sm">
            <Link href={`/astrologiya/luna-v-znake/${moon.sign}`} className="text-accent underline">Подробнее о Луне {inSignRu(moon.sign)}</Link>
            {" · "}
            <Link href="/lunnyy-kalendar" className="text-accent underline">Лунный день и фаза</Link>
          </p>
          <p className="mono-text mt-3 normal-case">Рассчитано на {formatDateRu(key)}, 12:00 МСК · <Link href="/astrologiya/kak-my-schitaem" className="text-accent underline">как мы считаем</Link></p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Переходы Луны по знакам на месяц</h2>
        <div className="prose overflow-x-auto" style={{ maxWidth: "none" }}>
          <table style={{ display: "table" }}>
            <thead><tr><th>Дата (МСК)</th><th>Время</th><th>Луна переходит</th><th>Фон</th></tr></thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.date}>
                  <td>{mskDate(e.date)}</td>
                  <td>{mskTime(e.date)}</td>
                  <td><Link href={`/astrologiya/luna-v-znake/${e.sign}`}>{intoSignRu(e.sign)}</Link></td>
                  <td>{data.signs[e.sign]?.moonText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Луна в каждом знаке</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SIGNS.map((slug) => {
            const m = ms.find((x) => x.slug === slug);
            return (
              <Link key={slug} href={`/astrologiya/luna-v-znake/${slug}`} className={`card card-hover p-4 ${slug === moon.sign ? "border-gold" : ""}`}>
                <p className="font-semibold">{m?.title ?? `Луна ${inSignRu(slug)}`}{slug === moon.sign && <span className="chip ml-2">сейчас</span>}</p>
                <p className="text-sm text-muted mt-1 line-clamp-2">{data.signs[slug]?.moonText}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {author && <AuthorCard author={author} className="mt-10" />}

      <Faq items={FAQ} />

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Рядом по теме</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/lunnyy-kalendar" className="btn btn-ghost">Лунный календарь</Link>
          <Link href="/astrologiya/tranzity" className="btn btn-ghost">Транзиты дня</Link>
          <Link href="/astrologiya/retrogradnyy-merkuriy" className="btn btn-ghost">Ретроградный Меркурий</Link>
          <Link href="/goroskop" className="btn btn-ghost">Гороскоп на сегодня</Link>
          <Link href="/astrologiya/natalnaya-karta" className="btn btn-ghost">Натальная карта</Link>
        </div>
      </section>
    </div>
  );
}
