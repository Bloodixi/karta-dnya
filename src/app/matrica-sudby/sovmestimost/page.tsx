import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import MatrixNav from "@/components/MatrixNav";
import CompatCta from "@/components/CompatCta";
import RazborCta from "@/components/RazborCta";
import { DateField, FormError, ShareLink, dateErrorText } from "@/components/NumerologyFields";
import ScrollToResult from "@/components/ScrollToResult";
import { formatDate, parseDate } from "@/lib/numerology";
import { calcMatrix, calcPair, findMatrixArcana } from "@/lib/matrix";
import { SITE } from "@/lib/site";

const PATH = "/matrica-sudby/sovmestimost";

export const metadata: Metadata = {
  title: "Совместимость по матрице судьбы: рассчитать пару онлайн",
  description: "Совместимость по матрице судьбы онлайн: введите две даты рождения, узнайте арканы партнёров, общий аркан пары и разбор сильных сторон союза.",
  alternates: { canonical: PATH },
};

const FAQ = [
  { q: "Как считается совместимость по матрице судьбы?", a: "Для каждой даты рассчитывается матрица из пяти точек. Затем арканы партнёров складываются по позициям, а центры матриц дают общий аркан пары: сумма центров, сведённая к диапазону от 1 до 22." },
  { q: "Что такое общий аркан пары?", a: "Это энергия, которая возникает между двумя людьми: общая тема, которую пара проживает вместе. Она не оценивает союз по баллам, а подсказывает, на что можно опереться и что стоит обсуждать." },
  { q: "Есть ли «плохие» сочетания арканов?", a: "Нет. Любое сочетание можно прожить гармонично или напряжённо: многое зависит от осознанности партнёров, а не от чисел. Описания помогают лучше понимать друг друга, но не определяют судьбу отношений." },
  { q: "Подходит ли расчёт для друзей и коллег?", a: "Да. Энергии арканов описывают стиль общения и ценности, поэтому разбор полезен и для делового партнёрства, и для дружбы, и для родственников." },
];

export default async function PairPage({ searchParams }: PageProps<typeof PATH>) {
  const sp = await searchParams;
  const a = parseDate(sp.a);
  const b = parseDate(sp.b);
  const invalid = (sp.a !== undefined || sp.b !== undefined) && !(a && b);

  let result: React.ReactNode = null;
  if (a && b) {
    const m1 = calcMatrix(a.d, a.m, a.y);
    const m2 = calcMatrix(b.d, b.m, b.y);
    const { pair, rows } = calcPair(m1, m2);
    const pa = findMatrixArcana(pair);
    const x = findMatrixArcana(m1.e);
    const y = findMatrixArcana(m2.e);
    result = (
      <section className="mt-8 scroll-mt-24" id="rezultat">
        <div className="ornament mb-4">
          <h2 className="text-2xl">{formatDate(a)} и {formatDate(b)}</h2>
          <span className="mono">общий аркан пары {pair}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <p className="mono">Первый партнёр · центр</p>
            <p className="display text-4xl mt-1"><Link href={`/matrica-sudby/arkany/${m1.e}`} className="inline-block min-w-11 hover:text-accent">{m1.e}</Link> <span className="text-xl text-muted">· {x?.name}</span></p>
            <p className="text-sm mt-2">{x?.short}</p>
            <p className="text-sm mt-1"><Link href={`/matrica-sudby?d=${a.iso}`} className="inline-flex min-h-11 items-center text-accent-text underline">Вся матрица</Link></p>
          </div>
          <div className="card p-5 text-center">
            <p className="mono">Общий аркан пары</p>
            <p className="display text-6xl mt-1 text-accent">{pair}</p>
            <p className="text-sm text-muted mt-1">{m1.e} + {m2.e} = {m1.e + m2.e}{m1.e + m2.e > 22 ? ` → ${pair}` : ""} · {pa?.name}</p>
          </div>
          <div className="card p-5">
            <p className="mono">Второй партнёр · центр</p>
            <p className="display text-4xl mt-1"><Link href={`/matrica-sudby/arkany/${m2.e}`} className="inline-block min-w-11 hover:text-accent">{m2.e}</Link> <span className="text-xl text-muted">· {y?.name}</span></p>
            <p className="text-sm mt-2">{y?.short}</p>
            <p className="text-sm mt-1"><Link href={`/matrica-sudby?d=${b.iso}`} className="inline-flex min-h-11 items-center text-accent-text underline">Вся матрица</Link></p>
          </div>
        </div>

        <div className="overflow-x-auto mt-6">
          <table className="text-sm w-full">
            <thead><tr className="text-left"><th className="p-2 mono">Позиция</th><th className="px-1 py-2 sm:p-2 mono">Первый</th><th className="px-1 py-2 sm:p-2 mono">Второй</th><th className="px-1 py-2 sm:p-2 mono">Вместе</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-line">
                  <td className="p-2">{r.letter} · {r.title.split(":")[0]}</td>
                  <td className="px-1 py-2 sm:p-2"><Link href={`/matrica-sudby/arkany/${r.v1}`} className="inline-flex min-w-11 min-h-11 items-center justify-center -my-2 text-accent-text underline tabular-nums">{r.v1}</Link></td>
                  <td className="px-1 py-2 sm:p-2"><Link href={`/matrica-sudby/arkany/${r.v2}`} className="inline-flex min-w-11 min-h-11 items-center justify-center -my-2 text-accent-text underline tabular-nums">{r.v2}</Link></td>
                  <td className="px-1 py-2 sm:p-2"><Link href={`/matrica-sudby/arkany/${r.sum}`} className="inline-flex min-w-11 min-h-11 items-center justify-center -my-2 text-accent-text underline tabular-nums">{r.sum}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pa && (
          <div className="prose mt-6">
            <h3>Энергия пары: аркан {pa.n}, {pa.name}</h3>
            <p>{pa.essence}</p>
            <h3>Сильные стороны союза</h3>
            <p>{pa.plus}</p>
            <h3>На что обратить внимание</h3>
            <p>{pa.minus}</p>
            <h3>В отношениях</h3>
            <p>{pa.love}</p>
            <h3>В общем деле</h3>
            <p>{pa.career}</p>
            <h3>Как сочетаются центры</h3>
            <p>У первого партнёра центр — {x?.name.toLowerCase()}: {x?.short.charAt(0).toLowerCase()}{x?.short.slice(1)} У второго — {y?.name.toLowerCase()}: {y?.short.charAt(0).toLowerCase()}{y?.short.slice(1)} Пара получает общую тему «{pa.name.toLowerCase()}». Полезно обсудить, как каждый видит эту энергию, и договориться о том, что вы хотите развивать вместе. Это описание для размышления, а не оценка отношений.</p>
            <p><Link href={`/matrica-sudby/arkany/${pa.n}`}>Полный разбор аркана {pa.n}</Link></p>
          </div>
        )}
        <ShareLink path={`${SITE.url}${PATH}?a=${a.iso}&b=${b.iso}`} />
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: "/matrica-sudby", label: "Матрица судьбы" }, { href: PATH, label: "Совместимость" }]} />
      <h1 className="text-3xl md:text-4xl">Совместимость по матрице судьбы</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">Введите две даты рождения. Калькулятор покажет арканы каждого, сложит их по позициям и найдёт общий аркан пары: энергию, которую вы проживаете вместе.</p>
      <div className="card p-6 mt-6 max-w-3xl">
        <Form action={PATH} className="flex flex-wrap gap-3 items-end">
          <DateField name="a" label="Ваша дата рождения" defaultValue={a?.iso ?? (typeof sp.a === "string" ? sp.a : "")} invalid={invalid && !a} />
          <DateField name="b" label="Дата рождения партнёра" defaultValue={b?.iso ?? (typeof sp.b === "string" ? sp.b : "")} invalid={invalid && !b} />
          <button type="submit" className="btn min-h-11">Рассчитать</button>
        </Form>
        <FormError text={invalid ? dateErrorText(!a ? sp.a : sp.b, "Введите обе даты рождения полностью.") : undefined} />
      </div>
      {result}
      <ScrollToResult key={`${a?.iso}-${b?.iso}`} id="rezultat" when={!!(a && b)} />
      <CompatCta from="matrica-sovmestimost" a={a?.iso} b={b?.iso} />
      <RazborCta from="matrica-sovmestimost" date={a?.iso} className="mt-6" />
      <section className="prose mt-12">
        <h2>Как читать результат</h2>
        <p>Сначала посмотрите на центральные арканы партнёров: это главные энергии каждого. Затем на общий аркан пары, сумму центров: он показывает тему, вокруг которой строится союз. Таблица позиций помогает увидеть, где арканы поддерживают друг друга: в характере, ресурсе, талантах и жизненных уроках.</p>
        <p>Для астрологического взгляда на пару есть <Link href="/sovmestimost">совместимость знаков зодиака</Link>, для числового — <Link href="/numerologiya/sovmestimost">совместимость по числу судьбы</Link>. Свою матрицу можно <Link href="/matrica-sudby">рассчитать отдельно</Link>, а значения всех арканов — в <Link href="/matrica-sudby/arkany">справочнике</Link>.</p>
      </section>
      <Faq items={FAQ} />
      <MatrixNav current={PATH} />
    </div>
  );
}
