import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import StonePhoto from "@/components/StonePhoto";
import ZodiacSign from "@/components/ZodiacSign";
import { findZodiac, getStoneImages, getZodiac } from "@/lib/content";
import { pageTitle, SITE } from "@/lib/site";
import { getStoneSigns, stonesForSign } from "@/lib/stones";

const HUB = "/kamni/po-znaku-zodiaka";

export const dynamicParams = false;

export function generateStaticParams() {
  return getZodiac().map((z) => ({ znak: z.slug }));
}

export async function generateMetadata({ params }: PageProps<"/kamni/po-znaku-zodiaka/[znak]">): Promise<Metadata> {
  const { znak } = await params;
  const z = findZodiac(znak);
  if (!z) return {};
  const top = stonesForSign(znak).slice(0, 3).map((s) => s.name.toLowerCase()).join(", ");
  return {
    title: pageTitle(`Камни для знака ${z.name}: талисманы и как их носить`),
    description: `Какие камни подходят знаку ${z.name} (${z.dates}): ${top} и другие. Почему эти минералы созвучны стихии ${z.element}, как носить талисман и с какого камня начать.`,
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
          "@type": "ItemList",
          name: `Камни для знака ${z.name}`,
          itemListElement: stones.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name, url: `${SITE.url}/kamni/${s.slug}` })),
        }}
      />
    </article>
  );
}
