import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import HubHeader from "@/components/HubHeader";
import TarotIndex from "@/components/TarotIndex";
import TelegramDaily from "@/components/TelegramDaily";
import { getArticles } from "@/lib/content";
import { SECTIONS, SECTION_KEYS, SECTION_TOOLS, type SectionKey } from "@/lib/site";
import ArticleLinks from "@/components/ArticleLinks";

export const dynamicParams = false;

export function generateStaticParams() {
  return SECTION_KEYS.map((section) => ({ section }));
}

export async function generateMetadata({ params }: PageProps<"/[section]">): Promise<Metadata> {
  const { section } = await params;
  const s = SECTIONS[section as SectionKey];
  if (!s) return {};
  return { title: s.seoTitle ?? s.title, description: s.description, alternates: { canonical: `/${section}` } };
}

export default async function SectionPage({ params }: PageProps<"/[section]">) {
  const { section } = await params;
  const key = section as SectionKey;
  const s = SECTIONS[key];
  if (!s) notFound();
  const articles = getArticles(key);
  const tools = SECTION_TOOLS[key] || [];
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: `/${key}`, label: s.title }]} />
      <HubHeader icon={s.icon} title={s.title} lede={s.description} links={tools} />
      {key === "taro" && <TarotIndex className="mt-10" />}
      <ArticleLinks path={`/${key}`} title="С чего начать" />
      <h2 className="text-2xl mt-10 mb-3">Статьи</h2>
      {articles.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.slug} a={a} />
          ))}
        </div>
      ) : (
        <p className="text-muted">Статьи этого раздела появятся совсем скоро.</p>
      )}
      {key === "numerologiya" && <TelegramDaily campaign="numerologiya" />}
    </div>
  );
}
