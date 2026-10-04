import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getTarot } from "@/lib/content";

export const metadata: Metadata = {
  title: "Значения карт Таро: все 78 карт с толкованием",
  description: "Полный список карт Таро Райдера–Уэйта: 22 старших и 56 младших арканов, значение в прямом и перевёрнутом положении, любовь, работа и совет.",
  alternates: { canonical: "/taro/karty" },
};

export default function CardsPage() {
  const cards = getTarot();
  const major = cards.filter((c) => c.arcana === "major");
  const suits = ["zhezly", "kubki", "mechi", "pentakli"];
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/taro", label: "Таро" }, { href: "/taro/karty", label: "Значения карт" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Значения карт Таро</h1>
      <p className="text-muted mt-2 max-w-2xl">78 карт колоды Райдера–Уэйта. Нажмите на карту, чтобы прочитать значение в прямом и перевёрнутом положении, для любви и работы.</p>
      <div className="mt-4 flex flex-wrap gap-2"><Link href="/taro/arkany/starshie" className="btn btn-ghost">Старшие арканы</Link><Link href="/taro/arkany/mladshie" className="btn btn-ghost">Младшие арканы</Link><Link href="/taro/tri-karty" className="btn btn-ghost">Расклад на три карты</Link></div>
      {!cards.length && <p className="text-muted mt-6">Колода готовится.</p>}
      {major.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl mb-3">Старшие арканы</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {major.map((c) => (
              <Link key={c.slug} href={`/taro/karty/${c.slug}`} className="card card-hover p-3 text-center">
                <p className="text-xs text-muted">{c.number}</p>
                <p className="font-semibold">{c.name}</p>
                <p className="text-[11px] text-muted mt-1">{c.keywords.slice(0, 2).join(", ")}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
      {suits.map((suit) => {
        const list = cards.filter((c) => c.suit === suit).sort((a, b) => a.number - b.number);
        if (!list.length) return null;
        return (
          <section key={suit} className="mt-8">
            <h2 className="text-2xl mb-3">{list[0].suitName}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {list.map((c) => (
                <Link key={c.slug} href={`/taro/karty/${c.slug}`} className="card card-hover p-3 text-center">
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-[11px] text-muted mt-1">{c.keywords.slice(0, 2).join(", ")}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
