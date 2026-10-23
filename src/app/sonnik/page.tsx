import type { Metadata } from "next";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import DreamSearch from "@/components/DreamSearch";
import HubHeader from "@/components/HubHeader";
import TelegramDaily from "@/components/TelegramDaily";
import { getArticles, getDreamImages, getDreams } from "@/lib/content";
import { SECTIONS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Сонник: к чему снится — толкование снов по символам",
  description: "Бесплатный сонник онлайн: 200 символов по алфавиту от А до Я — вода, змея, зубы, полёт, свадьба, покойник, кошка, деньги. Поиск по слову и толкование.",
  alternates: { canonical: "/sonnik" },
};

const POPULAR = ["bumazhnye-dengi", "belaya-koshka", "zmeya", "voda", "zuby", "byvshiy", "beremennost", "pokoynik", "umershiy-rodstvennik", "koshka", "sobaka", "dengi", "svadba", "polet", "padenie", "volosy-vypadayut"];

export default function DreamsPage() {
  const dreams = getDreams();
  const images = getDreamImages();
  const articles = getArticles("sonnik");
  const popular = POPULAR.map((slug) => dreams.find((d) => d.slug === slug)).filter((d) => d !== undefined);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/sonnik", label: "Сонник" }]} />
      <HubHeader icon={SECTIONS.sonnik.icon} title="Сонник" lede={SECTIONS.sonnik.description} />

      <div className="mt-6">
        {dreams.length ? (
          <DreamSearch
            items={dreams.map((d) => ({ slug: d.slug, word: d.word, short: d.short, thumb: images[d.slug]?.thumb }))}
            intro={
              popular.length > 0 && (
                <section className="mt-8" aria-labelledby="popular">
                  <div className="ornament mb-4"><h2 id="popular" className="text-2xl">Частые сны</h2><span className="mono">{popular.length} символов</span></div>
                  <div className="grid-lines grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
                    {popular.map((d) => (
                      <Link key={d.slug} href={`/sonnik/${d.slug}`} className="p-2 sm:p-3 hover:bg-surface transition-colors flex flex-col gap-2 min-w-0">
                        {images[d.slug] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={images[d.slug].thumb} width={320} height={240} alt="" loading="lazy" decoding="async" className="w-full h-auto rounded-sm object-cover aspect-[4/3]" />
                        )}
                        <span className="font-medium text-[13px] sm:text-sm leading-snug min-h-[2.6em] [overflow-wrap:anywhere] hyphens-auto">{d.word}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            }
            listHeading={<div className="ornament mt-10 mb-4"><h2 id="all-dreams" className="text-2xl">Все символы от А до Я</h2><span className="mono">{dreams.length} толкований</span></div>}
          />
        ) : (
          <p className="text-muted">Символы сонника готовятся.</p>
        )}
      </div>

      <section className="prose mt-12" aria-labelledby="how-to">
        <h2 id="how-to">Как пользоваться сонником</h2>
        <p>
          В соннике 200 символов: природа и стихии, животные, люди, дом, деньги, события. Сон редко говорит одним словом. Начните с главного образа, который запомнился сильнее всего, — воды, змеи, дома, человека — и найдите его в поиске
          или в алфавите. На странице символа есть общее толкование, разбор частых сюжетов и короткие варианты. Прочитайте их и выберите то, что ближе
          к вашему сну, а не к самому тревожному прочтению.
        </p>
        <p>
          Самая важная подсказка — ваши чувства во сне. Одна и та же картина может быть спокойной или пугающей: тёплое море и шторм, ласковая кошка и
          шипящая. Если во сне было легко, толкование обычно мягкое и поддерживающее; если было тревожно, сон чаще показывает, где сейчас напряжение,
          и не предсказывает беду. Важно и то, что вы делали: убегали, наблюдали со стороны или сами действовали.
        </p>
        <p>
          Затем посмотрите на детали: цвет, размер, место действия, кто был рядом и чем всё закончилось. Чистая вода и мутная, своя квартира и чужая,
          найденные деньги и потерянные — это разные сны. Если в одном сне несколько символов, прочитайте каждый и найдите общую тему.
        </p>
        <p>
          Отдельно стоит отнестись к снам, которые повторяются. Обычно они возвращаются, пока вопрос наяву остаётся открытым. Записывайте такие сны
          сразу после пробуждения, отмечайте настроение и события накануне — через пару недель станет заметно, что их связывает. Толкование — это
          повод спокойно подумать о себе, а не правило, которому нужно следовать.
        </p>
      </section>

      <TelegramDaily campaign="sonnik" text="Карта дня, Луна и новые статьи о снах — каждое утро в 8:00 по Москве." />

      {articles.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl mb-3">Статьи о снах</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => <ArticleCard key={a.slug} a={a} />)}
          </div>
        </section>
      )}
    </div>
  );
}
