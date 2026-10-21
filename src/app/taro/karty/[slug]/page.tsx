import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import RazborCta from "@/components/RazborCta";
import TarotCardView from "@/components/TarotCardView";
import { findTarot, findTarotExtra, findTarotLong, getTarot, type TarotCard, type TarotExtra } from "@/lib/content";
import { SITE, orgJsonLd } from "@/lib/site";
import ArticleLinks from "@/components/ArticleLinks";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTarot().map((c) => ({ slug: c.slug }));
}

const DESC_TAILS = [
  " Прямое и перевёрнутое значение, смысл в любви и работе, совет карты и ответ «да или нет».",
  " Значение в прямом и перевёрнутом положении, в любви и работе, совет и ответ «да или нет».",
  " Прямое и перевёрнутое значение, любовь, работа и ответ «да или нет».",
];

/** Описание 140–160 знаков: имя карты один раз, ключевые слова и что есть на странице. Подбирает число ключевых слов и хвост под длину. */
function cardDescription(c: TarotCard): string {
  let best = "";
  let score = Infinity;
  for (let n = c.keywords.length; n >= 1; n--) {
    const k = c.keywords.slice(0, n);
    const words = n > 1 ? `${k.slice(0, -1).join(", ")} и ${k[n - 1]}` : k[0];
    for (const head of [`${c.name} в Таро: ${words}.`, `Карта Таро «${c.name}»: ${words}.`]) {
      for (const tail of DESC_TAILS) {
        const d = head + tail;
        const sc = Math.abs(d.length - 152);
        if (d.length >= 140 && d.length <= 160 && sc < score) [best, score] = [d, sc];
      }
    }
  }
  return best || `${c.name} в Таро: ${c.keywords.join(", ")}.${DESC_TAILS[0]}`.slice(0, 160);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function cardFaq(c: TarotCard, extra: TarotExtra | null) {
  return [
    { q: `Что означает карта «${c.name}» в прямом положении?`, a: c.upright },
    { q: `Что значит перевёрнутая карта «${c.name}»?`, a: c.reversed },
    { q: `Что означает «${c.name}» в любви и отношениях?`, a: c.love },
    ...(extra ? [{ q: `«${c.name}» — это да или нет?`, a: `${cap(extra.yesno)}. ${extra.yesnoWhy}` }] : []),
  ];
}

export async function generateMetadata({ params }: PageProps<"/taro/karty/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = findTarot(slug);
  if (!c) return {};
  return {
    title: `${c.name} Таро: значение и толкование карты`,
    description: cardDescription(c),
    alternates: { canonical: `/taro/karty/${slug}` },
  };
}

export default async function CardPage({ params }: PageProps<"/taro/karty/[slug]">) {
  const { slug } = await params;
  const c = findTarot(slug);
  if (!c) notFound();
  const all = getTarot();
  const extra = findTarotExtra(slug);
  const long = findTarotLong(slug);
  const faq = cardFaq(c, extra);
  const byslug = (x: string) => all.find((a) => a.slug === x);
  const idx = all.findIndex((x) => x.slug === slug);
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];
  const sameGroup = all.filter((x) => x.slug !== slug && (c.arcana === "major" ? x.arcana === "major" : x.suit === c.suit));
  const sameNumber = c.arcana === "major" ? [] : all.filter((x) => x.slug !== slug && x.arcana !== "major" && x.number === c.number);
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/taro", label: "Таро" }, { href: "/taro/karty", label: "Значения карт" }, { href: `/taro/karty/${slug}`, label: c.name }]} />
      <div className="grid gap-x-8 gap-y-5 md:gap-y-2 md:grid-cols-[240px_1fr] items-start">
        {/* На телефоне заголовок идёт до карты, на десктопе — справа от неё. */}
        <h1 className="text-3xl md:text-4xl font-semibold md:col-start-2 md:row-start-1">{c.name}: значение карты Таро</h1>
        <figure className="w-40 mx-auto md:mx-0 md:w-full md:sticky md:top-24 md:col-start-1 md:row-start-1 md:row-span-2">
          <TarotCardView slug={c.slug} name={c.name} priority />
          <figcaption className="text-xs text-muted mt-3 text-center">{c.arcana === "major" ? `Старший аркан ${c.number}` : c.suitName} · колода Райдера–Уэйта, 1909</figcaption>
        </figure>
        <div className="prose md:col-start-2">
          {c.description && <p>{c.description}</p>}
          <h2>Прямое положение</h2>
          <p>{long?.upright || c.upright}</p>
          <h2>Перевёрнутое положение</h2>
          <p>{long?.reversed || c.reversed}</p>
          <p>Как читать перевёрнутые карты в раскладе в целом: <Link href="/taro/perevernutye-karty-taro">статья о перевёрнутых картах Таро</Link>.</p>
          <h2>В любви и отношениях</h2>
          {long ? (
            <>
              <h3>Прямое положение</h3>
              <p>{long.love}</p>
              <h3>Перевёрнутое положение</h3>
              <p>{long.loveReversed}</p>
            </>
          ) : (
            <p>{c.love}</p>
          )}
          <h2>В работе и деньгах</h2>
          <p>{long?.career || c.career}</p>
          {extra && (
            <>
              <h2>Силы и ресурс</h2>
              <p>{extra.health}</p>
              <h2>Ответ «да или нет»</h2>
              <p><strong>{cap(extra.yesno)}.</strong> {long?.yesno || extra.yesnoWhy} Проверить на свой вопрос: <Link href="/taro/da-net">гадание да/нет</Link>.</p>
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
          <blockquote>{long?.advice || c.advice}</blockquote>
          {c.arcana === "major" && <p>Этот образ есть и в матрице судьбы: <Link href={`/matrica-sudby/arkany/${c.number === 0 ? 22 : c.number}`}>{c.number === 0 ? 22 : c.number} аркан, {c.name}</Link>.</p>}
        </div>
      </div>
      {/* на десктопе — под колонкой текста, справа от карты */}
      <ArticleLinks path={[`/taro/karty/${slug}`, ...(c.arcana === "minor" ? ["taro-minor"] : [])]} className="max-w-3xl md:ml-[272px] md:max-w-[40rem]" />
      <Faq items={faq} className="max-w-3xl md:ml-[272px] md:max-w-[40rem]" />
      <RazborCta from="taro-karta" className="mt-10 md:ml-[272px] md:max-w-[40rem]" />
      <section className="mt-10" aria-labelledby="same-group">
        <h2 id="same-group" className="text-2xl mb-3">{c.arcana === "major" ? "Другие старшие арканы" : `Другие карты: ${c.suitName}`}</h2>
        <div className="flex flex-wrap gap-2">
          {sameGroup.map((x) => <Link key={x.slug} href={`/taro/karty/${x.slug}`} className="chip hover:text-ink hover:border-gold">{x.name}</Link>)}
        </div>
        {sameNumber.length > 0 && (
          <>
            <p className="mono mt-4 mb-2">та же карта в других мастях</p>
            <div className="flex flex-wrap gap-2">
              {sameNumber.map((x) => <Link key={x.slug} href={`/taro/karty/${x.slug}`} className="chip hover:text-ink hover:border-gold">{x.name}</Link>)}
            </div>
          </>
        )}
        <p className="text-sm mt-4">Задать карте короткий вопрос: <Link href="/taro/da-net" className="text-accent-text underline">Таро «да или нет»</Link> · <Link href="/karta-dnya" className="text-accent-text underline">карта дня</Link> · <Link href="/taro/tri-karty" className="text-accent-text underline">расклад на три карты</Link>.</p>
      </section>
      <div className="mt-10 flex flex-wrap gap-2 justify-between text-sm">
        <Link href={`/taro/karty/${prev.slug}`} className="btn btn-ghost">← {prev.name}</Link>
        <Link href="/taro/karty" className="btn btn-ghost">Все карты</Link>
        <Link href={`/taro/karty/${next.slug}`} className="btn btn-ghost">{next.name} →</Link>
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${c.name}: значение карты Таро`,
          description: cardDescription(c),
          image: `${SITE.url}/cards/${c.slug}@2x.webp`,
          inLanguage: "ru",
          mainEntityOfPage: `${SITE.url}/taro/karty/${slug}`,
          about: { "@type": "Thing", name: `${c.name} (карта Таро)` },
          author: orgJsonLd(), publisher: orgJsonLd(),
        }}
      />
    </article>
  );
}
