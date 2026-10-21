import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AuthorCard from "@/components/AuthorCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import PeriodNav from "@/components/PeriodNav";
import RazborCta from "@/components/RazborCta";
import ZodiacSign from "@/components/ZodiacSign";
import { Score } from "@/components/HoroscopeGrid";
import { authorJsonLd, horoscopeAuthor } from "@/lib/authors";
import { findZodiac, getZodiac } from "@/lib/content";
import { FORECAST_YEAR, yearOverview, yearSign } from "@/lib/horoscopeYear";
import { SITE, orgJsonLd } from "@/lib/site";

export const revalidate = 86400;
export const dynamicParams = false;

const Y = FORECAST_YEAR;

export function generateStaticParams() {
  return getZodiac().map((z) => ({ sign: z.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ sign: string }> }): Promise<Metadata> {
  const { sign } = await params;
  const z = findZodiac(sign);
  const t = yearSign(sign);
  if (!z || !t) return {};
  return {
    title: `Гороскоп на ${Y} год ${z.name} — ${t.titleTail}`,
    description: t.description,
    alternates: { canonical: `/goroskop/${sign}/${Y}` },
  };
}

function splitFact(s: string): { fact: string; note: string } {
  const i = s.indexOf(": ");
  return i > 0 ? { fact: s.slice(0, i), note: s.slice(i + 2) } : { fact: s, note: "" };
}

export default async function SignYearPage({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  const z = findZodiac(sign);
  const t = yearSign(sign);
  if (!z || !t) notFound();
  const ov = yearOverview();
  const all = getZodiac();
  const author = horoscopeAuthor();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/goroskop", label: "Гороскоп" }, { href: `/goroskop/${sign}`, label: z.name }, { href: `/goroskop/${sign}/${Y}`, label: `На ${Y} год` }]} />
      <div className="flex items-center gap-4">
        <ZodiacSign symbol={z.symbol} element={z.element} slug={`sign-${z.slug}`} size={84} className="shrink-0 size-16 sm:size-[84px]" />
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <h1 className="text-3xl md:text-4xl font-semibold">{z.name}: гороскоп на {Y} год</h1>
          <p className="text-muted">{z.dates} · {z.element} · {z.planet}</p>
        </div>
      </div>
      <div className="mt-4"><PeriodNav sign={z.slug} /></div>

      <section className="card p-6 mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl">Главное в {Y} году</h2>
          <span className="chip">настроение: {t.mood}</span>
        </div>
        <p className="mt-3 text-lg">{t.general}</p>
        <div className="mt-5 rounded border border-line bg-sunk px-4 py-3">
          <p className="mono">Что на небе</p>
          <ul className="mt-2 grid gap-1.5 text-sm">
            {t.sky.map((s) => {
              const { fact, note } = splitFact(s);
              return (
                <li key={s} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[0.55em] inline-block w-1.5 h-1.5 bg-gold rotate-45 shrink-0" />
                  <span><span className="font-semibold">{fact}</span>{note && <span className="text-muted"> — {note}</span>}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 mt-6">
        <div className="card p-5">
          <h2 className="text-xl"><Score label="Любовь" n={t.scores.love} /></h2>
          <p className="text-muted mt-2">{t.love}</p>
        </div>
        <div className="card p-5">
          <h2 className="text-xl"><Score label="Работа и деньги" n={t.scores.career} /></h2>
          <p className="text-muted mt-2">{t.career}</p>
        </div>
        <div className="card p-5">
          <h2 className="text-xl"><Score label="Силы и отдых" n={t.scores.energy} /></h2>
          <p className="text-muted mt-2">{t.health}</p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">{z.name} в {Y} году по сезонам</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {t.seasons.map((s) => (
            <div key={s.label} className="card p-5">
              <h3 className="font-semibold">{s.label}</h3>
              <p className="text-muted mt-2 text-sm">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Благоприятные месяцы</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {t.goodMonths.map((m) => (
            <li key={m.month} className="card p-4">
              <p className="font-semibold">{m.month}</p>
              <p className="text-sm text-muted mt-1">{m.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 border-l-2 border-gold pl-3 italic max-w-3xl">{t.advice}</p>
      </section>

      {ov && (
        <section className="prose mt-10">
          <h2>{Y} год по восточному календарю и нумерологии</h2>
          <p>
            {ov.eastern} <Link href={`/kitayskiy-goroskop/${Y}`}>Китайский гороскоп на {Y} год →</Link> {ov.numerology} <Link href={`/numerologiya/${Y}`}>Нумерология {Y} года →</Link>
          </p>
          <p className="text-sm text-muted">
            Это прогноз по знаку Солнца: он описывает общий фон года. Как он ложится на вашу личную карту, подскажет <Link href="/astrologiya/natalnaya-karta">натальная карта</Link> и <Link href={`/goroskop/${sign}`}>характер знака {z.name}</Link>. Общий обзор неба — в <Link href={`/goroskop/${Y}`}>гороскопе на {Y} год для всех знаков</Link>.
          </p>
        </section>
      )}

      <RazborCta from="goroskop-god" />

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Гороскоп на {Y} год для других знаков</h2>
        <div className="flex flex-wrap gap-2">
          {all.filter((x) => x.slug !== z.slug).map((x) => (
            <Link key={x.slug} href={`/goroskop/${x.slug}/${Y}`} className="chip hover:text-ink">{x.symbol}{"︎"} {x.name}</Link>
          ))}
        </div>
      </section>
      {author && <AuthorCard author={author} note="гороскопы ведёт" className="mt-10" />}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${z.name}: гороскоп на ${Y} год`,
          description: t.description,
          datePublished: "2026-10-17",
          dateModified: "2026-10-17",
          inLanguage: "ru",
          mainEntityOfPage: `${SITE.url}/goroskop/${sign}/${Y}`,
          author: author ? authorJsonLd(author) : orgJsonLd(),
          publisher: orgJsonLd(),
        }}
      />
    </div>
  );
}
