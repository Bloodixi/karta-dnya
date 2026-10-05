import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import { getArticles, getZodiac } from "@/lib/content";
import { cardOfDay, formatDateRu, todayKey } from "@/lib/daily";
import { SECTIONS, SECTION_KEYS, SITE, TOOLS } from "@/lib/site";

export const revalidate = 3600;

export default function Home() {
  const date = todayKey();
  const today = cardOfDay(date);
  const articles = getArticles().slice(0, 6);
  const zodiac = getZodiac();
  return (
    <div>
      <section className="hero-glow">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-10 grid gap-8 md:grid-cols-[1.3fr_1fr] items-center">
          <div>
            <p className="chip mb-4">✦ {formatDateRu(date)}</p>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
              {SITE.tagline}
            </h1>
            <p className="text-muted mt-4 max-w-xl text-lg">
              Каждый день: карта Таро, гороскоп для всех знаков и подсказки, как провести день спокойнее. Без мистического тумана и обещаний.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/karta-dnya" className="btn">Вытянуть карту дня</Link>
              <Link href="/goroskop" className="btn btn-ghost">Гороскоп на сегодня</Link>
            </div>
          </div>
          {today && (
            <Link href="/karta-dnya" className="justify-self-center w-48 md:w-56">
              <div className={`tarot-card ${today.reversed ? "reversed" : ""}`}>
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-70">Карта дня</p>
                  <p className="display text-2xl mt-2">{today.card.name}</p>
                  <p className="text-xs mt-2 opacity-80">{today.card.keywords.slice(0, 3).join(" · ")}</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="card card-hover p-5">
              <p className="text-2xl">{t.emoji}</p>
              <p className="font-semibold mt-2">{t.title}</p>
              <p className="text-sm text-muted mt-1">{t.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {zodiac.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-6">
          <h2 className="text-2xl mb-3">Гороскоп на сегодня по знакам</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {zodiac.map((z) => (
              <Link key={z.slug} href={`/goroskop/${z.slug}`} className="card card-hover p-3 text-center">
                <p className="text-2xl">{z.symbol}</p>
                <p className="text-sm font-semibold mt-1">{z.name}</p>
                <p className="text-[11px] text-muted">{z.dates}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="text-2xl mb-3">Разделы</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_KEYS.map((k) => (
            <Link key={k} href={`/${k}`} className="card card-hover p-5">
              <p className="text-2xl">{SECTIONS[k].emoji}</p>
              <p className="font-semibold text-lg mt-2">{SECTIONS[k].title}</p>
              <p className="text-sm text-muted mt-1">{SECTIONS[k].description}</p>
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
