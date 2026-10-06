import type { Metadata } from "next";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import DreamSearch from "@/components/DreamSearch";
import { getArticles, getDreamImages, getDreams } from "@/lib/content";
import { SECTIONS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Сонник: к чему снится — толкование снов по символам",
  description: "Бесплатный сонник онлайн: 200 символов по алфавиту от А до Я — вода, змея, зубы, полёт, свадьба, покойник, кошка, деньги. Поиск по слову и толкование.",
  alternates: { canonical: "/sonnik" },
};

const POPULAR = ["voda", "zmeya", "zuby", "polet", "svadba", "pokoynik", "koshka", "sobaka", "dengi", "beremennost", "byvshiy", "umershiy-rodstvennik"];

export default function DreamsPage() {
  const dreams = getDreams();
  const images = getDreamImages();
  const articles = getArticles("sonnik");
  const popular = POPULAR.map((slug) => dreams.find((d) => d.slug === slug)).filter((d) => d !== undefined);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/sonnik", label: "Сонник" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Сонник</h1>
      <p className="text-muted mt-2 max-w-2xl">{SECTIONS.sonnik.description}</p>

      {popular.length > 0 && (
        <section className="mt-8" aria-labelledby="popular">
          <div className="ornament mb-4"><h2 id="popular" className="text-2xl">Популярные сны</h2><span className="mono">{popular.length} символов</span></div>
          <div className="grid-lines grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
            {popular.map((d) => (
              <Link key={d.slug} href={`/sonnik/${d.slug}`} className="p-3 hover:bg-surface transition-colors flex flex-col gap-2">
                {images[d.slug] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images[d.slug].thumb} width={320} height={240} alt="" loading="lazy" decoding="async" className="w-full h-auto rounded-sm object-cover aspect-[4/3]" />
                )}
                <span className="font-medium text-sm leading-snug">{d.word}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10" aria-labelledby="all-dreams">
        <div className="ornament mb-4"><h2 id="all-dreams" className="text-2xl">Все символы от А до Я</h2><span className="mono">{dreams.length} толкований</span></div>
        {dreams.length ? <DreamSearch items={dreams.map((d) => ({ slug: d.slug, word: d.word, short: d.short, thumb: images[d.slug]?.thumb }))} /> : <p className="text-muted">Символы сонника готовятся.</p>}
      </section>

      {articles.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl mb-3">Статьи о снах</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => <ArticleCard key={a.slug} a={a} />)}
          </div>
        </section>
      )}
    </div>
  );
}
