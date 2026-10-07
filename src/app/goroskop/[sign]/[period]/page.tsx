import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AuthorCard from "@/components/AuthorCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { authorJsonLd, horoscopeAuthor } from "@/lib/authors";
import { SITE } from "@/lib/site";
import HoroscopeCard from "@/components/HoroscopeCard";
import PeriodNav from "@/components/PeriodNav";
import ZodiacSign from "@/components/ZodiacSign";
import { findZodiac, getZodiac } from "@/lib/content";
import { horoscopeFor, PERIODS, PERIOD_KEYS, periodLabel, todayKey, type PeriodKey } from "@/lib/daily";

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
  return {
    title: `${z.name}: гороскоп ${p.title}`,
    description: `Гороскоп ${p.title} для знака ${z.name}: общий фон, любовь, работа и деньги, самочувствие и совет. ${periodLabel(period as PeriodKey)}.`,
    alternates: { canonical: `/goroskop/${sign}/${period}` },
  };
}

export default async function SignPeriodPage({ params }: PageProps<"/goroskop/[sign]/[period]">) {
  const { sign, period } = await params;
  const z = findZodiac(sign);
  const pk = period as PeriodKey;
  if (!z || !PERIODS[pk] || pk === "segodnya") notFound();
  const h = horoscopeFor(z, pk, todayKey());
  const all = getZodiac();
  const author = horoscopeAuthor();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/goroskop", label: "Гороскоп" }, { href: `/goroskop/${sign}`, label: z.name }, { href: `/goroskop/${sign}/${period}`, label: PERIODS[pk].title }]} />
      <div className="flex items-center gap-4">
        <ZodiacSign symbol={z.symbol} element={z.element} slug={`sign-${z.slug}`} size={84} className="shrink-0" />
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">{z.name}: гороскоп {PERIODS[pk].title}</h1>
          <p className="text-muted">{z.dates} · {z.element} · {z.planet}</p>
        </div>
      </div>
      <div className="mt-4"><PeriodNav current={pk} sign={z.slug} /></div>
      {h && <div className="mt-4"><HoroscopeCard h={h} /></div>}
      <p className="mt-6 text-muted">
        <Link href={`/goroskop/${sign}`} className="text-accent underline">Характер знака {z.name} и гороскоп на сегодня</Link>
      </p>
      <section className="mt-10">
        <h2 className="text-2xl mb-3">Гороскоп {PERIODS[pk].title} для других знаков</h2>
        <div className="flex flex-wrap gap-2">
          {all.filter((x) => x.slug !== z.slug).map((x) => (
            <Link key={x.slug} href={`/goroskop/${x.slug}/${period}`} className="chip hover:text-ink">{x.symbol} {x.name}</Link>
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
            ...(author ? { author: authorJsonLd(author) } : {}),
            publisher: { "@type": "Organization", name: SITE.name },
          }}
        />
      )}
    </div>
  );
}
