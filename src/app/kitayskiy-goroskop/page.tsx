import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import HanziMark from "@/components/HanziMark";
import JsonLd from "@/components/JsonLd";
import { DateField, FormError, ShareLink } from "@/components/NumerologyFields";
import ScrollToResult from "@/components/ScrollToResult";
import { animalOrder, chineseSign, elementForYear, FIRST_YEAR, formatRuDate, getChineseAnimals, getChineseElements, getNewYears, LAST_YEAR, signName } from "@/lib/chineseZodiac";
import { parseDate } from "@/lib/numerology";
import { pageTitle, SITE } from "@/lib/site";

const PATH = "/kitayskiy-goroskop";

export const metadata: Metadata = {
  title: pageTitle("Китайский гороскоп по году рождения: калькулятор и знаки"),
  description: "Китайский гороскоп: узнайте животное и стихию по дате рождения с учётом даты Нового года по лунному календарю. Характер 12 знаков, пять стихий и таблица годов.",
  alternates: { canonical: PATH },
};

const FAQ = [
  { q: "Почему важна точная дата, а не только год рождения?", a: "Китайский год начинается не 1 января, а с Новым годом по лунному календарю — между 21 января и 20 февраля. Если вы родились в январе или начале февраля, ваше животное может относиться к предыдущему году. Калькулятор сверяет дату с таблицей начала годов." },
  { q: "Чем отличаются животное и стихия года?", a: "Животное повторяется раз в 12 лет и описывает основной характер. Стихия меняется каждые два года и добавляет оттенок: Огненный Тигр и Водяной Тигр — один знак, но с разным темпераментом. Полный цикл животного и стихии занимает 60 лет." },
  { q: "Какого цвета год и откуда берётся цвет?", a: "Цвет года задаёт стихия: Дерево — зелёный, Огонь — красный, Земля — жёлтый, Металл — белый, Вода — чёрный или синий. Поэтому 2027 год называют годом Красной Огненной Козы." },
  { q: "Совпадает ли китайский гороскоп с западным зодиаком?", a: "Нет, это разные системы. Западный зодиак делит год на 12 знаков по положению Солнца, китайский — присваивает знак целому году. Их можно читать вместе: знак зодиака говорит о вашем месяце рождения, китайское животное — о году." },
  { q: "Коза или Овца, Кролик или Кот?", a: "Иероглиф 羊 обозначает и козу, и овцу, поэтому встречаются оба названия. Кролика во вьетнамской традиции заменяет Кот. Свинью иногда называют Кабаном. Это один и тот же знак." },
];

export default async function ChineseHoroscopePage({ searchParams }: PageProps<typeof PATH>) {
  const sp = await searchParams;
  const date = parseDate(sp.d);
  const sign = date ? chineseSign(date.iso) : null;
  const outOfRange = !!date && !sign;
  const invalid = sp.d !== undefined && !date;
  const animals = getChineseAnimals();
  const elements = getChineseElements();
  const newYears = getNewYears();
  const tableYears = Object.keys(newYears).map(Number).filter((y) => y >= 1930 && y <= 2031);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/astrologiya", label: "Астрология" }, { href: PATH, label: "Китайский гороскоп" }]} />
      <h1 className="text-3xl md:text-4xl">Китайский гороскоп: кто вы по году рождения</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">Двенадцать животных сменяют друг друга по кругу, а пять стихий окрашивают каждый год в свой цвет. Введите дату рождения: калькулятор учтёт, что китайский Новый год каждый раз выпадает на новый день.</p>

      <div className="card p-6 mt-6 max-w-3xl">
        <Form action={PATH} className="flex flex-wrap gap-3 items-end">
          <DateField name="d" label="Дата рождения" defaultValue={date?.iso ?? (typeof sp.d === "string" ? sp.d : "")} invalid={invalid || outOfRange} />
          <button type="submit" className="btn min-h-11">Узнать животное</button>
        </Form>
        <FormError text={invalid ? "Введите настоящую дату рождения." : outOfRange ? `Таблица начала годов охватывает даты с ${formatRuDate(newYears[String(FIRST_YEAR)])} по ${LAST_YEAR} год.` : undefined} />
      </div>

      {sign && date && (
        <section className="mt-8 scroll-mt-24" id="rezultat">
          <div className="ornament mb-4"><h2 className="text-2xl">Ваш знак: {signName(sign.element, sign.animal)}</h2><span className="mono">{sign.year} год</span></div>
          <div className="card p-6 grid gap-5 md:grid-cols-[auto_1fr] items-start">
            <HanziMark hanzi={sign.animal.hanzi} size="lg" />
            <div>
              <p className="display text-3xl">{sign.animal.alias}</p>
              <p className="text-sm text-muted mt-1">стихия {sign.element.name} · цвет {sign.element.color} · {sign.animal.polarity}</p>
              <p className="mt-3 max-w-3xl">{sign.animal.summary}</p>
              <p className="text-sm mt-3 max-w-3xl">{sign.animal.elements[sign.element.key]}</p>
              <p className="text-sm text-muted mt-3">
                Год {sign.animal.gen} длился с {formatRuDate(sign.start)}{sign.end ? ` по ${formatRuDate(sign.end)}` : ""}.
                {sign.shifted && ` Вы родились до китайского Нового года ${date.y} года, поэтому ваш знак — животное ${sign.year} года.`}
              </p>
              <p className="mt-4 flex flex-wrap gap-2">
                <Link href={`${PATH}/${sign.animal.slug}`} className="btn">Характер и совместимость</Link>
                <Link href={`${PATH}/2027`} className="btn btn-ghost">Прогноз на 2027 год</Link>
              </p>
            </div>
          </div>
          <ShareLink path={`${SITE.url}${PATH}?d=${date.iso}`} />
        </section>
      )}
      <ScrollToResult key={date?.iso} id="rezultat" when={!!sign} />

      <section className="mt-12">
        <div className="ornament mb-4"><h2 className="text-2xl">12 животных китайского гороскопа</h2><span className="mono">по порядку цикла</span></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {animals.map((a) => {
            const recent = tableYears.filter((y) => animalOrder(y) === a.order && y >= 1960 && y <= 2031);
            return (
              <Link key={a.slug} href={`${PATH}/${a.slug}`} className="card card-hover p-4 flex gap-4 items-start">
                <HanziMark hanzi={a.hanzi} />
                <span className="min-w-0">
                  <span className="display text-xl block">{a.alias}</span>
                  <span className="text-xs text-muted block mt-0.5">{recent.join(", ")}</span>
                  <span className="text-sm text-muted block mt-2 line-clamp-3">{a.summary}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <div className="ornament mb-4"><h2 className="text-2xl">Пять стихий</h2><span className="mono">меняются раз в два года</span></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {elements.map((e) => (
            <div key={e.key} className="card p-4">
              <p className="display text-xl">{e.name}</p>
              <p className="text-xs text-accent-text mt-1">цвет {e.color} · годы на {e.digits}</p>
              <p className="text-sm text-muted mt-2">{e.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="prose mt-12">
        <h2>Как устроен китайский гороскоп</h2>
        <p>Китайский календарь считает время циклами по 60 лет. Внутри цикла по кругу идут двенадцать животных — Крыса, Бык, Тигр, Кролик, Дракон, Змея, Лошадь, Коза, Обезьяна, Петух, Собака и Свинья — и пять стихий: Дерево, Огонь, Земля, Металл и Вода. Каждая стихия держится два года подряд, сначала в мужской (ян), потом в женской (инь) форме. Так получается шестьдесят неповторимых сочетаний: Огненная Лошадь приходит раз в шестьдесят лет.</p>
        <p>Год начинается с новолуния, которое выпадает между 21 января и 20 февраля. Поэтому родившимся в январе и феврале стоит сверяться с таблицей ниже: 25 января 2020 года наступил год Крысы, а 24 января того же года ещё продолжался год Свиньи. По легенде, порядок животных определил забег через реку: первой к Нефритовому императору пришла хитрая Крыса, приехав на спине Быка, а последней — неторопливая Свинья.</p>
        <p>Китайский знак хорошо дополняет <Link href="/goroskop">гороскоп по знаку зодиака</Link>: зодиак описывает месяц рождения, животное — год. Для года 2027 у нас есть отдельный <Link href={`${PATH}/2027`}>прогноз года Красной Огненной Козы</Link>, а цифры года разобраны в <Link href="/numerologiya/2027">нумерологическом прогнозе на 2027</Link>. Камни-талисманы для каждого животного собраны на их страницах; полный каталог — в разделе <Link href="/kamni">камни</Link>.</p>
      </section>

      <section className="mt-12">
        <div className="ornament mb-4"><h2 className="text-2xl">Таблица годов 1930–2031</h2><span className="mono">дата начала года</span></div>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="px-4 py-2 font-normal">Год</th>
                <th className="px-4 py-2 font-normal">Начало</th>
                <th className="px-4 py-2 font-normal">Знак</th>
              </tr>
            </thead>
            <tbody>
              {tableYears.map((y) => {
                const a = animals.find((x) => x.order === animalOrder(y));
                const e = elementForYear(y);
                return (
                  <tr key={y} className="border-b border-line last:border-0">
                    <td className="px-4 py-1.5 tabular-nums">{y}</td>
                    <td className="px-4 py-1.5 tabular-nums">{formatRuDate(newYears[String(y)], false)}</td>
                    <td className="px-4 py-1.5">{a && <Link href={`${PATH}/${a.slug}`} className="hover:text-accent">{signName(e, a)}</Link>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted mt-2">Даты — по пекинскому времени, сверены с астрономическим расчётом новолуний и справочными таблицами.</p>
      </section>

      <Faq items={FAQ} />

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Ещё по теме</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/goroskop" className="chip hover:text-ink">Гороскоп на сегодня</Link>
          <Link href="/goroskop/god" className="chip hover:text-ink">Гороскоп на год</Link>
          <Link href="/sovmestimost" className="chip hover:text-ink">Совместимость знаков</Link>
          <Link href="/astrologiya/natalnaya-karta" className="chip hover:text-ink">Натальная карта</Link>
          <Link href="/numerologiya/2027" className="chip hover:text-ink">Нумерология 2027</Link>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Животные китайского гороскопа",
          itemListElement: animals.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.alias, url: `${SITE.url}${PATH}/${a.slug}` })),
        }}
      />
    </div>
  );
}
