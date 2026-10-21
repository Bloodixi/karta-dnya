import Link from "next/link";
import { getTarot } from "@/lib/content";
import { TAROT_SUITS } from "@/lib/tarot-links";

/** Все 78 карт списком ссылок по группам: старшие арканы и четыре масти. Лёгкий текстовый указатель без картинок. */
export default function TarotIndex({ className = "" }: { className?: string }) {
  const cards = getTarot();
  if (!cards.length) return null;
  const groups = [
    { title: "Старшие арканы", href: "/taro/arkany/starshie", list: cards.filter((c) => c.arcana === "major") },
    ...TAROT_SUITS.map((s) => {
      const list = cards.filter((c) => c.suit === s).sort((a, b) => a.number - b.number);
      return { title: list[0]?.suitName || s, href: "", list };
    }),
  ].filter((g) => g.list.length);
  return (
    <section className={className} aria-labelledby="tarot-index">
      <h2 id="tarot-index" className="text-2xl mb-1">Значения всех 78 карт Таро</h2>
      <p className="text-muted mb-4 max-w-2xl">Прямое и перевёрнутое положение, любовь, работа и ответ «да или нет» для каждой карты колоды Райдера–Уэйта.</p>
      <div className="card p-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {groups.map((g) => (
          <div key={g.title}>
            <h3 className="mono mb-2">{g.href ? <Link href={g.href} className="hover:text-ink">{g.title}</Link> : g.title}</h3>
            <ul className="space-y-1 text-sm">
              {g.list.map((c) => (
                <li key={c.slug}>
                  <Link href={`/taro/karty/${c.slug}`} className="hover:text-accent-text">
                    {c.arcana === "major" && <span className="text-muted tabular-nums">{c.number} · </span>}
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/taro/karty" className="chip hover:text-ink hover:border-gold">Карты с картинками</Link>
        <Link href="/taro/da-net" className="chip hover:text-ink hover:border-gold">Таро да или нет</Link>
        <Link href="/karta-dnya" className="chip hover:text-ink hover:border-gold">Карта дня</Link>
      </div>
    </section>
  );
}
