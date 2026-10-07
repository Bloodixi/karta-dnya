import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import NumerologyNav from "@/components/NumerologyNav";
import { DateField, FormError, NumberField, ShareLink } from "@/components/NumerologyFields";
import { getPersonalYears } from "@/lib/content";
import { currentYearMsk, formatDate, parseDate, personalMonth, personalYear } from "@/lib/numerology";

const PATH = "/numerologiya/lichnyy-god";

export const metadata: Metadata = {
  title: "Личный год в нумерологии: рассчитать онлайн и значение",
  description: "Калькулятор личного года по дате рождения: какой год девятилетнего цикла идёт у вас сейчас, значение всех девяти лет, личные месяцы и советы, как прожить этот этап спокойно.",
  alternates: { canonical: PATH },
};

const MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const MONTH_HINTS: Record<number, string> = {
  1: "начинать, проявлять инициативу",
  2: "ждать, договариваться, замечать детали",
  3: "общаться, творить, радоваться",
  4: "работать, наводить порядок",
  5: "менять, путешествовать, пробовать",
  6: "заботиться о доме и близких",
  7: "думать, учиться, отдыхать в тишине",
  8: "решать деловые и денежные вопросы",
  9: "завершать, отпускать, подводить итоги",
};

const FAQ = [
  { q: "Когда начинается личный год: 1 января или в день рождения?", a: "Есть обе традиции. Мы считаем от 1 января, как большинство русскоязычных источников. Если ваш день рождения ближе к концу года, можно читать новый год постепенно: с января темы начинают проступать, а после дня рождения звучат в полную силу." },
  { q: "Почему личный год не бывает 11 или 22?", a: "В расчёте личного года мастер-числа принято сводить до одной цифры: цикл состоит из девяти лет, и каждый год описывает одну из девяти тем. Если промежуточная сумма даёт 11 или 22, читайте 2 или 4 с поправкой на усиленную чувствительность." },
  { q: "Что такое личный месяц?", a: "Личный год плюс номер месяца, свёрнутые до одной цифры. Он показывает, какая тема года звучит в конкретном месяце. Таблица месяцев появляется после расчёта." },
  { q: "Можно ли посчитать прошлый или будущий год?", a: "Да. Введите любой год в поле «Год», и калькулятор покажет его номер в цикле. Удобно проверить, как читались уже прожитые годы, и понять логику цикла." },
];

export default async function PersonalYearPage({ searchParams }: PageProps<typeof PATH>) {
  const sp = await searchParams;
  const date = parseDate(sp.d);
  const now = currentYearMsk();
  const yRaw = Number(Array.isArray(sp.y) ? sp.y[0] : sp.y);
  const year = Number.isInteger(yRaw) && yRaw >= 1900 && yRaw <= now + 20 ? yRaw : now;
  const invalid = sp.d !== undefined && !date;
  const years = getPersonalYears();

  let result: React.ReactNode = null;
  if (date) {
    const py = personalYear(date.d, date.m, year);
    const t = years.find((y) => y.number === py.number);
    result = (
      <section className="mt-8" id="rezultat">
        <div className="ornament mb-4"><h2 className="text-2xl">{year} год для {formatDate(date)}</h2><span className="mono">личный год {py.number}</span></div>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="card p-6">
            <p className="display text-5xl">{py.number} {t && <span className="text-xl text-muted">· {t.title}</span>}</p>
            <p className="text-xs text-muted mt-1">{py.steps.join(" → ")}</p>
            {t && (
              <div className="prose mt-4">
                <p><strong>{t.theme}.</strong></p>
                {t.text.map((p, i) => <p key={i}>{p}</p>)}
                <h3>На чём сосредоточиться</h3>
                <ul>{t.focus.map((f) => <li key={f}>{f}</li>)}</ul>
                <p><strong>Совет:</strong> {t.advice}</p>
              </div>
            )}
          </div>
          <div className="card p-5 content-start">
            <p className="mono mb-3">Личные месяцы {year}</p>
            <ul className="grid gap-1 text-sm">
              {MONTHS.map((m, i) => {
                const pm = personalMonth(py.number, i + 1);
                return <li key={m} className="flex gap-2"><span className="display text-lg w-6 text-accent">{pm}</span><span><span className="capitalize">{m}</span>: {MONTH_HINTS[pm]}</span></li>;
              })}
            </ul>
          </div>
        </div>
        <p className="mt-4 flex flex-wrap gap-2">
          <Link href={`${PATH}?d=${date.iso}&y=${year + 1}`} className="btn btn-ghost">Следующий год</Link>
          <Link href={`${PATH}?d=${date.iso}&y=${year - 1}`} className="btn btn-ghost">Прошлый год</Link>
          <Link href={`/numerologiya/po-date-rozhdeniya?d=${date.iso}`} className="btn btn-ghost">Полный расчёт по дате</Link>
        </p>
        <ShareLink path={`https://karta-dnya.ru${PATH}?d=${date.iso}&y=${year}`} />
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: PATH, label: "Личный год" }]} />
      <h1 className="text-3xl md:text-4xl">Личный год по дате рождения</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">Жизнь в нумерологии делится на циклы по девять лет, и у каждого года своя тема: начало, рост, перемены, итоги. Введите дату рождения и узнайте, какой год идёт у вас в {now}-м.</p>

      <div className="card p-6 mt-6 max-w-3xl">
        <Form action={PATH} className="flex flex-wrap gap-3 items-end">
          <DateField name="d" label="Дата рождения" defaultValue={date?.iso ?? (typeof sp.d === "string" ? sp.d : "")} />
          <NumberField name="y" label="Год" defaultValue={year} min={1900} max={now + 20} />
          <button type="submit" className="btn">Рассчитать</button>
        </Form>
        <FormError text={invalid ? "Введите настоящую дату рождения." : undefined} />
      </div>

      {result}

      <section className="mt-12">
        <div className="ornament mb-4"><h2 className="text-2xl">Девять личных лет</h2><span className="mono">значение каждого</span></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {years.map((y) => (
            <div key={y.number} className="card p-5">
              <p className="display text-3xl">{y.number} <span className="text-lg text-muted">· {y.title}</span></p>
              <p className="text-xs text-accent mt-1">{y.theme}</p>
              <p className="text-sm text-muted mt-2">{y.text[0]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="prose mt-12">
        <h2>Как считается личный год</h2>
        <p>Складываются день рождения, месяц рождения и интересующий год, каждое слагаемое предварительно сворачивается до одной цифры. Например, для рождённого 14 марта в {now} году: 1 + 4 = 5, месяц 3, год {now} → {String(now).split("").join(" + ")} = {String(now).split("").reduce((s, d) => s + Number(d), 0)}. Итоговая сумма сворачивается до числа от 1 до 9.</p>
        <p>Цикл идёт по кругу: после девятого года снова наступает первый. Первый год — время начинать, четвёртый — строить, пятый — менять, седьмой — думать, девятый — завершать. Зная номер года, легче не торопить события в «медленные» годы и не упускать возможности в «быстрые». Личный год хорошо читать вместе с <Link href="/chislo-sudby">числом судьбы</Link>: число описывает характер, год — текущий этап. Для сравнения с астрологическим взглядом на год загляните в <Link href="/goroskop/god">гороскоп на год</Link>.</p>
      </section>

      <Faq items={FAQ} />
      <NumerologyNav current={PATH} />
    </div>
  );
}
