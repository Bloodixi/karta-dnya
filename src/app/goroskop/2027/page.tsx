import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import PeriodNav from "@/components/PeriodNav";
import RazborCta from "@/components/RazborCta";
import ZodiacSign from "@/components/ZodiacSign";
import { SignDates } from "@/components/HoroscopeGrid";
import { getZodiac } from "@/lib/content";
import { FORECAST_YEAR, yearOverview, yearSigns, type YearSign } from "@/lib/horoscopeYear";
import { SITE, orgJsonLd } from "@/lib/site";

export const revalidate = 86400;

const Y = FORECAST_YEAR;

const FAQ = [
  { q: "Каким будет 2027 год по астрологии и нумерологии?", a: "В астрологии 2027 год задают Сатурн и Нептун в Овне, переход Юпитера из Льва в Деву и два коридора затмений (февраль и июль–август). В нумерологии это год мастер-числа 11 и аркана XI «Справедливость», а по восточному календарю — год Красной Огненной Козы." },
  { q: "Когда в 2027 году будут затмения и ретроградный Меркурий?", a: "Пять затмений: солнечные 6 февраля и 2 августа, полутеневые лунные 20–21 февраля, 18 июля и 17 августа. Подробный разбор дат — на странице затмений 2027 года." },
  { q: "Когда начинается год Красной Огненной Козы?", a: "6 февраля 2027 года, с вторым новолунием после зимнего солнцестояния. До этого дня продолжается год Огненной Лошади." },
  { q: "Как получить точный прогноз на 2027 год по своей дате рождения?", a: "Солнечный гороскоп показывает общие транзиты для знака зодиака. Личную картину на 12 месяцев вперёд даёт разбор по дате рождения: число судьбы, личный год и ключевые периоды." },
];

export const metadata: Metadata = {
  title: `Гороскоп на ${Y} год для всех знаков зодиака`,
  description: `Гороскоп на ${Y} год для всех 12 знаков: Сатурн и Нептун в Овне, Юпитер в Льве и Деве, затмения и ретро Меркурия. Любовь, работа, сезоны и лучшие месяцы.`,
  alternates: { canonical: `/goroskop/${Y}` },
};

export default function YearHubPage() {
  const ov = yearOverview();
  const texts = new Map<string, YearSign>(yearSigns().map((t) => [t.sign, t]));
  const signs = getZodiac();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/goroskop", label: "Гороскоп" }, { href: `/goroskop/${Y}`, label: `На ${Y} год` }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Гороскоп на {Y} год для всех знаков зодиака</h1>
      <p className="mt-3 max-w-3xl text-muted">
        <strong>Коротко:</strong> 2027 год проходит под числом года 11 (аркан Таро XI «Справедливость») и символом Красной Огненной Козы (с 6 февраля). В западной астрологии тон задают Сатурн и Нептун в Овне, Юпитер во Льве и Деве и два коридора затмений — в феврале и июле–августе.
      </p>
      {ov && <p className="text-muted mt-2 max-w-3xl">{ov.lead}</p>}
      <div className="mt-4"><PeriodNav /></div>

      <section className="mt-8">
        <h2 className="text-2xl mb-3">Прогноз на {Y} год по знакам</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {signs.map((z) => {
            const t = texts.get(z.slug);
            return (
              <li key={z.slug}>
                <Link href={`/goroskop/${z.slug}/${Y}`} className="card h-full p-4 flex gap-3 hover:border-accent">
                  <ZodiacSign symbol={z.symbol} element={z.element} slug={`y-${z.slug}`} size={48} className="shrink-0" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{z.name}</span>
                    <span className="block text-xs text-muted"><SignDates dates={z.dates} /></span>
                    {t && <span className="block text-sm text-muted mt-1.5">{t.lead}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {ov && (
        <section className="prose mt-10">
          {ov.sections.map((s) => (
            <div key={s.h}>
              <h2>{s.h}</h2>
              {s.p.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
            </div>
          ))}
          <h2>Ключевые даты {Y} года</h2>
          <ul>
            {ov.keyDates.map((d) => <li key={d.date}><strong>{d.date}</strong> — {d.text}</li>)}
          </ul>
          <h2>Восточный и нумерологический год</h2>
          <p>
            {ov.eastern} <Link href={`/kitayskiy-goroskop/${Y}`}>Китайский гороскоп на {Y} год →</Link>
          </p>
          <p>
            {ov.numerology} <Link href={`/numerologiya/${Y}`}>Нумерология {Y} года →</Link>
          </p>
          <p>
            Пять затмений {Y} года — 6 февраля, 20–21 февраля, 18 июля, 2 августа и 17 августа — подробно разобраны в <Link href="/astrologiya/zatmeniya-2027">календаре затмений 2027 →</Link>
          </p>
          <p className="text-sm text-muted">
            Положения планет рассчитаны по эфемеридам на московское время. Это солнечный гороскоп — по знаку Солнца; личная картина точнее по <Link href="/astrologiya/natalnaya-karta">натальной карте</Link>. Даты ретроградного Меркурия по годам — на странице <Link href="/astrologiya/retrogradnyy-merkuriy">«Ретроградный Меркурий»</Link>.
          </p>
        </section>
      )}

      <RazborCta from="prognoz-2027" />

      <Faq items={FAQ} />

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Другие гороскопы</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/goroskop" className="btn btn-ghost">На сегодня</Link>
          <Link href="/goroskop/nedelya" className="btn btn-ghost">На неделю</Link>
          <Link href="/goroskop/mesyats" className="btn btn-ghost">На месяц</Link>
          <Link href="/goroskop/god" className="btn btn-ghost">На текущий год</Link>
          <Link href="/sovmestimost" className="btn btn-ghost">Совместимость</Link>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Гороскоп на ${Y} год для всех знаков зодиака`,
          datePublished: "2026-10-17",
          dateModified: "2026-10-17",
          inLanguage: "ru",
          mainEntityOfPage: `${SITE.url}/goroskop/${Y}`,
          author: orgJsonLd(), publisher: orgJsonLd(),
        }}
      />
    </div>
  );
}
