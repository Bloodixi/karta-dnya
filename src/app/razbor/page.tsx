import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { DateField, FormError, TextField } from "@/components/NumerologyFields";
import RazborPreview from "@/components/RazborPreview";
import RazborView from "@/components/RazborView";
import RazborWhoWrote, { RazborPriceAside } from "@/components/RazborWhoWrote";
import ScrollToResult from "@/components/ScrollToResult";
import { RazborCheckoutForm, RazborGiftFields, RazborGoal, RazborStickyCta } from "@/components/RazborClient";
import { cleanName, parseDate, personalMonth, personalYear } from "@/lib/numerology";
import { ageAt, buildTeaser, nowMsk, RAZBOR, RAZBOR_TOC } from "@/lib/razbor";
import { compatReady } from "@/lib/razborCompat";
import { packAddon, PRODUCTS } from "@/lib/razborProducts";
import { GIFT_DAYS_MAX, todayMsk } from "@/lib/razborGift";
import { countWords, plural } from "@/lib/ruCount";
import { pageTitle, SELLER, SITE } from "@/lib/site";
import { paidCount, publicReviews } from "@/lib/razborReview";

const PATH = "/razbor";
const DESCRIPTION =
  "Нумерологический разбор по дате рождения: число судьбы, квадрат Пифагора, личный год и прогноз на 12 месяцев. Бесплатная часть сразу, полный текст — по ссылке.";

export const metadata: Metadata = {
  title: pageTitle(RAZBOR.title),
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: RAZBOR.title, description: DESCRIPTION, url: PATH },
};

const SECTIONS = countWords(RAZBOR_TOC.length, ["раздел", "раздела", "разделов"]);

const FAQ = [
  { q: "Что входит в полный разбор?", a: `${SECTIONS[0].toUpperCase()}${SECTIONS.slice(1)}: твои числа с расчётом, сведение — как числа работают вместе, твой период жизни по возрасту, суть числа судьбы, сильные стороны и ловушки, призвание, талант дня рождения, квадрат Пифагора с расшифровкой девяти ячеек, любовь, работа, личный год, прогноз на двенадцать месяцев, следующий год, пять советов и памятка на год.` },
  { q: "Можно ли добавить совместимость с близким?", a: `Да. В форме оплаты отметь «+ совместимость с близким» и укажи дату рождения и имя второго человека. Пакет «разбор + совместимость» стоит ${PRODUCTS.pack.price} ₽ вместо ${PRODUCTS.razbor.price + PRODUCTS.compat.price} ₽ по отдельности; после оплаты придут две ссылки.` },
  { q: "Есть ли разбор для ребёнка?", a: "Да, для детей до 18 лет есть отдельный детский разбор: его читает родитель — о характере ребёнка, сильных сторонах, о том, как поддержать и на что не давить." },
  { q: "Можно ли подарить разбор?", a: "Да. В форме оплаты выбери «В подарок» и укажи дату рождения и имя получателя, подпись и, если хочешь, пожелание. Ссылка на разбор и чек придут тебе, а по желанию мы отправим получателю письмо с подарком — сразу после оплаты или в выбранный день в пределах года. Если письмо отложено, прогноз по месяцам начнётся с месяца отправки." },
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
const months = (n: number) => `${n} ${plural(n, ["месяц", "месяца", "месяцев"])}`;

const MONTH_NAMES = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

/** «январь 2027» для месяца `mo` (1–12) года `yr` со сдвигом на `add` месяцев. */
function monthLabel(yr: number, mo: number, add: number): string {
  const k = mo - 1 + add;
  return `${MONTH_NAMES[k % 12]} ${yr + Math.floor(k / 12)}`;
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

/** Личное число месяца `add` месяцев спустя — чтобы под размытием стояли настоящие числа, а не пример. */
function monthNumber(d: number, m: number, yr: number, mo: number, add: number): number {
  const k = mo - 1 + add;
  return personalMonth(personalYear(d, m, yr + Math.floor(k / 12)).number, (k % 12) + 1);
}

/** `labels` и `numbers` — подписи и личные числа закрытых месяцев по порядку (первые три после открытых). */
function HiddenMonths({ count, labels, numbers }: { count: number; labels: string[]; numbers: number[] }) {
  return (
    <div className="relative mt-2 max-w-3xl overflow-hidden">
      <ol aria-hidden="true" className="select-none pointer-events-none blur-[5px] border-t border-line">
        {BLUR_ROWS.map((r, i) => (
          <li key={i} className="grid grid-cols-[3rem_1fr] gap-x-4 py-4 border-b border-line">
            <span className="display text-3xl text-accent leading-none pt-1">{numbers[i] ?? r.n}</span>
            <div>
              <p className="mono">{labels[i] ?? "Следующий месяц"}</p>
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

/** Счётчик покупок показываем, когда разборов стало заметно много. */
const COUNTER_MIN = 30;

/** Объём, гарантия и пример — сразу под ценой; число составленных разборов — когда их не меньше COUNTER_MIN. */
function TrustList({ count }: { count: number }) {
  return (
    <ul className="mt-4 grid gap-1.5 text-sm">
      {count >= COUNTER_MIN ? <li>Уже {plural(count, ["составлен", "составлено", "составлено"])} {countWords(count, ["разбор", "разбора", "разборов"])}</li> : null}
      <li>{RAZBOR_TOC.length} разделов · около 30 тысяч знаков · прогноз на 12 месяцев</li>
      <li>
        Не открылся разбор — вернём деньги.{" "}
        <Link href="/vozvrat" className="text-accent-text underline">Условия возврата</Link>
      </li>
      <li>
        <Link href={`${PATH}/primer`} className="text-accent-text underline">Посмотреть пример полного разбора</Link>
      </li>
    </ul>
  );
}

/** Отзывы покупателей — только отобранные вручную, с согласия автора (content/data/razbor/reviews.json). Пока пусто — блока нет. */
function Reviews() {
  const list = publicReviews().slice(0, 6);
  if (!list.length) return null;
  return (
    <section className="mt-12 max-w-5xl">
      <h2 className="text-2xl mb-4">Отзывы</h2>
      <ul className="grid gap-4 md:grid-cols-2">
        {list.map((r, i) => (
          <li key={i} className="card p-5">
            <p className="text-accent" aria-label={`Оценка ${r.stars} из 5`}>{"★".repeat(r.stars)}</p>
            <p className="mt-2 whitespace-pre-line">{r.text}</p>
            <p className="text-sm text-muted mt-3">{r.name}{r.product ? ` · ${r.product}` : ""}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Ошибки полей подарка (коды из razborGift.parseGift). */
const GIFT_ERRORS: Record<string, string> = {
  gift_name: "Укажи имя получателя — оно будет в разборе и в письме.",
  gift_from: "Подпиши подарок: от кого он, до 40 знаков и без ссылок.",
  gift_wish: "Пожелание — до 300 знаков и без ссылок.",
  gift_email: "Проверь e-mail получателя или оставь поле пустым — тогда ссылку передашь сам(а).",
  gift_consent: "Подтверди, что получатель не будет против письма, — или оставь e-mail получателя пустым и передай ссылку сам(а).",
  gift_date: "Выбери день отправки не раньше сегодняшнего и не позже чем через год.",
  date2: "Проверь дату рождения близкого для совместимости: нужна настоящая дата, например 03.02.1988.",
  name2: "Укажи имя близкого — оно будет в тексте совместимости.",
  soon: "Совместимость пары скоро появится в продаже — пока можно оформить разбор без неё.",
};

export default async function RazborPage({ searchParams }: PageProps<"/razbor">) {
  const sp = await searchParams;
  const date = parseDate(sp.d);
  const name = cleanName(sp.n);
  const err = one(sp.err);
  const invalid = (sp.d !== undefined && !date) || err === "date";
  const counter = process.env.METRIKA_ID;
  const isGift = one(sp.g) === "1";
  const now = nowMsk();
  const teaser = date ? buildTeaser({ d: date.d, m: date.m, y: date.y, name: name || undefined, ...now }) : null;
  const contactEmail = SELLER.email.includes("@") ? SELLER.email : null;
  // младше 14 лет — подсказка о детском разборе для родителя
  const age = date ? ageAt({ d: date.d, m: date.m, y: date.y, ...now }) : null;
  const childHref = date ? `${PRODUCTS.child.path}?d=${date.iso}${name ? `&n=${encodeURIComponent(name)}` : ""}#teaser` : "";
  const offerPack = compatReady();
  const d2 = parseDate(sp.d2);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: PATH, label: "Разбор по дате рождения" }]} />
      <h1 className="text-3xl md:text-4xl max-w-3xl">{RAZBOR.title}</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">
        Твои числа одним связным текстом: характер, сильные стороны, призвание, квадрат Пифагора, любовь и работа, личный год и прогноз на двенадцать месяцев вперёд.
      </p>
      <p className="chip mt-4">
        Бесплатно — первые разделы · полный разбор {RAZBOR.price} ₽ · {RAZBOR_TOC.length} {plural(RAZBOR_TOC.length, ["раздел", "раздела", "разделов"])}
      </p>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:items-start">
        <div className="min-w-0">
          <div id="forma" className="card p-6 mt-6 max-w-3xl scroll-mt-24">
            <Form action={PATH} className="grid gap-3 sm:flex sm:flex-wrap sm:items-end">
              {isGift ? <input type="hidden" name="g" value="1" /> : null}
              <DateField name="d" label={isGift ? "Дата рождения получателя" : "Дата рождения"} defaultValue={date?.iso ?? (typeof sp.d === "string" ? sp.d : "")} />
              <TextField name="n" label={isGift ? "Имя получателя (необязательно)" : "Имя (необязательно)"} defaultValue={name} placeholder="Например, Анна" />
              <button type="submit" className="btn justify-center">Посмотреть бесплатно</button>
            </Form>
            <FormError text={invalid ? "Проверь дату: нужна настоящая дата рождения, например 17.05.1990." : undefined} />
            <p className="text-xs text-muted mt-3">Бесплатная часть откроется сразу, без регистрации.</p>
          </div>

          {teaser && date && (
            <section id="razbor-teaser" className="mt-10 scroll-mt-24">
              <ScrollToResult key={`${date.iso}|${name}`} id="razbor-teaser" when={!err} />
              <RazborGoal counter={counter} goal="razbor_teaser" />
              <div className="ornament mb-2">
                <h2 className="text-2xl">
                  Бесплатная часть{teaser.who ? ` · ${teaser.who}` : ""} · {teaser.date}
                </h2>
              </div>
              <p className="max-w-3xl text-sm text-muted mb-4">
                Ниже — бесплатная часть. Полный разбор из {RAZBOR_TOC.length} разделов стоит {RAZBOR.price} ₽:{" "}
                <a href="#oplata" className="text-accent-text underline">перейти к оплате</a>
              </p>
              {age !== null && age >= 0 && age < 14 ? (
                <p className="max-w-3xl card p-4 mb-4 text-sm">
                  Это дата рождения ребёнка? Для ребёнка есть{" "}
                  <Link href={childHref} className="text-accent-text underline">детский разбор для родителя</Link>{" "}
                  — о характере, сильных сторонах и о том, как поддержать.
                </p>
              ) : null}
              <RazborView sections={teaser.sections} toc={false} />
              {hiddenMonths(teaser) > 0 && (
                <HiddenMonths
                  count={hiddenMonths(teaser)}
                  labels={BLUR_ROWS.map((_, i) => monthLabel(now.yr, now.mo, 12 - hiddenMonths(teaser) + i))}
                  numbers={date ? BLUR_ROWS.map((_, i) => monthNumber(date.d, date.m, now.yr, now.mo, 12 - hiddenMonths(teaser) + i)) : []}
                />
              )}

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

          <section id="oplata" className="mt-6 max-w-3xl scroll-mt-24">
            <div className="card p-6 frame-gold">
              <div className="flex flex-col gap-6 md:grid md:grid-cols-[minmax(0,1fr)_17rem] md:items-start">
                <div className="min-w-0">
                  <p className="mono">Полный разбор</p>
                  <p className="display text-4xl mt-2">{RAZBOR.price} ₽</p>
                  <p className="text-sm text-muted mt-2">Страница с разбором по ссылке сразу после оплаты, копия ссылки и чек — на e-mail. Разбор можно сохранить в PDF. Можно оформить в подарок: с подписью, пожеланием и письмом получателю в выбранный день.</p>
                  <TrustList count={await paidCount().catch(() => 0)} />
                </div>
                <RazborPreview kind="razbor" href={`${PATH}/primer`} className="max-md:order-first" />
              </div>

              {err === "email" && (
                <p role="alert" className="text-sm mt-4 border-l-2 border-accent pl-3">Укажи e-mail — на него придут ссылка на разбор и чек об оплате.</p>
              )}

              {err && GIFT_ERRORS[err] && (
                <p role="alert" className="text-sm mt-4 border-l-2 border-accent pl-3">{GIFT_ERRORS[err]}</p>
              )}

              {err === "pay" && (
                <p role="alert" className="text-sm mt-4 border-l-2 border-accent pl-3">
                  Оплата временно недоступна. Попробуй чуть позже
                  {contactEmail ? (
                    <>
                      {" "}или напиши нам: <a className="text-accent-text underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>.
                    </>
                  ) : (
                    " или напиши нам — мы поможем."
                  )}
                </p>
              )}

              {date ? (
                <RazborCheckoutForm counter={counter}>
                  <input type="hidden" name="date" value={date.iso} />
                  <RazborGiftFields
                    counter={counter}
                    date={date.iso}
                    name={name}
                    today={todayMsk()}
                    maxDate={todayMsk(GIFT_DAYS_MAX)}
                    gift={isGift}
                    err={err}
                    price={RAZBOR.price}
                    pack={offerPack ? { addon: packAddon(), total: PRODUCTS.pack.price, full: PRODUCTS.compat.price, on: one(sp.p) === "1", date2: d2?.iso, name2: cleanName(sp.n2), today: todayMsk() } : undefined}
                  />
                  <p className="text-xs text-muted mt-3 max-w-md">
                    Нажимая кнопку, ты принимаешь условия <Link href="/oferta" className="underline">оферты</Link>. Оплата через ЮKassa. Разбор носит развлекательный и ознакомительный характер.
                  </p>
                </RazborCheckoutForm>
              ) : (
                <p className="mt-4">
                  <a href="#forma" className="btn">Ввести дату рождения</a>
                </p>
              )}
              <RazborWhoWrote className="lg:hidden" />
            </div>
          </section>

          <Reviews />

          <section className="mt-12 grid gap-8 lg:grid-cols-2 max-w-5xl">
            <div>
              <h2 className="text-2xl mb-3">Что внутри</h2>
              <ol className="grid gap-1.5 list-decimal pl-7 marker:text-muted">
                {RAZBOR_TOC.map((t) => (
                  <li key={t.id}>{t.title}</li>
                ))}
              </ol>
              <p className="mt-4">
                <Link href={`${PATH}/primer`} className="text-accent-text underline">Посмотреть пример полного разбора</Link>
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
                  Отдельная страница по личной ссылке: открывается на телефоне и компьютере, а кнопкой «Сохранить в PDF» её можно сохранить файлом или распечатать. Прогноз по месяцам начинается с месяца покупки, а в подарке с отложенным письмом — с месяца, когда разбор откроют.
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
        </div>

        <RazborPriceAside
          title="Полный разбор"
          price={RAZBOR.price}
          points={[
            `${RAZBOR_TOC.length} ${plural(RAZBOR_TOC.length, ["раздел", "раздела", "разделов"])} · около 30 тысяч знаков · прогноз на 12 месяцев`,
            "Бесплатная часть откроется сразу, без регистрации.",
            <Link key="primer" href={`${PATH}/primer`} className="text-accent-text underline">Посмотреть пример полного разбора</Link>,
          ]}
          href={date ? "#oplata" : "#forma"}
          cta={date ? "Открыть полный разбор" : "Ввести дату рождения"}
        />
      </div>

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
