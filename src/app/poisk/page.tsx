import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import SiteSearch from "@/components/SiteSearch";
import { TOOLS } from "@/lib/site";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ searchParams }: PageProps<"/poisk">): Promise<Metadata> {
  const q = one((await searchParams).q).trim();
  return {
    title: q ? `Поиск: ${q.slice(0, 40)}` : "Поиск по сайту",
    description: "Поиск по сайту «Карта дня»: карты Таро, знаки зодиака и гороскопы, руны, камни, символы сонника, числа, статьи и онлайн-инструменты в одном месте.",
    alternates: { canonical: "/poisk" },
    // страницы результатов (?q=) не индексируем: они повторяют разделы сайта
    ...(q ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function SearchPage({ searchParams }: PageProps<"/poisk">) {
  const q = one((await searchParams).q).trim().slice(0, 100);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/poisk", label: "Поиск" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Поиск по сайту</h1>
      <p className="text-muted mt-2 mb-6 max-w-2xl">Карты Таро, знаки и гороскопы, руны, камни, сны, числа и статьи. Можно писать без «ё» и с опечаткой.</p>
      <SiteSearch initialQuery={q} />
      <section className="mt-12">
        <h2 className="text-2xl mb-3">Инструменты</h2>
        <div className="flex flex-wrap gap-2">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="chip hover:text-ink">{t.title}</Link>
          ))}
        </div>
      </section>
    </div>
  );
}
