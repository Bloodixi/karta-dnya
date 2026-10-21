import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import MatrixNav from "@/components/MatrixNav";
import { ARCANA_NUMBERS, findMatrixArcana, findMatrixPositions, getMatrixArcana, POSITION_BLOCKS, POSITIONS, tarotFor } from "@/lib/matrix";
import { SITE, pageTitle, orgJsonLd } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return ARCANA_NUMBERS.map((n) => ({ n: String(n) }));
}

function get(n: string) {
  return /^\d{1,2}$/.test(n) ? findMatrixArcana(Number(n)) : null;
}

/** Первые предложения абзаца — для ответов FAQ. */
function lead(text: string, count = 2) {
  return text.split(/(?<=[.!?…])\s+/).slice(0, count).join(" ");
}

export async function generateMetadata({ params }: PageProps<"/matrica-sudby/arkany/[n]">): Promise<Metadata> {
  const { n } = await params;
  const a = get(n);
  if (!a) return {};
  const pos = findMatrixPositions(a.n);
  const desc = pos?.desc || `${a.n} аркан в матрице судьбы — ${a.name}. ${a.short} Плюсы и минусы, отношения, деньги и работа.`;
  return {
    title: pageTitle(`${a.n} аркан в матрице судьбы: значение в визитке, талантах, деньгах`),
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
  const pos = findMatrixPositions(a.n);
  const faq = pos
    ? [
        { q: `Что значит ${a.n} аркан в визитной карточке?`, a: lead(pos.vizitka) },
        { q: `Что означает ${a.n} аркан в центре матрицы?`, a: lead(pos.centr) },
        { q: `Что значит ${a.n} аркан в талантах?`, a: lead(pos.talanty) },
        { q: `Что значит ${a.n} аркан для женщины?`, a: lead(pos.zhenshchina) },
        { q: `Что означает ${a.n} аркан в предназначении?`, a: `${lead(pos.prednaznachenie.lichnoe, 1)} ${lead(pos.prednaznachenie.planetarnoe, 1)}` },
      ]
    : [{ q: `Что означает ${a.n} аркан в матрице судьбы?`, a: `${a.name} — ${a.short.charAt(0).toLowerCase() + a.short.slice(1)} Ключевые слова: ${a.keywords.join(", ")}.` }];
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: "/matrica-sudby", label: "Матрица судьбы" }, { href: "/matrica-sudby/arkany", label: "Арканы" }, { href: `/matrica-sudby/arkany/${a.n}`, label: `${a.n} · ${a.name}` }]} />
      <div className="prose max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-semibold !mt-0">{a.n} аркан в матрице судьбы: {a.name}</h1>
        <p className="text-muted text-lg">{a.short} Ключевые слова: {a.keywords.join(", ")}.</p>
        {pos && (
          <nav aria-label="Содержание" className="card p-4 my-6">
            <p className="mono mb-2">Аркан {a.n} в позициях матрицы</p>
            <ul className="m-0! list-none! flex flex-wrap gap-2">
              {POSITION_BLOCKS.map((b) => (
                <li key={b.id} className="m-0!"><a href={`#${b.id}`} className="chip no-underline!">{b.label}</a></li>
              ))}
            </ul>
          </nav>
        )}
        <h2>Суть энергии</h2>
        <p>{a.essence}</p>
        <h2>В плюсе</h2>
        <p>{a.plus}</p>
        <h2 id="uroki" className="scroll-mt-24">В минусе: жизненные уроки</h2>
        <p>{a.minus}</p>
        {pos ? (
          <>
            <h2 id="vizitka" className="scroll-mt-24">{a.n} аркан в визитной карточке</h2>
            <p>{pos.vizitka}</p>
            <h2 id="centr" className="scroll-mt-24">{a.n} аркан в центре матрицы</h2>
            <p>{pos.centr}</p>
            <h2 id="talanty" className="scroll-mt-24">{a.n} аркан в талантах</h2>
            <p>{pos.talanty}</p>
            <h2 id="prednaznachenie" className="scroll-mt-24">{a.n} аркан в предназначении</h2>
            <p><strong>Личное предназначение.</strong> {pos.prednaznachenie.lichnoe}</p>
            <p><strong>Социальное предназначение.</strong> {pos.prednaznachenie.socialnoe}</p>
            <p><strong>Планетарное предназначение.</strong> {pos.prednaznachenie.planetarnoe}</p>
            <h2 id="dengi" className="scroll-mt-24">{a.n} аркан в деньгах и работе</h2>
            <p>{pos.dengi}</p>
            <p>{a.career}</p>
            <h2 id="otnosheniya" className="scroll-mt-24">{a.n} аркан в отношениях</h2>
            <p>{pos.otnosheniya}</p>
            <p>{a.love}</p>
            <h2 id="zdorove" className="scroll-mt-24">{a.n} аркан в здоровье</h2>
            <p>{pos.zdorove}</p>
            <p className="text-sm text-muted">Матрица судьбы — символическая система для самонаблюдения и не заменяет консультацию врача.</p>
            <h2 id="zhenshchina" className="scroll-mt-24">{a.n} аркан для женщины</h2>
            <p>{pos.zhenshchina}</p>
            <h2 id="muzhchina" className="scroll-mt-24">{a.n} аркан для мужчины</h2>
            <p>{pos.muzhchina}</p>
          </>
        ) : (
          <>
            <h2>В отношениях</h2>
            <p>{a.love}</p>
            <h2>В деньгах и работе</h2>
            <p>{a.career}</p>
          </>
        )}
        <h2>Совет аркана</h2>
        <blockquote>{a.advice}</blockquote>
        <h2>Аркан {a.n} в разных точках матрицы</h2>
        <p>Значение аркана зависит от места, где он стоит. {POSITIONS.map((p) => `${p.letter} (${p.title.split(":")[0].toLowerCase()})`).join(", ")} — в каждой из этих позиций {a.name} проявляется по-своему: в дне рождения это черта характера, в центре — главная тема жизни.</p>
        <p>Хотите узнать, где этот аркан в вашей матрице? <Link href="/matrica-sudby">Рассчитайте матрицу по дате рождения</Link> или проверьте <Link href="/matrica-sudby/sovmestimost">совместимость с партнёром</Link>.</p>
        {tarot && <p>Образ связан с картой Таро: <Link href={`/taro/karty/${tarot.slug}`}>{tarot.name}: значение карты</Link>. Там трактовка в раскладах, прямом и перевёрнутом положении.</p>}
      </div>
      <Faq items={faq} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: `${a.n} аркан в матрице судьбы: ${a.name}`, inLanguage: "ru", mainEntityOfPage: `${SITE.url}/matrica-sudby/arkany/${a.n}`, author: orgJsonLd(), publisher: orgJsonLd() }} />
      <div className="mt-10 flex flex-wrap gap-2 justify-between text-sm">
        <Link href={`/matrica-sudby/arkany/${prev.n}`} className="btn btn-ghost">← {prev.n} · {prev.name}</Link>
        <Link href="/matrica-sudby/arkany" className="btn btn-ghost">Все арканы</Link>
        <Link href={`/matrica-sudby/arkany/${next.n}`} className="btn btn-ghost">{next.n} · {next.name} →</Link>
      </div>
      <MatrixNav current="" />
    </article>
  );
}
