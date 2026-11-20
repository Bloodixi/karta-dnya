import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import RazborCta from "@/components/RazborCta";
import StonePhoto from "@/components/StonePhoto";
import ZodiacSign from "@/components/ZodiacSign";
import { findZodiac, getStoneImages, getZodiac } from "@/lib/content";
import { metaDescription } from "@/lib/meta";
import { pageTitle, SITE, orgJsonLd } from "@/lib/site";
import { getStoneSigns, stonesForSign, stoneTasksForSign } from "@/lib/stones";
import ArticleLinks from "@/components/ArticleLinks";

const HUB = "/kamni/po-znaku-zodiaka";

export const dynamicParams = false;

export function generateStaticParams() {
  return getZodiac().map((z) => ({ znak: z.slug }));
}

export async function generateMetadata({ params }: PageProps<"/kamni/po-znaku-zodiaka/[znak]">): Promise<Metadata> {
  const { znak } = await params;
  const z = findZodiac(znak);
  if (!z) return {};
  const names = stonesForSign(znak).map((s) => s.name.toLowerCase());
  // Description 140–160: пробуем варианты с датами и разным числом камней, берём первый подходящий по длине.
  const variants: [number, boolean][] = [[4, true], [3, true], [5, false], [4, false], [3, false]];
  const descs = variants.map(([n, dates]) =>
    `Камни для знака ${z.name}${dates ? ` (${z.dates})` : ""}: ${names.slice(0, n).join(", ")} и другие. Почему они созвучны стихии ${z.element}, как носить талисман и с какого камня начать.`,
  );
  const description = descs.find((d) => d.length >= 140 && d.length <= 160) ?? descs[descs.length - 1];
  return {
    title: pageTitle(`Камни для знака ${z.name}: талисманы и как их носить`),
    description,
    alternates: { canonical: `${HUB}/${znak}` },
  };
}

export default async function StonesForSignPage({ params }: PageProps<"/kamni/po-znaku-zodiaka/[znak]">) {
  const { znak } = await params;
  const z = findZodiac(znak);
  if (!z) notFound();
  const info = getStoneSigns()[znak];
  const stones = stonesForSign(znak);
  const images = getStoneImages();
  const featured = stones.slice(0, 6);
  const rest = stones.slice(6);
  const tasks = stoneTasksForSign(stones);
  const others = getZodiac().filter((x) => x.slug !== znak);
  const faq = [
    { q: `Какой камень считается главным для знака ${z.name}?`, a: `В традиции чаще всего называют ${z.stone}. ${info?.tip ?? ""}`.trim() },
    { q: `Можно ли ${z.name} носить камни других знаков?`, a: "Да. Таблицы соответствий условны: выбирайте камень под задачу и по личной симпатии. Если минерал радует и его хочется брать с собой, он подходит, к какому бы знаку его ни относили." },
    { q: `Как носить камень знака ${z.name}?`, a: info?.wear ?? "Носите так, как удобно: в кольце, кулоне или браслете, либо держите камень дома и на рабочем столе." },
    { q: "Как ухаживать за камнем-талисманом?", a: "Большинство камней достаточно протирать мягкой тканью и иногда мыть прохладной водой. Нежные минералы (кунцит, селенит, лепидолит) берегите от воды, солнца и ударов — подробности есть на странице каждого камня." },
  ];
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/kamni", label: "Камни" }, { href: HUB, label: "По знаку зодиака" }, { href: `${HUB}/${znak}`, label: z.name }]} />
      <div className="flex items-center gap-4">
        <ZodiacSign symbol={z.symbol} element={z.element} slug={`stones-${z.slug}`} size={84} className="shrink-0" />
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">Камни для знака {z.name}</h1>
          <p className="text-muted">{z.dates} · {z.element} · {z.planet}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="chip">традиционный камень: {z.stone}</span>
        <span className="chip">цвет знака: {z.color}</span>
        <span className="chip">{stones.length} камней в подборке</span>
      </div>

      {info && (
        <section className="prose mt-8">
          <h2>Почему эти камни подходят знаку {z.name}</h2>
          <p>{info.why}</p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-2xl mb-4">Главные камни знака {z.name}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s, i) => {
            const img = images[s.slug];
            return (
              <div key={s.slug} className="flex flex-col">
                {img && <StonePhoto img={img} name={s.name} priority={i === 0} />}
                <h3 className="mt-3 text-xl font-semibold"><Link href={`/kamni/${s.slug}`} className="hover:text-accent">{s.name}</Link></h3>
                <p className="text-xs text-muted">{s.color}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.properties.slice(0, 3).map((p) => <span key={p} className="chip">{p}</span>)}
                </div>
                <p className="text-sm text-muted mt-2 line-clamp-3">{s.description}</p>
              </div>
            );
          })}
        </div>
        {rest.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold mb-2">Ещё подходят знаку {z.name}</h3>
            <div className="flex flex-wrap gap-2">
              {rest.map((s) => <Link key={s.slug} href={`/kamni/${s.slug}`} className="chip hover:text-ink">{s.name}</Link>)}
            </div>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Подбор камня знака {z.name} под задачу</h2>
        <ul className="sm:hidden grid gap-2">
          {tasks.map((row) => (
            <li key={row.task} className="card p-3">
              <p className="font-semibold">{row.task}</p>
              <p className="text-xs text-muted mt-0.5">{row.note}</p>
              <p className="text-sm mt-1">
                {row.picked.map((s, i) => (
                  <span key={s.slug}>{i > 0 && ", "}<Link href={`/kamni/${s.slug}`} className="text-accent-text underline underline-offset-2">{s.name}</Link></span>
                ))}
              </p>
            </li>
          ))}
        </ul>
        <div className="prose overflow-x-auto hidden sm:block" style={{ maxWidth: "none" }}>
          <table style={{ display: "table" }}>
            <thead>
              <tr><th>Задача</th><th>Подходящие камни</th><th>На что опирается</th></tr>
            </thead>
            <tbody>
              {tasks.map((row) => (
                <tr key={row.task}>
                  <td className="font-semibold whitespace-nowrap">{row.task}</td>
                  <td>
                    {row.picked.map((s, i) => (
                      <span key={s.slug}>{i > 0 && ", "}<Link href={`/kamni/${s.slug}`}>{s.name}</Link></span>
                    ))}
                  </td>
                  <td>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {(info?.forWomen || info?.forMen) && (
        <section className="mt-10">
          <h2 className="text-2xl mb-3">Рекомендации для женщины и для мужчины</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {info.forWomen && (
              <div className="card p-5">
                <h3 className="font-semibold text-lg mb-2">Для женщины</h3>
                <p className="text-sm text-muted">{info.forWomen}</p>
              </div>
            )}
            {info.forMen && (
              <div className="card p-5">
                <h3 className="font-semibold text-lg mb-2">Для мужчины</h3>
                <p className="text-sm text-muted">{info.forMen}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {info && (
        <section className="prose mt-10">
          <h2>Как носить камень знака {z.name}</h2>
          <p>{info.wear}</p>
          <p>{info.tip}</p>
          <p>
            Знак — не единственный ориентир. <Link href="/kamni/po-date-rozhdeniya">Подбор по дате рождения</Link> добавит камень по числу судьбы,
            а характер знака, его сильные стороны и прогноз на сегодня — в <Link href={`/goroskop/${z.slug}`}>гороскопе для знака {z.name}</Link>.
            Чтобы выбрать камень в подарок партнёру, загляните в <Link href="/sovmestimost">совместимость знаков</Link>.
          </p>
        </section>
      )}

      <ArticleLinks path={`/kamni/po-znaku-zodiaka/${znak}`} />
      <RazborCta from="kamni-znak" />
      <Faq items={faq} />

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Камни для других знаков</h2>
        <div className="flex flex-wrap gap-2">
          {others.map((x) => (
            <Link key={x.slug} href={`${HUB}/${x.slug}`} className="chip hover:text-ink">{x.symbol} {x.name}</Link>
          ))}
          <Link href={HUB} className="chip hover:text-ink">сводная таблица →</Link>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Камни для знака ${z.name}: талисманы и как их носить`,
          description: metaDescription(info?.why || z.description),
          inLanguage: "ru",
          mainEntityOfPage: `${SITE.url}${HUB}/${znak}`,
          author: orgJsonLd(),
          publisher: orgJsonLd(),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Камни для знака ${z.name}`,
          itemListElement: stones.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name, url: `${SITE.url}/kamni/${s.slug}` })),
        }}
      />
    </article>
  );
}
