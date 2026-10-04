import type { Metadata } from "next";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getArticles, getStones } from "@/lib/content";
import { SECTIONS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Камни и талисманы: свойства минералов и кому они подходят",
  description: "Каталог камней и минералов: свойства, цвет, чакра, кому подходит по знаку зодиака, как носить и очищать. Аметист, розовый кварц, турмалин, цитрин и другие.",
  alternates: { canonical: "/kamni" },
};

export default function StonesPage() {
  const stones = getStones();
  const articles = getArticles("kamni");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/kamni", label: "Камни" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">💎 Камни и талисманы</h1>
      <p className="text-muted mt-2 max-w-2xl">{SECTIONS.kamni.description}</p>
      {stones.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stones.map((s) => (
            <Link key={s.slug} href={`/kamni/${s.slug}`} className="card card-hover p-4">
              <p className="font-semibold">{s.name}</p>
              <p className="text-xs text-muted">{s.color}</p>
              <p className="text-sm text-muted mt-2 line-clamp-2">{s.properties.join(", ")}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted mt-6">Каталог готовится.</p>
      )}
      {articles.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl mb-3">Статьи</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => <ArticleCard key={a.slug} a={a} />)}
          </div>
        </section>
      )}
    </div>
  );
}
