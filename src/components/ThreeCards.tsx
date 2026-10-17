"use client";

import Link from "next/link";
import { useState } from "react";
import ScrollToResult from "./ScrollToResult";
import TarotCardView from "./TarotCardView";
import TarotShareCard from "./TarotShareCard";
import { THREE_POSITIONS as POSITIONS } from "@/lib/tarotVerdict";

type Card = { slug: string; name: string; keywords: string[]; upright: string; reversed: string; advice: string; arcana: string; suitName: string | null };
type Drawn = { card: Card; reversed: boolean };

export default function ThreeCards({ cards }: { cards: Card[] }) {
  const [res, setRes] = useState<Drawn[] | null>(null);
  const [question, setQuestion] = useState("");
  const [round, setRound] = useState(0);
  const draw = () => {
    const pool = [...cards];
    const out: Drawn[] = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      out.push({ card: pool.splice(idx, 1)[0], reversed: Math.random() < 0.3 });
    }
    setRes(out);
    setRound((n) => n + 1);
  };
  return (
    <div className="card p-6">
      <label className="grid gap-1 text-sm">
        Ситуация или вопрос (по желанию)
        <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Как сложится мой переезд?" className="border border-line rounded-lg px-3 py-2 bg-surface" maxLength={200} />
      </label>
      <button type="button" onClick={draw} className="btn mt-4">{res ? "Разложить заново" : "Разложить три карты"}</button>
      {!res && (
        <div className="mt-6 grid grid-cols-3 gap-4 max-w-md opacity-90">
          {POSITIONS.map((p) => (
            <div key={p} className="grid gap-2 text-center">
              <TarotCardView slug="shut" name="рубашка" faceDown className="tcard-thumb" sizes="(min-width: 768px) 200px, 45vw" />
              <span className="text-xs text-muted">{p}</span>
            </div>
          ))}
        </div>
      )}
      {res && (
        <>
          <ScrollToResult key={round} id="three-cards-row" when />
          <div id="three-cards-row" className="mt-6 grid grid-cols-3 gap-3 sm:gap-5 max-w-xl scroll-mt-24">
            {res.map((d, i) => (
              <div key={d.card.slug} className="grid gap-2 content-start text-center" style={{ ["--flip-delay" as string]: `${0.1 + i * 0.3}s` }}>
                <TarotCardView key={`${d.card.slug}-${d.reversed}`} slug={d.card.slug} name={d.card.name} reversed={d.reversed} flipIn className="tcard-thumb w-full max-w-40 mx-auto" sizes="(min-width: 768px) 180px, 30vw" />
                <span className="text-xs text-muted">{i + 1}. {POSITIONS[i]}</span>
                <span className="text-sm font-semibold leading-tight [overflow-wrap:anywhere] hyphens-auto">{d.card.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {res.map((d, i) => (
              <div key={d.card.slug} className="grid gap-2 content-start">
                <p className="chip w-fit">{i + 1}. {POSITIONS[i]}</p>
                <p className="font-semibold">{d.card.name}{d.reversed ? " (перевёрнутая)" : ""}</p>
                <p className="text-sm text-muted">{d.reversed ? d.card.reversed : d.card.upright}</p>
                <p className="text-xs"><Link href={`/taro/karty/${d.card.slug}`} className="text-accent-text underline">подробнее о карте</Link></p>
              </div>
            ))}
            <div className="md:col-span-3 border-l-2 border-gold pl-3 italic text-sm">
              Совет расклада: {res[2].card.advice}
            </div>
          </div>
          <TarotShareCard kind="three" cards={res.map((d) => ({ slug: d.card.slug, name: d.card.name, reversed: d.reversed }))} question={question} advice={res[2].card.advice} />
        </>
      )}
    </div>
  );
}
