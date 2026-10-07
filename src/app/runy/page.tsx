import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import RuneGlyph from "@/components/RuneGlyph";
import { getArticles, getRunes } from "@/lib/content";
import ArticleCard from "@/components/ArticleCard";
import { ATTS, HUB_FAQ, runesOfAtt } from "@/lib/runes";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Значение рун Старшего Футарка: все 24 руны и руна дня",
  description: "Значение 24 рун Старшего Футарка: прямое и перевёрнутое положение, любовь, работа, совет. Три атта, руна дня и спокойные подсказки, как читать руны.",
  alternates: { canonical: "/runy" },
};

export default function RunesHub() {
  const runes = getRunes();
  const articles = getArticles("runy");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/runy", label: "Руны" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Значение рун Старшего Футарка</h1>
      <p className="text-muted mt-2 max-w-2xl text-lg">
        Все 24 руны с трактовкой в прямом и перевёрнутом положении, в любви и работе, с советом и простой практикой. Выберите знак из ряда или узнайте руну дня.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/runy/runa-dnya" className="btn">Руна дня</Link>
        <Link href="/karta-dnya" className="btn btn-ghost">Карта дня Таро</Link>
      </div>

      <section className="mt-10 max-w-3xl prose">
        <h2>Что такое руны и Старший Футарк</h2>
        <p>
          Руны — знаки древнего письма германских и скандинавских народов. Они служили алфавитом, но каждый знак нёс ещё и имя, обозначающее понятие: скот, лёд, солнце, дорогу, дар. Именно это имя и делает руну удобным символом для размышления.
        </p>
        <p>
          Самый ранний ряд из 24 знаков называют Старшим Футарком по первым шести рунам: Феху, Уруз, Турисаз, Ансуз, Райдо, Кеназ. Ряд делится на три атта по восемь рун. В каждом свой круг тем: ресурсы и начинания, испытания и защита, движение, связи и новый рассвет. Ниже все руны в порядке Футарка, у каждой есть отдельная страница.
        </p>
      </section>

      {[1, 2, 3].map((att) => (
        <section key={att} className="mt-10">
          <h2 className="text-2xl">{ATTS[att].title}</h2>
          <p className="text-muted mt-1 mb-4 max-w-2xl">{ATTS[att].text}</p>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {runesOfAtt(att).map((r) => (
              <Link key={r.slug} href={`/runy/${r.slug}`} className="card card-hover p-4 flex items-center gap-3">
                <RuneGlyph slug={r.slug} att={r.att} size={56} className="shrink-0" />
                <span>
                  <b className="block">{r.name}</b>
                  <span className="text-xs text-muted">{r.keywords.slice(0, 2).join(", ")}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-10 max-w-3xl prose">
        <h2>Как читать значение руны</h2>
        <p>
          Сначала задайте вопрос о ситуации, а не о будущем целиком: «на что мне обратить внимание?» работает лучше, чем «что будет?». Прочитайте ключевые слова руны, затем разделы про прямое и перевёрнутое положение, и сопоставьте с тем, что происходит у вас. Если руна сомнительна, отложите решение на день и вернитесь к её описанию.
        </p>
        <p>
          Девять рун симметричны, у них нет перевёрнутого положения: Гебо, Хагалаз, Наутиз, Иса, Йера, Эйваз, Соулу, Ингуз и Дагаз. Остальным пятнадцати перевёрнутое положение добавляет оттенок предупреждения, а не приговор.
        </p>
        <p>
          Для ежедневной практики есть <Link href="/runy/runa-dnya">руна дня</Link>. Если вам ближе карты, загляните в <Link href="/taro/karty">значения карт Таро</Link>, а символы снов объяснит <Link href="/sonnik">сонник</Link>.
        </p>
      </section>

      {articles.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl mb-3">Статьи</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => <ArticleCard key={a.slug} a={a} />)}
          </div>
        </section>
      )}

      <Faq items={HUB_FAQ} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Руны Старшего Футарка",
          itemListElement: runes.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.name, url: `${SITE.url}/runy/${r.slug}` })),
        }}
      />
    </div>
  );
}
