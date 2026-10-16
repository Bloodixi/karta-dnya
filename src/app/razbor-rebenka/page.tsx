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
import { ageAt, nowMsk } from "@/lib/razbor";
import { buildChildTeaser, CHILD, CHILD_MAX_AGE, CHILD_TOC, childReady } from "@/lib/razborChild";
import { PRODUCTS } from "@/lib/razborProducts";
import { plural } from "@/lib/ruCount";
import { pageTitle, SELLER, SITE } from "@/lib/site";

const PATH = "/razbor-rebenka";
const DESCRIPTION = `Детский нумерологический разбор по дате рождения для родителя: характер ребёнка, сильные стороны, как поддержать и на что не давить. Полный текст — ${CHILD.price} ₽.`;

export const metadata: Metadata = {
  title: pageTitle("Детский разбор по дате рождения для родителя"),
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: CHILD.title, description: DESCRIPTION, url: PATH },
};

const FAQ = [
  { q: "Что входит в детский разбор?", a: `${CHILD_TOC.length} разделов: числа ребёнка с расчётом, характер, сильные стороны, как поддержать, на что не давить, к чему присмотреться в занятиях, как число проявляется в нынешнем возрасте, квадрат Пифагора с детскими трактовками и пять советов родителю.` },
  { q: "Для какого возраста?", a: `Для детей от рождения до ${CHILD_MAX_AGE} лет включительно. Раздел о возрасте подбирается по группе: до 3 лет, 4–6, 7–11 и 12–17 лет. Для взрослых есть обычный разбор по дате рождения.` },
  { q: "Кто читает разбор?", a: "Родитель или другой близкий взрослый. Текст обращается к тебе, а о ребёнке говорит по имени: что ему даётся легко, как его поддержать и где проявить бережность." },
  { q: "Это диагностика или рекомендации специалиста?", a: "Нет. Разбор носит развлекательный и ознакомительный характер и не заменяет консультацию психолога, педагога или врача. Лучше всего своего ребёнка знаешь ты." },
  { q: "Как я получу разбор?", a: "Сразу после оплаты откроется страница с разбором, ссылка и чек придут на e-mail. Страницу можно сохранить в PDF кнопкой на странице." },
  { q: "Можно ли вернуть деньги?", a: "Если из-за технической ошибки разбор не открылся, мы вернём оплату полностью. Подробности на странице «Возврат»." },
];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const ERRORS: Record<string, string> = {
  email: "Укажи e-mail — на него придут ссылка на разбор и чек об оплате.",
  age: `Детский разбор — для детей до ${CHILD_MAX_AGE + 1} лет. Для взрослого подойдёт обычный разбор по дате рождения.`,
  soon: "Детский разбор скоро появится в продаже. Бесплатная часть уже работает.",
};

export default async function ChildRazborPage({ searchParams }: PageProps<"/razbor-rebenka">) {
  const sp = await searchParams;
  const date = parseDate(sp.d);
  const name = cleanName(sp.n);
  const err = one(sp.err);
  const invalid = (sp.d !== undefined && !date) || err === "date";
  const counter = process.env.METRIKA_ID;
  const now = nowMsk();
  const age = date ? ageAt({ d: date.d, m: date.m, y: date.y, ...now }) : null;
  const tooOld = age !== null && age > CHILD_MAX_AGE;
  const future = age !== null && age < 0;
  const teaser = date && !tooOld && !future ? buildChildTeaser({ d: date.d, m: date.m, y: date.y, name: name || undefined, ...now }) : null;
  const ready = childReady();
  const price = PRODUCTS.child.price;
  const contactEmail = SELLER.email.includes("@") ? SELLER.email : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: PATH, label: "Детский разбор" }]} />
      <h1 className="text-3xl md:text-4xl max-w-3xl">Детский разбор по дате рождения — для родителя</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">
        Спокойный текст о твоём ребёнке по его дате рождения: характер, сильные стороны, как поддержать, на что не давить и к каким занятиям присмотреться.
      </p>
      <p className="chip mt-4">
        Бесплатно — первые разделы · полный детский разбор {price} ₽ · {CHILD_TOC.length} {plural(CHILD_TOC.length, ["раздел", "раздела", "разделов"])}
      </p>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 lg:items-start">
        <div className="min-w-0">
          <div id="forma" className="card p-6 mt-6 max-w-3xl scroll-mt-24">
            <Form action={PATH} className="grid gap-3 sm:flex sm:flex-wrap sm:items-end">
              <DateField name="d" label="Дата рождения ребёнка" defaultValue={date?.iso ?? (typeof sp.d === "string" ? sp.d : "")} />
              <TextField name="n" label="Имя ребёнка (необязательно)" defaultValue={name} placeholder="Например, Маша" />
              <button type="submit" className="btn justify-center">Посмотреть бесплатно</button>
            </Form>
            <FormError text={invalid || future ? "Проверь дату: нужна настоящая дата рождения, например 17.05.2019." : undefined} />
            {tooOld ? (
              <p className="text-sm mt-3">
                Детский разбор — для детей до {CHILD_MAX_AGE + 1} лет. Для взрослого подойдёт{" "}
                <Link href={`/razbor?d=${date!.iso}${name ? `&n=${encodeURIComponent(name)}` : ""}#razbor-teaser`} className="text-accent-text underline">разбор по дате рождения</Link>.
              </p>
            ) : null}
            <p className="text-xs text-muted mt-3">Бесплатная часть откроется сразу, без регистрации.</p>
          </div>

          {teaser && (
            <section id="teaser" className="mt-10 scroll-mt-24">
              <ScrollToResult key={`${date!.iso}|${name}`} id="teaser" when={!err} />
              <RazborGoal counter={counter} goal="child_teaser" />
              <div className="ornament mb-2">
                <h2 className="text-2xl">
                  Бесплатная часть{teaser.who ? ` · ${teaser.who}` : ""} · {teaser.date}
                </h2>
              </div>
              <p className="max-w-3xl text-sm text-muted mb-4">
                Ниже — бесплатная часть. Полный детский разбор из {CHILD_TOC.length} разделов стоит {price} ₽:{" "}
                <a href="#oplata" className="text-accent-text underline">перейти к оплате</a>
              </p>
              <RazborView sections={teaser.sections} toc={false} />
              <RazborLocked items={teaser.locked} label={`Ещё ${teaser.locked.length} разделов в полном разборе`} />
              {ready ? <RazborStickyCta price={price} from="teaser" label="Открыть детский разбор" /> : null}
            </section>
          )}

          <section id="oplata" className="mt-6 max-w-3xl scroll-mt-24">
            <div className="card p-6 frame-gold">
              <p className="mono">Полный детский разбор</p>
              <p className="display text-4xl mt-2">{price} ₽</p>
              <p className="text-sm text-muted mt-2">Страница с разбором по ссылке сразу после оплаты, копия ссылки и чек — на e-mail. Разбор можно сохранить в PDF.</p>
              <ul className="mt-4 grid gap-1.5 text-sm">
                <li>{CHILD_TOC.length} разделов · характер, поддержка, занятия, возраст и пять советов родителю</li>
                <li>
                  Не открылся разбор — вернём деньги. <Link href="/vozvrat" className="text-accent-text underline">Условия возврата</Link>
                </li>
              </ul>

              <PayError text={err ? ERRORS[err] : undefined} />
              {err === "pay" && (
                <PayError text={`Оплата временно недоступна. Попробуй чуть позже${contactEmail ? ` или напиши нам: ${contactEmail}` : " или напиши нам — мы поможем"}.`} />
              )}

              {!ready ? (
                <p className="mt-4 text-sm">Оплата детского разбора скоро откроется — тексты дописываются. Бесплатная часть уже работает.</p>
              ) : teaser && date ? (
                <RazborCheckoutForm counter={counter} goal="child_checkout_click">
                  <input type="hidden" name="product" value="child" />
                  <input type="hidden" name="date" value={date.iso} />
                  <label className="grid gap-1 text-sm mt-5 max-w-sm">
                    Имя ребёнка — будет в тексте разбора
                    <input type="text" name="name" maxLength={60} defaultValue={name} placeholder="Например, Маша" className="border border-line rounded-lg px-3 py-2 bg-surface min-w-0" />
                  </label>
                  <label className="grid gap-1 text-sm mt-4 max-w-sm">
                    Твой e-mail — пришлём сюда ссылку на разбор и чек
                    <input type="email" name="email" required autoComplete="email" maxLength={200} placeholder="you@example.ru" aria-invalid={err === "email" || undefined} className="border border-line rounded-lg px-3 py-2 bg-surface min-w-0" />
                  </label>
                  <PayButtons price={price} />
                  <p className="text-xs text-muted mt-3 max-w-md">
                    Нажимая кнопку, ты принимаешь условия <Link href="/oferta" className="underline">оферты</Link>. Оплата через ЮKassa. Разбор носит развлекательный и ознакомительный характер.
                  </p>
                </RazborCheckoutForm>
              ) : (
                <p className="mt-4">
                  <a href="#forma" className="btn">Ввести дату рождения ребёнка</a>
                </p>
              )}
              <RazborWhoWrote className="lg:hidden" />
            </div>
          </section>

          <section className="mt-12 grid gap-8 lg:grid-cols-2 max-w-5xl">
            <div>
              <h2 className="text-2xl mb-3">Что внутри</h2>
              <ol className="grid gap-1.5 list-decimal pl-7 marker:text-muted">
                {CHILD_TOC.map((t) => (
                  <li key={t.id}>{t.title}</li>
                ))}
              </ol>
            </div>
            <div>
              <h2 className="text-2xl mb-3">Как написан</h2>
              <p className="text-muted">
                Бережно и без ярлыков: без диагнозов, без «ребёнок обязан» и без сравнения с другими детьми. Числа подсказывают, на что обратить внимание, а решения всегда остаются за тобой.
              </p>
            </div>
          </section>

          <section className="prose mt-10">
            <h2>Бесплатные расчёты</h2>
            <p>
              Отдельные числа можно посчитать бесплатно: <Link href="/chislo-sudby">число судьбы</Link> и <Link href="/kvadrat-pifagora">квадрат Пифагора</Link>. Для взрослых есть <Link href="/razbor">разбор по дате рождения</Link>, для двоих — <Link href="/sovmestimost-razbor">совместимость пары</Link>.
            </p>
          </section>

          <p className="text-xs text-muted mt-8 max-w-2xl">
            Разбор носит развлекательный и ознакомительный характер и не является консультацией психолога, педагога или врача. Решения остаются за тобой.
          </p>

          <Faq items={FAQ} />
        </div>

        <RazborPriceAside
          title="Полный детский разбор"
          price={price}
          points={[
            `${CHILD_TOC.length} ${plural(CHILD_TOC.length, ["раздел", "раздела", "разделов"])} · характер, поддержка, занятия, возраст и пять советов родителю`,
            "Бесплатная часть откроется сразу, без регистрации.",
          ]}
          href={ready && teaser ? "#oplata" : "#forma"}
          cta={ready && teaser ? "Открыть детский разбор" : "Ввести дату рождения ребёнка"}
        />
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: CHILD.title,
          description: DESCRIPTION,
          url: SITE.url + PATH,
          brand: { "@type": "Brand", name: SITE.name },
          offers: { "@type": "Offer", price: String(price), priceCurrency: "RUB", availability: ready ? "https://schema.org/InStock" : "https://schema.org/PreOrder", url: SITE.url + PATH },
        }}
      />
    </div>
  );
}
