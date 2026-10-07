import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AuthorCard from "@/components/AuthorCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { authorJsonLd, horoscopeAuthor } from "@/lib/authors";
import { SITE } from "@/lib/site";
import HoroscopeCard from "@/components/HoroscopeCard";
import HoroscopeGrid from "@/components/HoroscopeGrid";
import PeriodNav from "@/components/PeriodNav";
import ZodiacSign from "@/components/ZodiacSign";
import { findZodiac, getStones, getZodiac } from "@/lib/content";
import { allHoroscopes, horoscopeFor, PERIODS, PERIOD_KEYS, periodLabel, todayKey, type PeriodKey } from "@/lib/daily";

export const revalidate = 1800;
export const dynamicParams = false;

const isPeriod = (s: string): s is PeriodKey => (PERIOD_KEYS as string[]).includes(s) && s !== "segodnya";

export function generateStaticParams() {
  return [...getZodiac().map((z) => ({ sign: z.slug })), ...PERIOD_KEYS.filter((p) => p !== "segodnya").map((p) => ({ sign: p }))];
}

export async function generateMetadata({ params }: PageProps<"/goroskop/[sign]">): Promise<Metadata> {
  const { sign } = await params;
  if (isPeriod(sign)) {
    const t = PERIODS[sign].title;
    return {
      title: `Гороскоп ${t} для всех знаков зодиака`,
      description: `Гороскоп ${t} для каждого знака зодиака: общий фон, любовь, работа и деньги, самочувствие и совет. ${periodLabel(sign)}.`,
      alternates: { canonical: `/goroskop/${sign}` },
    };
  }
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
  const date = todayKey();
  const author = horoscopeAuthor();
  if (isPeriod(sign)) {
    const items = allHoroscopes(sign, date);
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs items={[{ href: "/goroskop", label: "Гороскоп" }, { href: `/goroskop/${sign}`, label: PERIODS[sign].title }]} />
        <h1 className="text-3xl md:text-4xl font-semibold">Гороскоп {PERIODS[sign].title}: {periodLabel(sign, date)}</h1>
        <p className="text-muted mt-2 max-w-2xl">Прогноз {PERIODS[sign].title} для каждого знака: общий фон, любовь, дела, самочувствие и совет.</p>
        <div className="mt-4"><PeriodNav current={sign} /></div>
        <HoroscopeGrid items={items} period={sign} />
        {author && items.some((h) => h.source === "astro") && <AuthorCard author={author} note="гороскопы ведёт" className="mt-10" />}
      </div>
    );
  }
  const z = findZodiac(sign);
  if (!z) notFound();
  const h = horoscopeFor(z, "segodnya", date);
  const all = getZodiac();
  const name = (s: string) => all.find((x) => x.slug === s);
  const stones = getStones().filter((s) => s.zodiac.includes(z.slug)).slice(0, 4);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/goroskop", label: "Гороскоп" }, { href: `/goroskop/${sign}`, label: z.name }]} />
      <div className="flex items-center gap-4">
        <ZodiacSign symbol={z.symbol} element={z.element} slug={`sign-${z.slug}`} size={84} className="shrink-0" />
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">{z.name}: гороскоп на сегодня</h1>
          <p className="text-muted">{z.dates} · {z.element} · {z.planet}</p>
        </div>
      </div>
      <div className="mt-4"><PeriodNav current="segodnya" sign={z.slug} /></div>
      {h && <div className="mt-4"><HoroscopeCard h={h} /></div>}

      <section className="prose mt-10">
        <h2>Характер знака {z.name}</h2>
        <p>{z.description}</p>
        <p className="text-sm text-muted">Это портрет солнечного знака — внутреннего ядра. За первое впечатление отвечает <Link href={`/astrologiya/voshodyaschiy-znak#asc-${z.slug}`}>восходящий знак (Асцендент)</Link>: его можно рассчитать по дате, времени и городу рождения.</p>
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
          Лучше всего: {z.compatibility.best.map((s, i) => { const o = name(s); return o ? <span key={s}>{i > 0 && ", "}<Link href={`/sovmestimost/${z.slug}-${s}`}>{o.name}</Link></span> : null; })}.
          Сложнее: {z.compatibility.hard.map((s, i) => { const o = name(s); return o ? <span key={s}>{i > 0 && ", "}<Link href={`/sovmestimost/${z.slug}-${s}`}>{o.name}</Link></span> : null; })}.
          {" "}<Link href="/sovmestimost">Проверить любую пару →</Link>
        </p>
        <h2>Талисманы</h2>
        <p>Камень: {z.stone}. Цвет: {z.color}. Счастливые числа: {z.luckyNumbers.join(", ")}.</p>
        {stones.length > 0 && <p>Подробнее о камнях: {stones.map((s, i) => <span key={s.slug}>{i > 0 && ", "}<Link href={`/kamni/${s.slug}`}>{s.name}</Link></span>)}. <Link href={`/kamni/po-znaku-zodiaka/${z.slug}`}>Все камни для знака {z.name} →</Link></p>}
      </section>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Другие знаки</h2>
        <div className="flex flex-wrap gap-2">
          {all.filter((x) => x.slug !== z.slug).map((x) => (
            <Link key={x.slug} href={`/goroskop/${x.slug}`} className="chip hover:text-ink">{x.symbol} {x.name}</Link>
          ))}
        </div>
      </section>
      {author && h?.source === "astro" && <AuthorCard author={author} note="гороскопы ведёт" className="mt-10" />}
      {h?.source === "astro" && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${z.name}: гороскоп на сегодня, ${h.label}`,
            datePublished: h.key,
            dateModified: h.key,
            inLanguage: "ru",
            mainEntityOfPage: `${SITE.url}/goroskop/${sign}`,
            ...(author ? { author: authorJsonLd(author) } : {}),
            publisher: { "@type": "Organization", name: SITE.name },
          }}
        />
      )}
    </div>
  );
}
