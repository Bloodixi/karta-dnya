import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import NumerologyNav from "@/components/NumerologyNav";
import { DateField, FormError, ShareLink, TextField } from "@/components/NumerologyFields";
import { getBirthdayNumbers, getLuckyNumbers, getNameNumbers, getNumerology, getPersonalYears } from "@/lib/content";
import { birthdayNumber, cleanName, currentYearMsk, destinyNumber, formatDate, isMaster, luckyNumbers, nameNumbers, parseDate, personalYear } from "@/lib/numerology";

const PATH = "/numerologiya/po-date-rozhdeniya";

export const metadata: Metadata = {
  title: "Нумерология по дате рождения: полный расчёт онлайн",
  description: "Нумерология по дате рождения и имени онлайн: число судьбы, число дня рождения, числа имени, души и личности, личный год и счастливые числа с трактовками.",
  alternates: { canonical: PATH },
};

const FAQ = [
  { q: "Чем число судьбы отличается от числа дня рождения?", a: "Число судьбы считается по всей дате и описывает общий вектор жизни. Число дня рождения берётся только из дня месяца и добавляет к портрету одну заметную черту характера." },
  { q: "Какое имя вводить: полное или короткое?", a: "Чаще всего берут имя, данное при рождении, в той форме, которой вы пользуетесь в документах. Можно отдельно посчитать и домашнюю форму имени и сравнить результаты." },
  { q: "Почему результат отличается от другого сайта?", a: "Существуют разные таблицы букв и разные способы сворачивать дату. Мы используем таблицу по порядку русского алфавита и складываем все цифры даты подряд, сохраняя мастер-числа 11, 22 и 33." },
  { q: "Можно ли поделиться результатом?", a: "Да. Дата и имя записываются в адрес страницы, поэтому ссылку можно отправить другу или сохранить, а расчёт откроется заново." },
];

export default async function NumerologyByDatePage({ searchParams }: PageProps<typeof PATH>) {
  const sp = await searchParams;
  const date = parseDate(sp.d);
  const name = cleanName(sp.n);
  const invalid = sp.d !== undefined && !date;
  const numbers = getNumerology();
  const info = (n: number) => numbers.find((x) => x.number === n);

  let result: React.ReactNode = null;
  if (date) {
    const destiny = destinyNumber(date.d, date.m, date.y);
    const bday = birthdayNumber(date.d);
    const bdayText = getBirthdayNumbers().find((b) => b.number === bday.number);
    const year = currentYearMsk();
    const py = personalYear(date.d, date.m, year);
    const pyText = getPersonalYears().find((y) => y.number === py.number);
    const lucky = luckyNumbers(date.d, date.m, date.y);
    const luckyText = getLuckyNumbers().find((l) => l.number === lucky.main);
    const nm = name ? nameNumbers(name) : null;
    const nameTexts = getNameNumbers();
    const dInfo = info(destiny.number);
    const query = `?d=${date.iso}${name ? `&n=${name}` : ""}`;
    result = (
      <section className="mt-8" id="rezultat">
        <div className="ornament mb-4">
          <h2 className="text-2xl">Ваш расчёт на {formatDate(date)}{nm ? `, ${nm.clean}` : ""}</h2>
          <span className="mono">{nm ? "дата и имя" : "по дате"}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-5">
            <p className="mono">Число судьбы</p>
            <p className="display text-5xl mt-1">{destiny.number} {dInfo && <span className="text-xl text-muted">· {dInfo.title}</span>}</p>
            <p className="text-xs text-muted mt-1">{destiny.steps.join(" → ")}</p>
            {dInfo && <p className="text-sm mt-3">{dInfo.description}</p>}
            {isMaster(destiny.number) && <p className="text-sm mt-2 text-accent">У вас мастер-число. <Link href="/numerologiya/master-chisla" className="underline">Что это значит</Link></p>}
            <p className="text-sm mt-3"><Link href={`/chislo-sudby/${destiny.number}`} className="text-accent underline">Подробнее о числе {destiny.number}</Link></p>
          </div>
          <div className="card p-5">
            <p className="mono">Число дня рождения</p>
            <p className="display text-5xl mt-1">{bday.number} {bdayText && <span className="text-xl text-muted">· {bdayText.title}</span>}</p>
            <p className="text-xs text-muted mt-1">{bday.raw > 9 ? `${String(bday.raw).split("").join(" + ")} = ${bday.number}` : `день ${bday.raw}`}</p>
            {bdayText && <p className="text-sm mt-3">{bdayText.text}</p>}
          </div>
          {nm && (
            <>
              <div className="card p-5">
                <p className="mono">Число имени (выражения)</p>
                <p className="display text-5xl mt-1">{nm.expression.number} <span className="text-xl text-muted">· {nameTexts.find((t) => t.number === nm.expression.number)?.title}</span></p>
                <p className="text-xs text-muted mt-1 break-words">{nm.expression.steps.join(" → ")}</p>
                <p className="text-sm mt-3">{nameTexts.find((t) => t.number === nm.expression.number)?.text}</p>
                <p className="mt-3 flex flex-wrap gap-1">{nm.letters.map((l, i) => <span key={i} className={`chip ${l.vowel ? "text-accent" : ""}`}>{l.ch} {l.value}</span>)}</p>
              </div>
              <div className="grid gap-4">
                <div className="card p-5">
                  <p className="mono">Число души (гласные)</p>
                  <p className="display text-4xl mt-1">{nm.soul.number || "—"}</p>
                  <p className="text-sm mt-2">{nm.soul.number ? nameTexts.find((t) => t.number === nm.soul.number)?.soul : "В имени нет гласных букв."}</p>
                </div>
                <div className="card p-5">
                  <p className="mono">Число личности (согласные)</p>
                  <p className="display text-4xl mt-1">{nm.personality.number || "—"}</p>
                  <p className="text-sm mt-2">{nm.personality.number ? nameTexts.find((t) => t.number === nm.personality.number)?.personality : "В имени нет согласных букв."}</p>
                </div>
              </div>
            </>
          )}
          <div className="card p-5">
            <p className="mono">Личный год {year}</p>
            <p className="display text-5xl mt-1">{py.number} {pyText && <span className="text-xl text-muted">· {pyText.title}</span>}</p>
            <p className="text-xs text-muted mt-1">{py.steps.join(" → ")}</p>
            {pyText && <p className="text-sm mt-3">{pyText.theme}. {pyText.advice}</p>}
            <p className="text-sm mt-3"><Link href={`/numerologiya/lichnyy-god?d=${date.iso}`} className="text-accent underline">Подробный разбор года и месяцев</Link></p>
          </div>
          <div className="card p-5">
            <p className="mono">Счастливые числа</p>
            <p className="display text-5xl mt-1">{lucky.main} {luckyText && <span className="text-xl text-muted">· {luckyText.title}</span>}</p>
            <p className="mt-3 flex flex-wrap gap-1">{lucky.series.map((s) => <span key={s} className="chip">{s}</span>)}</p>
            <p className="text-sm mt-3">Удачные дни месяца: {lucky.days.join(", ")}. {luckyText?.hint}</p>
            <p className="text-sm mt-3"><Link href={`/numerologiya/schastlivoe-chislo?d=${date.iso}`} className="text-accent underline">Подробнее о счастливом числе</Link></p>
          </div>
        </div>
        <p className="mt-4 flex flex-wrap gap-2">
          <Link href={`/numerologiya/sovmestimost?a=${date.iso}`} className="btn btn-ghost">Проверить совместимость с партнёром</Link>
          <Link href="/kvadrat-pifagora" className="btn btn-ghost">Квадрат Пифагора</Link>
          <Link href={`/matrica-sudby?d=${date.iso}`} className="btn btn-ghost">Матрица судьбы</Link>
        </p>
        <ShareLink path={`https://karta-dnya.ru${PATH}${query}`} />
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: PATH, label: "По дате рождения" }]} />
      <h1 className="text-3xl md:text-4xl">Нумерология по дате рождения и имени</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">Один расчёт вместо шести: число судьбы, число дня рождения, числа имени, души и личности, личный год и счастливые числа. Введите дату, при желании имя, и получите портрет с понятными трактовками.</p>

      <div className="card p-6 mt-6 max-w-3xl">
        <Form action={PATH} className="flex flex-wrap gap-3 items-end">
          <DateField name="d" label="Дата рождения" defaultValue={date?.iso ?? (typeof sp.d === "string" ? sp.d : "")} />
          <TextField name="n" label="Имя (необязательно)" defaultValue={name} placeholder="Например, Анна" />
          <button type="submit" className="btn">Рассчитать</button>
        </Form>
        <FormError text={invalid ? "Введите настоящую дату рождения в формате ГГГГ-ММ-ДД." : undefined} />
      </div>

      {result}

      <section className="prose mt-12">
        <h2>Что показывает нумерология по дате рождения</h2>
        <p>Дата рождения — единственное, что в нумерологии не меняется никогда. Из неё получают несколько чисел, и каждое описывает свой слой: общий вектор жизни, заметную черту характера, ритм текущего года. Имя добавляет ещё три числа, связанные с тем, как человек проявляется и каким его видят. Ниже коротко о каждом.</p>
        <h3>Число судьбы (жизненного пути)</h3>
        <p>Сумма всех цифр даты, свёрнутая до одной цифры. Если промежуточная сумма равна 11, 22 или 33, число называют мастер-числом и не сворачивают дальше. Это главное число портрета: оно описывает характер, подход к любви и работе. Отдельная страница есть для каждого числа: <Link href="/chislo-sudby">калькулятор и значения</Link>.</p>
        <h3>Число дня рождения</h3>
        <p>День месяца, свёрнутый до одной цифры (11 и 22 сохраняются). Добавляет к портрету один яркий штрих: самостоятельность у рождённых 1, 10, 19 и 28 числа, чуткость у рождённых 2, 20 и 29 и так далее.</p>
        <h3>Числа имени, души и личности</h3>
        <p>Каждой букве соответствует цифра по таблице русского алфавита. Сумма всех букв даёт число имени (выражения), сумма гласных — число души, сумма согласных — число личности. Подробная таблица и значения на странице <Link href="/numerologiya/chislo-imeni">числа имени</Link>.</p>
        <h3>Личный год</h3>
        <p>День и месяц рождения складываются с текущим годом. Получается число от 1 до 9, которое описывает этап девятилетнего цикла: начало, рост, перемены, итоги. Подробнее в <Link href="/numerologiya/lichnyy-god">калькуляторе личного года</Link>.</p>
        <h3>Счастливые числа</h3>
        <p>Число судьбы, сведённое к 1–9, и ряд чисел, которые к нему сводятся (например, 3, 12, 21, 30). Это числа, которые по традиции считают удачными для важных дат и выборов. Подробнее на странице <Link href="/numerologiya/schastlivoe-chislo">счастливого числа</Link>.</p>
        <h2>Как мы считаем</h2>
        <p>Все цифры даты складываются подряд: 14.03.1987 → 1 + 4 + 0 + 3 + 1 + 9 + 8 + 7 = 33, это мастер-число, оно остаётся. Для 25.11.1990 сумма 28 → 2 + 8 = 10 → 1. Некоторые школы складывают день, месяц и год по отдельности, и результат может отличаться, поэтому на странице <Link href="/numerologiya/master-chisla">мастер-чисел</Link> мы показываем оба способа. Для имени используется таблица по порядку алфавита: А, И, С, Ъ = 1; Б, Й, Т, Ы = 2 и так далее. Латинские буквы считаются по пифагорейской таблице.</p>
        <p>Нумерология — это способ поговорить с собой о характере и этапах жизни, а не прогноз и не диагноз. Результаты стоит читать как подсказку, а решения принимать самостоятельно. Для полноты портрета посмотрите также <Link href="/kvadrat-pifagora">квадрат Пифагора</Link> <Link href="/matrica-sudby">матрицу судьбы</Link> с 22 арканами и <Link href="/numerologiya/sovmestimost">совместимость по дате рождения</Link>.</p>
      </section>

      <Faq items={FAQ} />
      <NumerologyNav current={PATH} />
    </div>
  );
}
