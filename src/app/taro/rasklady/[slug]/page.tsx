import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import Spread from "@/components/Spread";
import { findSpread, getSpreads, getTarot, spreadHref } from "@/lib/content";
import { SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getSpreads().filter((s) => !s.href).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/taro/rasklady/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = findSpread(slug);
  if (!s) return {};
  return { title: s.title, description: s.short, alternates: { canonical: `/taro/rasklady/${slug}` } };
}

export default async function SpreadPage({ params }: PageProps<"/taro/rasklady/[slug]">) {
  const { slug } = await params;
  const s = findSpread(slug);
  if (!s) notFound();
  const cards = getTarot().map((c) => ({ slug: c.slug, name: c.name, upright: c.upright, reversed: c.reversed }));
  const others = getSpreads().filter((x) => x.slug !== slug);
  const n = s.positions.length;
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/taro", label: "Таро" }, { href: "/taro/rasklady", label: "Расклады" }, { href: `/taro/rasklady/${slug}`, label: s.title.split(":")[0] }]} />
      <p className="mono">{n} {n === 1 ? "карта" : n < 5 ? "карты" : "карт"} · {s.theme}</p>
      <h1 className="text-3xl md:text-4xl mt-2">{s.title}</h1>
      <p className="text-muted mt-3 max-w-3xl text-lg">{s.intro[0]}</p>
      <div className="mt-6">{cards.length ? <Spread positions={s.positions} cards={cards} /> : <p className="text-muted">Колода готовится.</p>}</div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_320px] items-start">
        <div>
          <section>
            <div className="ornament mb-4"><h2 className="text-2xl">Позиции расклада</h2><span className="mono">{n} позиций</span></div>
            <ol className="grid gap-3">
              {s.positions.map((p, i) => (
                <li key={p.name} className="card p-4 grid grid-cols-[2.5rem_1fr] gap-3 items-baseline">
                  <span className="display text-2xl text-accent">{i + 1}</span>
                  <div>
                    <h3 className="text-lg">{p.name}</h3>
                    <p className="text-sm text-muted mt-1">{p.meaning}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section className="prose mt-10">
            <h2>Как делать расклад</h2>
            <p>{s.intro[1]}</p>
            <ol>
              {s.howTo.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <p>Перевёрнутые карты читаются как ослабленное или внутреннее проявление значения. Полные толкования каждой карты — в <Link href="/taro/karty">каталоге карт Таро</Link>, а для ежедневной практики есть <Link href="/karta-dnya">карта дня</Link>.</p>
          </section>
        </div>
        <aside className="card p-5 lg:sticky lg:top-24">
          <p className="mono mb-3">Другие расклады</p>
          <ul className="grid gap-2">
            {others.map((o) => (
              <li key={o.slug} className="flex justify-between gap-3 text-sm">
                <Link href={spreadHref(o)} className="text-accent underline">{o.title}</Link>
                <span className="text-muted shrink-0">{o.positions.length}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm mt-4"><Link href="/taro/rasklady" className="text-accent underline">Все расклады Таро</Link></p>
        </aside>
      </div>

      <Faq items={s.faq} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: s.title,
          description: s.short,
          url: `${SITE.url}/taro/rasklady/${slug}`,
          step: s.howTo.map((t, i) => ({ "@type": "HowToStep", position: i + 1, text: t })),
        }}
      />
    </article>
  );
}
