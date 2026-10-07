import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
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

const SECTIONS_LINKS = [
  { href: "/goroskop", title: "Гороскоп на сегодня" },
  { href: "/goroskop/nedelya", title: "На неделю" },
  { href: "/goroskop/god", title: "На год" },
  { href: "/astrologiya/natalnaya-karta", title: "Натальная карта" },
  { href: "/astrologiya/retrogradnyy-merkuriy", title: "Ретроградный Меркурий" },
  { href: "/astrologiya/luna-v-znake", title: "Луна в знаке" },
  { href: "/astrologiya/tranzity", title: "Транзиты дня" },
  { href: "/lunnyy-kalendar", title: "Лунный календарь" },
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
        <h2 className="text-2xl mb-3">Материалы автора</h2>
        <div className="flex flex-wrap gap-2">
          {SECTIONS_LINKS.map((l) => <Link key={l.href} href={l.href} className="btn btn-ghost">{l.title}</Link>)}
        </div>
        {articles.length > 0 && (
          <p className="mt-6 text-muted">
            Статьи раздела «Астрология»: {articles.map((x, i) => <span key={x.slug}>{i > 0 && ", "}<Link className="text-accent underline" href={`/astrologiya/${x.slug}`}>{x.title}</Link></span>)}.
          </p>
        )}
      </section>

      <JsonLd data={{ "@context": "https://schema.org", ...authorJsonLd(a, true), mainEntityOfPage: `${SITE.url}/avtory/${a.slug}` }} />
    </div>
  );
}
