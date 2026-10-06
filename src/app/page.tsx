import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import { IconBadge } from "@/components/Icons";
import MoonPhase from "@/components/MoonPhase";
import TarotCardView from "@/components/TarotCardView";
import { getArticles, getZodiac } from "@/lib/content";
import { cardOfDay, formatDateRu, shiftKey, todayKey } from "@/lib/daily";
import { dayInfo, PHASES } from "@/lib/moon";
import { SECTIONS, SECTION_KEYS, TOOLS } from "@/lib/site";

export const revalidate = 3600;

const TOOL_KIND: Record<string, string> = { "/karta-dnya": "таро", "/goroskop": "астрология", "/chislo-sudby": "нумерология", "/sonnik": "сонник", "/sovmestimost": "астрология", "/goroskop/zavtra": "астрология", "/taro/da-net": "таро", "/lunnyy-kalendar": "луна" };

export default function Home() {
  const date = todayKey();
  const today = cardOfDay(date);
  const tomorrow = cardOfDay(shiftKey(date, 1));
  const moon = dayInfo(date);
  const articles = getArticles().slice(0, 6);
  const zodiac = getZodiac();
  return (
    <div>
      <section className="night">
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-20 md:pt-16 md:pb-24 grid gap-10 md:grid-cols-[1.2fr_0.8fr] items-center">
          <div>
            <p className="mono mb-5">{formatDateRu(date)} · {moon.lunarDay}-й лунный день · Луна в знаке {moon.sign.name}</p>
            <h1 className="text-4xl md:text-6xl leading-[1.08]">Одна карта на сегодня.<br />Гороскоп без тумана.</h1>
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
                <TarotCardView slug={today.card.slug} name={today.card.name} reversed={today.reversed} flipIn priority sizes="(min-width: 768px) 240px, 208px" />
              </div>
              <span className="mono-text text-muted group-hover:text-[#ece9f1]">
                {today.card.name} · {today.reversed ? "перевёрнутое положение" : "прямое положение"}
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
          {tomorrow && (
            <Link href={`/taro/karty/${tomorrow.card.slug}`} className="flex items-center gap-4 p-5 md:border-r border-b md:border-b-0 border-line group">
              <span className="w-10 shrink-0"><TarotCardView slug={tomorrow.card.slug} name={tomorrow.card.name} reversed={tomorrow.reversed} className="tcard-thumb" sizes="40px" /></span>
              <span>
                <b className="block font-medium group-hover:text-accent">Карта на завтра: {tomorrow.card.name}</b>
                <span className="text-sm text-muted">{tomorrow.card.keywords.slice(0, 3).join(", ")}</span>
              </span>
            </Link>
          )}
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
        <div className="ornament mb-5"><h2 className="text-3xl">Инструменты</h2><span className="mono">{TOOLS.length} ежедневных</span></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t, i) => (
            <Link key={t.href} href={t.href} className="card card-hover p-5 flex flex-col gap-2">
              <span className="mono">{String(i + 1).padStart(2, "0")} · {TOOL_KIND[t.href] || "инструмент"}</span>
              <span className="display text-xl">{t.title}</span>
              <p className="text-sm text-muted">{t.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {zodiac.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12">
          <div className="ornament mb-5"><h2 className="text-3xl">Гороскоп на сегодня</h2><span className="mono">12 знаков</span></div>
          <div className="grid-lines grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
            {zodiac.map((z) => (
              <Link key={z.slug} href={`/goroskop/${z.slug}`} className="text-center p-4 hover:bg-surface transition-colors">
                <span className="zglyph">{z.symbol}{"︎"}</span>
                <b className="block font-medium mt-2 text-sm">{z.name}</b>
                <span className="text-xs text-muted">{z.dates}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="ornament mb-5"><h2 className="text-3xl">Разделы</h2><span className="mono">{SECTION_KEYS.length} темы</span></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_KEYS.map((k) => (
            <Link key={k} href={`/${k}`} className="card card-hover p-5 flex gap-4">
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
