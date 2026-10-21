import Link from "next/link";
import type { ReactNode } from "react";
import TarotCardView from "@/components/TarotCardView";
import type { TarotCard } from "@/lib/content";

type Item = { card: TarotCard; label: string };

/** Небольшой блок «Таро по теме страницы»: 1–2 главные карты с картинкой, ряд связанных карт и ссылка на гадание «да или нет». */
export default function TarotHint({ title, lede, items, related = [], relatedLabel, className = "mt-10" }: { title: string; lede?: ReactNode; items: Item[]; related?: TarotCard[]; relatedLabel?: string; className?: string }) {
  if (!items.length) return null;
  return (
    <section className={className} aria-labelledby="tarot-hint">
      <h2 id="tarot-hint" className="text-2xl mb-3">{title}</h2>
      <div className="card p-5">
        {lede && <p className="text-muted max-w-2xl mb-4">{lede}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(({ card, label }) => (
            <Link key={card.slug} href={`/taro/karty/${card.slug}`} className="flex gap-4 items-start group">
              <TarotCardView slug={card.slug} name={card.name} className="tcard-thumb w-16 shrink-0" sizes="64px" />
              <span className="min-w-0">
                <span className="mono block">{label}</span>
                <span className="display text-lg block group-hover:text-accent-text">{card.name}</span>
                <span className="text-sm text-muted block">{card.keywords.slice(0, 3).join(" · ")}</span>
              </span>
            </Link>
          ))}
        </div>
        {related.length > 0 && (
          <div className="mt-4">
            {relatedLabel && <p className="mono mb-2">{relatedLabel}</p>}
            <div className="flex flex-wrap gap-2">
              {related.map((c) => <Link key={c.slug} href={`/taro/karty/${c.slug}`} className="chip hover:text-ink hover:border-gold">{c.name}</Link>)}
            </div>
          </div>
        )}
        <p className="text-sm mt-4">Есть вопрос, на который нужен короткий ответ? Вытяните одну карту в гадании <Link href="/taro/da-net" className="text-accent-text underline">Таро «да или нет»</Link> или посмотрите <Link href="/taro/karty" className="text-accent-text underline">значения всех карт</Link>.</p>
      </div>
    </section>
  );
}
