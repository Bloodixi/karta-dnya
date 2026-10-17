"use client";

import Link from "next/link";
import { useState } from "react";
import ScrollToResult from "./ScrollToResult";
import TarotCardView from "./TarotCardView";
import { WISH_POSITIONS, wishAnswer, type WishTone } from "@/lib/wish";

type Card = { slug: string; name: string; upright: string; reversed: string; advice: string };
type Drawn = { card: Card; reversed: boolean };

const TONE: Record<WishTone, string> = { yes: "text-yes", likely: "text-yes", later: "text-maybe" };

/** Гадание на желание: одна карта (ответ) или три (ответ, условия, совет). Переворот и прокрутка — как в «Да или нет» и «Трёх картах». */
export default function WishCards({ cards }: { cards: Card[] }) {
  const [count, setCount] = useState<1 | 3>(1);
  const [res, setRes] = useState<Drawn[] | null>(null);
  const [wish, setWish] = useState("");
  const [round, setRound] = useState(0);
  const draw = () => {
    const pool = [...cards];
    const out: Drawn[] = [];
    for (let i = 0; i < count && pool.length; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      out.push({ card: pool.splice(idx, 1)[0], reversed: Math.random() < 0.3 });
    }
    setRes(out);
    setRound((n) => n + 1);
  };
  const pick = (n: 1 | 3) => {
    setCount(n);
    setRes(null);
  };
  const a = res ? wishAnswer(res[0].card.slug, res[0].reversed) : null;
  const text = (d: Drawn) => (d.reversed ? d.card.reversed : d.card.upright);
  return (
    <div className="card p-6">
      <label className="grid gap-1 text-sm">
        Ваше желание (можно не писать, достаточно держать его в мыслях)
        <input type="text" value={wish} onChange={(e) => setWish(e.target.value)} placeholder="Хочу, чтобы…" className="border border-line rounded-lg px-3 py-2 bg-surface" maxLength={200} />
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Сколько карт тянуть">
        {([1, 3] as const).map((n) => (
          <button key={n} type="button" onClick={() => pick(n)} aria-pressed={count === n} className={`btn text-sm ${count === n ? "" : "btn-ghost"}`}>
            {n === 1 ? "Одна карта: сбудется ли" : "Три карты: ответ, условия, совет"}
          </button>
        ))}
      </div>
      <button type="button" onClick={draw} className="btn mt-4">{res ? "Загадать снова" : count === 1 ? "Вытянуть карту" : "Вытянуть три карты"}</button>

      {!res && (
        <div className={`mt-6 grid gap-4 opacity-90 ${count === 1 ? "grid-cols-1 max-w-36 md:max-w-44" : "grid-cols-3 max-w-md"}`}>
          {WISH_POSITIONS.slice(0, count).map((p) => (
            <button key={p} type="button" onClick={draw} className="grid gap-2 text-center" aria-label={count === 1 ? "Вытянуть карту" : "Вытянуть три карты"}>
              <TarotCardView slug="shut" name="рубашка" faceDown className="tcard-thumb" sizes="(min-width: 768px) 180px, 30vw" />
              <span className="text-xs text-muted">{count === 1 ? "Нажмите, чтобы вытянуть" : p}</span>
            </button>
          ))}
        </div>
      )}

      {res && a && (
        <>
          <ScrollToResult key={round} id="wish-result" when />
          <div id="wish-result" className={`mt-6 grid gap-6 items-start scroll-mt-24 ${res.length === 1 ? "md:grid-cols-[200px_1fr]" : ""}`}>
            <div className={res.length === 1 ? "w-36 mx-auto md:mx-0 md:w-48" : "grid grid-cols-3 gap-3 sm:gap-5 max-w-xl"}>
              {res.map((d, i) => (
                <div key={d.card.slug} className="grid gap-2 content-start text-center" style={{ ["--flip-delay" as string]: `${0.1 + i * 0.3}s` }}>
                  <TarotCardView key={`${d.card.slug}-${d.reversed}`} slug={d.card.slug} name={d.card.name} reversed={d.reversed} flipIn className="tcard-thumb w-full max-w-40 mx-auto" sizes="(min-width: 768px) 200px, 30vw" />
                  {res.length > 1 && <span className="text-xs text-muted">{i + 1}. {WISH_POSITIONS[i]}</span>}
                  <span className="text-sm font-semibold leading-tight [overflow-wrap:anywhere] hyphens-auto">{d.card.name}</span>
                </div>
              ))}
            </div>
            <div>
              {wish && <p className="text-muted text-sm">Желание: «{wish}»</p>}
              <p className={`display text-4xl mt-1 ${TONE[a.tone]}`}>{a.answer}</p>
              <p className="mt-2">{a.text}</p>
              {res.length === 1 ? (
                <>
                  <p className="mt-3 text-sm text-muted">{res[0].reversed ? "Перевёрнутое положение. " : ""}{text(res[0])}</p>
                  <p className="mt-3 border-l-2 border-gold pl-3 italic text-sm">Совет: {res[0].card.advice}</p>
                  <p className="mt-3 text-sm"><Link href={`/taro/karty/${res[0].card.slug}`} className="text-accent-text underline">Подробнее о карте «{res[0].card.name}»</Link></p>
                </>
              ) : (
                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  {res.map((d, i) => (
                    <div key={d.card.slug} className="grid gap-2 content-start">
                      <p className="chip w-fit">{i + 1}. {WISH_POSITIONS[i]}</p>
                      <p className="font-semibold">{d.card.name}{d.reversed ? " (перевёрнутая)" : ""}</p>
                      <p className="text-sm text-muted">{i === 2 ? d.card.advice : text(d)}</p>
                      <p className="text-xs"><Link href={`/taro/karty/${d.card.slug}`} className="text-accent-text underline">подробнее о карте</Link></p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
