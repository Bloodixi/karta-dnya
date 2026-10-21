import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import MatrixNav from "@/components/MatrixNav";
import { ARCANA_NUMBERS, getMatrixArcana, tarotFor } from "@/lib/matrix";

const PATH = "/matrica-sudby/arkany";

export const metadata: Metadata = {
  title: "Арканы в матрице судьбы: значение 22 арканов",
  description: "Значение 22 арканов в матрице судьбы: Маг, Жрица, Императрица и другие. Суть энергии, плюсы и минусы, отношения, деньги и работа — для каждого аркана.",
  alternates: { canonical: PATH },
};

const POS_INFO: { id: string; title: string; text: string; rows?: boolean }[] = [
  { id: "vizitka", title: "Визитная карточка", text: "точка A, день рождения: каким человека видят окружающие и что в нём замечают первым.", rows: true },
  { id: "centr", title: "Центр матрицы", text: "точка E: характер и зона комфорта, состояние, в котором человеку спокойно.", rows: true },
  { id: "talanty", title: "Таланты", text: "точка B, месяц рождения: способности и то, что даётся легко.", rows: true },
  { id: "prednaznachenie", title: "Предназначение", text: "личное (небо + земля), социальное и планетарное — задачи разных периодов жизни.", rows: true },
  { id: "dengi", title: "Деньги и работа", text: "точка C, год рождения: стиль работы и материальная сторона жизни.", rows: true },
  { id: "otnosheniya", title: "Отношения", text: "как энергия аркана проявляется в любви и в паре." },
  { id: "zdorove", title: "Здоровье", text: "мягкие подсказки о ритме, отдыхе и заботе о себе." },
  { id: "zhenshchina", title: "Для женщины и для мужчины", text: "как одна и та же энергия может звучать по-разному." },
];

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
      <section className="mt-12 max-w-3xl">
        <h2 className="text-2xl">Позиции арканов в матрице</h2>
        <p className="text-muted mt-2">Один и тот же аркан звучит по-разному в зависимости от места в матрице. На странице каждого аркана есть отдельные блоки по позициям — выберите номер, чтобы сразу перейти к нужному.</p>
        <ul className="grid gap-4 mt-4">
          {POS_INFO.map((p) => (
            <li key={p.id}>
              <p><strong>{p.title}</strong> — {p.text}</p>
              {p.rows && (
                <p className="flex flex-wrap gap-1 mt-1 text-sm">
                  {ARCANA_NUMBERS.map((n) => (
                    <Link key={n} href={`${PATH}/${n}#${p.id}`} className="chip" aria-label={`${n} аркан: ${p.title.toLowerCase()}`}>{n}</Link>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
      <Faq items={FAQ} />
      <MatrixNav current={PATH} />
    </div>
  );
}
