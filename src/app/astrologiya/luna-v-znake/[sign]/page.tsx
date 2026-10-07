import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AuthorCard from "@/components/AuthorCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import ZodiacSign from "@/components/ZodiacSign";
import { horoscopeAuthor } from "@/lib/authors";
import { inSignRu, intoSignRu, mskDate, mskDateTime, nextMoonInSign } from "@/lib/astro/calendar";
import { mskNoon, SIGN_NAMES_RU, sky } from "@/lib/astro/engine";
import { getAstroData } from "@/lib/astro/interpret";
import { SIGNS, type SignSlug } from "@/lib/astro/types";
import { findMoonSign, getMoonSigns } from "@/lib/moonSigns";
import { findZodiac } from "@/lib/content";
import { todayKey } from "@/lib/daily";
import type { Faq as FaqItem } from "@/lib/content";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return getMoonSigns().map((m) => ({ sign: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/astrologiya/luna-v-znake/[sign]">): Promise<Metadata> {
  const { sign } = await params;
  const m = findMoonSign(sign);
  if (!m) return {};
  const inS = inSignRu(m.slug);
  return {
    title: `${m.title}: что значит и когда ближайшая`,
    description: `Луна ${inS}: что это значит для всех знаков, какой фон задаёт, что лучше делать и чего избегать, когда Луна ближайший раз войдёт в ${SIGN_NAMES_RU[m.slug]} — даты и время по Москве.`,
    alternates: { canonical: `/astrologiya/luna-v-znake/${sign}` },
  };
}

export default async function MoonSignPage({ params }: PageProps<"/astrologiya/luna-v-znake/[sign]">) {
  const { sign } = await params;
  const m = findMoonSign(sign);
  if (!m) notFound();
  const slug = m.slug as SignSlug;
  const z = findZodiac(slug);
  const data = getAstroData();
  const now = mskNoon(todayKey());
  const s = sky(now);
  const moonNow = s.positions.find((p) => p.body === "moon")!.sign;
  const pass = nextMoonInSign(slug, now);
  const author = horoscopeAuthor();
  const inS = inSignRu(slug);
  const faq: FaqItem[] = [
    { q: `Как часто Луна бывает ${inS}?`, a: `Раз в 27,3 дня, примерно на двое с половиной суток. ${pass ? pass.enter ? `Ближайший раз — с ${mskDate(pass.enter, true)} по ${mskDate(pass.exit, true)}.` : `Сейчас Луна ${inS} и выйдет из знака ${mskDateTime(pass.exit, true)}.` : ""}` },
    { q: `Луна ${inS} — это то же, что знак зодиака ${SIGN_NAMES_RU[slug]}?`, a: `Нет. Знак зодиака определяется положением Солнца в день рождения, а транзитная Луна ${inS} — это положение Луны прямо сейчас, оно меняется каждые два-три дня и влияет на фон для всех. Отдельная тема — натальная Луна ${inS}, то есть положение Луны в момент вашего рождения.` },
    { q: "Что значит Луна без курса в этом знаке?", a: "Отрезок перед выходом Луны из знака, когда она уже не образует точных аспектов. Традиционно важные начинания в эти часы откладывают, а рутину и завершение дел — нет." },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/astrologiya", label: "Астрология" }, { href: "/astrologiya/luna-v-znake", label: "Луна в знаке" }, { href: `/astrologiya/luna-v-znake/${slug}`, label: m.title }]} />
      <div className="flex items-center gap-4">
        {z && <ZodiacSign symbol={z.symbol} element={z.element} slug={`moon-${slug}`} size={84} className="shrink-0" />}
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">{m.title}: что это значит</h1>
          <p className="text-muted">{z ? `${z.element} · ` : ""}фон для всех знаков на два-три дня</p>
        </div>
      </div>

      <section className="card p-6 mt-6">
        <p className="mono">{moonNow === slug ? "сейчас" : "ближайшее прохождение"}</p>
        {pass ? (
          <p className="text-xl display mt-1">
            {pass.enter ? <>Луна войдёт {intoSignRu(slug)} {mskDateTime(pass.enter, true)} и выйдет {mskDateTime(pass.exit, true)}</> : <>Луна уже {inS} — до {mskDateTime(pass.exit, true)}</>}
          </p>
        ) : (
          <p className="text-xl display mt-1">Ближайшее прохождение — в течение месяца; даты в <Link href="/astrologiya/luna-v-znake" className="text-accent underline">календаре переходов</Link>.</p>
        )}
        <p className="mono-text mt-3 normal-case">Московское время, по эфемеридам · <Link href="/astrologiya/kak-my-schitaem" className="text-accent underline">как мы считаем</Link></p>
      </section>

      <section className="prose mt-8">
        <h2>Какой фон задаёт {m.title}</h2>
        <p>{m.meaning}</p>
        <p>{data.signs[slug]?.moonText ? `Коротко: ${data.signs[slug].moonText}.` : ""}</p>
        <div className="grid sm:grid-cols-2 gap-6 not-prose mt-4">
          <div className="card p-4"><p className="font-semibold">Хорошо подходит</p><ul className="mt-2 text-sm text-muted list-disc ml-5">{m.good.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div className="card p-4"><p className="font-semibold">Лучше отложить</p><ul className="mt-2 text-sm text-muted list-disc ml-5">{m.avoid.map((x) => <li key={x}>{x}</li>)}</ul></div>
        </div>
        <h2>Совет на эти дни</h2>
        <p>{m.tip}</p>
        <p>Луна в знаке — общий фон, он не отменяет ваш личный гороскоп. Посмотрите <Link href="/goroskop">гороскоп на сегодня</Link> для своего знака и <Link href="/lunnyy-kalendar">лунный день</Link>: вместе они дают более полную картину.</p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Луна в других знаках</h2>
        <div className="flex flex-wrap gap-2">
          {SIGNS.filter((x) => x !== slug).map((x) => (
            <Link key={x} href={`/astrologiya/luna-v-znake/${x}`} className="chip hover:text-ink">{SIGN_NAMES_RU[x]}</Link>
          ))}
          <Link href="/astrologiya/luna-v-znake" className="chip hover:text-ink">календарь переходов →</Link>
        </div>
      </section>

      {author && <AuthorCard author={author} className="mt-10" />}

      <Faq items={faq} />
    </div>
  );
}
