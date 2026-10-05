import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import { IconBadge } from "@/components/Icons";
import MoonPhase from "@/components/MoonPhase";
import Starfield from "@/components/Starfield";
import TarotCardView from "@/components/TarotCardView";
import ZodiacSign from "@/components/ZodiacSign";
import { getArticles, getZodiac } from "@/lib/content";
import { cardOfDay, formatDateRu, shiftKey, todayKey } from "@/lib/daily";
import { dayInfo, PHASES } from "@/lib/moon";
import { SECTIONS, SECTION_KEYS, SITE, TOOLS } from "@/lib/site";

export const revalidate = 3600;

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
        <Starfield />
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-24 md:pt-16 md:pb-28 grid gap-10 md:grid-cols-[1.25fr_1fr] items-center">
          <div>
            <p className="chip mb-5">{formatDateRu(date)} · {moon.lunarDay}-й лунный день</p>
            <h1 className="text-4xl md:text-6xl font-semibold leading-[1.05] display-glow">{SITE.tagline}</h1>
            <p className="text-muted mt-5 max-w-xl text-lg">
              Каждый день одна карта Таро, гороскоп для всех знаков и лунный календарь. Коротко, спокойно и без обещаний: повод присмотреться к дню, а не приговор.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/karta-dnya" className="btn">Открыть карту дня</Link>
              <Link href="/goroskop" className="btn btn-ghost">Гороскоп на сегодня</Link>
            </div>
          </div>
          {today && (
            <Link href="/karta-dnya" className="justify-self-center w-52 md:w-64 grid gap-3 text-center group">
              <div className="tcard-float">
                <TarotCardView slug={today.card.slug} name={today.card.name} reversed={today.reversed} flipIn priority sizes="(min-width: 768px) 256px, 208px" />
              </div>
              <span className="text-sm text-muted group-hover:text-[#f3e7c9]">
                Карта дня: <b className="text-[#f3e7c9]">{today.card.name}</b>{today.reversed ? ", перевёрнутая" : ""}
              </span>
            </Link>
          )}
        </div>
        <div className="night-fade" />
      </section>

      <section className="mx-auto max-w-6xl px-4 -mt-14 relative">
        <div className="card frame-gold p-5 md:p-6 grid gap-6 md:grid-cols-3">
          <Link href={`/lunnyy-kalendar/${date}`} className="flex items-center gap-4 group">
            <MoonPhase age={moon.age} size={64} className="shrink-0" />
            <span>
              <b className="block group-hover:text-accent">{PHASES[moon.phase].name}</b>
              <span className="text-sm text-muted">{moon.lunarDay}-й лунный день · Луна в знаке {moon.sign.name} · освещено {moon.illumination}%</span>
            </span>
          </Link>
          {tomorrow && (
            <Link href={`/taro/karty/${tomorrow.card.slug}`} className="flex items-center gap-4 group">
              <span className="w-10 shrink-0"><TarotCardView slug={tomorrow.card.slug} name={tomorrow.card.name} reversed={tomorrow.reversed} className="tcard-thumb" sizes="40px" /></span>
              <span>
                <b className="block group-hover:text-accent">Карта на завтра: {tomorrow.card.name}</b>
                <span className="text-sm text-muted">{tomorrow.card.keywords.slice(0, 3).join(", ")}</span>
              </span>
            </Link>
          )}
          <Link href="/goroskop/zavtra" className="flex items-center gap-4 group">
            <IconBadge name="sunrise" />
            <span>
              <b className="block group-hover:text-accent">Гороскоп на завтра</b>
              <span className="text-sm text-muted">{formatDateRu(shiftKey(date, 1), { day: "numeric", month: "long" })}: что готовит день для вашего знака</span>
            </span>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-10 pb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="card card-hover p-5">
              <IconBadge name={t.icon} />
              <p className="font-semibold mt-3">{t.title}</p>
              <p className="text-sm text-muted mt-1">{t.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {zodiac.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <h2 className="ornament text-2xl justify-center mb-6 text-ink">Гороскоп на сегодня по знакам</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {zodiac.map((z) => (
              <Link key={z.slug} href={`/goroskop/${z.slug}`} className="group text-center p-3 rounded-2xl hover:bg-surface transition-colors">
                <ZodiacSign symbol={z.symbol} element={z.element} slug={`home-${z.slug}`} size={64} className="mx-auto transition-transform group-hover:-translate-y-1" />
                <p className="font-semibold mt-2 group-hover:text-accent">{z.name}</p>
                <p className="text-xs text-muted">{z.dates}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="text-2xl mb-3">Разделы</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_KEYS.map((k) => (
            <Link key={k} href={`/${k}`} className="card card-hover p-5 flex gap-4">
              <IconBadge name={SECTIONS[k].icon} className="shrink-0" />
              <span>
                <p className="font-semibold text-lg">{SECTIONS[k].title}</p>
                <p className="text-sm text-muted mt-1">{SECTIONS[k].description}</p>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {articles.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-6">
          <h2 className="text-2xl mb-3">Свежие статьи</h2>
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
