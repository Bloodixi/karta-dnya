import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import TarotCardView from "@/components/TarotCardView";
import RazborCta from "@/components/RazborCta";
import Subscribe from "@/components/Subscribe";
import { cardOfDay, formatDateRu, shiftKey, todayKey } from "@/lib/daily";
import { findTarotExtra } from "@/lib/content";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: { absolute: "Карта дня Таро на сегодня: значение и совет дня" },
  description: "Карта дня Таро на сегодня: одна карта для всех, её значение в прямом или перевёрнутом положении, любовь, дела и совет на день. Новая карта каждую полночь.",
  alternates: { canonical: "/karta-dnya" },
};

const FAQ = [
  { q: "Что такое карта дня?", a: "Одна карта Таро, вытянутая на текущие сутки. Она не предсказывает события, а задаёт тему для внимания: на что посмотреть внимательнее и какой настрой выбрать." },
  { q: "Когда меняется карта дня на сегодня?", a: "Каждую полночь по московскому времени. Карта одна для всех посетителей, поэтому её можно обсудить с друзьями." },
  { q: "Что значит перевёрнутая карта дня?", a: "Перевёрнутое положение смягчает или переворачивает смысл карты: тема та же, но проявляется через задержку, сомнение или внутреннюю работу." },
  { q: "Чем карта дня отличается от гороскопа на сегодня?", a: "Гороскоп написан для вашего знака зодиака и опирается на положение планет, а карта дня одна для всех и работает как общий совет. Их удобно читать вместе." },
];

export default function CardOfDayPage() {
  const date = todayKey();
  const today = cardOfDay(date);
  const tomorrow = cardOfDay(shiftKey(date, 1));
  const extra = today ? findTarotExtra(today.card.slug) : null;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/karta-dnya", label: "Карта дня" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Карта дня на сегодня, {formatDateRu(date)}</h1>
      <p className="text-muted mt-2 max-w-2xl">
        Одна карта на сегодня для всех. Прочитайте значение, выделите одну мысль и понаблюдайте, как она проявится в течение дня. Это не предсказание, а повод для внимательности.
      </p>
      {today ? (
        <div className="mt-8 grid gap-8 md:grid-cols-[260px_1fr] items-start">
          <div className="w-60 md:w-full md:sticky md:top-24">
            <TarotCardView slug={today.card.slug} name={today.card.name} reversed={today.reversed} flipIn priority />
            <p className="text-xs text-muted mt-3 text-center">{today.card.arcana === "major" ? "Старший аркан" : today.card.suitName} · {today.card.keywords.slice(0, 3).join(" · ")}</p>
          </div>
          <div className="prose">
            <p className="chip">{today.reversed ? "перевёрнутое положение" : "прямое положение"}</p>
            <h2>Значение</h2>
            <p>{today.reversed ? today.card.reversed : today.card.upright}</p>
            <h2>В отношениях</h2>
            <p>{today.card.love}</p>
            <h2>В делах</h2>
            <p>{today.card.career}</p>
            {extra && (<><h2>Как прожить этот день</h2><p>{extra.dayCard}</p></>)}
            <h2>Совет дня</h2>
            <blockquote>{today.card.advice}</blockquote>
            {tomorrow && (<p className="text-sm text-muted">Карта на завтра: <Link href={`/taro/karty/${tomorrow.card.slug}`}>{tomorrow.card.name}</Link>{tomorrow.reversed ? " (перевёрнутая)" : ""}. Загляните завтра за толкованием.</p>)}
            <p>
              <Link href={`/taro/karty/${today.card.slug}`}>Подробнее о карте «{today.card.name}»</Link> · <Link href="/taro/karty">все 78 карт</Link> · <Link href="/taro">раздел Таро</Link>
            </p>
            <p className="text-sm text-muted">Любите символы попроще? Посмотрите <Link href="/runy/runa-dnya">руну дня</Link> из Старшего Футарка. Прогноз для своего знака — в <Link href="/goroskop">гороскопе на сегодня</Link>, а народные приметы на этот день собраны в статье <Link href="/praktiki/primety-na-segodnya">приметы на сегодня</Link>.</p>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-muted">Колода готовится, загляните чуть позже.</p>
      )}
      <RazborCta from="karta-dnya" />
      <Subscribe campaign="karta-dnya" className="mt-10" />
      <Faq items={FAQ} />
    </div>
  );
}
