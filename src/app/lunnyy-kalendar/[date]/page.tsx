import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import MoonPhase from "@/components/MoonPhase";
import RazborCta from "@/components/RazborCta";
import TelegramDaily from "@/components/TelegramDaily";
import { readJsonData } from "@/lib/content";
import { formatDateRu, shiftKey, todayKey } from "@/lib/daily";
import { dayInfo, LUNAR_DAYS, moonWindow, moonWindowKeys, PHASES } from "@/lib/moon";
import { pageTitle } from "@/lib/site";

export const revalidate = 86400;
export const dynamicParams = true;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function generateStaticParams() {
  return moonWindowKeys(todayKey()).map((date) => ({ date }));
}

export async function generateMetadata({ params }: PageProps<"/lunnyy-kalendar/[date]">): Promise<Metadata> {
  const { date } = await params;
  if (!DATE_RE.test(date)) return {};
  const d = dayInfo(date);
  return {
    // pageTitle: длинные даты («23 сентября») без суффикса бренда, чтобы уложиться в 65 знаков.
    title: pageTitle(`Лунный календарь на ${formatDateRu(date).replace(/\s*г\.$/, "")}: ${d.lunarDay}-й лунный день`),
    description: `${formatDateRu(date)}: ${d.lunarDay}-й лунный день, ${PHASES[d.phase].name}, Луна в знаке ${d.sign.name}. Что благоприятно, чего избегать, стрижка и посадки.`,
    alternates: { canonical: `/lunnyy-kalendar/${date}` },
  };
}

export default async function LunarDayPage({ params }: PageProps<"/lunnyy-kalendar/[date]">) {
  const { date } = await params;
  if (!DATE_RE.test(date)) notFound();
  const [y, m, dd] = date.split("-").map(Number);
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || dd < 1 || dd > 31) notFound();
  const d = dayInfo(date);
  const win = moonWindow(todayKey());
  const prev = shiftKey(date, -1);
  const next = shiftKey(date, 1);
  const ld = LUNAR_DAYS[d.lunarDay];
  const ph = PHASES[d.phase];
  const about = readJsonData<Record<string, string[]>>("lunar-days.json", {})[String(d.lunarDay)] ?? [];
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/lunnyy-kalendar", label: "Лунный календарь" }, { href: `/lunnyy-kalendar/${date}`, label: formatDateRu(date) }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Лунный календарь на {formatDateRu(date)}</h1>
      <div className="card p-6 mt-6 grid gap-6 md:grid-cols-[160px_1fr] items-center">
        <div className="text-center">
          <MoonPhase age={d.age} size={140} className="mx-auto" title={ph.name} />
          <p className="text-sm text-muted mt-2">освещённость {d.illumination}%</p>
        </div>
        <div>
          <p className="text-2xl display">{d.lunarDay}-й лунный день · {ph.name}</p>
          <p className="text-muted">Луна в знаке <Link href={`/goroskop/${d.sign.slug}`} className="text-accent underline">{d.sign.name}</Link> · символ дня: {ld.symbol}</p>
          <p className="mt-3">{ph.text}</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
            <div className="card p-3"><p className="font-semibold">Благоприятно</p><p className="text-muted">{ld.good}</p></div>
            <div className="card p-3"><p className="font-semibold">Лучше избегать</p><p className="text-muted">{ld.avoid}</p></div>
            <div className="card p-3"><p className="font-semibold">Стрижка</p><p className="text-muted">{ld.hair}</p></div>
            <div className="card p-3"><p className="font-semibold">Сад и огород</p><p className="text-muted">{ld.garden}</p></div>
          </div>
        </div>
      </div>
      {about.length > 0 && (
        <section className="prose mt-8 max-w-3xl">
          <h2>{d.lunarDay}-й лунный день: {ld.symbol}</h2>
          {about.map((p, i) => <p key={i}>{p}</p>)}
        </section>
      )}
      <div className="mt-6 flex flex-wrap gap-2 justify-between text-sm">
        {prev >= win.from && prev <= win.to ? <Link href={`/lunnyy-kalendar/${prev}`} className="btn btn-ghost">← {formatDateRu(prev, { day: "numeric", month: "long" })}</Link> : <span />}
        <Link href="/lunnyy-kalendar" className="btn btn-ghost">Сегодня и месяц</Link>
        {next >= win.from && next <= win.to ? <Link href={`/lunnyy-kalendar/${next}`} className="btn btn-ghost">{formatDateRu(next, { day: "numeric", month: "long" })} →</Link> : <span />}
      </div>
      <TelegramDaily campaign="lunnyy-den" text="Лунный день, фаза и карта дня — каждое утро в 8:00 по Москве. Коротко и без рекламы." />
      <RazborCta from="lunnyy-den" />
    </div>
  );
}
