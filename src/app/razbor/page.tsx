import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { DateField, FormError, TextField } from "@/components/NumerologyFields";
import RazborView from "@/components/RazborView";
import { RazborCheckoutForm, RazborGoal } from "@/components/RazborClient";
import { cleanName, parseDate } from "@/lib/numerology";
import { buildTeaser, nowMsk, RAZBOR, RAZBOR_TOC } from "@/lib/razbor";
import { pageTitle, SELLER, SITE } from "@/lib/site";

const PATH = "/razbor";
const DESCRIPTION =
  "Нумерологический разбор по дате рождения: число судьбы, квадрат Пифагора, личный год и прогноз на 12 месяцев. Бесплатная часть сразу, полный текст — по ссылке.";

export const metadata: Metadata = {
  title: pageTitle(RAZBOR.title),
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: RAZBOR.title, description: DESCRIPTION, url: PATH },
};

const FAQ = [
  { q: "Что входит в полный разбор?", a: `Тринадцать разделов: твои числа, суть числа судьбы, сильные стороны и ловушки, призвание, талант дня рождения, квадрат Пифагора с расшифровкой девяти ячеек, любовь, работа, личный год, прогноз на двенадцать месяцев, следующий год и пять советов.` },
  { q: "Как я получу разбор?", a: "Сразу после оплаты откроется страница с разбором. Ссылка на неё твоя: её можно сохранить в закладки, открыть с телефона или сохранить разбор в PDF кнопкой на странице." },
  { q: "Можно ли вернуть деньги?", a: "Если из-за технической ошибки разбор не открылся, мы вернём оплату полностью. Напиши нам, приложив номер заказа, — ответим в течение трёх рабочих дней. Подробности на странице «Возврат»." },
  { q: "Нужно ли знать точное время рождения?", a: "Нет. Нумерологический разбор строится только по дате рождения: дню, месяцу и году. Время и место рождения не нужны." },
  { q: "Чем разбор отличается от бесплатного калькулятора?", a: "Калькулятор показывает отдельные числа и короткие трактовки. В разборе числа сведены в один связный текст: как они сочетаются, что с ними делать в любви и работе и какой тон у каждого из ближайших двенадцати месяцев." },
];

const FOR_WHOM = [
  "Хочешь увидеть свои числа не по отдельности, а одной картиной.",
  "Стоишь перед выбором и ищешь спокойный повод взглянуть на себя со стороны.",
  "Любишь планировать и хочешь знать тон ближайших месяцев.",
  "Ищешь подарок близкому человеку, который увлекается нумерологией.",
];

function LockIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted">
      <rect x="5" y="11" width="14" height="10" rx="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function RazborPage({ searchParams }: PageProps<"/razbor">) {
  const sp = await searchParams;
  const date = parseDate(sp.d);
  const name = cleanName(sp.n);
  const err = one(sp.err);
  const invalid = (sp.d !== undefined && !date) || err === "date";
  const counter = process.env.METRIKA_ID;
  const teaser = date ? buildTeaser({ d: date.d, m: date.m, y: date.y, name: name || undefined, ...nowMsk() }) : null;
  const contactEmail = SELLER.email.includes("@") ? SELLER.email : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: PATH, label: "Разбор по дате рождения" }]} />
      <h1 className="text-3xl md:text-4xl max-w-3xl">{RAZBOR.title}</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">
        Твои числа одним связным текстом: характер, сильные стороны, призвание, квадрат Пифагора, любовь и работа, личный год и прогноз на двенадцать месяцев вперёд.
      </p>

      <div id="forma" className="card p-6 mt-6 max-w-3xl scroll-mt-24">
        <Form action={PATH} className="flex flex-wrap gap-3 items-end">
          <DateField name="d" label="Дата рождения" defaultValue={date?.iso ?? (typeof sp.d === "string" ? sp.d : "")} />
          <TextField name="n" label="Имя (необязательно)" defaultValue={name} placeholder="Например, Анна" />
          <button type="submit" className="btn">Посмотреть бесплатно</button>
        </Form>
        <FormError text={invalid ? "Проверь дату: нужна настоящая дата рождения, например 17.05.1990." : undefined} />
        <p className="text-xs text-muted mt-3">Бесплатная часть откроется сразу, без регистрации.</p>
      </div>

      {teaser && date && (
        <section id="razbor-teaser" className="mt-10 scroll-mt-24">
          <RazborGoal counter={counter} goal="razbor_teaser" />
          <div className="ornament mb-2">
            <h2 className="text-2xl">
              Бесплатная часть{teaser.who ? ` · ${teaser.who}` : ""} · {teaser.date}
            </h2>
          </div>
          <RazborView sections={teaser.sections} toc={false} />

          <div className="card p-5 mt-8 max-w-3xl razbor-locked">
            <p className="mono mb-3">Ещё {teaser.locked.length} разделов в полном разборе</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {teaser.locked.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <LockIcon /> {t.title}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section id="oplata" className="mt-8 max-w-3xl scroll-mt-24">
        <div className="card p-6 frame-gold">
          <p className="mono">Полный разбор</p>
          <p className="display text-4xl mt-2">{RAZBOR.price} ₽</p>
          <p className="text-sm text-muted mt-2">Страница с разбором по ссылке сразу после оплаты. Её можно сохранить в PDF.</p>

          {err === "pay" && (
            <p role="alert" className="text-sm mt-4 border-l-2 border-accent pl-3">
              Оплата временно недоступна. Попробуй чуть позже
              {contactEmail ? (
                <>
                  {" "}или напиши нам: <a className="text-accent underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>.
                </>
              ) : (
                " или напиши нам — мы поможем."
              )}
            </p>
          )}

          {date ? (
            <RazborCheckoutForm counter={counter}>
              <input type="hidden" name="date" value={date.iso} />
              <input type="hidden" name="name" value={name} />
              <label className="grid gap-1 text-sm mt-5 max-w-sm">
                E-mail для чека (необязательно)
                <input type="email" name="email" autoComplete="email" maxLength={200} placeholder="you@example.ru" className="border border-line rounded-lg px-3 py-2 bg-surface min-w-0" />
              </label>
              <button type="submit" className="btn mt-4">
                Получить полный разбор за {RAZBOR.price} ₽
              </button>
              <p className="text-xs text-muted mt-3 max-w-md">
                Нажимая кнопку, ты принимаешь условия <Link href="/oferta" className="underline">оферты</Link>. Оплата через ЮKassa. Разбор носит развлекательный и ознакомительный характер.
              </p>
            </RazborCheckoutForm>
          ) : (
            <p className="mt-4">
              <a href="#forma" className="btn">Ввести дату рождения</a>
            </p>
          )}
        </div>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-2 max-w-5xl">
        <div>
          <h2 className="text-2xl mb-3">Что внутри</h2>
          <ol className="grid gap-1.5 list-decimal pl-5 marker:text-muted">
            {RAZBOR_TOC.map((t) => (
              <li key={t.id}>{t.title}</li>
            ))}
          </ol>
        </div>
        <div className="grid gap-8 content-start">
          <div>
            <h2 className="text-2xl mb-3">Для кого</h2>
            <ul className="grid gap-1.5 text-muted">
              {FOR_WHOM.map((t) => (
                <li key={t}>— {t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl mb-3">Формат</h2>
            <p className="text-muted">
              Отдельная страница по личной ссылке: открывается на телефоне и компьютере, а кнопкой «Сохранить в PDF» её можно сохранить файлом или распечатать. Прогноз по месяцам начинается с текущего месяца.
            </p>
          </div>
        </div>
      </section>

      <p className="text-xs text-muted mt-8 max-w-2xl">
        Разбор носит развлекательный и ознакомительный характер и не является консультацией специалиста. Решения остаются за тобой.
      </p>

      <section className="prose mt-10">
        <h2>Бесплатные расчёты</h2>
        <p>
          Отдельные числа можно посчитать бесплатно: <Link href="/chislo-sudby">число судьбы</Link>, <Link href="/kvadrat-pifagora">квадрат Пифагора</Link> и <Link href="/numerologiya/lichnyy-god">личный год</Link>. Разбор собирает их вместе и добавляет то, чего нет в калькуляторах: как числа сочетаются между собой и что из этого следует на ближайший год.
        </p>
      </section>

      <Faq items={FAQ} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: RAZBOR.title,
          description: DESCRIPTION,
          url: SITE.url + PATH,
          brand: { "@type": "Brand", name: SITE.name },
          offers: {
            "@type": "Offer",
            price: String(RAZBOR.price),
            priceCurrency: "RUB",
            availability: "https://schema.org/InStock",
            url: SITE.url + PATH,
          },
        }}
      />
    </div>
  );
}
