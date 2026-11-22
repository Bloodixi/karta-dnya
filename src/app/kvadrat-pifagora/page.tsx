import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import Pythagoras from "@/components/Pythagoras";
import RazborDateScope, { ScopedRazborCta } from "@/components/RazborDateScope";
import ArticleLinks from "@/components/ArticleLinks";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Квадрат Пифагора по дате рождения: рассчитать онлайн",
  description: "Калькулятор квадрата Пифагора (психоматрицы) по дате рождения: рабочие числа, 9 ячеек и расшифровка характера, энергии, здоровья, логики и памяти.",
  alternates: { canonical: "/kvadrat-pifagora" },
};

const FAQ = [
  { q: "Что такое квадрат Пифагора?", a: "Психоматрица из девяти ячеек, которую строят по цифрам даты рождения и четырём рабочим числам. Количество одинаковых цифр в ячейке описывает выраженность качества." },
  { q: "Что значит пустая ячейка?", a: "Качество выражено слабо и развивается через опыт, а не дано от рождения. Пустая ячейка не приговор, а подсказка, куда направить внимание." },
  { q: "Чем квадрат Пифагора отличается от числа судьбы?", a: "Число судьбы — одно итоговое число, квадрат Пифагора — девять характеристик сразу. Их удобно читать вместе." },
];

export default function PythagorasPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: "/kvadrat-pifagora", label: "Квадрат Пифагора" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Квадрат Пифагора по дате рождения</h1>
      <p className="text-muted mt-2 max-w-2xl">Квадрат Пифагора (психоматрица) — это таблица из девяти ячеек от 1 до 9, которая строится по цифрам даты рождения и четырём рабочим числам. Калькулятор мгновенно рассчитывает матрицу онлайн и показывает расшифровку характера, энергии, здоровья, логики, памяти и других качеств личности.</p>
      {/* дата из калькулятора (или ?d= в адресе) подставляется в приглашение к разбору */}
      <RazborDateScope>
        <div className="mt-6 max-w-3xl"><Pythagoras /></div>
        <section className="prose mt-10">
          <h2>Как считается</h2>
          <p>Складываются все цифры даты рождения (первое рабочее число), затем цифры результата (второе). Третье число — первое минус удвоенная первая цифра дня рождения, четвёртое — сумма цифр третьего. Все цифры даты и рабочих чисел раскладываются по ячейкам от 1 до 9. Подробнее с примером в статье <Link href="/numerologiya/kvadrat-pifagora">как рассчитать и расшифровать квадрат Пифагора</Link>, а итоговое число даты смотрите в <Link href="/chislo-sudby">калькуляторе числа судьбы</Link>. Для оценки ритма текущего периода подойдут <Link href="/numerologiya/lichnyy-god">калькулятор личного года</Link> и <Link href="/numerologiya/2027">нумерологический прогноз на 2027 год</Link>.</p>
        </section>
        <ScopedRazborCta from="kvadrat-pifagora" />
      </RazborDateScope>
      <ArticleLinks path="/kvadrat-pifagora" />
      <Faq items={FAQ} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Калькулятор квадрата Пифагора", url: `${SITE.url}/kvadrat-pifagora`, applicationCategory: "LifestyleApplication", operatingSystem: "Any", inLanguage: "ru", offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" } }} />
    </div>
  );
}
