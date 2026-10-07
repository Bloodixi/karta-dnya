import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import NumerologyNav from "@/components/NumerologyNav";
import { DateField, FormError, ShareLink, TextField } from "@/components/NumerologyFields";
import { findNumerology } from "@/lib/content";
import { birthdayNumber, cleanName, destinyByParts, destinyNumber, formatDate, isMaster, MASTER_NUMBERS, nameNumbers, parseDate, toCore } from "@/lib/numerology";

const PATH = "/numerologiya/master-chisla";

export const metadata: Metadata = {
  title: "Мастер-числа 11, 22 и 33: значение и проверка по дате",
  description: "Мастер-числа 11, 22 и 33 в нумерологии: значение каждого, чем они отличаются от 2, 4 и 6, как их считать, и проверка, есть ли мастер-число в вашей дате и имени.",
  alternates: { canonical: PATH },
};

const FAQ = [
  { q: "Почему 44 не считается мастер-числом?", a: "В классической традиции мастер-числами называют только 11, 22 и 33. Сумма цифр даты рождения редко превышает 40, поэтому 44 почти не встречается в расчётах и большинство школ его не выделяет." },
  { q: "Мастер-число — это хорошо или плохо?", a: "Ни то ни другое. Это обычное число с повышенной чувствительностью и потенциалом. Оно просит больше внимания к себе и даёт больше, когда человек готов. В спокойные периоды оно живёт как своя основа: 2, 4 или 6." },
  { q: "Почему на другом сайте у меня 11, а здесь 2?", a: "Существуют два способа сворачивать дату: все цифры подряд или день, месяц и год по отдельности. Наш калькулятор показывает оба, чтобы вы видели, откуда берётся разница." },
  { q: "Можно ли «развить» мастер-число?", a: "Нумерология считает, что потенциал мастер-числа раскрывается с возрастом и опытом. Ничего специально делать не нужно: достаточно знать о своей чувствительности и беречь силы." },
];

export default async function MasterNumbersPage({ searchParams }: PageProps<typeof PATH>) {
  const sp = await searchParams;
  const date = parseDate(sp.d);
  const name = cleanName(sp.n);
  const invalid = sp.d !== undefined && !date;
  const m11 = findNumerology(11);
  const m22 = findNumerology(22);
  const m33 = findNumerology(33);

  let result: React.ReactNode = null;
  if (date) {
    const full = destinyNumber(date.d, date.m, date.y);
    const parts = destinyByParts(date.d, date.m, date.y);
    const bday = birthdayNumber(date.d);
    const nm = name ? nameNumbers(name) : null;
    const checks: { label: string; value: number; steps: string }[] = [
      { label: "Число судьбы (все цифры подряд)", value: full.number, steps: full.steps.join(" → ") },
      { label: "Число судьбы (день + месяц + год по отдельности)", value: parts.number, steps: parts.steps.join(" → ") },
      { label: "Число дня рождения", value: bday.number, steps: bday.raw > 9 ? `${String(bday.raw).split("").join(" + ")} = ${bday.number}` : `день ${bday.raw}` },
    ];
    if (nm) checks.push({ label: `Число имени ${nm.clean}`, value: nm.expression.number, steps: nm.expression.steps.join(" → ") });
    const found = checks.filter((c) => isMaster(c.value));
    result = (
      <section className="mt-8" id="rezultat">
        <div className="ornament mb-4"><h2 className="text-2xl">Проверка для {formatDate(date)}{nm ? `, ${nm.clean}` : ""}</h2><span className="mono">{found.length ? `найдено: ${found.map((f) => f.value).join(", ")}` : "мастер-чисел нет"}</span></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {checks.map((c) => (
            <div key={c.label} className={`card p-4 ${isMaster(c.value) ? "border-accent" : ""}`}>
              <p className="mono">{c.label}</p>
              <p className="display text-4xl mt-1">{c.value} {isMaster(c.value) && <span className="text-base text-accent">мастер-число</span>}</p>
              <p className="text-xs text-muted mt-1 break-words">{c.steps}</p>
            </div>
          ))}
        </div>
        <div className="prose mt-4">
          {found.length ? (
            <p>В вашем портрете есть мастер-число {found.map((f) => f.value).join(" и ")}. Читайте его страницу — {found.map((f, i) => <span key={f.value}>{i > 0 && ", "}<Link href={`/chislo-sudby/${f.value}`}>число {f.value}</Link></span>)} — и страницу его основы: {found.map((f, i) => <span key={f.value}>{i > 0 && ", "}<Link href={`/chislo-sudby/${toCore(f.value)}`}>число {toCore(f.value)}</Link></span>)}.</p>
          ) : (
            <p>Мастер-чисел в дате{nm ? " и имени" : ""} нет, и это совершенно нормально: так у большинства людей. Ваше число судьбы {full.number} описано на странице <Link href={`/chislo-sudby/${full.number}`}>числа {full.number}</Link>, а полный портрет по дате и имени — в <Link href={`/numerologiya/po-date-rozhdeniya?d=${date.iso}${nm ? `&n=${encodeURIComponent(nm.clean)}` : ""}`}>сводном расчёте</Link>.</p>
          )}
          {full.number !== parts.number && <p className="text-muted">Два способа расчёта дали разные числа: {full.number} и {parts.number}. Так бывает, когда промежуточная сумма в одном из способов попадает на 11, 22 или 33. На сайте мы используем первый способ, но знать о втором полезно.</p>}
        </div>
        <ShareLink path={`https://karta-dnya.ru${PATH}?d=${date.iso}${nm ? `&n=${nm.clean}` : ""}`} />
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: PATH, label: "Мастер-числа" }]} />
      <h1 className="text-3xl md:text-4xl">Мастер-числа 11, 22 и 33 в нумерологии</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">Три числа, которые не сворачивают до одной цифры. Что они значат, чем отличаются от своих основ 2, 4 и 6, и есть ли мастер-число у вас — проверьте по дате рождения и имени.</p>

      <div className="card p-6 mt-6 max-w-3xl">
        <p className="mono mb-3">Есть ли у меня мастер-число</p>
        <Form action={PATH} className="flex flex-wrap gap-3 items-end">
          <DateField name="d" label="Дата рождения" defaultValue={date?.iso ?? (typeof sp.d === "string" ? sp.d : "")} />
          <TextField name="n" label="Имя (необязательно)" defaultValue={name} placeholder="Например, Елена" />
          <button type="submit" className="btn">Проверить</button>
        </Form>
        <FormError text={invalid ? "Введите настоящую дату рождения." : undefined} />
      </div>

      {result}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] mt-12">
        <article className="prose">
          <h2>Что такое мастер-числа</h2>
          <p>В нумерологии почти любое число сводят к одной цифре: 28 превращается в 2 + 8 = 10, а затем в 1 + 0 = 1. Исключение — 11, 22 и 33. Их называют мастер-числами и оставляют как есть, потому что две одинаковые цифры рядом традиционно читают как усиление темы. Одиннадцать — усиленная двойка, двадцать два — усиленная четвёрка, тридцать три — усиленная шестёрка.</p>
          <p>Мастер-число не делает человека лучше других. Оно описывает повышенную чувствительность к своей теме: 11 острее чувствует людей, 22 сильнее ощущает масштаб задач, 33 глубже переживает чужие нужды. Это одновременно ресурс и нагрузка: такие люди быстрее устают и больше требуют от себя. В обычные, спокойные периоды мастер-число живёт как своя основа, и это нормально.</p>

          <h2>Число 11 — Вдохновитель</h2>
          {m11 && <><p>{m11.description}</p>{m11.essence?.[1] && <p>{m11.essence[1]}</p>}<p><Link href="/chislo-sudby/11">Подробная страница числа 11</Link> и его основа — <Link href="/chislo-sudby/2">двойка</Link>.</p></>}

          <h2>Число 22 — Мастер-строитель</h2>
          {m22 && <><p>{m22.description}</p>{m22.essence?.[1] && <p>{m22.essence[1]}</p>}<p><Link href="/chislo-sudby/22">Подробная страница числа 22</Link> и его основа — <Link href="/chislo-sudby/4">четвёрка</Link>.</p></>}

          <h2>Число 33 — Наставник</h2>
          {m33 && <><p>{m33.description}</p>{m33.essence?.[1] && <p>{m33.essence[1]}</p>}<p><Link href="/chislo-sudby/33">Подробная страница числа 33</Link> и его основа — <Link href="/chislo-sudby/6">шестёрка</Link>.</p></>}

          <h2>Как считать и почему способы различаются</h2>
          <p>Первый способ: все цифры даты складываются подряд. 29.11.1990 → 2 + 9 + 1 + 1 + 1 + 9 + 9 + 0 = 32 → 3 + 2 = 5. Второй способ: день, месяц и год сворачиваются по отдельности, затем складываются. Те же 29.11.1990 → 29 → 11 (остаётся), 11 (остаётся), 1990 → 19 → 10 → 1; затем 11 + 11 + 1 = 23 → 5. Здесь результат совпал, но так бывает не всегда: если в одном из способов промежуточная сумма попадает на 11, 22 или 33, итог различается. Именно поэтому один сайт может показывать 11, а другой — 2.</p>
          <p>Мы используем первый способ как основной: он проще и чаще встречается в русскоязычной традиции. Калькулятор выше показывает оба, а также число дня рождения (11 и 22 число месяца тоже считаются мастер-числами) и число имени по <Link href="/numerologiya/chislo-imeni">таблице букв</Link>.</p>

          <h2>Как жить с мастер-числом</h2>
          <ul>
            <li>Не требовать от себя постоянного подвига: периоды «обычной» двойки, четвёрки или шестёрки — это не откат, а отдых.</li>
            <li>Беречь нервную систему: сон, прогулки, тишина. Чувствительность — рабочий инструмент, его нужно обслуживать.</li>
            <li>Выбирать людей, рядом с которыми можно не защищаться. Для 11 это особенно важно, для 33 — умение принимать помощь, для 22 — делить ответственность.</li>
            <li>Читать обе страницы: мастер-числа и его основы. Вместе они дают более точный портрет, чем каждая по отдельности.</li>
          </ul>
          <p>Для полного портрета посмотрите <Link href="/numerologiya/po-date-rozhdeniya">нумерологию по дате рождения</Link>: там мастер-числа отмечаются во всех числах сразу.</p>
        </article>
        <aside className="grid gap-4 content-start">
          {MASTER_NUMBERS.map((n) => {
            const info = findNumerology(n);
            return (
              <Link key={n} href={`/chislo-sudby/${n}`} className="card card-hover p-5 block">
                <p className="display text-4xl">{n} <span className="text-base text-muted">· {info?.title}</span></p>
                <p className="text-xs text-muted mt-1">основа — число {toCore(n)}</p>
                <p className="mt-2 flex flex-wrap gap-1">{info?.keywords.map((k) => <span key={k} className="chip">{k}</span>)}</p>
              </Link>
            );
          })}
        </aside>
      </div>

      <Faq items={FAQ} />
      <NumerologyNav current={PATH} />
    </div>
  );
}
