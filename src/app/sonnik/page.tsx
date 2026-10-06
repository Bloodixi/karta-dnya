import type { Metadata } from "next";
import ArticleCard from "@/components/ArticleCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import DreamSearch from "@/components/DreamSearch";
import { getArticles, getDreamImages, getDreams } from "@/lib/content";
import { SECTIONS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Сонник: к чему снится — толкование снов по символам",
  description: "Бесплатный сонник онлайн: толкование самых частых снов по символам — вода, змея, зубы, полёт, свадьба, покойник и сотни других. Поиск по слову.",
  alternates: { canonical: "/sonnik" },
};

export default function DreamsPage() {
  const dreams = getDreams();
  const images = getDreamImages();
  const articles = getArticles("sonnik");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/sonnik", label: "Сонник" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Сонник</h1>
      <p className="text-muted mt-2 max-w-2xl">{SECTIONS.sonnik.description}</p>
      <div className="mt-6">
        {dreams.length ? <DreamSearch items={dreams.map((d) => ({ slug: d.slug, word: d.word, short: d.short, thumb: images[d.slug]?.thumb }))} /> : <p className="text-muted">Символы сонника готовятся.</p>}
      </div>
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
