import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AuthorCard from "@/components/AuthorCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { authorJsonLd, horoscopeAuthor } from "@/lib/authors";
import { SITE, orgJsonLd } from "@/lib/site";
import HoroscopeCard from "@/components/HoroscopeCard";
import PeriodNav from "@/components/PeriodNav";
import RazborCta from "@/components/RazborCta";
import ZodiacSign from "@/components/ZodiacSign";
import { findZodiac, getZodiac } from "@/lib/content";
import { horoscopeFor, periodKey, PERIODS, PERIOD_KEYS, todayKey, type PeriodKey } from "@/lib/daily";
import Year2027Teaser from "@/components/Year2027";
import { signMeta } from "@/lib/horoscopeMeta";
import { FORECAST_YEAR } from "@/lib/horoscopeYear";
import ArticleLinks from "@/components/ArticleLinks";

export const revalidate = 1800;
export const dynamicParams = false;

const PER = PERIOD_KEYS.filter((p) => p !== "segodnya");

export function generateStaticParams() {
  return getZodiac().flatMap((z) => PER.map((period) => ({ sign: z.slug, period })));
}

export async function generateMetadata({ params }: PageProps<"/goroskop/[sign]/[period]">): Promise<Metadata> {
  const { sign, period } = await params;
  const z = findZodiac(sign);
  const p = PERIODS[period as PeriodKey];
  if (!z || !p) return {};
  // В год подробного прогноза вкладка «Год» показывает те же тексты, что /goroskop/<знак>/<год>, — канонической считаем подробную.
  const yearPage = period === "god" && periodKey("god").startsWith(String(FORECAST_YEAR));
  return { ...signMeta(z.name, period as PeriodKey), alternates: { canonical: yearPage ? `/goroskop/${sign}/${FORECAST_YEAR}` : `/goroskop/${sign}/${period}` } };
}

export default async function SignPeriodPage({ params }: PageProps<"/goroskop/[sign]/[period]">) {
  const { sign, period } = await params;
  const z = findZodiac(sign);
  const pk = period as PeriodKey;
  if (!z || !PERIODS[pk] || pk === "segodnya") notFound();
  const date = todayKey();
  const h = horoscopeFor(z, pk, date);
  const all = getZodiac();
  const author = horoscopeAuthor();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/goroskop", label: "Гороскоп" }, { href: `/goroskop/${sign}`, label: z.name }, { href: `/goroskop/${sign}/${period}`, label: PERIODS[pk].title }]} />
      <div className="flex items-center gap-4">
        <ZodiacSign symbol={z.symbol} element={z.element} slug={`sign-${z.slug}`} size={84} className="shrink-0 size-16 sm:size-[84px]" />
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <h1 className="text-3xl md:text-4xl font-semibold">{z.name}: гороскоп {pk === "god" ? `на ${periodKey("god", date).slice(0, 4)} год` : PERIODS[pk].title}</h1>
          <p className="text-muted">{z.dates} · {z.element} · {z.planet}</p>
        </div>
      </div>
      <div className="mt-4"><PeriodNav current={pk} sign={z.slug} /></div>
      {h && <div className="mt-4"><HoroscopeCard h={h} /></div>}
      {pk === "god" && <Year2027Teaser sign={z.slug} name={z.name} />}
      <p className="mt-6 text-muted">
        <Link href={`/goroskop/${sign}`} className="text-accent-text underline">Характер знака {z.name} и гороскоп на сегодня</Link>
      </p>
      <ArticleLinks path={`/goroskop/${sign}/${period}`} />
      <RazborCta from="goroskop-period" />
      <section className="mt-10">
        <h2 className="text-2xl mb-3">Гороскоп {PERIODS[pk].title} для других знаков</h2>
        <div className="flex flex-wrap gap-2">
          {all.filter((x) => x.slug !== z.slug).map((x) => (
            <Link key={x.slug} href={`/goroskop/${x.slug}/${period}`} className="chip hover:text-ink">{x.symbol}{"\uFE0E"} {x.name}</Link>
          ))}
        </div>
      </section>
      {author && h?.source === "astro" && <AuthorCard author={author} note="гороскопы ведёт" className="mt-10" />}
      {h?.source === "astro" && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${z.name}: гороскоп ${PERIODS[pk].title}, ${h.label}`,
            datePublished: h.key,
            dateModified: h.key,
            inLanguage: "ru",
            mainEntityOfPage: `${SITE.url}/goroskop/${sign}/${period}`,
            author: author ? authorJsonLd(author) : orgJsonLd(),
            publisher: orgJsonLd(),
          }}
        />
      )}
    </div>
  );
}
