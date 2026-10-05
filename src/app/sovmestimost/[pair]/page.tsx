import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import PairPicker from "@/components/PairPicker";
import ZodiacSign from "@/components/ZodiacSign";
import { getZodiac } from "@/lib/content";
import { allPairs, compatibility, parsePair } from "@/lib/compat";

export const dynamicParams = false;

export function generateStaticParams() {
  return allPairs().map((p) => ({ pair: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/sovmestimost/[pair]">): Promise<Metadata> {
  const { pair } = await params;
  const p = parsePair(pair);
  if (!p) return {};
  const c = compatibility(p.a, p.b);
  return {
    title: `${p.a.name} и ${p.b.name}: совместимость в любви, дружбе и работе — ${c.score}%`,
    description: `Совместимость ${p.a.name} и ${p.b.name}: ${c.score}%, ${c.verdict}. Как складываются любовь, быт и работа, на что обратить внимание и совет паре.`,
    alternates: { canonical: `/sovmestimost/${pair}` },
  };
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm"><span>{label}</span><b>{value}%</b></div>
      <div className="h-2 rounded-full bg-sunk mt-1 overflow-hidden"><div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} /></div>
    </div>
  );
}

export default async function PairPage({ params }: PageProps<"/sovmestimost/[pair]">) {
  const { pair } = await params;
  const p = parsePair(pair);
  if (!p) notFound();
  const c = compatibility(p.a, p.b);
  const signs = getZodiac();
  const sameA = signs.filter((b) => b.slug !== p.b.slug).slice(0, 11);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/sovmestimost", label: "Совместимость" }, { href: `/sovmestimost/${pair}`, label: `${p.a.name} и ${p.b.name}` }]} />
      <div className="flex items-center gap-4">
        <div className="flex shrink-0 -space-x-3">
          <ZodiacSign symbol={p.a.symbol} element={p.a.element} slug={`pa-${p.a.slug}`} size={72} />
          <ZodiacSign symbol={p.b.symbol} element={p.b.element} slug={`pb-${p.b.slug}`} size={72} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">{p.a.name} и {p.b.name}: совместимость</h1>
          <p className="text-muted mt-1">{p.a.element} и {p.b.element} · {c.verdict}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-[280px_1fr] items-start">
        <div className="card p-6 text-center">
          <p className="display text-6xl">{c.score}%</p>
          <p className="text-muted">общая совместимость</p>
          <div className="grid gap-3 mt-5 text-left">
            <Bar label="Любовь" value={c.love} />
            <Bar label="Дружба" value={c.friendship} />
            <Bar label="Работа" value={c.work} />
          </div>
        </div>
        <div className="prose">
          <p>{c.text.general}</p>
          <h2>В любви</h2>
          <p>{c.text.love}</p>
          <h2>В быту и общих планах</h2>
          <p>{c.text.life}</p>
          <h2>Совет паре</h2>
          <blockquote>{c.text.advice}</blockquote>
          <p>
            Подробнее о знаках: <Link href={`/goroskop/${p.a.slug}`}>{p.a.name}</Link> и <Link href={`/goroskop/${p.b.slug}`}>{p.b.name}</Link>.
            {p.a.slug !== p.b.slug && <> Обратная пара: <Link href={`/sovmestimost/${p.b.slug}-${p.a.slug}`}>{p.b.name} и {p.a.name}</Link>.</>}
          </p>
        </div>
      </div>
      <section className="mt-10 max-w-2xl">
        <h2 className="text-2xl mb-3">Проверить другую пару</h2>
        <PairPicker signs={signs} initial={[p.a.slug, p.b.slug]} />
      </section>
      <section className="mt-10">
        <h2 className="text-2xl mb-3">{p.a.name} с другими знаками</h2>
        <div className="flex flex-wrap gap-2">
          {sameA.map((b) => (
            <Link key={b.slug} href={`/sovmestimost/${p.a.slug}-${b.slug}`} className="chip hover:text-ink">{b.symbol} {b.name} · {compatibility(p.a, b).score}%</Link>
          ))}
        </div>
      </section>
    </div>
  );
}
