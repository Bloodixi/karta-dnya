import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import Pythagoras from "@/components/Pythagoras";
import RazborDateScope, { ScopedRazborCta } from "@/components/RazborDateScope";
import ArticleLinks from "@/components/ArticleLinks";
import { PSYCHOMATRIX_CELLS, PSYCHOMATRIX_LINES } from "@/lib/pythagoras";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Квадрат Пифагора по дате рождения: рассчитать онлайн",
  description: "Калькулятор квадрата Пифагора (психоматрицы) по дате рождения: рабочие числа, 9 ячеек, 8 линий и полная расшифровка характера, энергии, логики и памяти.",
  alternates: { canonical: "/kvadrat-pifagora" },
};

const FAQ = [
  { q: "Что такое квадрат Пифагора?", a: "Психоматрица из девяти ячеек, которую строят по цифрам даты рождения и четырём рабочим числам. Количество одинаковых цифр в ячейке описывает выраженность качества." },
  { q: "Что значит пустая ячейка?", a: "Качество выражено слабо и развивается через опыт, а не дано от рождения. Пустая ячейка не приговор, а подсказка, куда направить внимание." },
  { q: "Как читать строки, столбцы и диагонали психоматрицы?", a: "Считается общее количество цифр в каждой из восьми линий. До 2 цифр — качество проявляется мягко, 3–4 — устойчивая опора, 5 и больше — ведущая черта характера." },
  { q: "Что означает много одинаковых цифр (3 и больше) в одной ячейке?", a: "Качество выражено ярко и задаёт тон характеру, но при перегрузе может уходить в крайность — например, сильная воля (1111) требует бережного диалога, а избыток двоек просит регулярной физической нагрузки." },
  { q: "Чем квадрат Пифагора отличается от числа судьбы?", a: "Число судьбы — одно итоговое число, квадрат Пифагора — девять характеристик и восемь линий сразу. Их удобно читать вместе." },
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
        <section className="mt-10">
          <div className="ornament mb-4">
            <h2 className="text-2xl">Расшифровка 9 ячеек квадрата Пифагора</h2>
            <span className="mono">мало · норма · много</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-2 pr-4">Ячейка</th>
                  <th className="py-2 pr-4">Мало (пусто или 1)</th>
                  <th className="py-2 pr-4">Норма (2 цифры)</th>
                  <th className="py-2">Много (3 и больше)</th>
                </tr>
              </thead>
              <tbody>
                {PSYCHOMATRIX_CELLS.map((c) => (
                  <tr key={c.digit} className="border-b border-line/60 align-top">
                    <td className="py-2.5 pr-4 font-semibold whitespace-nowrap">{c.digit} · {c.title}</td>
                    <td className="py-2.5 pr-4 text-muted">{c.low}</td>
                    <td className="py-2.5 pr-4">{c.norm}</td>
                    <td className="py-2.5 text-muted">{c.high}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="mt-10">
          <div className="ornament mb-4">
            <h2 className="text-2xl">Значение 8 линий психоматрицы</h2>
            <span className="mono">3 строки · 3 столбца · 2 диагонали</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-2 pr-4">Линия</th>
                  <th className="py-2 pr-4">Тип</th>
                  <th className="py-2 pr-4">Ячейки</th>
                  <th className="py-2">За что отвечает</th>
                </tr>
              </thead>
              <tbody>
                {PSYCHOMATRIX_LINES.map((l) => (
                  <tr key={l.name} className="border-b border-line/60 align-top">
                    <td className="py-2.5 pr-4 font-semibold whitespace-nowrap">{l.name}</td>
                    <td className="py-2.5 pr-4 text-muted whitespace-nowrap">{l.kind}</td>
                    <td className="py-2.5 pr-4 mono whitespace-nowrap">{l.cells}</td>
                    <td className="py-2.5 text-muted">{l.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <ScopedRazborCta from="kvadrat-pifagora" />
      </RazborDateScope>
      <ArticleLinks path="/kvadrat-pifagora" />
      <Faq items={FAQ} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Калькулятор квадрата Пифагора", url: `${SITE.url}/kvadrat-pifagora`, applicationCategory: "LifestyleApplication", operatingSystem: "Any", inLanguage: "ru", offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" } }} />
    </div>
  );
}
