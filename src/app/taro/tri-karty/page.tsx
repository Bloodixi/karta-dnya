import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import ExtraText from "@/components/ExtraText";
import Faq from "@/components/Faq";
import TelegramDaily from "@/components/TelegramDaily";
import ThreeCards from "@/components/ThreeCards";
import { getTarot } from "@/lib/content";
import { getExtraText, mergeFaq } from "@/lib/extra-text";

export const metadata: Metadata = {
  title: "Расклад Таро на три карты онлайн: прошлое и будущее",
  description: "Бесплатный онлайн-расклад Таро на три карты: прошлое, настоящее и будущее ситуации. Вытяните карты, прочитайте значения и совет, узнайте, как читать связку.",
  alternates: { canonical: "/taro/tri-karty" },
};

const FAQ = [
  { q: "Что значат позиции в раскладе на три карты?", a: "Первая карта — корни ситуации и прошлое, вторая — то, что происходит сейчас, третья — куда ведёт текущий путь, если ничего не менять." },
  { q: "Как читать карты вместе, а не по отдельности?", a: "Сначала посмотрите на общий тон: сколько карт благоприятных, сколько сложных. Потом свяжите их в историю: что было, что есть, к чему идёт." },
  { q: "Можно ли делать расклад на другого человека?", a: "Лучше спрашивать о своих действиях и чувствах: «как мне вести себя в этой ситуации», а не «что он думает»." },
];

export default async function ThreeCardsPage() {
  const more = await getExtraText("tools", "taro-tri-karty");
  const cards = getTarot().map((c) => ({ slug: c.slug, name: c.name, keywords: c.keywords, upright: c.upright, reversed: c.reversed, advice: c.advice, arcana: c.arcana, suitName: c.suitName }));
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/taro", label: "Таро" }, { href: "/taro/tri-karty", label: "Три карты" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Расклад на три карты онлайн</h1>
      <p className="text-muted mt-2 max-w-2xl">Классический расклад «прошлое, настоящее, будущее». Подумайте о ситуации, разложите карты и прочитайте их как одну историю.</p>
      <div className="mt-6">{cards.length ? <ThreeCards cards={cards} /> : <p className="text-muted">Колода готовится.</p>}</div>
      <TelegramDaily campaign="taro-tri-karty" text="Карта дня с толкованием — каждое утро в 8:00 по Москве. Коротко и без рекламы." className="mt-8" />
      {more && <ExtraText html={more.html} />}
      <section className="prose mt-8">
        <p>Перевёрнутые карты читаются как ослабленное, заблокированное или внутреннее проявление значения. Для короткого ответа подойдёт <Link href="/taro/da-net">гадание «да или нет»</Link>, для загаданной мечты — <Link href="/taro/na-zhelanie">гадание на желание</Link>, а расклады на любовь, отношения, работу и год собраны в каталоге <Link href="/taro/rasklady">все расклады Таро онлайн</Link>.</p>
      </section>
      <Faq items={mergeFaq(FAQ, more?.faq)} />
    </div>
  );
}
