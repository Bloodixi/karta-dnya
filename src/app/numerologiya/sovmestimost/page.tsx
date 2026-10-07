import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import NumerologyNav from "@/components/NumerologyNav";
import { DateField, FormError, ShareLink } from "@/components/NumerologyFields";
import { getNumerology, getNumerologyPairs } from "@/lib/content";
import { CORE_NUMBERS, destinyNumber, formatDate, isMaster, pairKey, parseDate, toCore } from "@/lib/numerology";

const PATH = "/numerologiya/sovmestimost";

export const metadata: Metadata = {
  title: "Совместимость по дате рождения: нумерология онлайн",
  description: "Совместимость по дате рождения онлайн: узнайте числа судьбы партнёров, процент совместимости и разбор пары — любовь, работа, совет. 45 сочетаний чисел.",
  alternates: { canonical: PATH },
};

const FAQ = [
  { q: "Что значит процент совместимости?", a: "Это условная оценка того, насколько легко двум числам судьбы понимать друг друга. Высокий процент означает похожие ценности и темп, низкий — что паре придётся больше договариваться. Это не прогноз и не приговор." },
  { q: "Почему мастер-числа 11, 22 и 33 сведены к 2, 4 и 6?", a: "В таблице сочетаний мастер-числа читаются через свою основу: 11 как усиленная двойка, 22 как четвёрка, 33 как шестёрка. Мы показываем, если у кого-то из партнёров есть мастер-число, и советуем прочитать его страницу отдельно." },
  { q: "Подходит ли расчёт для друзей и коллег?", a: "Да. Числа описывают стиль общения и ценности, а не только романтику. Для рабочих пар смотрите блок «В работе»." },
  { q: "Нужно ли время рождения?", a: "Нет, нумерология использует только дату. Время и место нужны для астрологии — например, для натальной карты." },
];

function destinyLabel(n: number) {
  return isMaster(n) ? `${n} (мастер-число, читается как ${toCore(n)})` : String(n);
}

export default async function CompatPage({ searchParams }: PageProps<typeof PATH>) {
  const sp = await searchParams;
  const a = parseDate(sp.a);
  const b = parseDate(sp.b);
  const invalid = (sp.a !== undefined || sp.b !== undefined) && !(a && b);
  const pairs = getNumerologyPairs();
  const numbers = getNumerology();
  const byKey = (k: string) => pairs.find((p) => p.pair === k);

  let result: React.ReactNode = null;
  if (a && b) {
    const da = destinyNumber(a.d, a.m, a.y);
    const db = destinyNumber(b.d, b.m, b.y);
    const key = pairKey(da.number, db.number);
    const pair = byKey(key);
    const ta = numbers.find((n) => n.number === da.number);
    const tb = numbers.find((n) => n.number === db.number);
    result = (
      <section className="mt-8" id="rezultat">
        <div className="ornament mb-4">
          <h2 className="text-2xl">{formatDate(a)} и {formatDate(b)}</h2>
          <span className="mono">числа {toCore(da.number)} и {toCore(db.number)}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr]">
          <div className="card p-5">
            <p className="mono">Первый партнёр</p>
            <p className="display text-5xl mt-1">{da.number} {ta && <span className="text-xl text-muted">· {ta.title}</span>}</p>
            <p className="text-xs text-muted mt-1">{da.steps.join(" → ")}</p>
            <p className="text-sm mt-3"><Link href={`/chislo-sudby/${da.number}`} className="text-accent underline">Число судьбы {destinyLabel(da.number)}</Link></p>
          </div>
          <div className="card p-5 text-center">
            <p className="mono">Совместимость</p>
            <p className="display text-6xl mt-1 text-accent">{pair?.percent ?? "—"}%</p>
            <p className="text-sm text-muted mt-1">{pair?.title}</p>
          </div>
          <div className="card p-5">
            <p className="mono">Второй партнёр</p>
            <p className="display text-5xl mt-1">{db.number} {tb && <span className="text-xl text-muted">· {tb.title}</span>}</p>
            <p className="text-xs text-muted mt-1">{db.steps.join(" → ")}</p>
            <p className="text-sm mt-3"><Link href={`/chislo-sudby/${db.number}`} className="text-accent underline">Число судьбы {destinyLabel(db.number)}</Link></p>
          </div>
        </div>
        {pair && (
          <div className="prose mt-6">
            <p>{pair.text}</p>
            <h3>В любви</h3>
            <p>{pair.love}</p>
            <h3>В работе</h3>
            <p>{pair.work}</p>
            <h3>Совет паре</h3>
            <p>{pair.advice}</p>
            {(isMaster(da.number) || isMaster(db.number)) && <p className="text-muted">У одного из партнёров мастер-число: оно добавляет чувствительности и масштаба. Загляните на страницу <Link href="/numerologiya/master-chisla">мастер-чисел</Link>, чтобы учесть это в разборе.</p>}
          </div>
        )}
        <ShareLink path={`https://karta-dnya.ru${PATH}?a=${a.iso}&b=${b.iso}`} />
      </section>
    );
  }

  const sorted = [...pairs].sort((x, y) => y.percent - x.percent);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: PATH, label: "Совместимость по дате рождения" }]} />
      <h1 className="text-3xl md:text-4xl">Совместимость по дате рождения</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">Введите две даты рождения. Калькулятор посчитает число судьбы каждого, покажет процент совместимости и разбор пары: что объединяет, где возможны трения и как договориться.</p>

      <div className="card p-6 mt-6 max-w-3xl">
        <Form action={PATH} className="flex flex-wrap gap-3 items-end">
          <DateField name="a" label="Ваша дата рождения" defaultValue={a?.iso ?? (typeof sp.a === "string" ? sp.a : "")} />
          <DateField name="b" label="Дата рождения партнёра" defaultValue={b?.iso ?? (typeof sp.b === "string" ? sp.b : "")} />
          <button type="submit" className="btn">Рассчитать</button>
        </Form>
        <FormError text={invalid ? "Введите обе даты рождения полностью." : undefined} />
      </div>

      {result}

      <section className="mt-12">
        <div className="ornament mb-4"><h2 className="text-2xl">Таблица совместимости чисел судьбы</h2><span className="mono">9 × 9, процент</span></div>
        <div className="overflow-x-auto">
          <table className="text-sm min-w-[520px] w-full">
            <thead>
              <tr><th className="p-2 text-left mono">число</th>{CORE_NUMBERS.map((n) => <th key={n} className="p-2 display text-lg">{n}</th>)}</tr>
            </thead>
            <tbody>
              {CORE_NUMBERS.map((r) => (
                <tr key={r} className="border-t border-line">
                  <th className="p-2 text-left display text-lg">{r}</th>
                  {CORE_NUMBERS.map((c) => {
                    const p = byKey(pairKey(r, c));
                    const v = p?.percent ?? 0;
                    return <td key={c} className={`p-2 text-center ${v >= 84 ? "text-accent font-semibold" : v < 62 ? "text-muted" : ""}`}>{v}%</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted mt-2">Выделены пары от 84% и выше; серым — сочетания, которым нужно больше договорённостей. Мастер-числа 11, 22 и 33 читайте как 2, 4 и 6.</p>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-2xl mb-3">Самые гармоничные пары</h2>
          <ul className="grid gap-2">
            {sorted.slice(0, 8).map((p) => <li key={p.pair} className="card px-4 py-3 flex justify-between gap-3"><span>{p.pair.replace("-", " и ")} · {p.title}</span><span className="text-accent">{p.percent}%</span></li>)}
          </ul>
        </div>
        <div>
          <h2 className="text-2xl mb-3">Пары, которым нужно больше работы</h2>
          <ul className="grid gap-2">
            {sorted.slice(-8).reverse().map((p) => <li key={p.pair} className="card px-4 py-3 flex justify-between gap-3"><span>{p.pair.replace("-", " и ")} · {p.title}</span><span className="text-muted">{p.percent}%</span></li>)}
          </ul>
        </div>
      </section>

      <section className="prose mt-12">
        <h2>Как считается совместимость по дате рождения</h2>
        <p>Для каждого партнёра складываются все цифры даты рождения, пока не получится одна цифра: 14.03.1987 → 1 + 4 + 0 + 3 + 1 + 9 + 8 + 7 = 33, 3 + 3 = 6. Затем два числа сопоставляются по таблице из 45 сочетаний: от «двух лидеров» (1 и 1) до «общего горизонта» (9 и 9). Каждое сочетание описано с трёх сторон — общий характер пары, любовь и работа — и заканчивается советом.</p>
        <p>Процент — не математика отношений, а условная мера похожести ценностей и темпа. Пары с низким процентом нередко дополняют друг друга лучше, чем похожие, если умеют договариваться. Подробнее о логике сочетаний в статье <Link href="/numerologiya/numerologicheskaya-sovmestimost">о нумерологической совместимости</Link>, а значение каждого числа на страницах <Link href="/chislo-sudby">числа судьбы</Link>. Для астрологического взгляда на пару есть <Link href="/sovmestimost">совместимость знаков зодиака</Link>.</p>
      </section>

      <Faq items={FAQ} />
      <NumerologyNav current={PATH} />
    </div>
  );
}
