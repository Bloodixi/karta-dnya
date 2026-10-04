import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { findTarot, getTarot } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTarot().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/taro/karty/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = findTarot(slug);
  if (!c) return {};
  return {
    title: `${c.name} Таро: значение карты в прямом и перевёрнутом положении`,
    description: `${c.name}: ${c.upright}`.slice(0, 158),
    alternates: { canonical: `/taro/karty/${slug}` },
  };
}

export default async function CardPage({ params }: PageProps<"/taro/karty/[slug]">) {
  const { slug } = await params;
  const c = findTarot(slug);
  if (!c) notFound();
  const all = getTarot();
  const idx = all.findIndex((x) => x.slug === slug);
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/taro", label: "Таро" }, { href: "/taro/karty", label: "Значения карт" }, { href: `/taro/karty/${slug}`, label: c.name }]} />
      <div className="grid gap-8 md:grid-cols-[240px_1fr] items-start">
        <div className="tarot-card w-56 md:w-full">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-70">{c.arcana === "major" ? `Старший аркан ${c.number}` : c.suitName}</p>
            <p className="display text-3xl mt-2">{c.name}</p>
            <p className="text-sm mt-3 opacity-80">{c.keywords.join(" · ")}</p>
          </div>
        </div>
        <div className="prose">
          <h1 className="text-3xl md:text-4xl font-semibold !mt-0">{c.name}: значение карты Таро</h1>
          {c.description && <p>{c.description}</p>}
          <h2>Прямое положение</h2>
          <p>{c.upright}</p>
          <h2>Перевёрнутое положение</h2>
          <p>{c.reversed}</p>
          <h2>В любви и отношениях</h2>
          <p>{c.love}</p>
          <h2>В работе и деньгах</h2>
          <p>{c.career}</p>
          <h2>Совет карты</h2>
          <blockquote>{c.advice}</blockquote>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap gap-2 justify-between text-sm">
        <Link href={`/taro/karty/${prev.slug}`} className="btn btn-ghost">← {prev.name}</Link>
        <Link href="/taro/karty" className="btn btn-ghost">Все карты</Link>
        <Link href={`/taro/karty/${next.slug}`} className="btn btn-ghost">{next.name} →</Link>
      </div>
    </article>
  );
}
