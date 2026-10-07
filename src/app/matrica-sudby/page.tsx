import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import MatrixDiagram from "@/components/MatrixDiagram";
import MatrixNav from "@/components/MatrixNav";
import { DateField, FormError, ShareLink } from "@/components/NumerologyFields";
import { formatDate, parseDate } from "@/lib/numerology";
import { POSITIONS, calcMatrix, findMatrixArcana, getMatrixArcana } from "@/lib/matrix";
import { SITE } from "@/lib/site";

const PATH = "/matrica-sudby";

export const metadata: Metadata = {
  title: "Матрица судьбы по дате рождения: рассчитать онлайн",
  description: "Рассчитайте матрицу судьбы по дате рождения онлайн: арканы дня, месяца, года и центра, личное предназначение и краткие трактовки каждой позиции.",
  alternates: { canonical: PATH },
};

const FAQ = [
  { q: "Как рассчитать матрицу судьбы по дате рождения?", a: "Введите день, месяц и год рождения. Калькулятор сведёт каждое число к диапазону от 1 до 22: если значение больше 22, складываются его цифры. Получится пять точек: день, месяц, год, их сумма и центр матрицы." },
  { q: "Что такое аркан в матрице судьбы?", a: "Это число от 1 до 22, которое соответствует одному из старших арканов Таро и описывает определённую энергию: например, 4 — структура и ответственность, 19 — радость и открытость. Значения арканов собраны на отдельных страницах." },
  { q: "Что означает центральный аркан?", a: "Центр матрицы считают главной энергией личности: он показывает, в какой теме человеку проще всего находить смысл и ощущение собственного пути. Остальные точки уточняют, как эта энергия проявляется в характере, ресурсах и задачах." },
  { q: "Это прогноз судьбы?", a: "Нет. Матрица судьбы — символическая система для самонаблюдения. Она подсказывает темы для размышления, но не предсказывает события и не заменяет решений, которые вы принимаете сами." },
  { q: "Почему результаты в разных источниках отличаются?", a: "Существует несколько школ расчёта: отличаются набор точек и нумерация арканов (например, место Силы и Справедливости). Мы используем классическую схему и нумерацию, как в старших арканах Таро." },
];

export default async function MatrixPage({ searchParams }: PageProps<typeof PATH>) {
  const sp = await searchParams;
  const raw = sp.d;
  const date = parseDate(raw);
  const invalid = raw !== undefined && !date;
  const arcana = getMatrixArcana();

  let result: React.ReactNode = null;
  if (date) {
    const m = calcMatrix(date.d, date.m, date.y);
    const main = findMatrixArcana(m.e);
    result = (
      <section className="mt-8" id="rezultat">
        <div className="ornament mb-4">
          <h2 className="text-2xl">Матрица судьбы {formatDate(date)}</h2>
          <span className="mono">центр: аркан {m.e}</span>
        </div>
        <div className="grid gap-6 md:grid-cols-[320px_1fr] items-start">
          <div className="card p-4">
            <MatrixDiagram m={m} label={`Матрица судьбы ${formatDate(date)}: A ${m.a}, B ${m.b}, C ${m.c}, D ${m.d}, центр ${m.e}`} />
            <ol className="text-xs text-muted mt-3 grid gap-1">{m.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </div>
          <div className="grid gap-3">
            {POSITIONS.map((p) => {
              const a = findMatrixArcana(m[p.key]);
              return (
                <div key={p.key} className="card p-4">
                  <p className="mono">{p.letter} · {p.title}</p>
                  <p className="display text-2xl mt-1">
                    <Link href={`/matrica-sudby/arkany/${m[p.key]}`} className="hover:text-accent">{m[p.key]} · {a?.name}</Link>
                  </p>
                  <p className="text-sm text-muted mt-1">{p.text}</p>
                  <p className="text-sm mt-2">{a?.short}</p>
                </div>
              );
            })}
          </div>
        </div>
        {main && (
          <div className="prose mt-6">
            <h3>Личное предназначение: аркан {main.n}, {main.name}</h3>
            <p>{main.essence}</p>
            <p><strong>В плюсе.</strong> {main.plus}</p>
            <p><strong>Что полезно помнить.</strong> {main.minus}</p>
            <p><Link href={`/matrica-sudby/arkany/${main.n}`}>Полный разбор аркана {main.n}</Link></p>
          </div>
        )}
        <p className="mt-4 flex flex-wrap gap-2">
          <Link href={`/matrica-sudby/sovmestimost?a=${date.iso}`} className="btn btn-ghost">Совместимость с партнёром</Link>
          <Link href={`/numerologiya/po-date-rozhdeniya?d=${date.iso}`} className="btn btn-ghost">Нумерология по этой дате</Link>
        </p>
        <ShareLink path={`${SITE.url}${PATH}?d=${date.iso}`} />
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: PATH, label: "Матрица судьбы" }]} />
      <h1 className="text-3xl md:text-4xl">Матрица судьбы по дате рождения</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">Введите дату рождения и получите арканы дня, месяца, года и центр матрицы с краткими трактовками. Расчёт по классической схеме, значения — на страницах 22 арканов.</p>

      <div className="card p-6 mt-6 max-w-3xl">
        <Form action={PATH} className="flex flex-wrap gap-3 items-end">
          <DateField name="d" label="Дата рождения" defaultValue={date?.iso ?? (typeof raw === "string" ? raw : "")} />
          <button type="submit" className="btn">Рассчитать матрицу</button>
        </Form>
        <FormError text={invalid ? "Введите дату рождения полностью, например 14.03.1987." : undefined} />
      </div>

      {result}

      <section className="prose mt-12">
        <h2>Как считается матрица судьбы</h2>
        <p>Все числа сводятся к диапазону от 1 до 22: если результат больше 22, складываются его цифры (29 → 2 + 9 = 11). Число 22 остаётся как есть. Расчёт строится из пяти точек.</p>
        <ul>
          {POSITIONS.map((p) => <li key={p.key}><strong>{p.letter}</strong> — {p.title.toLowerCase()}. {p.key === "a" && "Равна дню рождения."}{p.key === "b" && "Равна номеру месяца (от 1 до 12)."}{p.key === "c" && "Сумма цифр года рождения."}{p.key === "d" && "A + B + C."}{p.key === "e" && "A + B + C + D."}</li>)}
        </ul>
        <p>Пример: 14.03.1987. A = 14, B = 3, год 1 + 9 + 8 + 7 = 25 → 2 + 5 = 7, C = 7. D = 14 + 3 + 7 = 24 → 6. Центр E = 14 + 3 + 7 + 6 = 30 → 3 + 0 = 3. Центральный аркан — 3, Императрица.</p>
        <p>Нумерация арканов совпадает со старшими арканами Таро: аркан 22 соответствует Шуту (карта 0). Значения арканов связаны со страницами карт на сайте, например <Link href="/taro/karty/mag">Маг</Link> и <Link href="/taro/karty/imperatritsa">Императрица</Link>. Если интересуют числа даты рождения без арканов, посмотрите <Link href="/numerologiya/po-date-rozhdeniya">нумерологию по дате рождения</Link> и <Link href="/chislo-sudby">число судьбы</Link>.</p>
      </section>

      <section className="mt-10">
        <div className="ornament mb-4"><h2 className="text-2xl">22 аркана матрицы</h2><Link href="/matrica-sudby/arkany" className="mono">все значения</Link></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {arcana.map((a) => (
            <Link key={a.n} href={`/matrica-sudby/arkany/${a.n}`} className="card card-hover px-3 py-2 block">
              <span className="display text-xl text-accent">{a.n}</span> <span className="text-sm">{a.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <Faq items={FAQ} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Калькулятор матрицы судьбы", url: `${SITE.url}${PATH}`, applicationCategory: "LifestyleApplication", operatingSystem: "Any", inLanguage: "ru", offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" } }} />
      <MatrixNav current={PATH} />
    </div>
  );
}
