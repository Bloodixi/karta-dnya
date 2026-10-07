import type { Metadata } from "next";
import Link from "next/link";
import AuthorCard from "@/components/AuthorCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { authorJsonLd, horoscopeAuthor } from "@/lib/authors";
import { inSignRu, mskDate, mskDateTime, retroPeriodsByYears, retroStatus } from "@/lib/astro/calendar";
import { SIGN_NAMES_RU } from "@/lib/astro/engine";
import { getArticle, type Faq as FaqItem } from "@/lib/content";
import { SITE } from "@/lib/site";

/** Статус «сейчас ретрограден/директен до …» считается на лету, таблица — по эфемеридам на два года. */
export const revalidate = 3600;

const year = () => new Date(Date.now() + 3 * 3_600_000).getUTCFullYear();

export async function generateMetadata(): Promise<Metadata> {
  const y = year();
  return {
    title: `Ретроградный Меркурий ${y} и ${y + 1}: даты, что делать`,
    description: `Ретроградный Меркурий в ${y} и ${y + 1} году: точные даты разворотов по эфемеридам, знаки, что значит период, что делать и чего избегать. Ретро или директ сейчас.`,
    alternates: { canonical: "/astrologiya/retrogradnyy-merkuriy" },
  };
}

export default async function MercuryRetroPage() {
  const y = year();
  const now = new Date();
  const status = retroStatus("mercury", now);
  const periods = retroPeriodsByYears("mercury", y, y + 1);
  const article = await getArticle("astrologiya", "retrogradnyy-merkuriy");
  const author = horoscopeAuthor();
  const upcoming = periods.find((p) => new Date(p.end).getTime() > now.getTime());
  const nextStart = periods.find((p) => new Date(p.start).getTime() > now.getTime());
  const untilText = status.until ? mskDateTime(status.until, true) : "";
  const faq: FaqItem[] = [
    ...(article?.faq ?? []),
    {
      q: "Когда ближайший ретроградный Меркурий?",
      a: status.retrograde
        ? `Прямо сейчас: Меркурий ретрограден ${inSignRu(status.sign)}${status.until ? ` и вернётся к прямому движению ${untilText}` : ""}.${nextStart ? ` Следующий разворот — ${mskDate(nextStart.start, true)}.` : ""}`
        : nextStart
          ? `Ближайший разворот — ${mskDateTime(nextStart.start, true)} ${inSignRu(nextStart.startSign)}; прямое движение возобновится ${mskDate(nextStart.end, true)}. Все даты рассчитаны по эфемеридам на московское время.`
          : "Даты ближайших периодов — в таблице выше; они рассчитаны по эфемеридам на московское время.",
    },
    {
      q: "Почему даты в разных источниках отличаются на день?",
      a: "Разворот — это момент, когда скорость Меркурия по эклиптике проходит через ноль. Он приходится на конкретное время суток, и в других часовых поясах дата может сдвинуться. На этой странице указано московское время, уточнённое до минуты.",
    },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/astrologiya", label: "Астрология" }, { href: "/astrologiya/retrogradnyy-merkuriy", label: "Ретроградный Меркурий" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Ретроградный Меркурий {y} и {y + 1}: даты, что делать</h1>
      <p className="text-muted mt-2 max-w-2xl">Точные моменты разворотов по эфемеридам, знаки, в которых они происходят, и спокойное объяснение, что это значит на практике.</p>

      <section className="card p-6 mt-6">
        <p className="mono">сейчас</p>
        <p className="text-2xl display mt-1">
          Меркурий {status.retrograde ? "ретрограден" : "директен"} {inSignRu(status.sign)}
          {status.until && <span className="text-muted"> — {status.retrograde ? "до" : "следующий разворот"} {mskDateTime(status.until, true)}</span>}
        </p>
        <p className="text-muted mt-2 text-sm">
          {status.retrograde
            ? "Период обратного движения: перепроверяйте договорённости, документы и маршруты, возвращайтесь к отложенному."
            : "Прямое движение: обычный ритм дел, договорённостей и поездок."}
          {" "}Рассчитано на {mskDateTime(now)} · <Link href="/astrologiya/kak-my-schitaem" className="text-accent underline">как мы считаем</Link>
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Периоды ретроградного Меркурия в {y}–{y + 1} годах</h2>
        <div className="prose overflow-x-auto" style={{ maxWidth: "none" }}>
          <table style={{ display: "table" }}>
            <thead>
              <tr><th>Начало (МСК)</th><th>Конец (МСК)</th><th>Знак</th><th>Длительность</th></tr>
            </thead>
            <tbody>
              {periods.map((p) => {
                const active = upcoming === p && new Date(p.start).getTime() <= now.getTime();
                const signs = p.startSign === p.endSign ? SIGN_NAMES_RU[p.startSign] : `${SIGN_NAMES_RU[p.startSign]} → ${SIGN_NAMES_RU[p.endSign]}`;
                return (
                  <tr key={p.start} className={active ? "font-semibold" : ""}>
                    <td>{mskDateTime(p.start, true)}</td>
                    <td>{mskDateTime(p.end, true)}</td>
                    <td>{signs}</td>
                    <td>{p.days} дн.{active ? " · идёт сейчас" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted">Знак «→» означает, что Меркурий развернулся в одном знаке, а вернулся к прямому движению уже в предыдущем. В таблице моменты точных стояний; «тени» до и после — ещё по две недели.</p>
      </section>

      {article && (
        <article className="mt-10">
          <h2 className="text-2xl mb-3">{article.title}</h2>
          <div className="prose" dangerouslySetInnerHTML={{ __html: article.html }} />
        </article>
      )}

      {author && <AuthorCard author={author} className="mt-10" />}

      <Faq items={faq} />

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Рядом по теме</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/astrologiya/tranzity" className="btn btn-ghost">Транзиты дня</Link>
          <Link href="/astrologiya/luna-v-znake" className="btn btn-ghost">Луна в знаке</Link>
          <Link href="/goroskop" className="btn btn-ghost">Гороскоп на сегодня</Link>
          <Link href="/goroskop/nedelya" className="btn btn-ghost">Гороскоп на неделю</Link>
          <Link href="/astrologiya/natalnaya-karta" className="btn btn-ghost">Натальная карта</Link>
          <Link href="/lunnyy-kalendar" className="btn btn-ghost">Лунный календарь</Link>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Ретроградный Меркурий ${y} и ${y + 1}: даты, что делать`,
          description: article?.description,
          datePublished: article?.date,
          dateModified: now.toISOString().slice(0, 10),
          inLanguage: "ru",
          mainEntityOfPage: `${SITE.url}/astrologiya/retrogradnyy-merkuriy`,
          ...(author ? { author: authorJsonLd(author) } : {}),
          publisher: { "@type": "Organization", name: SITE.name },
        }}
      />
    </div>
  );
}
