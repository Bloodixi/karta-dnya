import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import HanziMark from "@/components/HanziMark";
import JsonLd from "@/components/JsonLd";
import { getStones } from "@/lib/content";
import {
  COMPAT_LABELS,
  compatLevel,
  findChineseAnimal,
  formatRuDate,
  getChineseAnimals,
  getChineseElements,
  getForecast2027,
  signName,
  yearsOf,
  elementForYear,
  type CompatLevel,
} from "@/lib/chineseZodiac";
import { pageTitle, SITE, orgJsonLd } from "@/lib/site";

const HUB = "/kitayskiy-goroskop";

export const dynamicParams = false;

export function generateStaticParams() {
  return getChineseAnimals().map((a) => ({ zhivotnoe: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/kitayskiy-goroskop/[zhivotnoe]">): Promise<Metadata> {
  const { zhivotnoe } = await params;
  const a = findChineseAnimal(zhivotnoe);
  if (!a) return {};
  return {
    title: pageTitle(`Год ${a.gen}: характер, совместимость и годы рождения`),
    description: a.description,
    alternates: { canonical: `${HUB}/${a.slug}` },
  };
}

const LEVEL_ORDER: CompatLevel[] = ["best", "friend", "neutral", "hard"];
const LEVEL_TITLES: Record<CompatLevel, string> = {
  best: "Лучшие союзники",
  friend: "Тайный друг",
  neutral: "Ровные отношения",
  hard: "Пара, где нужно договариваться",
};

export default async function ChineseAnimalPage({ params }: PageProps<"/kitayskiy-goroskop/[zhivotnoe]">) {
  const { zhivotnoe } = await params;
  const a = findChineseAnimal(zhivotnoe);
  if (!a) notFound();
  const animals = getChineseAnimals();
  const elements = getChineseElements();
  const stones = getStones();
  const years = yearsOf(a.order).filter((y) => y.year >= 1924);
  const forecast = getForecast2027().find((f) => f.slug === a.slug);
  const others = animals.filter((x) => x.slug !== a.slug);
  const groups = LEVEL_ORDER.map((level) => ({ level, items: others.filter((x) => compatLevel(a.order, x.order) === level) })).filter((g) => g.items.length);
  const stoneLinks = a.stones.map((s) => stones.find((x) => x.slug === s)).filter((s) => !!s);

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/astrologiya", label: "Астрология" }, { href: HUB, label: "Китайский гороскоп" }, { href: `${HUB}/${a.slug}`, label: a.name }]} />
      <div className="flex items-center gap-4">
        <HanziMark hanzi={a.hanzi} size="lg" />
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">Год {a.gen} в китайском гороскопе</h1>
          <p className="text-muted">{a.alias} · {a.order}-й знак цикла · {a.polarity} · постоянная стихия {a.element}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="chip">часы знака: {a.hours}</span>
        <span className="chip">цвета: {a.colors.join(", ")}</span>
        <span className="chip">числа: {a.numbers.join(", ")}</span>
      </div>

      <section className="prose mt-8">
        <h2>Характер людей, рождённых в год {a.gen}</h2>
        {a.character.map((p, i) => <p key={i}>{p}</p>)}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-xl">Сильные стороны</h2>
          <ul className="mt-3 grid gap-1.5 text-sm list-disc pl-5">{a.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
        <div className="card p-5">
          <h2 className="text-xl">Над чем работать</h2>
          <ul className="mt-3 grid gap-1.5 text-sm list-disc pl-5">{a.growth.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      </section>

      <section className="prose mt-8">
        <h2>В любви и в работе</h2>
        <p>{a.love}</p>
        <p>{a.work}</p>
      </section>

      <section className="mt-10">
        <div className="ornament mb-4"><h2 className="text-2xl">Совместимость {a.gen} с другими знаками</h2><span className="mono">по традиции</span></div>
        <p className="max-w-3xl">{a.compatText}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g) => (
            <div key={g.level} className="card p-4">
              <p className="mono">{LEVEL_TITLES[g.level]}</p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {g.items.map((x) => <Link key={x.slug} href={`${HUB}/${x.slug}`} className="chip hover:text-ink" title={COMPAT_LABELS[g.level]}>{x.name}</Link>)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted mt-3">Союзники по тройке делят общий взгляд на жизнь, тайный друг тихо поддерживает, противоположный знак стоит напротив в круге из двенадцати: с ним интересно, но приходится больше договариваться. Совместимость по западному зодиаку — в разделе <Link href="/sovmestimost" className="text-accent-text underline">совместимость знаков</Link>.</p>
      </section>

      <section className="mt-10">
        <div className="ornament mb-4"><h2 className="text-2xl">Пять стихий {a.gen}</h2><span className="mono">годы рождения</span></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {elements.map((e) => {
            const own = years.filter((y) => elementForYear(y.year)?.key === e.key);
            return (
              <div key={e.key} className="card p-4">
                <p className="display text-lg">{signName(e, a)}</p>
                <p className="text-xs text-accent-text mt-1">{own.map((y) => y.year).join(", ")}</p>
                <p className="text-sm text-muted mt-2">{a.elements[e.key]}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <div className="ornament mb-4"><h2 className="text-2xl">Годы {a.gen}: точные даты</h2><span className="mono">по лунному календарю</span></div>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="px-4 py-2 font-normal">Год</th>
                <th className="px-4 py-2 font-normal">Знак</th>
                <th className="px-4 py-2 font-normal">Период</th>
              </tr>
            </thead>
            <tbody>
              {years.map((y) => (
                <tr key={y.year} className="border-b border-line last:border-0">
                  <td className="px-4 py-1.5 tabular-nums">{y.year}</td>
                  <td className="px-4 py-1.5">{signName(elementForYear(y.year), a)}</td>
                  <td className="px-4 py-1.5 tabular-nums">{formatRuDate(y.start)}{y.end ? ` — ${formatRuDate(y.end)}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted mt-2">Родились в январе или феврале? Проверьте дату в <Link href={HUB} className="text-accent-text underline">калькуляторе китайского гороскопа</Link>: до Нового года по лунному календарю действует предыдущий знак.</p>
      </section>

      <section className="mt-10">
        <div className="ornament mb-4"><h2 className="text-2xl">Камни и цвета {a.gen}</h2><span className="mono">талисманы</span></div>
        <div className="flex flex-wrap gap-2">
          {stoneLinks.map((s) => <Link key={s.slug} href={`/kamni/${s.slug}`} className="chip hover:text-ink">{s.name}</Link>)}
        </div>
        <p className="text-sm text-muted mt-3 max-w-3xl">Счастливые цвета знака — {a.colors.join(", ")}; числа — {a.numbers.join(", ")}. Это традиционные соответствия: выбирайте камень, который нравится и который хочется носить. Больше идей — в подборе <Link href="/kamni/po-date-rozhdeniya" className="text-accent-text underline">камня по дате рождения</Link>.</p>
      </section>

      {forecast && (
        <section className="prose mt-10">
          <h2>{a.name} в 2027 году</h2>
          <p>{forecast.text}</p>
          <p><Link href={`${HUB}/2027`}>Весь прогноз на год Красной Огненной Козы</Link></p>
        </section>
      )}

      <Faq items={a.faq} />

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Другие знаки китайского гороскопа</h2>
        <div className="flex flex-wrap gap-2">
          {others.map((x) => <Link key={x.slug} href={`${HUB}/${x.slug}`} className="chip hover:text-ink">{x.name}</Link>)}
          <Link href={HUB} className="chip hover:text-ink">калькулятор по году →</Link>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Год ${a.gen} в китайском гороскопе`,
          description: a.description,
          url: `${SITE.url}${HUB}/${a.slug}`,
          inLanguage: "ru",
          author: orgJsonLd(), publisher: orgJsonLd(),
        }}
      />
    </article>
  );
}
