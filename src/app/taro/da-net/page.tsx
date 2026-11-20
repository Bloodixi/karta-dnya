import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import RazborCta from "@/components/RazborCta";
import ExtraText from "@/components/ExtraText";
import Faq from "@/components/Faq";
import TelegramDaily from "@/components/TelegramDaily";
import YesNo from "@/components/YesNo";
import { getTarot, getTarotExtra } from "@/lib/content";
import { getExtraText, mergeFaq } from "@/lib/extra-text";

const POPULAR_SLUGS = [
  "shut", "mag", "verhovnaya-zhritsa", "imperatritsa",
  "vlyublennye", "koleso-fortuny", "sila", "otshelnik",
  "smert", "bashnya", "zvezda", "solntse",
] as const;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const metadata: Metadata = {
  title: "Таро да или нет: гадание онлайн на одной карте",
  description: "Гадание Таро «да или нет» онлайн бесплатно: задайте вопрос, вытяните одну карту и получите ответ с объяснением. Как правильно задавать вопрос и читать карту.",
  alternates: { canonical: "/taro/da-net" },
};

const FAQ = [
  { q: "Как задавать вопрос для гадания «да или нет»?", a: "Вопрос должен быть закрытым и про одно действие: «Стоит ли мне менять работу этой осенью?» вместо «Что будет с работой?»." },
  { q: "Можно ли задавать один вопрос несколько раз?", a: "Лучше один раз в день. Повторные вытягивания размывают ответ: вы начинаете искать нужную карту, а не слушать первую." },
  { q: "Почему некоторые карты дают ответ «скорее да» или «пока рано»?", a: "Часть карт говорит о паузе и переходном состоянии: Колесо Фортуны, Умеренность, Отшельник. Такой ответ значит, что итог зависит от ваших действий." },
  { q: "Перевёрнутая карта всегда значит «нет»?", a: "Нет. Перевёрнутая сложная карта, например Башня или Дьявол, наоборот смягчает значение: препятствие уходит." },
];

export default async function YesNoPage() {
  const more = await getExtraText("tools", "taro-da-net");
  const all = getTarot();
  const extra = getTarotExtra();
  const cards = all.map((c) => ({ slug: c.slug, name: c.name, keywords: c.keywords, upright: c.upright, reversed: c.reversed, advice: c.advice, arcana: c.arcana, suitName: c.suitName }));
  const popular = POPULAR_SLUGS.map((s) => all.find((c) => c.slug === s)).filter((c): c is NonNullable<typeof c> => !!c);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/taro", label: "Таро" }, { href: "/taro/da-net", label: "Да или нет" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Таро да или нет: гадание онлайн</h1>
      <p className="text-muted mt-2 max-w-2xl">Сформулируйте закрытый вопрос, вытяните одну карту и получите ответ. Ответ строится на значении карты и её положении, объяснение прилагается.</p>
      <div className="card p-4 mt-4 max-w-3xl">
        <p className="mono mb-1">Как работает гадание «да или нет»</p>
        <p className="text-sm text-muted">
          Задайте один конкретный вопрос и вытяните карту. Прямая карта чаще отвечает «да», перевёрнутая — «нет» или советует притормозить, а арканы перехода (Отшельник, Умеренность, Колесо Фортуны) показывают, что ответ зависит от ваших шагов.
        </p>
      </div>
      <div className="mt-6 max-w-3xl">{cards.length ? <YesNo cards={cards} /> : <p className="text-muted">Колода готовится.</p>}</div>
      <TelegramDaily campaign="taro-da-net" text="Карта дня с толкованием — каждое утро в 8:00 по Москве. Коротко и без рекламы." className="mt-8 max-w-3xl" />
      <RazborCta from="taro-da-net" className="mt-8 max-w-3xl" />
      <section className="mt-10">
        <h2 className="text-2xl mb-3">Популярные карты в гадании «да или нет»</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {popular.map((c) => {
            const ex = extra[c.slug];
            return (
              <Link key={c.slug} href={`/taro/karty/${c.slug}`} className="card card-hover p-4 block">
                <p className="font-semibold">{c.name}</p>
                {ex && <p className="mono mt-1">{cap(ex.yesno)}</p>}
                <p className="text-xs text-muted mt-1 line-clamp-2">{c.keywords.slice(0, 3).join(", ")}</p>
              </Link>
            );
          })}
        </div>
      </section>
      {more && <ExtraText html={more.html} />}
      <section className="prose mt-8">
        <p>Для более подробного ответа посмотрите <Link href="/taro/tri-karty">расклад на три карты</Link> или прочитайте <Link href="/taro/kak-nachat-gadat-na-taro">руководство для новичков</Link>. Если вопрос о заветной мечте, попробуйте <Link href="/taro/na-zhelanie">гадание на желание</Link>. Значения всех карт собраны в <Link href="/taro/karty">каталоге карт</Link>, а другие схемы — на странице <Link href="/taro/rasklady">все расклады Таро онлайн</Link>.</p>
      </section>
      <Faq items={mergeFaq(FAQ, more?.faq)} />
    </div>
  );
}
