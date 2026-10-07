import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import MatrixNav from "@/components/MatrixNav";
import { ARCANA_NUMBERS, findMatrixArcana, getMatrixArcana, POSITIONS, tarotFor } from "@/lib/matrix";
import { SITE, pageTitle } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return ARCANA_NUMBERS.map((n) => ({ n: String(n) }));
}

function get(n: string) {
  return /^\d{1,2}$/.test(n) ? findMatrixArcana(Number(n)) : null;
}

export async function generateMetadata({ params }: PageProps<"/matrica-sudby/arkany/[n]">): Promise<Metadata> {
  const { n } = await params;
  const a = get(n);
  if (!a) return {};
  const desc = `${a.n} аркан в матрице судьбы — ${a.name}. ${a.short} Плюсы и минусы, отношения, деньги и работа.`;
  return {
    title: pageTitle(`${a.n} аркан в матрице судьбы: ${a.name}, значение`),
    description: desc.length > 160 ? desc.slice(0, desc.lastIndexOf(" ", 157)).replace(/[,.;:]$/, "") + "…" : desc,
    alternates: { canonical: `/matrica-sudby/arkany/${a.n}` },
  };
}

export default async function ArcanaPage({ params }: PageProps<"/matrica-sudby/arkany/[n]">) {
  const { n } = await params;
  const a = get(n);
  if (!a) notFound();
  const all = getMatrixArcana();
  const prev = all[(a.n - 2 + all.length) % all.length];
  const next = all[a.n % all.length];
  const tarot = tarotFor(a.n);
  const faq = [
    { q: `Что означает ${a.n} аркан в матрице судьбы?`, a: `${a.name} — ${a.short.charAt(0).toLowerCase() + a.short.slice(1)} Ключевые слова: ${a.keywords.join(", ")}.` },
    { q: `Что означает аркан ${a.n} в центре матрицы?`, a: `В центре матрицы аркан описывает главную энергию личности: ${a.short.charAt(0).toLowerCase() + a.short.slice(1)} Центр читают вместе с остальными точками, поэтому для полного разбора рассчитайте матрицу целиком.` },
    { q: `Как связаны ${a.name} в матрице и в Таро?`, a: tarot ? `Это один образ: в Таро ему соответствует карта «${tarot.name}». В матрице аркан описывает энергию даты рождения, а в раскладе карта отвечает на конкретный вопрос. Сравнить трактовки можно на странице карты.` : "Это один образ из старших арканов Таро." },
  ];
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: "/matrica-sudby", label: "Матрица судьбы" }, { href: "/matrica-sudby/arkany", label: "Арканы" }, { href: `/matrica-sudby/arkany/${a.n}`, label: `${a.n} · ${a.name}` }]} />
      <div className="prose max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-semibold !mt-0">{a.n} аркан в матрице судьбы: {a.name}</h1>
        <p className="text-muted text-lg">{a.short} Ключевые слова: {a.keywords.join(", ")}.</p>
        <h2>Суть энергии</h2>
        <p>{a.essence}</p>
        <h2>В плюсе</h2>
        <p>{a.plus}</p>
        <h2>В минусе</h2>
        <p>{a.minus}</p>
        <h2>В отношениях</h2>
        <p>{a.love}</p>
        <h2>В деньгах и работе</h2>
        <p>{a.career}</p>
        <h2>Совет аркана</h2>
        <blockquote>{a.advice}</blockquote>
        <h2>Аркан {a.n} в разных точках матрицы</h2>
        <p>Значение аркана зависит от места, где он стоит. {POSITIONS.map((p) => `${p.letter} (${p.title.split(":")[0].toLowerCase()})`).join(", ")} — в каждой из этих позиций {a.name} проявляется по-своему: в дне рождения это черта характера, в центре — главная тема жизни.</p>
        <p>Хотите узнать, где этот аркан в вашей матрице? <Link href="/matrica-sudby">Рассчитайте матрицу по дате рождения</Link> или проверьте <Link href="/matrica-sudby/sovmestimost">совместимость с партнёром</Link>.</p>
        {tarot && <p>Образ связан с картой Таро: <Link href={`/taro/karty/${tarot.slug}`}>{tarot.name}: значение карты</Link>. Там трактовка в раскладах, прямом и перевёрнутом положении.</p>}
      </div>
      <Faq items={faq} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: `${a.n} аркан в матрице судьбы: ${a.name}`, inLanguage: "ru", mainEntityOfPage: `${SITE.url}/matrica-sudby/arkany/${a.n}`, publisher: { "@type": "Organization", name: SITE.name, url: SITE.url } }} />
      <div className="mt-10 flex flex-wrap gap-2 justify-between text-sm">
        <Link href={`/matrica-sudby/arkany/${prev.n}`} className="btn btn-ghost">← {prev.n} · {prev.name}</Link>
        <Link href="/matrica-sudby/arkany" className="btn btn-ghost">Все арканы</Link>
        <Link href={`/matrica-sudby/arkany/${next.n}`} className="btn btn-ghost">{next.n} · {next.name} →</Link>
      </div>
      <MatrixNav current="" />
    </article>
  );
}
