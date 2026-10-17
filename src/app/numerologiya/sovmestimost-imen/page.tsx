import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import NumerologyNav from "@/components/NumerologyNav";
import { FormError, ShareLink, TextField } from "@/components/NumerologyFields";
import ScrollToResult from "@/components/ScrollToResult";
import { getNameNumbers, readJsonData } from "@/lib/content";
import { cleanName, CORE_NUMBERS, isMaster, nameNumbers, pairKey, toCore } from "@/lib/numerology";
import { pageTitle, SITE } from "@/lib/site";

const PATH = "/numerologiya/sovmestimost-imen";

export const metadata: Metadata = {
  title: pageTitle("Совместимость по именам: нумерология онлайн"),
  description: "Совместимость имён по нумерологии: калькулятор переводит буквы в цифры, находит число каждого имени и показывает разбор пары. Все 45 сочетаний чисел 1–9.",
  alternates: { canonical: PATH },
};

type NamePair = { pair: string; percent: number; title: string; text: string };

const FAQ = [
  { q: "Как считается совместимость по именам?", a: "Каждая буква имени получает цифру по таблице (А = 1, Б = 2 и так далее по кругу до 9). Цифры складываются и сворачиваются до одного числа — это число имени. Пара чисел двух имён и даёт сочетание, которое мы описываем." },
  { q: "Какое имя вводить: полное, короткое или ласковое?", a: "То, которым человек пользуется в ваших отношениях. Если вы зовёте друг друга Саша и Лена, считайте эти формы: они описывают, как звучит ваше общение каждый день. Полные имена из документов показывают более «официальный» слой." },
  { q: "Что делать, если у имени мастер-число 11, 22 или 33?", a: "В таблице сочетаний мастер-числа читаются через основу: 11 как 2, 22 как 4, 33 как 6. Мастер-число добавляет паре чувствительности и масштаба — о нём можно прочитать отдельно." },
  { q: "Низкий процент — значит, пара не подходит друг другу?", a: "Нет. Процент показывает, насколько легко двум ритмам совпасть без усилий. Пары с невысоким процентом часто самые интересные: в них больше различий, а значит, больше того, чему можно научиться друг у друга." },
  { q: "Чем совместимость имён отличается от совместимости по дате рождения?", a: "Дата рождения не меняется и описывает глубинный характер. Имя описывает подачу и стиль общения: как вы звучите друг для друга. Для полной картины посмотрите оба расчёта." },
];

export default async function NameCompatPage({ searchParams }: PageProps<typeof PATH>) {
  const sp = await searchParams;
  const na = cleanName(sp.a);
  const nb = cleanName(sp.b);
  const ra = na ? nameNumbers(na) : null;
  const rb = nb ? nameNumbers(nb) : null;
  const invalid = (sp.a !== undefined || sp.b !== undefined) && !(ra && rb);
  const pairs = readJsonData<NamePair[]>("numerology-name-compat.json", []);
  const texts = getNameNumbers();
  const byKey = (k: string) => pairs.find((p) => p.pair === k);
  const title = (n: number) => texts.find((t) => t.number === n)?.title;

  let result: React.ReactNode = null;
  if (ra && rb) {
    const x = ra.expression.number;
    const y = rb.expression.number;
    const pair = byKey(pairKey(x, y));
    result = (
      <section className="mt-8 scroll-mt-24" id="rezultat">
        <div className="ornament mb-4"><h2 className="text-2xl">{ra.clean} и {rb.clean}</h2><span className="mono">числа {toCore(x)} и {toCore(y)}</span></div>
        <div className="grid gap-4 md:grid-cols-3">
          {[ra, rb].map((r, i) => (
            <div key={i} className={`card p-5 ${i === 1 ? "md:order-3" : ""}`}>
              <p className="mono">{i === 0 ? "Первое имя" : "Второе имя"}</p>
              <p className="display text-5xl mt-1">{r.expression.number} <span className="text-xl text-muted">· {title(r.expression.number)}</span></p>
              <p className="text-xs text-muted mt-1 break-words">{r.expression.steps.join(" → ")}</p>
              <p className="text-sm mt-3"><Link href={`/numerologiya/chislo-imeni?n=${encodeURIComponent(r.clean)}`} className="text-accent-text underline">Разбор имени {r.clean}</Link></p>
            </div>
          ))}
          <div className="card p-5 text-center md:order-2">
            <p className="mono">Совместимость имён</p>
            <p className="display text-6xl mt-1 text-accent">{pair?.percent ?? "—"}%</p>
            <p className="text-sm text-muted mt-1">{pair?.title}</p>
          </div>
        </div>
        {pair && (
          <div className="prose mt-6">
            <p>{pair.text}</p>
            {(isMaster(x) || isMaster(y)) && <p className="text-muted">В паре есть мастер-число: оно читается через свою основу и добавляет чуткости. Подробнее — на странице <Link href="/numerologiya/master-chisla">мастер-чисел</Link>.</p>}
          </div>
        )}
        <ShareLink path={`${SITE.url}${PATH}?a=${encodeURIComponent(ra.clean)}&b=${encodeURIComponent(rb.clean)}`} />
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: PATH, label: "Совместимость имён" }]} />
      <h1 className="text-3xl md:text-4xl">Совместимость по именам</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">Введите два имени. Калькулятор переведёт буквы в цифры, найдёт число каждого имени и расскажет, как эти имена звучат вместе: в чём пара сильна и о чём стоит договориться.</p>

      <div className="card p-6 mt-6 max-w-3xl">
        <Form action={PATH} className="flex flex-wrap gap-3 items-end">
          <TextField name="a" label="Ваше имя" defaultValue={na} placeholder="Например, Анна" required />
          <TextField name="b" label="Имя партнёра" defaultValue={nb} placeholder="Например, Илья" required />
          <button type="submit" className="btn min-h-11">Рассчитать</button>
        </Form>
        <FormError text={invalid ? "Введите оба имени буквами русского или латинского алфавита." : undefined} />
      </div>

      {result}
      <ScrollToResult key={`${na}-${nb}`} id="rezultat" when={!!(ra && rb)} />

      <section className="prose mt-12">
        <h2>Как работает совместимость имён</h2>
        <p>В нумерологии каждой букве соответствует цифра: А, И, С, Ъ — единица, Б, Й, Т, Ы — двойка и так далее по кругу. Сумма цифр имени, свёрнутая до одного знака, — это число имени, или число выражения. Оно описывает, как человек проявляется и каким его слышат другие. Когда встречаются два имени, встречаются и два стиля общения.</p>
        <p>Совместимость имён не заменяет <Link href="/numerologiya/sovmestimost">совместимость по дате рождения</Link>: дата говорит о характере и пути, имя — о том, как вы звучите друг для друга каждый день. Если числа совпадают, разговор идёт легко; если различаются, пара учится переводить с одного языка на другой. Таблица букв и значения всех чисел — на странице <Link href="/numerologiya/chislo-imeni">число имени</Link>.</p>
      </section>

      <section className="mt-10">
        <div className="ornament mb-4"><h2 className="text-2xl">Все 45 сочетаний чисел имени</h2><span className="mono">от 1 и 1 до 9 и 9</span></div>
        {CORE_NUMBERS.map((n) => {
          const list = pairs.filter((p) => Number(p.pair.split("-")[0]) === n);
          return (
            <details key={n} className="card mb-2 group" open={n === 1}>
              <summary className="cursor-pointer list-none flex justify-between gap-3 px-4 py-3 min-h-11">
                <span className="display text-lg">Имя с числом {n} <span className="text-muted text-base">· {title(n)}</span></span>
                <span className="text-muted group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="grid gap-3 px-4 pb-4 md:grid-cols-2">
                {list.map((p) => (
                  <div key={p.pair} className="border-t border-line pt-3">
                    <p className="font-semibold">{p.pair.replace("-", " и ")} · {p.title} <span className="text-accent-text">{p.percent}%</span></p>
                    <p className="text-sm text-muted mt-1">{p.text}</p>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
        <p className="text-sm text-muted mt-2">Пары перечислены один раз: сочетание 3 и 7 ищите в разделе тройки. Мастер-числа 11, 22 и 33 читайте как 2, 4 и 6.</p>
      </section>

      <Faq items={FAQ} />
      <NumerologyNav current={PATH} />
    </div>
  );
}
