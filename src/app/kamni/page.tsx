import type { Metadata } from "next";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import HubHeader from "@/components/HubHeader";
import { getArticles, getStoneImages, getStones } from "@/lib/content";
import { SECTIONS, SECTION_TOOLS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Камни и талисманы: свойства минералов и кому подходят",
  description: "Каталог камней и минералов: свойства, цвет, чакра, кому подходит по знаку зодиака, как носить и очищать. Аметист, розовый кварц, турмалин, цитрин и другие.",
  alternates: { canonical: "/kamni" },
};

export default function StonesPage() {
  const stones = getStones();
  const images = getStoneImages();
  const articles = getArticles("kamni");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/kamni", label: "Камни" }]} />
      <HubHeader icon={SECTIONS.kamni.icon} title="Камни и талисманы" lede={SECTIONS.kamni.description} links={(SECTION_TOOLS.kamni || []).filter((t) => t.href !== "/kamni")} />
      {stones.length ? (
        <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          {stones.map((s) => (
            <Link key={s.slug} href={`/kamni/${s.slug}`} className="card card-hover overflow-hidden flex flex-col">
              {images[s.slug] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[s.slug].thumb} width={400} height={300} alt={`${s.name}: фото`} loading="lazy" decoding="async" className="stone-img w-full aspect-[4/3] object-cover" />
              )}
              <span className="p-3 sm:p-4 flex flex-col min-w-0">
                <p className="font-semibold leading-snug">{s.name}</p>
                <p className="hidden sm:block text-xs text-muted">{s.color}</p>
                <p className="text-xs sm:text-sm text-muted mt-1 sm:mt-2 line-clamp-1 sm:line-clamp-2">{s.properties.join(", ")}</p>
              </span>
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
