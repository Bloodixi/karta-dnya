import type { Metadata } from "next";
import Link from "next/link";
import AscForm from "@/components/AscForm";
import AuthorCard from "@/components/AuthorCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import ZodiacSign from "@/components/ZodiacSign";
import { authorJsonLd, horoscopeAuthor } from "@/lib/authors";
import { ASC_PATH, formatOffset, natalQuery, parseAscParams } from "@/lib/astro/ascendant";
import { cityLabel } from "@/lib/astro/cities";
import { getAstroData } from "@/lib/astro/interpret";
import { SIGNS, type SignSlug } from "@/lib/astro/types";
import { getArticle, getZodiac, readJsonData, type Faq as FaqItem } from "@/lib/content";
import { SITE } from "@/lib/site";

const TITLE = "Восходящий знак (асцендент): как узнать и рассчитать онлайн";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: "Восходящий знак (асцендент): как узнать по дате, времени и городу рождения. Бесплатный калькулятор, градус Асцендента, трактовки для 12 знаков и частые ошибки.",
  alternates: { canonical: ASC_PATH },
};

/** Короткие портреты для таблицы: первое впечатление, которое производит человек с таким Асцендентом. */
const SHORT: Record<SignSlug, string> = {
  oven: "Энергичный, прямой, быстрый на старте",
  telets: "Спокойный, основательный, приятный в общении",
  bliznetsy: "Подвижный, любознательный, разговорчивый",
  rak: "Мягкий, осторожный, чуткий к атмосфере",
  lev: "Яркий, тёплый, заметный в любой компании",
  deva: "Сдержанный, аккуратный, внимательный к деталям",
  vesy: "Обаятельный, дипломатичный, ищущий баланс",
  skorpion: "Глубокий, сдержанно-сильный, наблюдательный",
  strelets: "Открытый, оптимистичный, любит простор",
  kozerog: "Серьёзный, собранный, надёжный",
  vodoley: "Независимый, необычный, дружелюбный на расстоянии",
  ryby: "Мечтательный, мягкий, впечатлительный",
};

const EXTRA_FAQ: FaqItem[] = [
  {
    q: "Чем этот калькулятор отличается от натальной карты?",
    a: "Он считает тем же движком, но показывает только одну точку — Асцендент, его знак и градус. Полная натальная карта на той же дате, времени и городе добавит планеты в знаках и домах, Середину неба и аспекты; ссылка на неё появляется под результатом.",
  },
  {
    q: "Почему на другом сайте получился другой восходящий знак?",
    a: "Чаще всего дело в часовом поясе: для рождений в прошлом действовали декретное и летнее время, и разные калькуляторы учитывают их по-разному. Вторая причина — время рождения у границы знаков: сдвиг в 10–15 минут может перевести Асцендент в соседний знак. Мы переводим местное время во всемирное по историческим правилам часовых поясов и показываем градус, чтобы было видно, насколько вы близко к границе.",
  },
];

export default async function AscendantPage({ searchParams }: PageProps<"/astrologiya/voshodyaschiy-znak">) {
  const params = await searchParams;
  const parsed = parseAscParams(params);
  const data = getAstroData();
  const texts = readJsonData<{ asc: Record<string, string> }>("astro/natal-texts.json", { asc: {} }).asc;
  const zodiac = getZodiac();
  const byZ = (slug: SignSlug) => zodiac.find((z) => z.slug === slug);
  const article = await getArticle("astrologiya", "voshodyaschiy-znak");
  const author = horoscopeAuthor();
  const faq: FaqItem[] = [...(article?.faq ?? []), ...EXTRA_FAQ];

  const r = parsed.status === "ok" ? parsed.result : null;
  const formInitial = parsed.status === "ok"
    ? { date: r!.date, time: r!.time, city: cityLabel(r!.city), citySlug: r!.city.slug }
    : parsed.status === "error"
      ? { date: parsed.date, time: parsed.time, city: parsed.cityQuery }
      : undefined;

  const when = r ? new Date(r.utc) : null;
  const dateRu = r && when ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: r.city.tz }).format(when) : "";
  const timeRu = r && when ? new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: r.city.tz }).format(when) : "";
  const inSign = r ? r.asc - Math.floor(r.asc / 30) * 30 : 0;
  const nearPrev = r && inSign < 1.5 ? SIGNS[(SIGNS.indexOf(r.sign) + 11) % 12] : null;
  const nearNext = r && inSign > 28.5 ? SIGNS[(SIGNS.indexOf(r.sign) + 1) % 12] : null;
  const neighbour = nearPrev ?? nearNext;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/astrologiya", label: "Астрология" }, { href: ASC_PATH, label: "Восходящий знак" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Восходящий знак (асцендент): как узнать</h1>
      <p className="text-muted mt-2 max-w-2xl">
        Введите дату, время и город рождения — калькулятор определит знак и градус Асцендента и даст спокойную трактовку.
        Ниже — короткие портреты всех двенадцати восходящих знаков и подробная статья о том, что они значат.
      </p>

      <div className="mt-6">
        <AscForm initial={formInitial} />
        {parsed.status === "error" && <p className="text-sm mt-3 text-red-600" role="alert">{parsed.message}</p>}
      </div>

      {r && (
        <section className="mt-8 scroll-mt-24" aria-labelledby="asc-result">
          <h2 id="asc-result" className="text-2xl">Ваш восходящий знак</h2>
          <p className="text-muted mt-1">{dateRu}, {timeRu} ({formatOffset(r.offsetMinutes)}) · {cityLabel(r.city)}</p>
          <div className="card p-5 mt-4">
            <div className="flex items-center gap-4">
              {byZ(r.sign) && <ZodiacSign symbol={byZ(r.sign)!.symbol} element={byZ(r.sign)!.element} slug={`asc-result-${r.sign}`} size={84} className="shrink-0" />}
              <div>
                <p className="mono">асцендент</p>
                <p className="text-3xl display mt-1">{data.signs[r.sign].name} <span className="text-muted text-xl">{r.degree}</span></p>
                <p className="text-sm text-muted mt-1">{SHORT[r.sign]}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="chip">Солнце · {data.signs[r.sunSign].name}</span>
              <span className="chip">Луна · {data.signs[r.moonSign].name}</span>
              <span className="chip">Середина неба · {data.signs[r.mcSign].name}</span>
            </div>
            {neighbour && (
              <p className="text-sm text-muted mt-4 max-w-2xl">
                Асцендент у самой границы знаков: сдвиг времени рождения на несколько минут может перевести его в знак {data.signs[neighbour].genitive}. Если время известно приблизительно, прочитайте обе трактовки и сравните с тем, как вас видят другие.
              </p>
            )}
            <h3 className="text-xl mt-5">Асцендент в {data.signs[r.sign].locative}</h3>
            <p className="mt-2 max-w-3xl">{texts[r.sign]}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/astrologiya/natalnaya-karta?${natalQuery(r)}`} className="btn">Полная натальная карта</Link>
              <Link href={`/goroskop/${r.sign}`} className="btn btn-ghost">Гороскоп для знака {data.signs[r.sign].name}</Link>
              <Link href={`/goroskop/${r.sunSign}`} className="btn btn-ghost">Солнечный знак: {data.signs[r.sunSign].name}</Link>
            </div>
            <p className="text-xs text-muted mt-4">
              Адрес этой страницы уже содержит дату, время и город — его можно сохранить или отправить. Расчёт по эфемеридам, местное время переведено во всемирное по правилам часового пояса · <Link href="/astrologiya/kak-my-schitaem" className="text-accent underline">как мы считаем</Link>.
            </p>
          </div>
        </section>
      )}

      <section className="mt-12" aria-labelledby="asc-table">
        <h2 id="asc-table" className="text-2xl mb-2">12 восходящих знаков: короткие портреты</h2>
        <p className="text-muted mb-4 max-w-2xl">Если вы уже знаете свой Асцендент, найдите его в таблице. Это описание первого впечатления и манеры входить в новые ситуации, а не характера целиком.</p>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-2 px-4 font-normal">Асцендент</th>
                <th className="py-2 px-4 font-normal">Первое впечатление и манера</th>
                <th className="py-2 px-4 font-normal whitespace-nowrap">Подробнее</th>
              </tr>
            </thead>
            <tbody>
              {SIGNS.map((slug) => {
                const z = byZ(slug);
                const s = data.signs[slug];
                return (
                  <tr key={slug} id={`asc-${slug}`} className="border-t border-line scroll-mt-24 align-top">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="flex items-center gap-3">
                        {z && <ZodiacSign symbol={z.symbol} element={z.element} slug={`asc-row-${slug}`} size={40} className="shrink-0" />}
                        <span className="font-semibold">{s.name}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold">{SHORT[slug]}</p>
                      <p className="text-muted mt-1">{texts[slug]}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap"><Link href={`/goroskop/${slug}`} className="text-accent underline">Гороскоп {s.genitive}</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {article && (
        <article className="mt-12">
          <h2 className="text-2xl mb-3">{article.title}</h2>
          <div className="prose" dangerouslySetInnerHTML={{ __html: article.html }} />
        </article>
      )}

      {author && <AuthorCard author={author} className="mt-10" />}

      <Faq items={faq} />

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Рядом по теме</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/astrologiya/natalnaya-karta" className="btn btn-ghost">Натальная карта</Link>
          <Link href="/astrologiya/natalnaya-karta-chto-eto" className="btn btn-ghost">Что такое натальная карта</Link>
          <Link href="/astrologiya/doma-v-astrologii" className="btn btn-ghost">Дома в астрологии</Link>
          <Link href="/goroskop" className="btn btn-ghost">Гороскоп на сегодня</Link>
          <Link href="/astrologiya/luna-v-znake" className="btn btn-ghost">Луна в знаке</Link>
          <Link href="/sovmestimost" className="btn btn-ghost">Совместимость</Link>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: article?.description,
          datePublished: article?.date,
          dateModified: article?.date,
          inLanguage: "ru",
          mainEntityOfPage: `${SITE.url}${ASC_PATH}`,
          ...(author ? { author: authorJsonLd(author) } : {}),
          publisher: { "@type": "Organization", name: SITE.name },
        }}
      />
    </div>
  );
}
