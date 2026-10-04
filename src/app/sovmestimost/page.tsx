import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import PairPicker from "@/components/PairPicker";
import { getZodiac } from "@/lib/content";
import { compatibility } from "@/lib/compat";

export const metadata: Metadata = {
  title: "Совместимость знаков зодиака: таблица пар в любви и браке",
  description: "Совместимость знаков зодиака в любви, дружбе и работе: выберите два знака и получите процент и разбор пары. Полная таблица 12×12 и лучшие пары.",
  alternates: { canonical: "/sovmestimost" },
};

export default function CompatIndex() {
  const signs = getZodiac();
  const best = signs.flatMap((a) => signs.filter((b) => a.slug < b.slug).map((b) => ({ a, b, c: compatibility(a, b) }))).sort((x, y) => y.c.score - x.c.score).slice(0, 8);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/sovmestimost", label: "Совместимость" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Совместимость знаков зодиака</h1>
      <p className="text-muted mt-2 max-w-2xl">Выберите два знака и узнайте, насколько они подходят друг другу в любви, дружбе и работе. Оценка строится на стихиях и характере знаков.</p>
      <div className="mt-6 max-w-2xl"><PairPicker signs={signs} /></div>

      {best.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl mb-3">Самые гармоничные пары</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {best.map(({ a, b, c }) => (
              <Link key={a.slug + b.slug} href={`/sovmestimost/${a.slug}-${b.slug}`} className="card card-hover p-4">
                <p className="font-semibold">{a.symbol} {a.name} + {b.symbol} {b.name}</p>
                <p className="text-sm text-muted mt-1">{c.score}% · {c.verdict}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {signs.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl mb-3">Таблица совместимости</h2>
          <div className="overflow-x-auto card p-2">
            <table className="text-xs sm:text-sm w-full">
              <thead>
                <tr>
                  <th className="p-1"></th>
                  {signs.map((b) => <th key={b.slug} className="p-1 text-center" title={b.name}>{b.symbol}</th>)}
                </tr>
              </thead>
              <tbody>
                {signs.map((a) => (
                  <tr key={a.slug}>
                    <th className="p-1 text-left whitespace-nowrap">{a.symbol} {a.name}</th>
                    {signs.map((b) => {
                      const c = compatibility(a, b);
                      const bg = c.score >= 80 ? "bg-green-500/25" : c.score >= 65 ? "bg-yellow-500/25" : "bg-red-500/15";
                      return (
                        <td key={b.slug} className={`p-1 text-center ${bg}`}>
                          <Link href={`/sovmestimost/${a.slug}-${b.slug}`} className="block">{c.score}</Link>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted mt-2">Строка — первый знак, столбец — второй. Нажмите на число, чтобы открыть разбор пары.</p>
        </section>
      )}
    </div>
  );
}
