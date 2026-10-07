import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import MatrixNav from "@/components/MatrixNav";
import { getMatrixArcana, tarotFor } from "@/lib/matrix";

const PATH = "/matrica-sudby/arkany";

export const metadata: Metadata = {
  title: "Арканы в матрице судьбы: значение 22 арканов",
  description: "Значение 22 арканов в матрице судьбы: Маг, Жрица, Императрица и другие. Суть энергии, плюсы и минусы, отношения, деньги и работа — для каждого аркана.",
  alternates: { canonical: PATH },
};

const FAQ = [
  { q: "Сколько арканов в матрице судьбы?", a: "В классической схеме используются 22 аркана — по числу старших арканов Таро. Все числа матрицы сводятся к диапазону от 1 до 22." },
  { q: "Чем аркан матрицы отличается от карты Таро?", a: "Названия и образы те же, но в матрице аркан описывает энергию точки даты рождения, а в Таро карта читается в раскладе на конкретный вопрос. Мы связываем эти страницы ссылками, чтобы можно было сравнить трактовки." },
  { q: "Какой аркан самый важный?", a: "Центральный: он считается главной энергией матрицы. Остальные арканы уточняют, как она проявляется. Узнать свои арканы можно в калькуляторе по дате рождения." },
];

export default function ArcanaHub() {
  const all = getMatrixArcana();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: "/matrica-sudby", label: "Матрица судьбы" }, { href: PATH, label: "Арканы" }]} />
      <h1 className="text-3xl md:text-4xl">Арканы в матрице судьбы: значения 22 арканов</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">Каждый аркан описывает определённую энергию: как она проявляется в плюсе и в минусе, в отношениях, деньгах и работе. Нумерация и названия те же, что у старших арканов Таро. Не знаете свои числа? <Link href="/matrica-sudby" className="text-accent underline">Рассчитайте матрицу по дате рождения</Link>.</p>
      <div className="grid gap-3 mt-8 sm:grid-cols-2 lg:grid-cols-3">
        {all.map((a) => {
          const t = tarotFor(a.n);
          return (
            <Link key={a.n} href={`/matrica-sudby/arkany/${a.n}`} className="card card-hover p-4 block">
              <p className="mono">Аркан {a.n}{t ? ` · Таро: ${t.name}` : ""}</p>
              <p className="display text-xl mt-1">{a.name}</p>
              <p className="text-sm text-muted mt-1">{a.short}</p>
            </Link>
          );
        })}
      </div>
      <Faq items={FAQ} />
      <MatrixNav current={PATH} />
    </div>
  );
}
