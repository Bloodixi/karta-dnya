"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { giftHasLink } from "@/lib/giftText";
import { umamiTrack } from "@/lib/umami";

type Ym = (id: number, action: "reachGoal", goal: string) => void;

function reachGoal(counter: string | undefined, goal: string) {
  umamiTrack(goal);
  if (!counter) return;
  try {
    const ym = (window as unknown as { ym?: Ym }).ym;
    if (typeof ym === "function") ym(Number(counter), "reachGoal", goal);
  } catch {}
}

const FIELD = "border border-line rounded-lg px-3 py-2 bg-surface min-w-0";
const LINK_HINT = "Без ссылок и адресов: письмо уходит от имени сайта. Даты вроде 14.03 можно.";

/** Галочка «Присылать раз в год напоминание о новом прогнозе» (по умолчанию выключена) → consent_yearly в заказе. */
export function YearlyConsent() {
  return (
    <label className="flex items-start gap-2 text-sm mt-5 max-w-md cursor-pointer">
      <input type="checkbox" name="consent_yearly" value="1" defaultChecked={false} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
      <span>
        Присылать раз в год напоминание о новом прогнозе
        <span className="block text-xs text-muted">Одно письмо через 11 месяцев — с бесплатной частью прогноза на следующий год. Отписаться можно по ссылке в письме.</span>
      </span>
    </label>
  );
}

/** Поля подарка: подпись, пожелание, e-mail получателя, день отправки и согласие (оферта, п. 5.4). Лимиты — как на сервере (razborGift.parseGift). */
export function GiftExtraFields({ today, maxDate, err, what, note }: { today: string; maxDate: string; err?: string; what: string; note?: string }) {
  const [from, setFrom] = useState("");
  const [wish, setWish] = useState("");
  const [to, setTo] = useState("");
  const [when, setWhen] = useState<"now" | "date">("now");
  const [ok, setOk] = useState(false);
  const fromRef = useRef<HTMLInputElement>(null);
  const wishRef = useRef<HTMLTextAreaElement>(null);
  const fromLink = giftHasLink(from);
  const wishLink = giftHasLink(wish);
  useEffect(() => {
    fromRef.current?.setCustomValidity(fromLink ? LINK_HINT : "");
    wishRef.current?.setCustomValidity(wishLink ? LINK_HINT : "");
  }, [fromLink, wishLink]);
  const bad = (code: string) => (err === code ? true : undefined);
  return (
    <div className="grid gap-4 mt-4 max-w-md text-sm">
      {note ? <p className="text-muted">{note}</p> : null}
      <label className="grid gap-1">
        От кого
        <input ref={fromRef} type="text" name="gift_from" required value={from} onChange={(e) => setFrom(e.target.value)} maxLength={40} placeholder="Например, мама и папа" aria-invalid={bad("gift_from") ?? (fromLink || undefined)} className={FIELD} />
        <span className={`text-xs ${fromLink ? "text-danger" : "text-muted"}`} aria-live="polite">{fromLink ? LINK_HINT : "Так подпишем подарок, до 40 знаков: например, «Ольга»."}</span>
      </label>
      <label className="grid gap-1">
        Пожелание (необязательно)
        <textarea ref={wishRef} name="gift_wish" value={wish} onChange={(e) => setWish(e.target.value)} maxLength={300} rows={3} placeholder="Пара тёплых слов — их увидит получатель" aria-invalid={bad("gift_wish") ?? (wishLink || undefined)} className={FIELD} />
        <span className={`text-xs ${wishLink ? "text-danger" : "text-muted"}`} aria-live="polite">{wishLink ? LINK_HINT : "До 300 знаков, без ссылок."}</span>
      </label>
      <label className="grid gap-1">
        E-mail получателя (необязательно)
        <input type="email" name="gift_to" maxLength={200} autoComplete="off" placeholder="friend@example.ru" value={to} onChange={(e) => setTo(e.target.value)} aria-invalid={bad("gift_email")} className={FIELD} />
        <span className="text-xs text-muted">Оставь пустым — ссылка придёт только тебе, и ты передашь её сам(а).</span>
      </label>
      {to.trim() ? (
        <>
          <fieldset className="grid gap-2">
            <legend className="mb-1">Когда отправить письмо получателю</legend>
            <label className="flex items-center gap-2">
              <input type="radio" name="gift_when" value="now" checked={when === "now"} onChange={() => setWhen("now")} />
              Сразу после оплаты
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="gift_when" value="date" checked={when === "date"} onChange={() => setWhen("date")} />
              В выбранный день, например к празднику
            </label>
            {when === "date" ? <input type="date" name="gift_at" required min={today} max={maxDate} aria-invalid={bad("gift_date")} className={FIELD + " w-48"} /> : null}
            <span className="text-xs text-muted">
              Письмо уходит в 9 утра по Москве. Ссылка на {what} в любом случае сразу придёт тебе.
              {when === "date" && what !== "сертификат" ? " Прогноз начнётся с месяца отправки." : ""}
            </span>
          </fieldset>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="gift_ok" value="1" required checked={ok} onChange={(e) => setOk(e.target.checked)} aria-invalid={bad("gift_consent")} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
            <span>
              Получатель не будет против письма от сайта с моим подарком (<Link href="/oferta" className="underline">оферта, п. 5.4</Link>)
            </span>
          </label>
        </>
      ) : null}
    </div>
  );
}

/**
 * «Себе / В подарок» для совместимости и детского разбора: в подарок — поля подарка, иначе — галочка напоминания через год.
 * `onMode` — родителю (пакет в подарок не оформляется). Цель Метрики «<product>_gift_mode» — один раз.
 */
export default function GiftModeFields({
  counter,
  product,
  today,
  maxDate,
  gift: initial = false,
  err,
  onMode,
}: {
  counter?: string;
  product: "compat" | "child";
  today: string;
  maxDate: string;
  gift?: boolean;
  err?: string;
  onMode?: (gift: boolean) => void;
}) {
  const [gift, setGift] = useState(initial);
  const sent = useRef(false);
  const pick = (g: boolean) => {
    setGift(g);
    onMode?.(g);
    if (g && !sent.current) {
      sent.current = true;
      reachGoal(counter, `${product}_gift_mode`);
    }
  };
  const self = product === "compat" ? "Для нас" : "Для себя";
  const note =
    product === "compat"
      ? "Совместимость строится по двум датам выше — это даты пары, которой ты даришь. Письмо можно отправить одному из двоих."
      : "Разбор строится по дате ребёнка выше. Его читает родитель — письмо отправим ему.";
  return (
    <>
      <fieldset className="mt-5">
        <legend className="text-sm mb-2">{product === "compat" ? "Кому совместимость" : "Кому разбор"}</legend>
        <div className="inline-flex rounded-lg border border-line overflow-hidden text-sm">
          {[
            { v: false, label: self },
            { v: true, label: "В подарок" },
          ].map((o) => (
            <label key={o.label} className={`px-4 py-2 min-h-11 flex items-center cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-accent ${gift === o.v ? "bg-ink text-bg" : "bg-surface"}`}>
              <input type="radio" name="for" value={o.v ? "gift" : "self"} checked={gift === o.v} onChange={() => pick(o.v)} className="sr-only" />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
      {gift ? <GiftExtraFields today={today} maxDate={maxDate} err={err} what={product === "compat" ? "совместимость" : "разбор"} note={note} /> : <YearlyConsent />}
    </>
  );
}
