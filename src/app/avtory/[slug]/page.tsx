import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import Icon, { type IconName } from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import { authorJsonLd, authorYears, findAuthor, getAuthors } from "@/lib/authors";
import { getArticles } from "@/lib/content";
import { pageTitle, SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAuthors().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/avtory/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = findAuthor(slug);
  if (!a) return {};
  return {
    title: pageTitle(`${a.name} — ${a.role}, автор гороскопов`),
    description: `${a.name}, ${a.role} с ${a.since} года: автор гороскопов и материалов по астрологии на «Карте дня». Биография, подход к прогнозам и методика расчёта.`,
    alternates: { canonical: `/avtory/${slug}` },
  };
}

const SECTIONS_LINKS: { href: string; title: string; icon: IconName }[] = [
  { href: "/goroskop", title: "Гороскоп на сегодня", icon: "sun" },
  { href: "/goroskop/nedelya", title: "На неделю", icon: "calendar" },
  { href: "/goroskop/god", title: "На год", icon: "calendar" },
  { href: "/astrologiya/natalnaya-karta", title: "Натальная карта", icon: "star" },
  { href: "/astrologiya/retrogradnyy-merkuriy", title: "Ретроградный Меркурий", icon: "ball" },
  { href: "/astrologiya/luna-v-znake", title: "Луна в знаке", icon: "moon" },
  { href: "/astrologiya/tranzity", title: "Транзиты дня", icon: "sunrise" },
  { href: "/lunnyy-kalendar", title: "Лунный календарь", icon: "moon" },
];

export default async function AuthorPage({ params }: PageProps<"/avtory/[slug]">) {
  const { slug } = await params;
  const a = findAuthor(slug);
  if (!a) notFound();
  const articles = getArticles("astrologiya").slice(0, 6);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/astrologiya", label: "Астрология" }, { href: `/avtory/${a.slug}`, label: a.name }]} />
      <div className="grid gap-8 md:grid-cols-[220px_1fr] items-start">
        <figure className="frame-gold rounded-full overflow-hidden bg-surface w-[200px] h-[200px] mx-auto md:mx-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- статичная картинка 512×512 */}
          <img src={a.photo} alt={`${a.name}, ${a.role}`} width={512} height={512} loading="eager" fetchPriority="high" decoding="async" className="w-full h-full object-cover block" />
        </figure>
        <div>
          <p className="mono">автор</p>
          <h1 className="text-3xl md:text-4xl font-semibold mt-1">{a.name}</h1>
          <p className="text-muted mt-2">{a.role} · практика с {a.since} года · {authorYears(a)} лет</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {a.focus.map((f) => <span key={f} className="chip">{f}</span>)}
          </div>
          <p className="mt-5 text-lg max-w-[72ch]">{a.bio}</p>
        </div>
      </div>

      <section className="prose mt-10">
        <h2>Подход к прогнозам</h2>
        <ul>
          {a.principles.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <h2>Как считаются гороскопы</h2>
        <p>
          Все ежедневные, недельные, месячные и годовые гороскопы на сайте строятся от реальных положений планет на 12:00 по Москве:
          эфемериды, солярные дома для каждого знака, аспекты и фазы Луны. По этим данным составляется картина дня для знака,
          затем текст проходит редактуру — чтобы он читался спокойно и говорил о фоне, а не о «событиях, которые обязательно произойдут».
          Подробно о каждом шаге — на странице <Link href="/astrologiya/kak-my-schitaem">«Как мы считаем»</Link>.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl mb-4">Материалы автора</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {SECTIONS_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="card card-hover p-3 flex items-center gap-3 h-full min-h-14">
                <Icon name={l.icon} size={20} className="shrink-0 text-accent" />
                <span className="text-[0.95rem] leading-snug">{l.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {articles.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl mb-4">Статьи раздела «Астрология»</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((x) => <ArticleCard key={x.slug} a={x} />)}
          </div>
        </section>
      )}

      <JsonLd data={{ "@context": "https://schema.org", ...authorJsonLd(a, true), mainEntityOfPage: `${SITE.url}/avtory/${a.slug}` }} />
    </div>
  );
}
