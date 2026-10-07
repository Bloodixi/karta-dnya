import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import TarotCardView from "@/components/TarotCardView";
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
      <div className="mt-4 flex flex-wrap gap-2"><Link href="/taro/arkany/starshie" className="btn btn-ghost">Старшие арканы</Link><Link href="/taro/arkany/mladshie" className="btn btn-ghost">Младшие арканы</Link><Link href="/taro/tri-karty" className="btn btn-ghost">Расклад на три карты</Link><Link href="/matrica-sudby/arkany" className="btn btn-ghost">Арканы в матрице судьбы</Link></div>
      {!cards.length && <p className="text-muted mt-6">Колода готовится.</p>}
      {major.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl mb-3">Старшие арканы</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {major.map((c) => (
              <Link key={c.slug} href={`/taro/karty/${c.slug}`} className="text-center group">
                <TarotCardView slug={c.slug} name={c.name} className="tcard-thumb" sizes="(min-width: 1024px) 130px, (min-width: 640px) 20vw, 28vw" />
                <p className="font-semibold mt-2 text-sm group-hover:text-accent">{c.number}. {c.name}</p>
                <p className="text-xs text-muted">{c.keywords.slice(0, 2).join(", ")}</p>
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
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-4">
              {list.map((c) => (
                <Link key={c.slug} href={`/taro/karty/${c.slug}`} className="text-center group">
                  <TarotCardView slug={c.slug} name={c.name} className="tcard-thumb" sizes="(min-width: 1024px) 130px, (min-width: 640px) 20vw, 28vw" />
                  <p className="font-semibold mt-2 text-sm group-hover:text-accent">{c.name}</p>
                  <p className="text-xs text-muted">{c.keywords.slice(0, 2).join(", ")}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
