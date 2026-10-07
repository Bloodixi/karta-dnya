import type { Metadata } from "next";
import Link from "next/link";
import AffirmationOfDay from "@/components/AffirmationOfDay";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import { AFFIRM_PATH, getAffirmationTopics } from "@/lib/affirmations";
import { formatDateRu, todayKey } from "@/lib/daily";

export const revalidate = 1800;

const PATH = `${AFFIRM_PATH}/dnya`;

export const metadata: Metadata = {
  title: "Аффирмация дня: фраза на сегодня для спокойного настроя",
  description: "Аффирмация дня на сегодня: одна короткая фраза для всех, обновляется каждую полночь по Москве. Как использовать её утром и в течение дня, плюс подборки по темам.",
  alternates: { canonical: PATH },
};

const FAQ = [
  { q: "Как часто меняется аффирмация дня?", a: "Каждую полночь по московскому времени. Фраза выбирается по дате, поэтому в один день она одинакова для всех посетителей, а завтра будет другой." },
  { q: "Что делать с аффирмацией дня?", a: "Прочитайте её утром медленно, на выдохе, и запомните. Днём вспоминайте её в паузах: в дороге, перед делом, за чаем. Вечером можно отметить, как она отозвалась." },
  { q: "Можно ли выбрать свою аффирмацию вместо фразы дня?", a: "Конечно. Фраза дня — это простая отправная точка. Если она не откликается, загляните в подборки по темам и выберите ту, которая звучит для вас честно." },
];

export default function AffirmationDayPage() {
  const date = todayKey();
  const topics = getAffirmationTopics();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/praktiki", label: "Практики" }, { href: AFFIRM_PATH, label: "Аффирмации" }, { href: PATH, label: "Аффирмация дня" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Аффирмация дня — {formatDateRu(date)}</h1>
      <p className="text-muted mt-2 max-w-2xl text-lg">Одна короткая фраза на сегодня для всех. Прочитайте её спокойно и вернитесь к ней в течение дня.</p>

      <section className="mt-8"><AffirmationOfDay link={false} /></section>

      <section className="prose mt-10">
        <h2>Как использовать аффирмацию дня</h2>
        <p>
          Утром сделайте три медленных вдоха и прочитайте фразу вслух или про себя. Выберите одно слово, которое откликается сильнее всего, и держите его в голове весь день.
          Это практика настроя, а не предсказание: она не обещает событий, а помогает внимательнее относиться к себе.
        </p>
        <p>
          Днём вспоминайте фразу в коротких паузах: по дороге, перед важным делом, за чашкой чая. Вечером подумайте, в какие моменты она пригодилась.
          Если хочется углубить практику, добавьте <Link href="/praktiki/dyhatelnye-praktiki">дыхательные упражнения</Link> или <Link href="/praktiki/meditatsiya-dlya-nachinayushchih">медитацию для начинающих</Link>.
          Нужны ориентиры на сегодня — загляните в <Link href="/karta-dnya">карту дня</Link> и <Link href="/lunnyy-kalendar">лунный календарь</Link>.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Подборки аффирмаций по темам</h2>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => <Link key={t.slug} href={`${AFFIRM_PATH}/${t.slug}`} className="chip hover:text-ink">{t.h1}</Link>)}
          <Link href={AFFIRM_PATH} className="chip hover:text-ink">Все аффирмации</Link>
        </div>
      </section>

      <Faq items={FAQ} />
    </div>
  );
}
