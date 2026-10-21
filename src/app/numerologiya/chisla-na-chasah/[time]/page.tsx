import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import TarotHint from "@/components/TarotHint";
import { CLOCK_KINDS, DIGITS, clockDescription, clockFaq, clockSteps, clockTitle, compactTime, digitsOf, findClock, getClockNumbers, reduceDigit, relatedClocks } from "@/lib/clock";
import { cardsOfNumber } from "@/lib/tarot-links";

export const dynamicParams = false;

export function generateStaticParams() {
  return getClockNumbers().map((c) => ({ time: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/numerologiya/chisla-na-chasah/[time]">): Promise<Metadata> {
  const { time } = await params;
  const c = findClock(time);
  if (!c) return {};
  return {
    title: clockTitle(c),
    description: clockDescription(c),
    alternates: { canonical: `/numerologiya/chisla-na-chasah/${time}` },
  };
}

export default async function ClockPage({ params }: PageProps<"/numerologiya/chisla-na-chasah/[time]">) {
  const { time } = await params;
  const c = findClock(time);
  if (!c) notFound();
  const all = getClockNumbers();
  const idx = all.findIndex((x) => x.slug === time);
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];
  const digits = Array.from(new Set(digitsOf(c.time)));
  const others = all.filter((x) => x.slug !== time && x.kind === c.kind).slice(0, 12);
  const paragraphs = c.meaning.split(/\n+/).filter(Boolean);
  const { mirror, sameSum } = relatedClocks(c, all);
  const steps = clockSteps(c);
  const faq = clockFaq(c);
  const kindWord = CLOCK_KINDS[c.kind].plural;
  const tarot = cardsOfNumber(c.sum);
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: "/numerologiya/chisla-na-chasah", label: "Числа на часах" }, { href: `/numerologiya/chisla-na-chasah/${time}`, label: c.time }]} />
      <div className="grid gap-8 md:grid-cols-[280px_1fr] items-start">
        <div className="card frame-gold p-6 text-center md:sticky md:top-24">
          <p className="mono">{kindWord} цифры · {compactTime(c.time)}</p>
          <p className="display text-6xl mt-3">{c.time}</p>
          <p className="display text-xl mt-2">{c.title}</p>
          <p className="text-sm text-muted mt-3">{c.keywords.join(" · ")}</p>
          <p className="mono mt-5">сумма цифр · {c.sum}</p>
          <p className="text-sm text-muted mt-1">{DIGITS[reduceDigit(c.sum)].title}: {DIGITS[reduceDigit(c.sum)].text}</p>
        </div>
        <div className="prose">
          <h1 className="text-3xl md:text-4xl !mt-0">{c.time} на часах: значение и что это значит</h1>
          <p className="text-lg">{c.short}</p>
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          <h2>{c.time} в любви и отношениях</h2>
          <p>{c.love}</p>
          <h2>{c.time} в работе и деньгах</h2>
          <p>{c.money}</p>
          <h2>Из чего складывается {c.time}</h2>
          <ul>
            {digits.map((d) => <li key={d}><strong>{d} · {DIGITS[d].title}.</strong> {DIGITS[d].text}</li>)}
          </ul>
          <h2>Что делать, если видите {c.time}</h2>
          <p>Сначала просто заметьте, о чём вы думали в момент, когда взглянули на часы: подсказка относится к этой мысли. Дальше можно выбрать один из спокойных шагов:</p>
          <ul>
            {steps.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
          <h2>Совет на день</h2>
          <blockquote>{c.advice}</blockquote>
          <p>Хотите узнать свой постоянный фон, а не подсказку момента? Рассчитайте <Link href="/chislo-sudby">число судьбы</Link> или постройте <Link href="/kvadrat-pifagora">квадрат Пифагора</Link>.</p>
        </div>
      </div>
      <Faq items={faq} />
      {tarot.major && (
        <TarotHint
          title={`Карта Таро числа ${c.time}`}
          lede={<>Сумма цифр {c.time} — {c.sum}. В Таро этому числу соответствует старший аркан «{tarot.major.name}»{tarot.minors.length > 0 && <>, а среди младших арканов — карты с номером {tarot.minorNumber}: они добавляют к подсказке часов бытовые детали</>}.</>}
          items={[{ card: tarot.major, label: `аркан ${tarot.major.number}` }]}
          related={tarot.minors}
          relatedLabel={`младшие арканы · ${tarot.minorNumber}`}
        />
      )}
      {mirror.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl mb-3">Зеркальные и похожие на {c.time}</h2>
          <div className="flex flex-wrap gap-2">
            {mirror.map((o) => <Link key={o.slug} href={`/numerologiya/chisla-na-chasah/${o.slug}`} className="chip hover:text-ink">{o.time} · {o.title}</Link>)}
          </div>
        </section>
      )}
      {sameSum.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl mb-3">С той же суммой цифр</h2>
          <div className="flex flex-wrap gap-2">
            {sameSum.map((o) => <Link key={o.slug} href={`/numerologiya/chisla-na-chasah/${o.slug}`} className="chip hover:text-ink">{o.time}</Link>)}
          </div>
        </section>
      )}
      <section className="mt-10">
        <h2 className="text-2xl mb-3">Другие {kindWord} числа на часах</h2>
        <div className="flex flex-wrap gap-2">
          {others.map((o) => <Link key={o.slug} href={`/numerologiya/chisla-na-chasah/${o.slug}`} className="chip hover:text-ink">{o.time}</Link>)}
          <Link href="/numerologiya/chisla-na-chasah" className="chip hover:text-ink">все числа на часах →</Link>
        </div>
      </section>
      <div className="mt-8 flex flex-wrap gap-2 justify-between text-sm">
        <Link href={`/numerologiya/chisla-na-chasah/${prev.slug}`} className="btn btn-ghost">← {prev.time}</Link>
        <Link href={`/numerologiya/chisla-na-chasah/${next.slug}`} className="btn btn-ghost">{next.time} →</Link>
      </div>
    </article>
  );
}
