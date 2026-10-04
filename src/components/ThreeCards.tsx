"use client";

import Link from "next/link";
import { useState } from "react";

type Card = { slug: string; name: string; keywords: string[]; upright: string; reversed: string; advice: string; arcana: string; suitName: string | null };
type Drawn = { card: Card; reversed: boolean };
const POSITIONS = ["Прошлое", "Настоящее", "Будущее"];

export default function ThreeCards({ cards }: { cards: Card[] }) {
  const [res, setRes] = useState<Drawn[] | null>(null);
  const [question, setQuestion] = useState("");
  const draw = () => {
    const pool = [...cards];
    const out: Drawn[] = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      out.push({ card: pool.splice(idx, 1)[0], reversed: Math.random() < 0.3 });
    }
    setRes(out);
  };
  return (
    <div className="card p-6">
      <label className="grid gap-1 text-sm">
        Ситуация или вопрос (по желанию)
        <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Как сложится мой переезд?" className="border border-line rounded-lg px-3 py-2 bg-surface" maxLength={200} />
      </label>
      <button type="button" onClick={draw} className="btn mt-4">{res ? "Разложить заново" : "Разложить три карты"}</button>
      {res && (
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {res.map((d, i) => (
            <div key={d.card.slug} className="grid gap-3">
              <p className="chip self-start">{i + 1}. {POSITIONS[i]}</p>
              <div className={`tarot-card w-40 ${d.reversed ? "reversed" : ""}`}>
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-70">{d.card.arcana === "major" ? "Старший аркан" : d.card.suitName}</p>
                  <p className="display text-xl mt-1">{d.card.name}</p>
                </div>
              </div>
              <p className="font-semibold">{d.card.name}{d.reversed ? " (перевёрнутая)" : ""}</p>
              <p className="text-sm text-muted">{d.reversed ? d.card.reversed : d.card.upright}</p>
              <p className="text-xs"><Link href={`/taro/karty/${d.card.slug}`} className="text-accent underline">подробнее о карте</Link></p>
            </div>
          ))}
          <div className="md:col-span-3 border-l-2 border-gold pl-3 italic text-sm">
            Совет расклада: {res[2].card.advice}
          </div>
        </div>
      )}
    </div>
  );
}
