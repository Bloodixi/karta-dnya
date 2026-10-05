"use client";

import Link from "next/link";
import { useState } from "react";
import TarotCardView from "./TarotCardView";

type Card = { slug: string; name: string; keywords: string[]; upright: string; reversed: string; advice: string; arcana: string; suitName: string | null };

const NEGATIVE = new Set(["bashnya", "smert", "dyavol", "luna", "povesheniy", "povechenny", "troyka-mechey", "desyatka-mechey", "pyaterka-pentakley", "pyaterka-kubkov", "vosmerka-kubkov", "devyatka-mechey", "pyaterka-mechey", "semerka-mechey", "vosmerka-mechey"]);
const NEUTRAL = new Set(["dvoyka-mechey", "semerka-pentakley", "chetvyorka-kubkov", "otshelnik", "umerennost", "koleso-fortuny", "sud", "spravedlivost"]);

function verdict(c: Card, reversed: boolean): { answer: string; tone: "yes" | "no" | "maybe"; why: string } {
  const neg = NEGATIVE.has(c.slug), neu = NEUTRAL.has(c.slug);
  if (neu) return { answer: "Скорее нет, пока рано", tone: "maybe", why: "Карта говорит о паузе и неопределённости: ответ зависит от ваших следующих шагов." };
  if (!reversed && !neg) return { answer: "Да", tone: "yes", why: "Прямое положение благоприятной карты: обстоятельства на вашей стороне." };
  if (reversed && neg) return { answer: "Скорее да", tone: "maybe", why: "Перевёрнутая сложная карта смягчает её значение: препятствие ослабевает." };
  if (!reversed && neg) return { answer: "Нет", tone: "no", why: "Карта предупреждает: сейчас затея потребует больше, чем даст." };
  return { answer: "Скорее нет", tone: "no", why: "Перевёрнутая карта: нужное пока заблокировано или требует другого подхода." };
}

export default function YesNo({ cards }: { cards: Card[] }) {
  const [res, setRes] = useState<{ card: Card; reversed: boolean } | null>(null);
  const [question, setQuestion] = useState("");
  const draw = () => {
    const card = cards[Math.floor(Math.random() * cards.length)];
    setRes({ card, reversed: Math.random() < 0.3 });
  };
  const v = res ? verdict(res.card, res.reversed) : null;
  const color = v?.tone === "yes" ? "text-green-600 dark:text-green-400" : v?.tone === "no" ? "text-red-600 dark:text-red-400" : "text-gold";
  return (
    <div className="card p-6">
      <label className="grid gap-1 text-sm">
        Ваш вопрос (можно не писать, просто держите его в голове)
        <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Стоит ли мне…?" className="border border-line rounded-lg px-3 py-2 bg-surface" maxLength={200} />
      </label>
      <div className="mt-6 grid gap-6 md:grid-cols-[200px_1fr] items-start">
        <button type="button" onClick={draw} className="w-48 text-left group" aria-label={res ? "Вытянуть ещё раз" : "Вытянуть карту"}>
          <TarotCardView key={res ? `${res.card.slug}-${res.reversed}` : "down"} slug={res ? res.card.slug : "shut"} name={res ? res.card.name : "рубашка"} reversed={res?.reversed} faceDown={!res} flipIn={!!res} className="tcard-thumb" sizes="(min-width: 768px) 200px, 45vw" />
          <span className="block text-center text-sm text-muted mt-2">{res ? "Нажмите, чтобы вытянуть ещё раз" : "Нажмите на карту, чтобы вытянуть"}</span>
        </button>
        {res && v ? (
          <div>
            {question && <p className="text-muted text-sm">Вопрос: «{question}»</p>}
            <p className={`display text-4xl mt-1 ${color}`}>{v.answer}</p>
            <p className="mt-2">{v.why}</p>
            <p className="mt-3 text-sm text-muted">{res.reversed ? "Перевёрнутое положение. " : ""}{res.reversed ? res.card.reversed : res.card.upright}</p>
            <p className="mt-3 border-l-2 border-gold pl-3 italic text-sm">{res.card.advice}</p>
            <p className="mt-3 text-sm"><Link href={`/taro/karty/${res.card.slug}`} className="text-accent underline">Подробнее о карте «{res.card.name}»</Link></p>
          </div>
        ) : (
          <p className="text-muted self-center">Сформулируйте вопрос так, чтобы на него можно было ответить «да» или «нет», и переверните карту.</p>
        )}
      </div>
    </div>
  );
}
