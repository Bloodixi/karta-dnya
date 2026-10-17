import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import HanziMark from "@/components/HanziMark";
import JsonLd from "@/components/JsonLd";
import { COMPAT_LABELS, compatLevel, findChineseAnimal, getChineseAnimals, getForecast2027 } from "@/lib/chineseZodiac";
import { pageTitle, SITE } from "@/lib/site";

const PATH = "/kitayskiy-goroskop/2027";

export const metadata: Metadata = {
  title: pageTitle("Символ 2027 года — Красная Огненная Коза (Овца)"),
  description: "Символ 2027 года — Красная Огненная Коза (Овца), год начинается 6 февраля 2027. Как встречать, какие цвета выбрать, что подарить и прогноз для 12 знаков.",
  alternates: { canonical: PATH },
};

const FAQ = [
  { q: "Когда начинается год Козы 2027?", a: "6 февраля 2027 года, с первым новолунием после зимнего солнцестояния, которое считается китайским Новым годом. Год Огненной Козы продлится до 25 января 2028 года, а 26 января 2028-го его сменит Земляная Обезьяна." },
  { q: "Коза или Овца — кто символ 2027 года?", a: "Это один знак. Китайский иероглиф 羊 обозначает и козу, и овцу, поэтому в русскоязычных источниках встречаются оба названия. По стихии Огня год называют Красной Огненной Козой (Овцой)." },
  { q: "Какого цвета одежду выбрать для встречи 2027 года?", a: "Главный цвет года — красный, цвет стихии Огня. Подойдут также бордовый, терракотовый, коралловый и тёплые оттенки бежевого, а из спокойных — зелёный, любимый цвет Козы. Не обязательно одеваться в красное с головы до ног: достаточно детали — шарфа, украшения, помады." },
  { q: "Когда был прошлый год Огненной Козы?", a: "В 1967 году: стихии и животные складываются в цикл длиной 60 лет. Год просто Козы, но с другой стихией, был в 2015 году (Деревянная Коза) и будет снова в 2039-м (Земляная Коза)." },
  { q: "Отмечать ли Новый год 1 января или 6 февраля?", a: "Можно и так и так. Многие встречают 1 января по-европейски, держа в уме символ наступающего года, а 6 февраля устраивают тихий второй праздник: уборка, красные фонарики, ужин с близкими." },
];

export default function Year2027Page() {
  const animals = getChineseAnimals();
  const forecast = getForecast2027();
  const goat = findChineseAnimal("koza");

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/astrologiya", label: "Астрология" }, { href: "/kitayskiy-goroskop", label: "Китайский гороскоп" }, { href: PATH, label: "2027 год" }]} />
      <div className="flex items-center gap-4">
        <HanziMark hanzi="羊" size="lg" />
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">Символ 2027 года — Красная Огненная Коза (Овца)</h1>
          <p className="text-muted">с 6 февраля 2027 по 25 января 2028 · стихия Огонь · инь</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="chip">丁未 · дин-вэй</span>
        <span className="chip">цвет года: красный</span>
        <span className="chip">прошлый такой год: 1967</span>
      </div>

      <section className="prose mt-8">
        <h2>Какой будет год Огненной Козы</h2>
        <p>Коза — восьмой знак китайского цикла, самый мирный и художественный из двенадцати. Она не любит спешки и прямой конкуренции, ценит красоту, уют, доброе слово и людей, с которыми можно молчать. Стихия Огня в 2027 году добавляет ей тепла и открытости: это год вдохновения, творчества, встреч и праздников, а не жёсткой борьбы за результат.</p>
        <p>Огонь в инь-форме горит ровно, как свеча, а не как костёр. Поэтому лучше всего год поддерживает дела, которые растут постепенно: обучение, ремесло, семейные проекты, отношения, которым нужно время. Коза плохо переносит давление, и год подсказывает всем знакам: договариваться выгоднее, чем настаивать, а забота о себе и близких — не роскошь, а основа.</p>
        <p>В нумерологии 2027 год тоже говорит о партнёрстве и чуткости: сумма его цифр даёт мастер-число 11. Подробнее — в <Link href="/numerologiya/2027">нумерологическом прогнозе на 2027 год</Link>.</p>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <h2 className="text-xl">Как встречать</h2>
          <ul className="mt-3 grid gap-1.5 text-sm list-disc pl-5">
            <li>Перед праздником навести порядок дома и раздать ненужное: Коза любит простор и чистоту.</li>
            <li>Накрыть стол без излишеств: зелень, овощи, сыры, выпечка, фрукты. Коза — травоядный знак, мясные блюда можно оставить, но пусть центром будет что-то растительное.</li>
            <li>Позвать близких: Коза — знак дома и тёплой компании, а не шумных вечеринок.</li>
            <li>Зажечь свечи или повесить гирлянду — маленький огонь в честь стихии года.</li>
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="text-xl">Цвета года</h2>
          <ul className="mt-3 grid gap-1.5 text-sm list-disc pl-5">
            <li>Красный — главный цвет Огня и китайского праздника.</li>
            <li>Бордовый, терракотовый, коралловый, медный — тёплые оттенки стихии.</li>
            <li>Зелёный и травяной — любимые цвета Козы.</li>
            <li>Молочный, бежевый, песочный — для тех, кому ближе спокойная гамма.</li>
          </ul>
          <p className="text-sm text-muted mt-3">Счастливые цвета Козы по традиции: {goat?.colors.join(", ")}.</p>
        </div>
        <div className="card p-5">
          <h2 className="text-xl">Что подарить</h2>
          <ul className="mt-3 grid gap-1.5 text-sm list-disc pl-5">
            <li>Тёплые вещи из шерсти: плед, шарф, носки, варежки.</li>
            <li>Керамику ручной работы, чайную пару, красивую посуду.</li>
            <li>Комнатное растение или набор семян для подоконника.</li>
            <li>Билеты на концерт, в театр или на мастер-класс — Коза ценит искусство.</li>
            <li>Свечи, ароматы для дома, красный конверт с добрыми пожеланиями.</li>
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <div className="ornament mb-4"><h2 className="text-2xl">Прогноз на 2027 год для каждого знака</h2><span className="mono">12 животных</span></div>
        <div className="grid gap-4 md:grid-cols-2">
          {animals.map((a) => {
            const f = forecast.find((x) => x.slug === a.slug);
            const level = a.slug === "koza" ? null : compatLevel(8, a.order);
            return (
              <div key={a.slug} className="card p-5">
                <div className="flex items-center gap-3">
                  <HanziMark hanzi={a.hanzi} size="sm" />
                  <h3 className="display text-xl"><Link href={`/kitayskiy-goroskop/${a.slug}`} className="hover:text-accent">{a.name}</Link></h3>
                  <span className="mono ml-auto">{level ? COMPAT_LABELS[level] : "свой год"}</span>
                </div>
                <p className="text-sm text-muted mt-3">{f?.text}</p>
              </div>
            );
          })}
        </div>
        <p className="text-sm text-muted mt-3">Не знаете своё животное? Узнайте его по дате рождения в <Link href="/kitayskiy-goroskop" className="text-accent-text underline">калькуляторе китайского гороскопа</Link>. Прогноз по западному знаку зодиака — в <Link href="/goroskop/god" className="text-accent-text underline">гороскопе на год</Link>.</p>
      </section>

      <Faq items={FAQ} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Символ 2027 года — Красная Огненная Коза (Овца)",
          url: `${SITE.url}${PATH}`,
          inLanguage: "ru",
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
        }}
      />
    </article>
  );
}
