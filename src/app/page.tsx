import type { Metadata } from "next";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import { SignDates } from "@/components/HoroscopeGrid";
import HomeTools from "@/components/HomeTools";
import { IconBadge } from "@/components/Icons";
import MoonPhase from "@/components/MoonPhase";
import RazborCta from "@/components/RazborCta";
import TarotCardView from "@/components/TarotCardView";
import TelegramDaily from "@/components/TelegramDaily";
import TomorrowCard from "@/components/TomorrowCard";
import { getArticles, getZodiac } from "@/lib/content";
import { cardOfDay, formatDateRu, shiftKey, todayKey } from "@/lib/daily";
import { dayInfo, LUNAR_DAYS, PHASES } from "@/lib/moon";
import { signByDate } from "@/lib/stones";
import { SECTIONS, SECTION_KEYS, TOOLS } from "@/lib/site";

export const revalidate = 3600;

/** Снимок «какой сегодня день»: дата, знак Солнца, знак Луны и лунный день — прямо в сниппете. */
function homeDescription(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  const sun = signByDate(month, day);
  const moon = dayInfo(date);
  const d = formatDateRu(date, { day: "numeric", month: "long" });
  const head = `Сегодня ${d}${sun ? `, по гороскопу — время знака ${sun.name}` : ""}, Луна в знаке ${moon.sign.name}, ${moon.lunarDay}-й лунный день.`;
  const tails = [
    " Карта Таро дня с толкованием и гороскоп на сегодня для каждого знака.",
    " Карта Таро дня и гороскоп на сегодня для каждого знака.",
    " Карта Таро дня и гороскоп для каждого знака.",
    " Карта Таро и гороскоп на сегодня.",
  ];
  return tails.map((t) => head + t).find((x) => x.length <= 160) || head.slice(0, 160);
}

export function generateMetadata(): Metadata {
  const date = todayKey();
  const d = formatDateRu(date, { day: "numeric", month: "long" });
  return {
    title: { absolute: `Карта дня на сегодня, ${d}: гороскоп, Таро, Луна` },
    description: homeDescription(date),
    alternates: { canonical: "/" },
  };
}

export default function Home() {
  const date = todayKey();
  const today = cardOfDay(date);
  const moon = dayInfo(date);
  const articles = getArticles().slice(0, 6);
  const zodiac = getZodiac();
  const [, month, day] = date.split("-").map(Number);
  const sun = signByDate(month, day);
  const ld = LUNAR_DAYS[moon.lunarDay];
  return (
    <div>
      <section className="night">
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-20 md:pt-16 md:pb-24 grid gap-10 md:grid-cols-[1.2fr_0.8fr] items-center">
          <div>
            <p className="mono mb-5">{formatDateRu(date)} · {moon.lunarDay}-й лунный день · Луна в знаке {moon.sign.name}</p>
            <h1 className="text-4xl md:text-6xl leading-[1.08]">Карта дня на сегодня.<br />Гороскоп без тумана.</h1>
            <p className="text-muted mt-5 max-w-xl text-lg">
              Каждый день: карта Таро, прогноз для вашего знака и лунный календарь. Коротко и спокойно, как повод присмотреться к дню.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/karta-dnya" className="btn">Открыть карту дня</Link>
              <Link href="/goroskop" className="btn btn-ghost">Гороскоп на сегодня</Link>
            </div>
          </div>
          {today && (
            <Link href="/karta-dnya" className="relative justify-self-center w-52 md:w-60 grid gap-3 text-center group">
              <span className="sticker absolute -left-6 top-5 z-10">карта дня</span>
              <div className="tcard-float">
                {/* LCP: на телефоне sizes занижен (106px × DPR 3 ≈ 320w), чтобы бралась 1x-картинка 35 КБ, а не @2x 110 КБ. */}
                <TarotCardView slug={today.card.slug} name={today.card.name} reversed={today.reversed} flipIn priority sizes="(min-width: 768px) 240px, 106px" />
              </div>
              <span className="grid gap-1">
                <span className="display text-xl md:text-2xl leading-tight group-hover:underline underline-offset-4">{today.card.name}</span>
                <span className="mono-text text-muted">{today.reversed ? "перевёрнутое положение" : "прямое положение"}</span>
              </span>
            </Link>
          )}
        </div>
      </section>
      <div className="night-edge" />

      <section className="mx-auto max-w-6xl px-4 pt-8">
        <div className="card grid md:grid-cols-3">
          <Link href={`/lunnyy-kalendar/${date}`} className="flex items-center gap-4 p-5 md:border-r border-b md:border-b-0 border-line group">
            <MoonPhase age={moon.age} size={52} className="shrink-0" />
            <span>
              <b className="block font-medium group-hover:text-accent">{PHASES[moon.phase].name}</b>
              <span className="text-sm text-muted">{moon.lunarDay}-й лунный день · освещено {moon.illumination}%</span>
            </span>
          </Link>
          <TomorrowCard campaign="home" variant="tile" className="md:border-r border-b md:border-b-0 border-line" />
          <Link href="/goroskop/zavtra" className="flex items-center gap-4 p-5 group">
            <span className="mono text-2xl tracking-normal text-accent">→</span>
            <span>
              <b className="block font-medium group-hover:text-accent">Гороскоп на завтра</b>
              <span className="text-sm text-muted">{formatDateRu(shiftKey(date, 1), { day: "numeric", month: "long" })}: что готовит день</span>
            </span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="ornament mb-5"><h2 className="text-3xl">Какой сегодня день по гороскопу</h2><span className="mono">{formatDateRu(date, { day: "numeric", month: "long" })}</span></div>
        <div className="prose max-w-3xl">
          <p>
            Сегодня {formatDateRu(date)}{sun ? <>, Солнце в знаке <Link href={`/goroskop/${sun.slug}`}>{sun.name}</Link></> : null}, Луна в знаке{" "}
            <Link href={`/astrologiya/luna-v-znake/${moon.sign.slug}`}>{moon.sign.name}</Link>, {moon.lunarDay}-й лунный день{ld ? ` («${ld.symbol}»)` : ""}. {PHASES[moon.phase].name}: {PHASES[moon.phase].text}
          </p>
          <p>
            Карта Таро на сегодня — {today ? <Link href="/karta-dnya">{today.card.name}{today.reversed ? " в перевёрнутом положении" : ""}</Link> : <Link href="/karta-dnya">карта дня</Link>}.
            Прогноз для своего знака смотрите в <Link href="/goroskop">гороскопе на сегодня</Link>, подробности о Луне — в <Link href={`/lunnyy-kalendar/${date}`}>лунном календаре</Link>,
            а личную астрологическую карту по дате, времени и месту рождения построит <Link href="/astrologiya/natalnaya-karta">натальная карта</Link>.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="ornament mb-5"><h2 className="text-3xl">Инструменты</h2><span className="mono">{TOOLS.length} ежедневных</span></div>
        <HomeTools date={date} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <RazborCta from="glavnaya" className="" />
      </section>

      {zodiac.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12">
          <div className="ornament mb-5"><h2 className="text-3xl">Гороскоп на сегодня</h2><span className="mono">12 знаков</span></div>
          <div className="grid-lines grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
            {zodiac.map((z) => (
              <Link key={z.slug} href={`/goroskop/${z.slug}`} className="text-center p-4 hover:bg-surface transition-colors">
                <span className="zglyph">{z.symbol}{"︎"}</span>
                <b className="block font-medium mt-2 text-sm">{z.name}</b>
                <span className="block text-xs text-muted"><SignDates dates={z.dates} short /></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-6xl px-4 pt-12">
        <TelegramDaily campaign="home" text="Карта дня, настроение знаков и Луна — в 8:00 по Москве, вечером — карта на завтра. Коротко и без рекламы." className="" />
      </div>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="ornament mb-5"><h2 className="text-3xl">Разделы</h2><span className="mono">{SECTION_KEYS.length} темы</span></div>
        {/* 7 разделов: первая плитка на две колонки — 8 ячеек, ровно 4 ряда по 2 или 2 ряда по 4 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECTION_KEYS.map((k, i) => (
            <Link key={k} href={`/${k}`} className={`card card-hover p-5 flex gap-4 ${i === 0 && SECTION_KEYS.length % 2 ? "sm:col-span-2" : ""}`}>
              <IconBadge name={SECTIONS[k].icon} className="shrink-0" />
              <span>
                <span className="display text-xl block">{SECTIONS[k].title}</span>
                <p className="text-sm text-muted mt-1">{SECTIONS[k].description}</p>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {articles.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-4">
          <div className="ornament mb-5"><h2 className="text-3xl">Свежие статьи</h2><span className="mono">обновляется ежедневно</span></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.section + a.slug} a={a} showSection />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
