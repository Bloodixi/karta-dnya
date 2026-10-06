"use client";

import Link from "next/link";
import { useState } from "react";
import TarotCardView from "./TarotCardView";

export type SpreadCard = { slug: string; name: string; upright: string; reversed: string };
type Position = { name: string; meaning: string };
type Drawn = { card: SpreadCard; reversed: boolean };

/** Сетка по числу карт: 12 — 4×3, 10 — 5×2, 7 — 4+3, 5–6 — в один-два ряда; ширина ограничена, чтобы карты оставались миниатюрами. */
function cols(n: number) {
  if (n >= 12) return "grid-cols-3 sm:grid-cols-4 max-w-2xl";
  if (n >= 9) return "grid-cols-3 sm:grid-cols-5 max-w-3xl";
  if (n >= 6) return "grid-cols-3 sm:grid-cols-4 max-w-2xl";
  if (n >= 4) return "grid-cols-3 sm:grid-cols-5 max-w-3xl";
  if (n === 3) return "grid-cols-3 max-w-md";
  return "grid-cols-1 max-w-[180px]";
}

/** Короткое значение: первое предложение текста. */
function brief(text: string) {
  const m = text.match(/^.*?[.!?](\s|$)/);
  return m ? m[0].trim() : text;
}

export default function Spread({ positions, cards }: { positions: Position[]; cards: SpreadCard[] }) {
  const [res, setRes] = useState<Drawn[] | null>(null);
  const [round, setRound] = useState(0);
  const n = positions.length;
  const draw = () => {
    const pool = [...cards];
    const out: Drawn[] = [];
    for (let i = 0; i < n && pool.length; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      out.push({ card: pool.splice(idx, 1)[0], reversed: Math.random() < 0.3 });
    }
    setRes(out);
    setRound((r) => r + 1);
  };
  const grid = `mt-6 grid gap-4 sm:gap-5 ${cols(n)}`;
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={draw} className="btn">{res ? "Разложить заново" : "Разложить"}</button>
        <span className="mono">{n} {n === 1 ? "карта" : n < 5 ? "карты" : "карт"} · 78 в колоде</span>
      </div>
      {!res && (
        <div className={grid} aria-label="Карты рубашкой вверх">
          {positions.map((p, i) => (
            <div key={p.name} className="grid gap-2 text-center">
              <TarotCardView slug="shut" name="рубашка" faceDown className="tcard-thumb" sizes="(min-width: 768px) 200px, 30vw" />
              <span className="text-xs text-muted">{i + 1}. {p.name}</span>
            </div>
          ))}
        </div>
      )}
      {res && (
        <div className={grid}>
          {res.map((d, i) => (
            <div key={`${round}-${d.card.slug}`} className="grid gap-2 content-start">
              <div style={{ "--flip-delay": `${0.1 + i * 0.12}s` } as React.CSSProperties}>
                <TarotCardView slug={d.card.slug} name={d.card.name} reversed={d.reversed} flipIn className="tcard-thumb" sizes="(min-width: 768px) 200px, 30vw" />
              </div>
              <p className="mono">{i + 1}. {positions[i].name}</p>
              <p className="font-semibold text-sm leading-snug">{d.card.name}{d.reversed ? <span className="text-muted font-normal"> (перевёрнутая)</span> : null}</p>
              <p className="text-xs text-muted leading-snug">{brief(d.reversed ? d.card.reversed : d.card.upright)}</p>
              <p className="text-xs"><Link href={`/taro/karty/${d.card.slug}`} className="text-accent underline">о карте</Link></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
