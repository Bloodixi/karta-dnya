import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { findZodiac, getStones, getZodiac } from "@/lib/content";
import { formatDateRu, horoscopeFor, todayKey } from "@/lib/daily";

export const revalidate = 1800;
export const dynamicParams = false;

export function generateStaticParams() {
  return getZodiac().map((z) => ({ sign: z.slug }));
}

export async function generateMetadata({ params }: PageProps<"/goroskop/[sign]">): Promise<Metadata> {
  const { sign } = await params;
  const z = findZodiac(sign);
  if (!z) return {};
  return {
    title: `${z.name}: гороскоп на сегодня и характеристика знака`,
    description: `Гороскоп для знака ${z.name} на сегодня: любовь, работа, самочувствие и совет дня. Характер, сильные стороны и совместимость ${z.name}.`,
    alternates: { canonical: `/goroskop/${sign}` },
  };
}

export default async function SignPage({ params }: PageProps<"/goroskop/[sign]">) {
  const { sign } = await params;
  const z = findZodiac(sign);
  if (!z) notFound();
  const date = todayKey();
  const h = horoscopeFor(z, date);
  const all = getZodiac();
  const name = (s: string) => all.find((x) => x.slug === s);
  const stones = getStones().filter((s) => s.zodiac.includes(z.slug)).slice(0, 4);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/goroskop", label: "Гороскоп" }, { href: `/goroskop/${sign}`, label: z.name }]} />
      <div className="flex items-center gap-4">
        <span className="text-5xl">{z.symbol}</span>
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">{z.name}: гороскоп на сегодня</h1>
          <p className="text-muted">{z.dates} · {z.element} · {z.planet}</p>
        </div>
      </div>

      {h && (
        <section className="card p-6 mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl">{formatDateRu(date)}</h2>
            <span className="chip">настроение: {h.mood}</span>
          </div>
          <p className="mt-3 text-lg">{h.general}</p>
          <div className="grid gap-4 sm:grid-cols-3 mt-5 text-sm">
            <div><p className="font-semibold">Любовь <span className="stars">{"★".repeat(h.score.love)}</span></p><p className="text-muted mt-1">{h.love}</p></div>
            <div><p className="font-semibold">Работа и деньги <span className="stars">{"★".repeat(h.score.career)}</span></p><p className="text-muted mt-1">{h.career}</p></div>
            <div><p className="font-semibold">Самочувствие <span className="stars">{"★".repeat(h.score.energy)}</span></p><p className="text-muted mt-1">{h.health}</p></div>
          </div>
          <p className="mt-5 border-l-2 border-gold pl-3 italic">{h.advice}</p>
        </section>
      )}

      <section className="prose mt-10">
        <h2>Характер знака {z.name}</h2>
        <p>{z.description}</p>
        <div className="grid sm:grid-cols-2 gap-6 not-prose mt-4">
          <div className="card p-4"><p className="font-semibold">Сильные стороны</p><ul className="mt-2 text-sm text-muted list-disc ml-5">{z.strengths.map((s) => <li key={s}>{s}</li>)}</ul></div>
          <div className="card p-4"><p className="font-semibold">Над чем работать</p><ul className="mt-2 text-sm text-muted list-disc ml-5">{z.weaknesses.map((s) => <li key={s}>{s}</li>)}</ul></div>
        </div>
        <h2>В любви</h2>
        <p>{z.love}</p>
        <h2>В работе и деньгах</h2>
        <p>{z.career}</p>
        <h2>Самочувствие</h2>
        <p>{z.health}</p>
        <h2>Совместимость</h2>
        <p>
          Лучше всего: {z.compatibility.best.map((s, i) => { const o = name(s); return o ? <span key={s}>{i > 0 && ", "}<Link href={`/goroskop/${s}`}>{o.name}</Link></span> : null; })}.
          Сложнее: {z.compatibility.hard.map((s, i) => { const o = name(s); return o ? <span key={s}>{i > 0 && ", "}<Link href={`/goroskop/${s}`}>{o.name}</Link></span> : null; })}.
        </p>
        <h2>Талисманы</h2>
        <p>Камень: {z.stone}. Цвет: {z.color}. Счастливые числа: {z.luckyNumbers.join(", ")}.</p>
        {stones.length > 0 && <p>Подробнее о камнях: {stones.map((s, i) => <span key={s.slug}>{i > 0 && ", "}<Link href={`/kamni/${s.slug}`}>{s.name}</Link></span>)}.</p>}
      </section>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Другие знаки</h2>
        <div className="flex flex-wrap gap-2">
          {all.filter((x) => x.slug !== z.slug).map((x) => (
            <Link key={x.slug} href={`/goroskop/${x.slug}`} className="chip hover:text-ink">{x.symbol} {x.name}</Link>
          ))}
        </div>
      </section>
    </div>
  );
}
