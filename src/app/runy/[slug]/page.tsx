import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import RuneGlyph from "@/components/RuneGlyph";
import { findRune, getRunes } from "@/lib/content";
import { ATTS, neighbours, runeFaq, runesOfAtt } from "@/lib/runes";
import { pageTitle, SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getRunes().map((r) => ({ slug: r.slug }));
}

function describe(r: NonNullable<ReturnType<typeof findRune>>): string {
  const kw = r.keywords.slice(0, 4).join(", ");
  const variants = [
    `Руна ${r.name} (${r.orig}): значение в гадании, ${r.reversed ? "прямое и перевёрнутое положение, " : ""}в любви и работе. Ключевые слова: ${kw}. Совет и простая практика.`,
    `Руна ${r.name} (${r.orig}): значение, ${r.reversed ? "прямое и перевёрнутое положение, " : ""}любовь, работа и совет. Ключевые слова: ${kw}. Как использовать руну.`,
    `Руна ${r.name}: значение в гадании, ${r.reversed ? "прямое и перевёрнутое положение, " : ""}в любви и работе. Ключевые слова: ${kw}. Совет и практика на каждый день.`,
    `Руна ${r.name} (${r.orig}) Старшего Футарка: значение в любви, работе, ${r.reversed ? "перевёрнутое положение, " : ""}совет. Ключевые слова: ${kw}. Простая практика.`,
  ];
  return variants.find((d) => d.length >= 140 && d.length <= 160) ?? variants.sort((a, b) => Math.abs(a.length - 150) - Math.abs(b.length - 150))[0];
}

export async function generateMetadata({ params }: PageProps<"/runy/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = findRune(slug);
  if (!r) return {};
  return {
    title: pageTitle(`Руна ${r.name}: значение в гадании, любви и работе`),
    description: describe(r),
    alternates: { canonical: `/runy/${slug}` },
  };
}

export default async function RunePage({ params }: PageProps<"/runy/[slug]">) {
  const { slug } = await params;
  const r = findRune(slug);
  if (!r) notFound();
  const nb = neighbours(slug);
  const sameAtt = runesOfAtt(r.att).filter((x) => x.slug !== slug && x.slug !== nb?.prev.slug && x.slug !== nb?.next.slug).slice(0, 4);
  const faq = runeFaq(r);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/runy", label: "Руны" }, { href: `/runy/${slug}`, label: r.name }]} />
      <div className="grid gap-8 md:grid-cols-[220px_1fr] items-start">
        <div className="md:sticky md:top-24">
          <RuneGlyph slug={r.slug} att={r.att} size={200} className="mx-auto" />
          <p className="text-xs text-muted mt-3 text-center">{r.orig} · звук «{r.sound}» · {r.pos}-я из 24</p>
          <p className="text-xs text-muted text-center">{ATTS[r.att].title}</p>
        </div>
        <article>
          <h1 className="text-3xl md:text-4xl font-semibold">Руна {r.name}: значение</h1>
          <p className="text-muted mt-2">Название переводится как «{r.translation}». Ключевые слова: {r.keywords.join(", ")}.</p>
          <div className="prose mt-4">
            <p>{r.about}</p>
            <h2>Значение в прямом положении</h2>
            <p>{r.upright}</p>
            <h2>{r.reversed ? "Перевёрнутое положение" : "Перевёрнутого положения нет"}</h2>
            <p>{r.reversed ?? `Знак руны ${r.name} симметричен, поэтому при перевороте выглядит так же. Её толкование не меняется, и руна читается одинаково всегда.`}</p>
            <h2>В любви и отношениях</h2>
            <p>{r.love}</p>
            <h2>В работе и деньгах</h2>
            <p>{r.work}</p>
            <h2>Совет руны</h2>
            <blockquote>{r.advice}</blockquote>
            <h2>Как использовать руну {r.name}</h2>
            <p>{r.practice} Руна не гарантирует результата, она лишь задаёт тему для размышления. Если вам не подходит трактовка, опирайтесь на собственное ощущение и здравый смысл.</p>
            <p>
              Связанные образы: {r.associations.toLowerCase()}. Хотите узнать, какая руна выпала на сегодня? Загляните на страницу <Link href="/runy/runa-dnya">«Руна дня»</Link>.
            </p>
          </div>
        </article>
      </div>

      <Faq items={faq} />

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Соседние руны</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[nb?.prev, nb?.next, ...sameAtt].filter((x): x is NonNullable<typeof x> => !!x).map((x) => (
            <Link key={x.slug} href={`/runy/${x.slug}`} className="card card-hover p-3 flex flex-col items-center gap-2 text-center">
              <RuneGlyph slug={x.slug} att={x.att} size={56} />
              <b className="text-sm">{x.name}</b>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          <Link href="/runy" className="underline">Все 24 руны</Link> · <Link href="/runy/runa-dnya" className="underline">Руна дня</Link> · <Link href="/karta-dnya" className="underline">Карта дня Таро</Link> · <Link href="/praktiki" className="underline">Практики</Link>
        </p>
      </section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Руна ${r.name}: значение`,
          description: r.about,
          inLanguage: "ru",
          mainEntityOfPage: `${SITE.url}/runy/${slug}`,
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
        }}
      />
    </div>
  );
}
