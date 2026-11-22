import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import HubHeader from "@/components/HubHeader";
import JsonLd from "@/components/JsonLd";
import RazborCta from "@/components/RazborCta";
import TarotIndex from "@/components/TarotIndex";
import TelegramDaily from "@/components/TelegramDaily";
import { getArticles } from "@/lib/content";
import { SECTIONS, SECTION_KEYS, SECTION_TOOLS, SITE, orgJsonLd, type SectionKey } from "@/lib/site";
import ArticleLinks from "@/components/ArticleLinks";

const ASTRO_FAQ = [
  { q: "С чего начать знакомство с астрологией на сайте?", a: "Проще всего рассчитать натальную карту по дате, времени и месту рождения, проверить свой восходящий знак (Асцендент) и сверить текущие транзиты планет с ежедневным гороскопом." },
  { q: "Чем солнечный знак отличается от Асцендента?", a: "Солнечный знак описывает базовый характер и мотивацию, а Асцендент (восходящий знак) показывает первое впечатление и сетку домов, в которых проигрываются события." },
  { q: "Как астрология на «Карте дня» связана с персональным разбором?", a: "В разделе собраны общие астрологические расчёты и прогнозы по знакам, а персональный разбор объединяет ваши числа даты рождения, матрицу Пифагора и тон ближайших 12 месяцев." },
];

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
      {key === "astrologiya" && (
        <section className="card p-5 mt-8" aria-labelledby="astro-answer">
          <h2 id="astro-answer" className="text-lg font-semibold">Главные астрологические инструменты и прогнозы</h2>
          <p className="text-sm text-muted mt-1.5">
            Все расчёты на Карте дня строятся по точным эфемеридам: посмотрите <Link href="/astrologiya/natalnaya-karta" className="text-accent-text underline">натальную карту</Link>,{" "}
            <Link href="/astrologiya/tranzity" className="text-accent-text underline">транзиты планет сегодня</Link>,{" "}
            <Link href="/astrologiya/retrogradnyy-merkuriy" className="text-accent-text underline">календарь ретроградного Меркурия</Link> и{" "}
            <Link href="/astrologiya/zatmeniya-2027" className="text-accent-text underline">затмения 2027 года</Link>. Из ежедневных знаков чаще всего ищут{" "}
            <Link href="/goroskop/skorpion" className="text-accent-text underline">Скорпиона</Link>, <Link href="/goroskop/rak" className="text-accent-text underline">Рака</Link> и{" "}
            <Link href="/goroskop/deva" className="text-accent-text underline">Деву</Link>.
          </p>
        </section>
      )}
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
      {key === "astrologiya" && (
        <>
          <RazborCta from="astrologiya-hub" className="mt-10" />
          <Faq items={ASTRO_FAQ} />
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: s.seoTitle ?? s.title,
              description: s.description,
              url: `${SITE.url}/${key}`,
              inLanguage: "ru",
              publisher: orgJsonLd(),
            }}
          />
        </>
      )}
      {key === "numerologiya" && <TelegramDaily campaign="numerologiya" />}
    </div>
  );
}
