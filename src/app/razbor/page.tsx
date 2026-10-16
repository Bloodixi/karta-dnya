import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { DateField, FormError, TextField } from "@/components/NumerologyFields";
import RazborView from "@/components/RazborView";
import { RazborCheckoutForm, RazborGiftFields, RazborGoal, RazborStickyCta } from "@/components/RazborClient";
import { cleanName, parseDate } from "@/lib/numerology";
import { buildTeaser, nowMsk, RAZBOR, RAZBOR_TOC } from "@/lib/razbor";
import { GIFT_DAYS_MAX, todayMsk } from "@/lib/razborGift";
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
  { q: "Что входит в полный разбор?", a: `Шестнадцать разделов: твои числа с расчётом, сведение — как числа работают вместе, твой период жизни по возрасту, суть числа судьбы, сильные стороны и ловушки, призвание, талант дня рождения, квадрат Пифагора с расшифровкой девяти ячеек, любовь, работа, личный год, прогноз на двенадцать месяцев, следующий год, пять советов и памятка на год.` },
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

/** «1 месяц», «3 месяца», «9 месяцев». */
function months(n: number): string {
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return `${n} месяц`;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return `${n} месяца`;
  return `${n} месяцев`;
}

/** Сколько месяцев прогноза закрыто: новое поле тизера `months_hidden`; пока его нет — 9 (бесплатно видно 3 из 12). */
function hiddenMonths(teaser: object): number {
  const v = "months_hidden" in teaser ? teaser.months_hidden : undefined;
  return typeof v === "number" && v >= 0 ? v : 9;
}

/** Размытые строки прогноза вместо закрытых месяцев: видно, что текст есть, но прочитать нельзя. */
const BLUR_ROWS = [
  { n: 4, t: "Месяц для порядка и долгих дел: проще закончить начатое, чем браться за новое, и это хорошее время для планов." },
  { n: 7, t: "Тише и глубже обычного: больше пользы от чтения, отдыха и разговоров с собой, чем от громких решений." },
  { n: 2, t: "Тон договорённостей и мягких шагов: помогают терпение, внимание к близким и готовность подождать ответа." },
];

function HiddenMonths({ count }: { count: number }) {
  return (
    <div className="relative mt-2 max-w-3xl overflow-hidden">
      <ol aria-hidden="true" className="select-none pointer-events-none blur-[5px] border-t border-line">
        {BLUR_ROWS.map((r) => (
          <li key={r.n} className="grid grid-cols-[3rem_1fr] gap-x-4 py-4 border-b border-line">
            <span className="display text-3xl text-accent leading-none pt-1">{r.n}</span>
            <div>
              <p className="mono">Следующий месяц</p>
              <p className="mt-1">{r.t}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="absolute inset-0 grid place-items-center p-4">
        <p className="card px-5 py-3 text-center">
          <span className="display text-xl">Ещё {months(count)} прогноза</span>
          <span className="block text-sm text-muted mt-1">открываются в полном разборе</span>
        </p>
      </div>
    </div>
  );
}

/** Объём, гарантия и пример — сразу под ценой. */
function TrustList() {
  return (
    <ul className="mt-4 grid gap-1.5 text-sm">
      <li>{RAZBOR_TOC.length} разделов · около 30 тысяч знаков · прогноз на 12 месяцев</li>
      <li>
        Не открылся разбор — вернём деньги.{" "}
        <Link href="/vozvrat" className="text-accent underline">Условия возврата</Link>
      </li>
      <li>
        <Link href={`${PATH}/primer`} className="text-accent underline">Посмотреть пример полного разбора</Link>
      </li>
    </ul>
  );
}

/** Кто составлял: отдельного автора-нумеролога в authors.json нет, поэтому — редакция и ссылки на калькуляторы с той же методикой. */
function WhoWrote() {
  return (
    <div className="mt-6 border-t border-line pt-4 text-sm text-muted">
      <p className="mono !text-ink">Кто составлял</p>
      <p className="mt-1">
        Тексты разбора написала редакция «{SITE.name}» по классической пифагорейской нумерологии. Числа считаются по тем же правилам, что в калькуляторах{" "}
        <Link href="/chislo-sudby" className="underline">числа судьбы</Link> и <Link href="/kvadrat-pifagora" className="underline">квадрата Пифагора</Link>, а расчёт каждого числа показан в самом разборе.
      </p>
    </div>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Ошибки полей подарка (коды из razborGift.parseGift). */
const GIFT_ERRORS: Record<string, string> = {
  gift_name: "Укажи имя получателя — оно будет в разборе и в письме.",
  gift_from: "Подпиши подарок: от кого он, до 40 знаков и без ссылок.",
  gift_wish: "Пожелание — до 300 знаков и без ссылок.",
  gift_email: "Проверь e-mail получателя или оставь поле пустым — тогда ссылку передашь сам(а).",
  gift_date: "Выбери день отправки не раньше сегодняшнего и не позже чем через год.",
};

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
        <section id="razbor-teaser" className="mt-10 scroll-mt-24 max-md:pb-16">
          <RazborGoal counter={counter} goal="razbor_teaser" />
          <div className="ornament mb-2">
            <h2 className="text-2xl">
              Бесплатная часть{teaser.who ? ` · ${teaser.who}` : ""} · {teaser.date}
            </h2>
          </div>
          <p className="max-w-3xl text-sm text-muted mb-4">
            Ниже — бесплатная часть. Полный разбор из {RAZBOR_TOC.length} разделов стоит {RAZBOR.price} ₽:{" "}
            <a href="#oplata" className="text-accent underline">перейти к оплате</a>
          </p>
          <RazborView sections={teaser.sections} toc={false} />
          {hiddenMonths(teaser) > 0 && <HiddenMonths count={hiddenMonths(teaser)} />}

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
          <RazborStickyCta price={RAZBOR.price} />
        </section>
      )}

      <section id="oplata" className="mt-8 max-w-3xl scroll-mt-24">
        <div className="card p-6 frame-gold">
          <p className="mono">Полный разбор</p>
          <p className="display text-4xl mt-2">{RAZBOR.price} ₽</p>
          <p className="text-sm text-muted mt-2">Страница с разбором по ссылке сразу после оплаты, копия ссылки и чек — на e-mail. Разбор можно сохранить в PDF. Можно оформить в подарок: с подписью, пожеланием и письмом получателю в выбранный день.</p>
          <TrustList />

          {err === "email" && (
            <p role="alert" className="text-sm mt-4 border-l-2 border-accent pl-3">Укажи e-mail — на него придут ссылка на разбор и чек об оплате.</p>
          )}

          {err && GIFT_ERRORS[err] && (
            <p role="alert" className="text-sm mt-4 border-l-2 border-accent pl-3">{GIFT_ERRORS[err]} Поля подарка нужно заполнить заново.</p>
          )}

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
              <RazborGiftFields counter={counter} name={name} today={todayMsk()} maxDate={todayMsk(GIFT_DAYS_MAX)} gift={one(sp.g) === "1"} err={err} />
              <label className="grid gap-1 text-sm mt-5 max-w-sm">
                E-mail — пришлём сюда ссылку на разбор и чек
                <input type="email" name="email" required autoComplete="email" maxLength={200} placeholder="you@example.ru" aria-invalid={err === "email" || undefined} className="border border-line rounded-lg px-3 py-2 bg-surface min-w-0" />
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="submit" name="method" value="sbp" className="btn">
                  Оплатить {RAZBOR.price} ₽ по СБП
                </button>
                <button type="submit" name="method" value="" className="btn btn-ghost">
                  Картой или другим способом
                </button>
              </div>
              <p className="text-xs text-muted mt-2">СБП — оплата по QR-коду или в приложении банка, без ввода карты.</p>
              <p className="text-xs text-muted mt-3 max-w-md">
                Нажимая кнопку, ты принимаешь условия <Link href="/oferta" className="underline">оферты</Link>. Оплата через ЮKassa. Разбор носит развлекательный и ознакомительный характер.
              </p>
            </RazborCheckoutForm>
          ) : (
            <p className="mt-4">
              <a href="#forma" className="btn">Ввести дату рождения</a>
            </p>
          )}
          <WhoWrote />
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
          <p className="mt-4">
            <Link href={`${PATH}/primer`} className="text-accent underline">Посмотреть пример полного разбора</Link>
          </p>
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

      <section id="dostup" className="mt-10 max-w-3xl scroll-mt-24">
        <div className="card p-6">
          <h2 className="text-xl">Потеряли ссылку на разбор?</h2>
          {one(sp.dostup) ? (
            <p role="status" className="mt-3">Если на этот адрес были оплаченные разборы, мы отправили ссылки на них. Проверь почту, в том числе папку «Спам».</p>
          ) : (
            <form method="post" action="/api/razbor/dostup" className="mt-3 flex flex-wrap items-end gap-2">
              <label className="grid gap-1 text-sm min-w-0 flex-1 max-w-sm">
                E-mail, указанный при оплате
                <input type="email" name="email" required autoComplete="email" maxLength={200} placeholder="you@example.ru" className="border border-line rounded-lg px-3 py-2 bg-surface min-w-0" />
              </label>
              <button type="submit" className="btn btn-ghost">Прислать ссылки</button>
            </form>
          )}
        </div>
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
