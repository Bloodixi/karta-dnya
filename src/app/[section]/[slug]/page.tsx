import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import AuthorCard from "@/components/AuthorCard";
import { authorJsonLd, horoscopeAuthor } from "@/lib/authors";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
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
    if (s) return { title: `${s.name}: свойства, кому подходит и как носить`, description: s.description.slice(0, 160), alternates: { canonical: `/kamni/${slug}` } };
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
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: `/${key}`, label: SECTIONS[key].title }, { href: `/${key}/${slug}`, label: a.title }]} />
      <header className="max-w-[72ch]">
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight">{a.title}</h1>
        <p className="text-muted mt-3 text-lg">{a.description}</p>
        <p className="text-xs text-muted mt-3">
          {new Date(a.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })} · {a.readingMinutes} мин чтения
        </p>
      </header>
      <div className="prose mt-6" dangerouslySetInnerHTML={{ __html: a.html }} />
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
  const others = getDreams().filter((x) => x.slug !== slug).slice(0, 12);
  const moodLabel = d.mood === "warning" ? "предупреждение" : d.mood === "good" ? "благоприятный знак" : "нейтральный символ";
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/sonnik", label: "Сонник" }, { href: `/sonnik/${slug}`, label: d.word }]} />
      <div className="grid gap-8 md:grid-cols-[360px_1fr] items-start">
        {img && (
          <figure className="frame-gold rounded-2xl overflow-hidden bg-surface">
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
        {d.variants.length > 0 && (
          <>
            <h2>Варианты сна</h2>
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

function StonePage({ slug }: { slug: string }) {
  const s = findStone(slug)!;
  const img = findStoneImage(slug);
  const zodiac = getZodiac();
  const signs = s.zodiac.map((z) => zodiac.find((x) => x.slug === z)).filter(Boolean);
  const others = getStones().filter((x) => x.slug !== slug).slice(0, 10);
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
      <section className="mt-10">
        <h2 className="text-2xl mb-3">Другие камни</h2>
        <div className="flex flex-wrap gap-2">
          {others.map((o) => (
            <Link key={o.slug} href={`/kamni/${o.slug}`} className="chip hover:text-ink">{o.name}</Link>
          ))}
          <Link href="/kamni" className="chip hover:text-ink">все камни →</Link>
        </div>
      </section>
    </article>
  );
}
