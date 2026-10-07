import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import ZodiacSign from "@/components/ZodiacSign";
import { getArticles, getZodiac } from "@/lib/content";
import { pageTitle, SITE } from "@/lib/site";
import { ELEMENTS, ELEMENT_NOTES, stonesForSign } from "@/lib/stones";

const PATH = "/kamni/po-znaku-zodiaka";

export const metadata: Metadata = {
  title: pageTitle("Камни по знаку зодиака: таблица талисманов для 12 знаков"),
  description: "Какой камень подходит вашему знаку зодиака: сводная таблица 12 знаков с датами, стихией, планетой и талисманами, группировка по стихиям и ответы на частые вопросы.",
  alternates: { canonical: PATH },
};

const FAQ = [
  { q: "Как подобрать камень по знаку зодиака?", a: "Посмотрите в таблице камни вашего знака и выберите тот, который нравится внешне и по описанию. Соответствия условны: это подсказка, а не правило. Если сомневаетесь, начните с одного камня и поносите его пару недель." },
  { q: "Что делать, если камень моего знака не нравится?", a: "Не носить его. Личная симпатия важнее любых таблиц: камень, который не радует, вряд ли станет талисманом. Попробуйте другие камни той же стихии или подберите по дате рождения и числу судьбы." },
  { q: "Можно ли носить камни другого знака?", a: "Да. Ни один камень не «запрещён» для знака. Традиция лишь подсказывает, какие минералы созвучны характеру, но вы можете выбирать камень под задачу: для спокойствия, для смелости, для общения." },
  { q: "Чем отличаются камни по стихиям?", a: "Огню подбирают яркие и тёплые камни, Земле — зелёные и коричневые непрозрачные, Воздуху — лёгкие прозрачные и голубые, Воде — молочные и переливающиеся. Это помогает сузить выбор, когда камней слишком много." },
  { q: "Сколько камней носить одновременно?", a: "Для начала достаточно одного. Два-три камня можно сочетать, если они нравятся вместе и не спорят по цвету. Собирать на себе много талисманов не нужно: внимание рассеивается, а смысл теряется." },
  { q: "Как выбрать камень, если дата рождения на границе знаков?", a: "Если вы родились в последний или первый день знака, посмотрите камни обоих знаков и выберите по ощущению. Точнее знак определяют по году и времени рождения: в разные годы Солнце переходит в знак с разницей в сутки." },
];

export default function StonesByZodiacPage() {
  const zodiac = getZodiac();
  const stones = Object.fromEntries(zodiac.map((z) => [z.slug, stonesForSign(z.slug)]));
  const articles = getArticles("kamni").filter((a) => a.slug !== "kamni-po-znaku-zodiaka").slice(0, 3);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/kamni", label: "Камни" }, { href: PATH, label: "По знаку зодиака" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Камни по знаку зодиака</h1>
      <p className="text-muted mt-2 max-w-2xl text-lg">
        Для каждого знака традиция называет несколько камней-талисманов: они созвучны стихии, планете-управителю и характеру знака.
        Ниже — сводная таблица на 12 знаков, подборки по стихиям и ответы на частые вопросы. Соответствия условны: выбирайте тот камень, который нравится.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/kamni/po-date-rozhdeniya" className="btn btn-ghost">Подобрать по дате рождения</Link>
        <Link href="/kamni" className="btn btn-ghost">Каталог камней</Link>
        <Link href="/kamni/kamni-po-znaku-zodiaka" className="btn btn-ghost">Статья: как выбрать свой камень</Link>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Сводная таблица: камни 12 знаков</h2>
        <div className="prose overflow-x-auto" style={{ maxWidth: "none" }}>
          <table style={{ display: "table" }}>
            <thead>
              <tr><th>Знак</th><th>Даты</th><th>Стихия</th><th>Планета</th><th>Камни-талисманы</th></tr>
            </thead>
            <tbody>
              {zodiac.map((z) => (
                <tr key={z.slug}>
                  <td className="whitespace-nowrap"><Link href={`${PATH}/${z.slug}`}>{z.symbol} {z.name}</Link></td>
                  <td className="whitespace-nowrap">{z.dates}</td>
                  <td>{z.element}</td>
                  <td>{z.planet}</td>
                  <td>
                    {stones[z.slug].slice(0, 5).map((s, i) => (
                      <span key={s.slug}>{i > 0 && ", "}<Link href={`/kamni/${s.slug}`}>{s.name.toLowerCase()}</Link></span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {ELEMENTS.map((el) => {
        const signs = zodiac.filter((z) => z.element === el);
        if (!signs.length) return null;
        return (
          <section key={el} className="mt-12">
            <h2 className="text-2xl">Стихия {el}: {signs.map((z) => z.name).join(", ")}</h2>
            <p className="text-muted mt-2 max-w-2xl">{ELEMENT_NOTES[el]}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {signs.map((z) => (
                <div key={z.slug} className="card p-5 flex flex-col">
                  <div className="flex items-center gap-3">
                    <ZodiacSign symbol={z.symbol} element={z.element} slug={`stones-${z.slug}`} size={56} className="shrink-0" />
                    <div>
                      <p className="font-semibold text-lg">{z.name}</p>
                      <p className="text-xs text-muted">{z.dates} · {z.planet}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stones[z.slug].slice(0, 5).map((s) => (
                      <Link key={s.slug} href={`/kamni/${s.slug}`} className="chip hover:text-ink">{s.name}</Link>
                    ))}
                  </div>
                  <p className="mt-auto pt-4 text-sm">
                    <Link href={`${PATH}/${z.slug}`} className="text-accent underline">Все камни для знака {z.name} ({stones[z.slug].length}) →</Link>
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <section className="prose mt-12">
        <h2>Как пользоваться таблицей</h2>
        <p>
          Найдите свой знак и посмотрите на его камни. Первые в списке — классические талисманы знака, дальше идут минералы, которые уравновешивают характер:
          огненным знакам добавляют заземляющие камни, водным — тёплые. На странице знака каждый камень показан с фото, описанием и советом, как носить.
        </p>
        <p>
          Если хочется точнее, воспользуйтесь <Link href="/kamni/po-date-rozhdeniya">подбором по дате рождения</Link>: он учитывает не только знак, но и число судьбы.
          А характер самого знака, его сильные стороны и совместимость — в разделе <Link href="/goroskop">гороскопа</Link>.
        </p>
      </section>

      <Faq items={FAQ} />

      {articles.length > 0 && (
        <p className="mt-10 text-muted">
          Читайте также: {articles.map((a, i) => <span key={a.slug}>{i > 0 && ", "}<Link className="text-accent underline" href={`/kamni/${a.slug}`}>{a.title}</Link></span>)}.
        </p>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Камни по знаку зодиака",
          itemListElement: zodiac.map((z, i) => ({ "@type": "ListItem", position: i + 1, name: `Камни для знака ${z.name}`, url: `${SITE.url}${PATH}/${z.slug}` })),
        }}
      />
    </div>
  );
}
