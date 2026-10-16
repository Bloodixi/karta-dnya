import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { DateField, FormError, TextField } from "@/components/NumerologyFields";
import RazborLocked, { PayError } from "@/components/RazborLocked";
import RazborView from "@/components/RazborView";
import RazborWhoWrote, { RazborPriceAside } from "@/components/RazborWhoWrote";
import ScrollToResult from "@/components/ScrollToResult";
import { PayButtons, RazborCheckoutForm, RazborGoal, RazborStickyCta } from "@/components/RazborClient";
import { cleanName, parseDate } from "@/lib/numerology";
import { nowMsk } from "@/lib/razbor";
import { buildCompatTeaser, COMPAT, COMPAT_TOC, compatReady } from "@/lib/razborCompat";
import { PRODUCTS } from "@/lib/razborProducts";
import { plural } from "@/lib/ruCount";
import { pageTitle, SELLER, SITE } from "@/lib/site";

const PATH = "/sovmestimost-razbor";
const DESCRIPTION = `Совместимость пары по датам рождения: числа судьбы, образ пары, любовь, быт, споры, общий год и три совета. Бесплатная часть сразу, полный текст — ${COMPAT.price} ₽.`;

export const metadata: Metadata = {
  title: pageTitle(COMPAT.title),
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: COMPAT.title, description: DESCRIPTION, url: PATH },
};

const FAQ = [
  { q: "Что входит в совместимость пары?", a: `${COMPAT_TOC.length} разделов: ваши числа с расчётом, образ пары, любовь и близость, быт и общие дела, где вы спорите и как договариваться, сила пары, ваш общий год по личным годам обоих и три совета.` },
  { q: "Для каких пар подходит?", a: "Для любых: партнёры и супруги, друзья, родитель и взрослый ребёнок, коллеги. Текст написан о паре в целом и не предполагает ни пола, ни возраста, ни брака." },
  { q: "Что нужно знать о втором человеке?", a: "Только дату рождения и имя. Время и место рождения не нужны: совместимость считается по числам судьбы и личным годам." },
  { q: "Бывают ли несовместимые пары?", a: "Нет. У каждой пары есть сильные стороны и зоны, где нужно договариваться. Совместимость подсказывает, на что опираться и как обходить острые углы, а не выносит приговор." },
  { q: "Как я получу совместимость?", a: "Сразу после оплаты откроется страница с текстом, ссылка и чек придут на e-mail. Страницу можно сохранить в PDF кнопкой на странице." },
  { q: "Можно ли вернуть деньги?", a: "Если из-за технической ошибки совместимость не открылась, мы вернём оплату полностью. Подробности на странице «Возврат»." },
];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const ERRORS: Record<string, string> = {
  date: "Проверь обе даты рождения: нужны настоящие даты, например 17.05.1990.",
  name: "Укажи оба имени — они будут в тексте совместимости.",
  email: "Укажи e-mail — на него придут ссылка и чек об оплате.",
  soon: "Совместимость пары скоро появится в продаже. Бесплатная часть уже работает.",
};

export default async function CompatRazborPage({ searchParams }: PageProps<"/sovmestimost-razbor">) {
  const sp = await searchParams;
  const a = parseDate(sp.a);
  const b = parseDate(sp.b);
  const na = cleanName(sp.na);
  const nb = cleanName(sp.nb);
  const err = one(sp.err);
  const invalid = ((sp.a !== undefined || sp.b !== undefined) && !(a && b) && !(a && sp.b === undefined)) || err === "date";
  const counter = process.env.METRIKA_ID;
  const now = nowMsk();
  const teaser = a && b ? buildCompatTeaser({ a: { d: a.d, m: a.m, y: a.y, name: na || undefined }, b: { d: b.d, m: b.m, y: b.y, name: nb || undefined }, ...now }) : null;
  const ready = compatReady();
  const price = PRODUCTS.compat.price;
  const contactEmail = SELLER.email.includes("@") ? SELLER.email : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: PATH, label: "Совместимость пары" }]} />
      <h1 className="text-3xl md:text-4xl max-w-3xl">{COMPAT.title}</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">
        Две даты рождения — один связный текст о вашей паре: в чём вы похожи и чем дополняете друг друга, как договариваться и какой у вас общий год.
      </p>
      <p className="chip mt-4">
        Бесплатно — первые разделы · полная совместимость {price} ₽ · {COMPAT_TOC.length} {plural(COMPAT_TOC.length, ["раздел", "раздела", "разделов"])}
      </p>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:items-start">
        <div className="min-w-0">
          <div id="forma" className="card p-6 mt-6 max-w-3xl scroll-mt-24">
            <Form action={PATH} className="grid gap-3 sm:grid-cols-2 items-end">
              <DateField name="a" label="Первая дата рождения" defaultValue={a?.iso ?? (typeof sp.a === "string" ? sp.a : "")} />
              <TextField name="na" label="Имя" defaultValue={na} placeholder="Например, Анна" />
              <DateField name="b" label="Вторая дата рождения" defaultValue={b?.iso ?? (typeof sp.b === "string" ? sp.b : "")} />
              <TextField name="nb" label="Имя" defaultValue={nb} placeholder="Например, Сергей" />
              <button type="submit" className="btn justify-center sm:col-span-2 sm:justify-self-start">Посмотреть бесплатно</button>
            </Form>
            <FormError text={invalid ? "Проверь обе даты: нужны настоящие даты рождения, например 17.05.1990." : undefined} />
            <p className="text-xs text-muted mt-3">Бесплатная часть откроется сразу, без регистрации. Пара — любая: партнёры, друзья, родные, коллеги.</p>
          </div>

          {teaser && (
            <section id="teaser" className="mt-10 scroll-mt-24">
              <ScrollToResult key={`${a!.iso}|${b!.iso}|${na}|${nb}`} id="teaser" when={!err} />
              <RazborGoal counter={counter} goal="compat_teaser" />
              <div className="ornament mb-2">
                <h2 className="text-2xl">
                  Бесплатная часть · {teaser.who}
                </h2>
              </div>
              <p className="max-w-3xl text-sm text-muted mb-4">
                Ниже — бесплатная часть. Полная совместимость из {COMPAT_TOC.length} разделов стоит {price} ₽:{" "}
                <a href="#oplata" className="text-accent-text underline">перейти к оплате</a>
              </p>
              <RazborView sections={teaser.sections} toc={false} />
              <RazborLocked items={teaser.locked} label={`Ещё ${teaser.locked.length} разделов в полной совместимости`} />
              {ready ? <RazborStickyCta price={price} from="teaser" label="Открыть совместимость" /> : null}
            </section>
          )}

          <section id="oplata" className="mt-6 max-w-3xl scroll-mt-24">
            <div className="card p-6 frame-gold">
              <p className="mono">Полная совместимость</p>
              <p className="display text-4xl mt-2">{price} ₽</p>
              <p className="text-sm text-muted mt-2">Страница с текстом по ссылке сразу после оплаты, копия ссылки и чек — на e-mail. Можно сохранить в PDF.</p>
              <ul className="mt-4 grid gap-1.5 text-sm">
                <li>{COMPAT_TOC.length} разделов · образ пары, любовь, быт, споры, общий год и три совета</li>
                <li>
                  Не открылась страница — вернём деньги. <Link href="/vozvrat" className="text-accent-text underline">Условия возврата</Link>
                </li>
                <li>
                  Нужен и личный разбор? На странице <Link href="/razbor" className="text-accent-text underline">разбора по дате рождения</Link> — пакет «разбор + совместимость» за {PRODUCTS.pack.price} ₽.
                </li>
              </ul>

              <PayError text={err && err !== "date" ? ERRORS[err] : undefined} />
              {err === "pay" && (
                <PayError text={`Оплата временно недоступна. Попробуй чуть позже${contactEmail ? ` или напиши нам: ${contactEmail}` : " или напиши нам — мы поможем"}.`} />
              )}

              {!ready ? (
                <p className="mt-4 text-sm">Оплата совместимости скоро откроется — тексты для всех пар дописываются. Бесплатная часть уже работает.</p>
              ) : a && b ? (
                <RazborCheckoutForm counter={counter} goal="compat_checkout_click">
                  <input type="hidden" name="product" value="compat" />
                  <input type="hidden" name="date" value={a.iso} />
                  <input type="hidden" name="date2" value={b.iso} />
                  <div className="grid gap-3 mt-5 sm:grid-cols-2 max-w-md">
                    <label className="grid gap-1 text-sm">
                      Имя ({a.iso.split("-").reverse().join(".")})
                      <input type="text" name="name" required maxLength={60} defaultValue={na} placeholder="Например, Анна" aria-invalid={err === "name" || undefined} className="border border-line rounded-lg px-3 py-2 bg-surface min-w-0" />
                    </label>
                    <label className="grid gap-1 text-sm">
                      Имя ({b.iso.split("-").reverse().join(".")})
                      <input type="text" name="name2" required maxLength={60} defaultValue={nb} placeholder="Например, Сергей" aria-invalid={err === "name" || undefined} className="border border-line rounded-lg px-3 py-2 bg-surface min-w-0" />
                    </label>
                  </div>
                  <label className="grid gap-1 text-sm mt-4 max-w-sm">
                    E-mail — пришлём сюда ссылку и чек
                    <input type="email" name="email" required autoComplete="email" maxLength={200} placeholder="you@example.ru" aria-invalid={err === "email" || undefined} className="border border-line rounded-lg px-3 py-2 bg-surface min-w-0" />
                  </label>
                  <PayButtons price={price} />
                  <p className="text-xs text-muted mt-3 max-w-md">
                    Нажимая кнопку, ты принимаешь условия <Link href="/oferta" className="underline">оферты</Link>. Оплата через ЮKassa. Совместимость носит развлекательный и ознакомительный характер.
                  </p>
                </RazborCheckoutForm>
              ) : (
                <p className="mt-4">
                  <a href="#forma" className="btn">Ввести две даты рождения</a>
                </p>
              )}
              <RazborWhoWrote what="совместимости" className="lg:hidden" />
            </div>
          </section>

          <section className="mt-12 grid gap-8 lg:grid-cols-2 max-w-5xl">
            <div>
              <h2 className="text-2xl mb-3">Что внутри</h2>
              <ol className="grid gap-1.5 list-decimal pl-7 marker:text-muted">
                {COMPAT_TOC.map((t) => (
                  <li key={t.id}>{t.title}</li>
                ))}
              </ol>
            </div>
            <div>
              <h2 className="text-2xl mb-3">Как считается</h2>
              <p className="text-muted">
                Для каждого из двоих считаются число судьбы и личный год. Образ пары читается по сочетанию чисел судьбы (мастер-числа 11, 22 и 33 — по базовым цифрам 2, 4 и 6), общий год — по сочетанию личных годов. Расчёт каждого числа показан в тексте.
              </p>
            </div>
          </section>

          <section className="prose mt-10">
            <h2>Бесплатные расчёты для пары</h2>
            <p>
              Короткие трактовки можно посмотреть бесплатно: <Link href="/numerologiya/sovmestimost">совместимость по числу судьбы</Link>, <Link href="/matrica-sudby/sovmestimost">совместимость по матрице судьбы</Link> и <Link href="/sovmestimost">совместимость знаков зодиака</Link>. Платная совместимость собирает числа обоих в один связный текст и добавляет ваш общий год.
            </p>
          </section>

          <p className="text-xs text-muted mt-8 max-w-2xl">
            Совместимость носит развлекательный и ознакомительный характер и не является консультацией специалиста. Решения остаются за вами.
          </p>

          <Faq items={FAQ} />
        </div>

        <RazborPriceAside
          title="Полная совместимость"
          price={price}
          what="совместимости"
          points={[
            `${COMPAT_TOC.length} ${plural(COMPAT_TOC.length, ["раздел", "раздела", "разделов"])} · образ пары, любовь, быт, споры, общий год и три совета`,
            "Бесплатная часть откроется сразу, без регистрации.",
          ]}
          href={ready && a && b ? "#oplata" : "#forma"}
          cta={ready && a && b ? "Открыть совместимость" : "Посмотреть бесплатно"}
        />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: COMPAT.title,
          description: DESCRIPTION,
          url: SITE.url + PATH,
          brand: { "@type": "Brand", name: SITE.name },
          offers: { "@type": "Offer", price: String(price), priceCurrency: "RUB", availability: ready ? "https://schema.org/InStock" : "https://schema.org/PreOrder", url: SITE.url + PATH },
        }}
      />
    </div>
  );
}
