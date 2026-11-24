import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import HubHeader from "@/components/HubHeader";
import JsonLd from "@/components/JsonLd";
import RazborCta from "@/components/RazborCta";
import TarotIndex from "@/components/TarotIndex";
import TelegramDaily from "@/components/TelegramDaily";
import { getArticles } from "@/lib/content";
import { SECTIONS, SECTION_KEYS, SECTION_TOOLS, SITE, orgJsonLd, type SectionKey } from "@/lib/site";
import ArticleLinks from "@/components/ArticleLinks";

const SECTION_FAQ: Partial<Record<SectionKey, { q: string; a: string }[]>> = {
  astrologiya: [
    { q: "С чего начать знакомство с астрологией на сайте?", a: "Проще всего рассчитать натальную карту по дате, времени и месту рождения, проверить свой восходящий знак (Асцендент) и сверить текущие транзиты планет с ежедневным гороскопом." },
    { q: "Чем солнечный знак отличается от Асцендента?", a: "Солнечный знак описывает базовый характер и мотивацию, а Асцендент (восходящий знак) показывает первое впечатление и сетку домов, в которых проигрываются события." },
    { q: "Как астрология на «Карте дня» связана с персональным разбором?", a: "В разделе собраны общие астрологические расчёты и прогнозы по знакам, а персональный разбор объединяет ваши числа даты рождения, матрицу Пифагора и тон ближайших 12 месяцев." },
  ],
  numerologiya: [
    { q: "С какого расчёта лучше начать в нумерологии?", a: "Начните с расчёта нумерологии по дате рождения или числа судьбы — это базовый вектор характера, сильных сторон и жизненных задач." },
    { q: "Чем квадрат Пифагора отличается от матрицы судьбы?", a: "Квадрат Пифагора показывает распределение энергий по 9 ячейкам психоматрицы, а матрица судьбы опирается на 22 старших аркана Таро для анализа кармических задач и отношений." },
    { q: "Как использовать расчёты для планирования года?", a: "Рассчитайте свой личный год, чтобы понять общий фокус ближайших 12 месяцев, или закажите персональный разбор с прогнозом по месяцам." },
  ],
  praktiki: [
    { q: "Какие практики подойдут для ежедневной привычки?", a: "Достаточно 3–5 минут утром: выберите аффирмацию дня, сформулируйте одно спокойное намерение и при желании дополните его руной дня." },
    { q: "Как правильно работать с аффирмациями?", a: "Выбирайте формулировки в настоящем времени без частицы «не» и повторяйте их в спокойном состоянии, связывая с конкретным действием на день." },
    { q: "Когда лучше проводить ритуалы на намерение?", a: "Традиционно новые намерения и цели формулируют в новолуние, а отпускают лишнее и подводят итоги на убывающей Луне." },
  ],
  taro: [
    { q: "С какого расклада Таро начать новичку?", a: "Для быстрого ориентира подойдёт карта дня или расклад «Таро да или нет», а для более объёмного взгляда на ситуацию — расклад на три карты." },
    { q: "Нужно ли запоминать значения всех 78 карт сразу?", a: "Нет, достаточно понимать общую идею Старших арканов и четырёх мастей, а точные трактовки в прямом и перевёрнутом положении всегда можно открыть в каталоге карт." },
    { q: "Как часто можно гадать на один и тот же вопрос?", a: "Лучше не повторять расклад на одну и ту же ситуацию чаще раза в неделю или до появления новых обстоятельств, чтобы не путать себя противоречивыми сигналами." },
  ],
  kamni: [
    { q: "Как подобрать камень-талисман для себя?", a: "Камень можно выбрать по знаку зодиака, по дате рождения или по конкретной задаче — например, для спокойствия, фокуса или защиты." },
    { q: "Нужно ли очищать минералы после покупки?", a: "Да, новый камень рекомендуется промыть прохладной проточной водой (если минерал не боится влаги) или подержать рядом с дымом благовоний или на лунном свете." },
    { q: "Можно ли носить несколько камней одновременно?", a: "Лучше сочетать 1–2 близких по задаче минерала и наблюдать за собственным самочувствием, не перегружая образ сразу множеством разных талисманов." },
  ],
};

function SectionAnswer({ section }: { section: SectionKey }) {
  if (section === "astrologiya") {
    return (
      <section className="card p-5 mt-8" aria-labelledby="section-answer">
        <h2 id="section-answer" className="text-lg font-semibold">Главные астрологические инструменты и прогнозы</h2>
        <p className="text-sm text-muted mt-1.5">
          Все расчёты на Карте дня строятся по точным эфемеридам: посмотрите <Link href="/astrologiya/natalnaya-karta" className="text-accent-text underline">натальную карту</Link>,{" "}
          <Link href="/astrologiya/tranzity" className="text-accent-text underline">транзиты планет сегодня</Link>,{" "}
          <Link href="/astrologiya/retrogradnyy-merkuriy" className="text-accent-text underline">календарь ретроградного Меркурия</Link> и{" "}
          <Link href="/astrologiya/zatmeniya-2027" className="text-accent-text underline">затмения 2027 года</Link>. Из ежедневных знаков чаще всего ищут{" "}
          <Link href="/goroskop/skorpion" className="text-accent-text underline">Скорпиона</Link>, <Link href="/goroskop/rak" className="text-accent-text underline">Рака</Link> и{" "}
          <Link href="/goroskop/deva" className="text-accent-text underline">Деву</Link>.
        </p>
      </section>
    );
  }
  if (section === "numerologiya") {
    return (
      <section className="card p-5 mt-8" aria-labelledby="section-answer">
        <h2 id="section-answer" className="text-lg font-semibold">Главные нумерологические расчёты онлайн</h2>
        <p className="text-sm text-muted mt-1.5">
          Бесплатные калькуляторы по дате рождения и имени: рассчитайте <Link href="/numerologiya/po-date-rozhdeniya" className="text-accent-text underline">нумерологию по дате рождения</Link>,{" "}
          <Link href="/chislo-sudby" className="text-accent-text underline">число судьбы</Link>,{" "}
          <Link href="/matrica-sudby" className="text-accent-text underline">матрицу судьбы</Link> и{" "}
          <Link href="/kvadrat-pifagora" className="text-accent-text underline">квадрат Пифагора</Link>. Для пары и планов на год откройте{" "}
          <Link href="/numerologiya/sovmestimost" className="text-accent-text underline">совместимость по дате</Link> и{" "}
          <Link href="/numerologiya/lichnyy-god" className="text-accent-text underline">личный год</Link>.
        </p>
      </section>
    );
  }
  if (section === "praktiki") {
    return (
      <section className="card p-5 mt-8" aria-labelledby="section-answer">
        <h2 id="section-answer" className="text-lg font-semibold">Ежедневные практики, аффирмации и ритуалы</h2>
        <p className="text-sm text-muted mt-1.5">
          Спокойные инструменты для фокуса и внутреннего равновесия: откройте <Link href="/praktiki/affirmacii" className="text-accent-text underline">каталог аффирмаций</Link>,{" "}
          <Link href="/praktiki/affirmacii/dnya" className="text-accent-text underline">аффирмацию дня</Link>,{" "}
          <Link href="/praktiki/affirmacii/na-dengi" className="text-accent-text underline">аффирмации на деньги</Link> и{" "}
          <Link href="/praktiki/affirmacii/dlya-zhenschin" className="text-accent-text underline">подборку для женщин</Link>. Для утренней настройки также подойдёт{" "}
          <Link href="/runy/runa-dnya" className="text-accent-text underline">руна дня</Link>.
        </p>
      </section>
    );
  }
  if (section === "taro") {
    return (
      <section className="card p-5 mt-8" aria-labelledby="section-answer">
        <h2 id="section-answer" className="text-lg font-semibold">Гадания Таро онлайн и значения всех 78 карт</h2>
        <p className="text-sm text-muted mt-1.5">
          Выберите формат под ваш вопрос: вытяните <Link href="/karta-dnya" className="text-accent-text underline">карту дня</Link>,{" "}
          сделайте быстрый расклад <Link href="/taro/da-net" className="text-accent-text underline">Таро да или нет</Link>,{" "}
          <Link href="/taro/tri-karty" className="text-accent-text underline">три карты</Link> или{" "}
          <Link href="/taro/na-zhelanie" className="text-accent-text underline">гадание на желание</Link>. Полный справочник с прямым и перевёрнутым значением — в разделе{" "}
          <Link href="/taro/karty" className="text-accent-text underline">всех карт Таро</Link>.
        </p>
      </section>
    );
  }
  if (section === "kamni") {
    return (
      <section className="card p-5 mt-8" aria-labelledby="section-answer">
        <h2 id="section-answer" className="text-lg font-semibold">Подбор камней и значения минералов</h2>
        <p className="text-sm text-muted mt-1.5">
          Изучите свойства и описание минералов в <Link href="/kamni" className="text-accent-text underline">каталоге камней</Link> или подберите персональный талисман: откройте{" "}
          <Link href="/kamni/po-znaku-zodiaka" className="text-accent-text underline">камни по знаку зодиака</Link> и{" "}
          <Link href="/kamni/po-date-rozhdeniya" className="text-accent-text underline">камень по дате рождения</Link>. Ниже собраны статьи о выборе, ношении и очищении камней.
        </p>
      </section>
    );
  }
  return null;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return SECTION_KEYS.map((section) => ({ section }));
}

export async function generateMetadata({ params }: PageProps<"/[section]">): Promise<Metadata> {
  const { section } = await params;
  const s = SECTIONS[section as SectionKey];
  if (!s) return {};
  return { title: s.seoTitle ?? s.title, description: s.description, alternates: { canonical: `/${section}` } };
}

export default async function SectionPage({ params }: PageProps<"/[section]">) {
  const { section } = await params;
  const key = section as SectionKey;
  const s = SECTIONS[key];
  if (!s) notFound();
  const articles = getArticles(key);
  const tools = SECTION_TOOLS[key] || [];
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: `/${key}`, label: s.title }]} />
      <HubHeader icon={s.icon} title={s.title} lede={s.description} links={tools} />
      {key === "taro" && <TarotIndex className="mt-10" />}
      <SectionAnswer section={key} />
      <ArticleLinks path={`/${key}`} title="С чего начать" />
      <h2 className="text-2xl mt-10 mb-3">Статьи</h2>
      {articles.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.slug} a={a} />
          ))}
        </div>
      ) : (
        <p className="text-muted">Статьи этого раздела появятся совсем скоро.</p>
      )}
      {SECTION_FAQ[key] && (
        <>
          <RazborCta from={`${key}-hub`} className="mt-10" />
          <Faq items={SECTION_FAQ[key]!} />
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: s.seoTitle ?? s.title,
              description: s.description,
              url: `${SITE.url}/${key}`,
              inLanguage: "ru",
              publisher: orgJsonLd(),
            }}
          />
        </>
      )}
      {key === "numerologiya" && <TelegramDaily campaign="numerologiya" />}
    </div>
  );
}
