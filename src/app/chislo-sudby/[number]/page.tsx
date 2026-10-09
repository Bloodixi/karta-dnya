import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import NumerologyNav from "@/components/NumerologyNav";
import RazborCta from "@/components/RazborCta";
import { findNumerology, getNumerology } from "@/lib/content";
import { isMaster, NUMBER_WORDS, toCore } from "@/lib/numerology";
import { pageTitle } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getNumerology().map((n) => ({ number: String(n.number) }));
}

export async function generateMetadata({ params }: PageProps<"/chislo-sudby/[number]">): Promise<Metadata> {
  const { number } = await params;
  const n = findNumerology(Number(number));
  if (!n) return {};
  const master = isMaster(n.number);
  const title = master ? `Число судьбы ${n.number}: значение мастер-числа, любовь и работа` : `Число судьбы ${n.number}: значение, характер, любовь и работа`;
  const description = master
    ? `Мастер-число ${n.number} («${n.title}») в числе судьбы: значение, отличие от числа ${toCore(n.number)}, сильные и слабые стороны, любовь, работа, совместимость с другими числами.`
    : `Число судьбы ${n.number} («${n.title}») по дате рождения: характер, сильные и слабые стороны, любовь, работа, совместимость с числами, над чем работать и совет.`;
  return { title: pageTitle(title), description, alternates: { canonical: `/chislo-sudby/${n.number}` } };
}

function NumChip({ n, current }: { n: number; current: number }) {
  if (n === current) return <span className="chip">{n} · вы</span>;
  return <Link href={`/chislo-sudby/${n}`} className="chip hover:text-ink">{n}</Link>;
}

export default async function DestinyNumberPage({ params }: PageProps<"/chislo-sudby/[number]">) {
  const { number } = await params;
  const n = findNumerology(Number(number));
  if (!n) notFound();
  const all = getNumerology();
  const master = isMaster(n.number);
  const core = toCore(n.number);
  const compat = n.compat;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: "/chislo-sudby", label: "Число судьбы" }, { href: `/chislo-sudby/${n.number}`, label: `Число ${n.number}` }]} />
      <div className="flex items-baseline gap-4 flex-wrap">
        <span className="display text-6xl md:text-7xl text-accent">{n.number}</span>
        <h1 className="text-3xl md:text-4xl">Число судьбы {n.number} — {n.title}</h1>
      </div>
      <p className="mt-3 flex flex-wrap gap-2">{n.keywords.map((k) => <span key={k} className="chip">{k}</span>)}</p>
      <p className="text-muted mt-4 max-w-2xl text-lg">{n.description}</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] mt-8">
        <div className="prose">
          <h2>Как получить число {n.number}</h2>
          {master ? (
            <p>Сложите все цифры даты рождения. Если сумма равна {n.number}, это мастер-число, и его не сводят до {NUMBER_WORDS[core] === "двойка" ? "двойки" : NUMBER_WORDS[core] === "четвёрка" ? "четвёрки" : "шестёрки"}. Например, 29.11.1990 даёт 2 + 9 + 1 + 1 + 1 + 9 + 9 + 0 = 32 → 5, а вот 29.09.1981 даёт 2 + 9 + 0 + 9 + 1 + 9 + 8 + 1 = 39 → 12 → 3. Мастер-число появляется только когда промежуточная сумма точно равна 11, 22 или 33. Проверить свою дату можно в <Link href="/chislo-sudby">калькуляторе числа судьбы</Link>, а подробнее о мастер-числах — на странице <Link href="/numerologiya/master-chisla">11, 22 и 33</Link>.</p>
          ) : (
            <p>Сложите все цифры даты рождения, а затем цифры результата, пока не получится одна цифра. Число {n.number} получается, когда итоговая сумма сворачивается к {NUMBER_WORDS[n.number] === "единица" ? "единице" : NUMBER_WORDS[n.number].replace(/ка$/, "ке").replace(/ца$/, "це")}. Проверить свою дату можно в <Link href="/chislo-sudby">калькуляторе числа судьбы</Link> или получить сразу все числа даты и имени в <Link href="/numerologiya/po-date-rozhdeniya">сводном расчёте</Link>.</p>
          )}
          <h2>Что значит число {n.number}</h2>
          {n.essence?.map((p, i) => <p key={i}>{p}</p>)}
          <h2>В любви</h2>
          <p>{n.love}</p>
          <h2>В работе</h2>
          <p>{n.career}</p>
          {compat && (
            <>
              <h2>Совместимость числа {n.number} с другими числами</h2>
              <p>{compat.text}</p>
              <div className="not-prose grid gap-3 sm:grid-cols-3 mt-4">
                <div className="card p-4"><p className="mono mb-2">Лучшие пары</p><p className="flex flex-wrap gap-2">{compat.best.map((b) => <NumChip key={b} n={b} current={n.number} />)}</p></div>
                <div className="card p-4"><p className="mono mb-2">Хорошие</p><p className="flex flex-wrap gap-2">{compat.good.map((b) => <NumChip key={b} n={b} current={n.number} />)}</p></div>
                <div className="card p-4"><p className="mono mb-2">Требуют работы</p><p className="flex flex-wrap gap-2">{compat.hard.map((b) => <NumChip key={b} n={b} current={n.number} />)}</p></div>
              </div>
              <p>Точный процент для вашей пары считает <Link href="/numerologiya/sovmestimost">калькулятор совместимости по дате рождения</Link>: две даты, число судьбы каждого и разбор сочетания.</p>
            </>
          )}
          <h2>Над чем работать</h2>
          <p>{n.challenge}</p>
          {n.advice && <p><strong>Совет:</strong> {n.advice}</p>}
        </div>
        <aside className="grid gap-4 content-start">
          {n.strengths && (
            <div className="card p-5">
              <p className="mono mb-2">Сильные стороны</p>
              <ul className="grid gap-1 text-sm">{n.strengths.map((s) => <li key={s}>— {s}</li>)}</ul>
            </div>
          )}
          {n.weaknesses && (
            <div className="card p-5">
              <p className="mono mb-2">Слабые места</p>
              <ul className="grid gap-1 text-sm text-muted">{n.weaknesses.map((s) => <li key={s}>— {s}</li>)}</ul>
            </div>
          )}
          {master && (
            <div className="card p-5">
              <p className="mono mb-2">Базовое число</p>
              <p className="text-sm">В спокойные периоды {n.number} проявляется как <Link href={`/chislo-sudby/${core}`} className="text-accent underline">число {core}</Link>. Читайте обе страницы.</p>
            </div>
          )}
          <div className="card p-5">
            <p className="mono mb-2">Другие числа судьбы</p>
            <p className="flex flex-wrap gap-2">{all.map((x) => <NumChip key={x.number} n={x.number} current={n.number} />)}</p>
          </div>
        </aside>
      </div>

      <RazborCta />
      <Faq items={n.faq ?? []} />
      <NumerologyNav current="/chislo-sudby" />
    </div>
  );
}
