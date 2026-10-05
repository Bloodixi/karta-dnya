import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import TarotCardView from "@/components/TarotCardView";
import { findTarot, findTarotExtra, getTarot } from "@/lib/content";

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
  const extra = findTarotExtra(slug);
  const byslug = (x: string) => all.find((a) => a.slug === x);
  const idx = all.findIndex((x) => x.slug === slug);
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/taro", label: "Таро" }, { href: "/taro/karty", label: "Значения карт" }, { href: `/taro/karty/${slug}`, label: c.name }]} />
      <div className="grid gap-8 md:grid-cols-[240px_1fr] items-start">
        <figure className="w-56 md:w-full md:sticky md:top-24">
          <TarotCardView slug={c.slug} name={c.name} priority />
          <figcaption className="text-xs text-muted mt-3 text-center">{c.arcana === "major" ? `Старший аркан ${c.number}` : c.suitName} · колода Райдера–Уэйта, 1909</figcaption>
        </figure>
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
          {extra && (
            <>
              <h2>Здоровье и ресурс</h2>
              <p>{extra.health}</p>
              <h2>Ответ «да или нет»</h2>
              <p><strong>{extra.yesno}.</strong> {extra.yesnoWhy} Проверить на свой вопрос: <Link href="/taro/da-net">гадание да/нет</Link>.</p>
              <h2>В позициях расклада</h2>
              <ul>
                <li><strong>Прошлое:</strong> {extra.positions.past}</li>
                <li><strong>Настоящее:</strong> {extra.positions.present}</li>
                <li><strong>Будущее:</strong> {extra.positions.future}</li>
              </ul>
              <h2>Сочетания с другими картами</h2>
              <ul>
                {extra.combos.map((k) => { const o = byslug(k.with); return <li key={k.with}>{o ? <Link href={`/taro/karty/${o.slug}`}>{o.name}</Link> : k.with}: {k.means}</li>; })}
              </ul>
              <h2>Если это карта дня</h2>
              <p>{extra.dayCard}</p>
            </>
          )}
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
