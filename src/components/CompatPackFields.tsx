"use client";

import { useRef, useState } from "react";
import GiftModeFields from "@/components/GiftModeFields";
import { PayButtons } from "@/components/RazborClient";

type Ym = (id: number, action: "reachGoal", goal: string) => void;

/** Цель Метрики «pack_toggle» (как на /razbor); счётчика может не быть — тогда ничего. */
function reachGoal(counter: string | undefined, goal: string) {
  if (!counter) return;
  try {
    const ym = (window as unknown as { ym?: Ym }).ym;
    if (typeof ym === "function") ym(Number(counter), "reachGoal", goal);
  } catch {}
}

const FIELD = "border border-line rounded-lg px-3 py-2 bg-surface min-w-0";

/**
 * Хвост формы оплаты совместимости: галочка «+ личный разбор» (пакет), e-mail и кнопки оплаты с ценой по выбору.
 * Пакет зеркалит «+ совместимость» на /razbor: тот же продукт pack, личный разбор — по первой дате формы.
 * `pack` — нет предложения (банк совместимости не готов) → только e-mail и кнопки.
 */
export default function CompatPackFields({
  counter,
  price,
  firstDate,
  err,
  pack: offer,
  gift: giftOffer,
}: {
  counter?: string;
  price: number;
  /** Первая дата формы, дд.мм.гггг — по ней личный разбор. */
  firstDate: string;
  err?: string;
  pack?: { addon: number; total: number; on?: boolean };
  /** Режим «В подарок»: сегодня и предел даты отправки (по Москве), выбран ли сразу (?g=1). Пакет в подарок не оформляется. */
  gift?: { today: string; maxDate: string; on?: boolean };
}) {
  const [on, setOn] = useState(Boolean(offer?.on));
  const [gift, setGift] = useState(Boolean(giftOffer?.on));
  const sent = useRef(false);
  const packOn = Boolean(offer && on && !gift);
  const toggle = (v: boolean) => {
    setOn(v);
    if (v && !sent.current) {
      sent.current = true;
      reachGoal(counter, "pack_toggle");
    }
  };
  return (
    <>
      {giftOffer ? <GiftModeFields counter={counter} product="compat" today={giftOffer.today} maxDate={giftOffer.maxDate} gift={giftOffer.on} err={err} onMode={setGift} /> : null}
      {offer && !gift ? (
        <div className={`mt-5 rounded-lg border p-4 max-w-md transition-colors ${packOn ? "border-accent" : "border-line"}`}>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="pack" value="1" checked={on} onChange={(e) => toggle(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
            <span>
              <strong>+ личный разбор за {offer.addon} ₽</strong>
              <span className="block text-muted">
                Разбор по дате {firstDate} — для того, кто указан первым: числа, квадрат Пифагора, личный год и прогноз на 12 месяцев.
              </span>
            </span>
          </label>
          {packOn ? (
            <p className="text-xs text-muted mt-3">Вместе — {offer.total} ₽. Придут две ссылки: на совместимость и на личный разбор.</p>
          ) : null}
        </div>
      ) : null}
      <label className="grid gap-1 text-sm mt-4 max-w-sm">
        {packOn ? "E-mail — пришлём сюда обе ссылки и чек" : gift ? "Твой e-mail — пришлём сюда ссылку и чек" : "E-mail — пришлём сюда ссылку и чек"}
        <input type="email" name="email" required autoComplete="email" maxLength={200} placeholder="you@example.ru" aria-invalid={err === "email" || undefined} className={FIELD} />
      </label>
      <PayButtons price={packOn && offer ? offer.total : price} />
    </>
  );
}
