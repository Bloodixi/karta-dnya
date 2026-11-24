import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import DestinyCalc from "@/components/DestinyCalc";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import NumerologyNav from "@/components/NumerologyNav";
import TelegramBot from "@/components/TelegramBot";
import RazborCta from "@/components/RazborCta";
import { getArticles, getNumerology } from "@/lib/content";
import { SITE } from "@/lib/site";
import ArticleLinks from "@/components/ArticleLinks";

export const metadata: Metadata = {
  title: "Число судьбы по дате рождения: расчёт и значение",
  description: "Рассчитайте число судьбы по дате рождения онлайн за секунду: расшифровка чисел 1–9 и мастер-чисел 11, 22, 33 — характер, любовь, работа и прогноз.",
  alternates: { canonical: "/chislo-sudby" },
};

const DESTINY_FAQ = [
  { q: "Как считается число судьбы по дате рождения?", a: "Сложите все цифры дня, месяца и года рождения. Если получилась сумма больше 9, складывайте её цифры дальше до однозначного числа 1–9 или остановитесь на мастер-числах 11, 22 и 33." },
  { q: "Что такое мастер-числа 11, 22 и 33?", a: "Это управляющие числа, которые в классической нумерологии не сворачивают до 2, 4 и 6: они дают повышенную чувствительность, масштаб задач и дополнительную ответственность." },
  { q: "Чем число судьбы отличается от квадрата Пифагора?", a: "Число судьбы задаёт главный вектор жизненного пути одной цифрой, а квадрат Пифагора показывает распределение девяти качеств (характер, энергия, логика, труд) по всем цифрам даты." },
  { q: "Как связать число судьбы с прогнозом на 2027 год?", a: "После расчёта числа судьбы проверьте свой личный год 2027 и полный разбор по дате рождения: он соединяет базовый характер с тоном каждого месяца." },
];

export default function DestinyPage() {
  const numbers = getNumerology();
  // Сначала статьи о самом числе судьбы (как считать вручную, чем отличаются 1–9), потом свежие статьи раздела.
  const FIRST = ["chislo-sudby-po-date-rozhdeniya", "chislo-sudby-1-9-znachenie"];
  const all = getArticles("numerologiya");
  const articles = [...FIRST.map((s) => all.find((a) => a.slug === s)).filter((a) => a !== undefined), ...all.filter((a) => !FIRST.includes(a.slug))].slice(0, 3);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: "/chislo-sudby", label: "Число судьбы" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Число судьбы по дате рождения</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">Число судьбы (жизненного пути) — это сумма всех цифр даты рождения, свёрнутая до одной цифры от 1 до 9 или мастер-числа 11, 22 и 33. Оно описывает главный вектор характера, таланты, любовь и работу. Калькулятор рассчитает его за секунду. Нужны сразу все числа даты — откройте <Link className="text-accent-text underline" href="/numerologiya/po-date-rozhdeniya">нумерологию по дате рождения</Link>, а для разбора через 22 аркана — <Link className="text-accent-text underline" href="/matrica-sudby">матрицу судьбы</Link>.</p>
      <div className="mt-6 max-w-2xl">
        <DestinyCalc numbers={numbers} />
        <TelegramBot from="chislo-sudby" className="mt-6" />
      </div>
      {numbers.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl mb-3">Значения чисел</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {numbers.map((n) => (
              <Link key={n.number} href={`/chislo-sudby/${n.number}`} className="card card-hover p-5 block">
                <p className="display text-3xl">{n.number} <span className="text-lg text-muted">· {n.title}</span></p>
                <p className="text-sm text-muted mt-2 line-clamp-4">{n.description}</p>
                <p className="text-accent-text text-sm mt-3">Подробнее о числе {n.number}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
      {articles.length > 0 && (
        <p className="mt-10 text-muted">
          Подробнее: {articles.map((a, i) => <span key={a.slug}>{i > 0 && ", "}<Link className="text-accent-text underline" href={`/numerologiya/${a.slug}`}>{a.title}</Link></span>)}.
        </p>
      )}
      <ArticleLinks path="/chislo-sudby" />
      <RazborCta from="chislo-sudby" />
      <Faq items={DESTINY_FAQ} />
      <p className="mt-6 text-sm text-muted">Также посмотрите <Link className="text-accent-text underline" href="/numerologiya/lichnyy-god">калькулятор личного года</Link>, <Link className="text-accent-text underline" href="/numerologiya/2027">нумерологический прогноз на 2027 год</Link> и <Link className="text-accent-text underline" href="/razbor-rebenka">детский разбор по дате рождения</Link> для родителей.</p>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Калькулятор числа судьбы", url: `${SITE.url}/chislo-sudby`, applicationCategory: "LifestyleApplication", operatingSystem: "Any", inLanguage: "ru", offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" } }} />
      <NumerologyNav current="/chislo-sudby" />
    </div>
  );
}
