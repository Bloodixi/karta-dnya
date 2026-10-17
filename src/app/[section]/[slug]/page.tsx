import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import ArticleToc from "@/components/ArticleToc";
import AuthorCard from "@/components/AuthorCard";
import { authorJsonLd, horoscopeAuthor } from "@/lib/authors";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import RazborCta from "@/components/RazborCta";
import ReadingProgress from "@/components/ReadingProgress";
import StonePhoto from "@/components/StonePhoto";
import { findDream, findDreamImage, findStone, findStoneImage, getArticle, getArticles, getDreams, getStones, getZodiac } from "@/lib/content";
import { pageTitle, SECTIONS, SECTION_KEYS, SITE, type SectionKey } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  const out: { section: string; slug: string }[] = [];
  for (const a of getArticles()) out.push({ section: a.section, slug: a.slug });
  for (const d of getDreams()) out.push({ section: "sonnik", slug: d.slug });
  for (const s of getStones()) out.push({ section: "kamni", slug: s.slug });
  return out;
}

export async function generateMetadata({ params }: PageProps<"/[section]/[slug]">): Promise<Metadata> {
  const { section, slug } = await params;
  const key = section as SectionKey;
  if (key === "sonnik") {
    const d = findDream(slug);
    if (d) return { title: `К чему снится ${d.word.toLowerCase()}: толкование сна`, description: `${d.short} ${d.meaning}`.slice(0, 160), alternates: { canonical: `/sonnik/${slug}` } };
  }
  if (key === "kamni") {
    const s = findStone(slug);
    if (s) return { title: s.name.length > 12 ? `${s.name}: свойства и кому подходит` : `${s.name}: свойства, кому подходит и как носить`, description: s.description.slice(0, 160), alternates: { canonical: `/kamni/${slug}` } };
  }
  const a = await getArticle(key, slug);
  if (!a) return {};
  return {
    title: pageTitle(a.title),
    description: a.description,
    alternates: { canonical: `/${section}/${slug}` },
    openGraph: { type: "article", title: a.title, description: a.description, publishedTime: a.date },
  };
}

export default async function Page({ params }: PageProps<"/[section]/[slug]">) {
  const { section, slug } = await params;
  const key = section as SectionKey;
  if (!SECTION_KEYS.includes(key)) notFound();

  if (key === "sonnik") {
    const d = findDream(slug);
    if (d) return <DreamPage slug={slug} />;
  }
  if (key === "kamni") {
    const s = findStone(slug);
    if (s) return <StonePage slug={slug} />;
  }

  const a = await getArticle(key, slug);
  if (!a) notFound();
  const more = getArticles(key).filter((x) => x.slug !== slug).slice(0, 3);
  const author = key === "astrologiya" ? horoscopeAuthor() : null;
  const showToc = a.toc.length >= 3;
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <ReadingProgress targetId="article-body" />
      <Breadcrumbs items={[{ href: `/${key}`, label: SECTIONS[key].title }, { href: `/${key}/${slug}`, label: a.title }]} />
      <header className="max-w-[72ch]">
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight">{a.title}</h1>
        <p className="text-muted mt-3 text-lg">{a.description}</p>
        <p className="text-xs text-muted mt-3">
          {new Date(a.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })} · {a.readingMinutes} мин чтения
        </p>
      </header>
      {a.cover && (
        <figure className="frame-gold rounded-2xl overflow-hidden bg-surface mt-6 max-w-4xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- next/image без оптимизации не даёт srcset */}
          <img src={a.cover.file} srcSet={`${a.cover.thumb} 600w, ${a.cover.file} 1200w`} sizes="(min-width: 960px) 896px, 92vw" width={1200} height={675} alt={a.title} loading="eager" fetchPriority="high" decoding="async" className="article-cover w-full h-auto block" />
        </figure>
      )}
      <div className={showToc ? "lg:grid lg:grid-cols-[minmax(0,72ch)_15rem] lg:gap-12 mt-6" : "mt-6"}>
        <div className="min-w-0">
          {showToc && (
            <details className="toc-mobile group lg:hidden card px-4 py-3 mb-4">
              <summary className="cursor-pointer font-semibold list-none flex justify-between gap-3 min-h-6">
                <span>Содержание</span>
                <span aria-hidden="true" className="text-muted group-open:rotate-45 transition-transform">+</span>
              </summary>
              <ArticleToc items={a.toc} />
            </details>
          )}
          <div id="article-body" className="prose prose-article" dangerouslySetInnerHTML={{ __html: a.html }} />
        </div>
        {showToc && (
          <aside className="hidden lg:block">
            <nav aria-label="Содержание" className="sticky top-24 border-l border-line pl-4">
              <p className="mono mb-2">Содержание</p>
              <ArticleToc items={a.toc} rail />
            </nav>
          </aside>
        )}
      </div>
      {key === "numerologiya" && <RazborCta from={`statya-${slug}`} />}
      {author && <AuthorCard author={author} className="mt-10 max-w-[72ch]" />}
      <Faq items={a.faq} />
      {a.tags.length > 0 && (
        <p className="mt-8 flex flex-wrap gap-2">
          {a.tags.map((t) => (
            <span key={t} className="chip">#{t}</span>
          ))}
        </p>
      )}
      {more.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl mb-3">Читайте также</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((m) => (
              <ArticleCard key={m.slug} a={m} />
            ))}
          </div>
        </section>
      )}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.description,
          datePublished: a.date,
          inLanguage: "ru",
          mainEntityOfPage: `${SITE.url}/${key}/${slug}`,
          ...(author ? { author: authorJsonLd(author) } : {}),
          publisher: { "@type": "Organization", name: SITE.name },
        }}
      />
    </article>
  );
}

function DreamPage({ slug }: { slug: string }) {
  const d = findDream(slug)!;
  const img = findDreamImage(slug);
  const others = dreamNeighbours(slug, 6);
  const article = dreamArticle(slug);
  const moodLabel = d.mood === "warning" ? "предупреждение" : d.mood === "good" ? "благоприятный знак" : "нейтральный символ";
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/sonnik", label: "Сонник" }, { href: `/sonnik/${slug}`, label: d.word }]} />
      <div className="grid gap-8 md:grid-cols-[360px_1fr] items-start">
        {img && (
          <figure className="frame-gold rounded overflow-hidden bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element -- next/image без оптимизации не даёт srcset */}
            <img src={img.file} srcSet={`${img.thumb} 320w, ${img.file} 640w`} sizes="(min-width: 768px) 360px, 90vw" width={640} height={480} alt={`${d.word}: иллюстрация символа сна`} loading="eager" fetchPriority="high" decoding="async" className="w-full h-auto block" />
          </figure>
        )}
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">К чему снится {d.word.toLowerCase()}</h1>
          <p className="chip mt-3">{moodLabel}</p>
          <p className="text-lg mt-4 max-w-[72ch]">{d.short}</p>
        </div>
      </div>
      <div className="prose mt-4">
        <p>{d.meaning}</p>
        {d.long?.intro.map((t, i) => <p key={i}>{t}</p>)}
        {d.long && (
          <>
            <h2>К чему снится {d.word.toLowerCase()}: детали сна</h2>
            {d.long.details.map((x, i) => (
              <section key={i}>
                <h3>{x.title}</h3>
                <p>{x.text}</p>
              </section>
            ))}
            {d.long.forWhom?.map((x, i) => (
              <section key={i}>
                <h2>К чему снится {d.word.toLowerCase()} {x.who.toLowerCase()}</h2>
                <p>{x.text}</p>
              </section>
            ))}
            <h2>Если сон повторяется</h2>
            <p>{d.long.repeat}</p>
          </>
        )}
        {d.variants.length > 0 && (
          <>
            <h2>{d.long ? "Коротко о вариантах" : "Варианты сна"}</h2>
            <ul>
              {d.variants.map((v, i) => (
                <li key={i}>
                  <strong>{v.when}</strong> — {v.means}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      {article && (
        <Link href={`/sonnik/${article.slug}`} className="card card-hover p-5 mt-8 flex items-center justify-between gap-4 max-w-[72ch]">
          <span>
            <span className="mono block">Подробный разбор сна</span>
            <span className="font-semibold text-lg leading-snug block mt-1">{article.title}</span>
          </span>
          <span aria-hidden="true" className="text-accent-text text-xl shrink-0">→</span>
        </Link>
      )}
      {d.long && <Faq items={d.long.faq} />}
      <section className="mt-10">
        <h2 className="text-2xl mb-3">Другие символы</h2>
        <div className="flex flex-wrap gap-2">
          {others.map((o) => (
            <Link key={o.slug} href={`/sonnik/${o.slug}`} className="chip hover:text-ink">
              {o.word}
            </Link>
          ))}
          <Link href="/sonnik" className="chip hover:text-ink">все символы →</Link>
        </div>
      </section>
    </article>
  );
}

/** Соседи символа по алфавиту (по `n` с каждой стороны, по кругу): на каждой странице свой набор вместо одних и тех же первых слов. */
function dreamNeighbours(slug: string, n: number) {
  const all = getDreams();
  const i = all.findIndex((x) => x.slug === slug);
  if (i < 0 || all.length < 2) return [];
  const out: typeof all = [];
  for (let k = -n; k <= n; k++) {
    if (k === 0) continue;
    const d = all[(i + k + all.length) % all.length];
    if (d.slug !== slug && !out.some((x) => x.slug === d.slug)) out.push(d);
  }
  return out;
}

/** Статьи раздела «Сонник», которые подробно разбирают символ, если slug статьи не совпадает с концом slug символа. */
const DREAM_ARTICLE_ALIASES: Record<string, string> = { pokoynik: "k-chemu-snyatsya-umershie", "umershiy-rodstvennik": "k-chemu-snyatsya-umershie" };

function dreamArticle(slug: string) {
  const articles = getArticles("sonnik");
  const alias = DREAM_ARTICLE_ALIASES[slug];
  return articles.find((a) => (alias ? a.slug === alias : a.slug.endsWith(`-${slug}`))) ?? null;
}

function StonePage({ slug }: { slug: string }) {
  const s = findStone(slug)!;
  const img = findStoneImage(slug);
  const zodiac = getZodiac();
  const signs = s.zodiac.map((z) => zodiac.find((x) => x.slug === z)).filter(Boolean);
  const related = relatedStones(slug, 6);
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/kamni", label: "Камни" }, { href: `/kamni/${slug}`, label: s.name }]} />
      <div className="grid gap-8 md:grid-cols-[360px_1fr] items-start">
        {img && <StonePhoto img={img} name={s.name} priority className="md:sticky md:top-24" />}
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">{s.name}</h1>
          <p className="text-muted mt-2">Цвет: {s.color} · Чакра: {s.chakra}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {s.properties.map((p) => (
              <span key={p} className="chip">{p}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="prose mt-6">
        <p>{s.description}</p>
        <h2>Как использовать</h2>
        <p>{s.howToUse}</p>
        <h2>Уход и очищение</h2>
        <p>{s.care}</p>
        {signs.length > 0 && (
          <>
            <h2>Кому подходит</h2>
            <p>
              {signs.map((z, i) => (
                <span key={z!.slug}>
                  {i > 0 && ", "}
                  <Link href={`/goroskop/${z!.slug}`}>{z!.symbol} {z!.name}</Link>
                </span>
              ))}
            </p>
          </>
        )}
      </div>
      {related.length > 0 && (
        <section className="mt-12">
          <div className="ornament mb-4 border-b border-line pb-2">
            <h2 className="text-2xl">Похожие камни</h2>
            <span className="mono">по знаку, цвету и свойствам</span>
            <Link href="/kamni" className="mono ml-auto hover:!text-ink">все камни →</Link>
          </div>
          <ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {related.map(({ stone: o, reason }) => {
              const pic = findStoneImage(o.slug);
              return (
                <li key={o.slug}>
                  <Link href={`/kamni/${o.slug}`} className="card card-hover block h-full overflow-hidden group">
                    {pic ? (
                      // eslint-disable-next-line @next/next/no-img-element -- миниатюра из того же набора, что и на /kamni
                      <img src={pic.thumb} width={400} height={300} alt="" loading="lazy" decoding="async" className="stone-img block w-full aspect-[4/3] object-cover bg-night" />
                    ) : (
                      <span aria-hidden="true" className="block w-full aspect-[4/3] bg-night" />
                    )}
                    <span className="block p-3">
                      <span className="block font-semibold leading-snug group-hover:text-accent-text">{o.name}</span>
                      <span className="mono block mt-1 !normal-case !tracking-normal">{reason}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  );
}

/** Семейство цвета по первому упомянутому оттенку: «нежно-розовый, сиреневый» → «розовый». */
const COLOR_FAMILIES: [RegExp, string][] = [
  [/фиолет|сирен/, "фиолетовый"],
  [/розов/, "розовый"],
  [/красн|алый|малин|винн/, "красный"],
  [/оранж/, "оранжевый"],
  [/жёлт|желт|золот|мед/, "золотистый"],
  [/зелён|зелен|бирюз|олив|мят/, "зелёный"],
  [/голуб|син/, "голубой и синий"],
  [/бел|молоч|бесцвет|прозрач/, "светлый"],
  [/чёрн|черн|сер|дымч/, "тёмный"],
  [/коричн/, "коричневый"],
];

function colorFamily(color: string): string | null {
  const c = color.toLowerCase();
  let best: { at: number; name: string } | null = null;
  for (const [re, name] of COLOR_FAMILIES) {
    const m = re.exec(c);
    if (m && (!best || m.index < best.at)) best = { at: m.index, name };
  }
  return best?.name ?? null;
}

/**
 * Связанные камни: общий знак зодиака, то же семейство цвета, общее свойство; при равенстве — ближайшие по списку.
 * У каждого — короткая причина, почему он рядом («тоже для Рыб» не склоняем: «знак: Рыбы»).
 */
function relatedStones(slug: string, n: number) {
  const all = getStones();
  const i = all.findIndex((x) => x.slug === slug);
  if (i < 0) return [];
  const me = all[i];
  const myColor = colorFamily(me.color);
  const zodiac = getZodiac();
  const scored = all
    .map((o, j) => {
      if (o.slug === slug) return null;
      const signs = o.zodiac.filter((z) => me.zodiac.includes(z));
      const props = o.properties.filter((p) => me.properties.includes(p));
      const sameColor = myColor !== null && colorFamily(o.color) === myColor;
      const score = signs.length * 2 + props.length * 3 + (sameColor ? 2 : 0);
      const dist = Math.min(Math.abs(i - j), all.length - Math.abs(i - j));
      let reason: string;
      if (props.length) reason = props[0];
      else if (signs.length) reason = `знак: ${zodiac.find((z) => z.slug === signs[0])?.name ?? signs[0]}`;
      else if (sameColor && myColor) reason = `цвет: ${myColor}`;
      else reason = o.properties[0] ?? o.color;
      return { stone: o, reason, score, dist };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.score - a.score || a.dist - b.dist);
  return scored.slice(0, n).map(({ stone, reason }) => ({ stone, reason }));
}
