import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { formatDateRu, shiftKey, todayKey } from "@/lib/daily";
import { dayInfo, LUNAR_DAYS, PHASES } from "@/lib/moon";

export const revalidate = 86400;
export const dynamicParams = true;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function generateStaticParams() {
  const today = todayKey();
  return Array.from({ length: 120 }, (_, i) => ({ date: shiftKey(today, i - 30) }));
}

export async function generateMetadata({ params }: PageProps<"/lunnyy-kalendar/[date]">): Promise<Metadata> {
  const { date } = await params;
  if (!DATE_RE.test(date)) return {};
  const d = dayInfo(date);
  return {
    title: `Лунный календарь на ${formatDateRu(date)}: ${d.lunarDay}-й лунный день, ${PHASES[d.phase].name.toLowerCase()}`,
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
  const ld = LUNAR_DAYS[d.lunarDay];
  const ph = PHASES[d.phase];
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/lunnyy-kalendar", label: "Лунный календарь" }, { href: `/lunnyy-kalendar/${date}`, label: formatDateRu(date) }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Лунный календарь на {formatDateRu(date)}</h1>
      <div className="card p-6 mt-6 grid gap-6 md:grid-cols-[160px_1fr] items-center">
        <div className="text-center">
          <p className="text-7xl">{ph.emoji}</p>
          <p className="text-sm text-muted mt-2">освещённость {d.illumination}%</p>
        </div>
        <div>
          <p className="text-2xl display">{d.lunarDay}-й лунный день · {ph.name}</p>
          <p className="text-muted">Луна в знаке <Link href={`/goroskop/${d.sign.slug}`} className="text-accent underline">{d.sign.name}</Link> · символ дня: {ld.symbol}</p>
          <p className="mt-3">{ph.text}</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
            <div className="card p-3"><p className="font-semibold">Благоприятно</p><p className="text-muted">{ld.good}</p></div>
            <div className="card p-3"><p className="font-semibold">Лучше избегать</p><p className="text-muted">{ld.avoid}</p></div>
            <div className="card p-3"><p className="font-semibold">✂️ Стрижка</p><p className="text-muted">{ld.hair}</p></div>
            <div className="card p-3"><p className="font-semibold">🌱 Сад и огород</p><p className="text-muted">{ld.garden}</p></div>
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2 justify-between text-sm">
        <Link href={`/lunnyy-kalendar/${shiftKey(date, -1)}`} className="btn btn-ghost">← {formatDateRu(shiftKey(date, -1), { day: "numeric", month: "long" })}</Link>
        <Link href="/lunnyy-kalendar" className="btn btn-ghost">Сегодня и месяц</Link>
        <Link href={`/lunnyy-kalendar/${shiftKey(date, 1)}`} className="btn btn-ghost">{formatDateRu(shiftKey(date, 1), { day: "numeric", month: "long" })} →</Link>
      </div>
    </div>
  );
}
