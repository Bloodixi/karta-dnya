"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type Ym = (id: number, action: "reachGoal", goal: string) => void;

/** Цель Яндекс.Метрики; счётчика может не быть (нет METRIKA_ID, блокировщик) — тогда молча ничего. */
function reachGoal(counter: string | undefined, goal: string) {
  if (!counter) return;
  try {
    const ym = (window as unknown as { ym?: Ym }).ym;
    if (typeof ym === "function") ym(Number(counter), "reachGoal", goal);
  } catch {}
}

/** Отправляет цель один раз при показе блока. */
export function RazborGoal({ counter, goal }: { counter?: string; goal: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    // Метрика грузится afterInteractive — даём ей секунду на инициализацию.
    const t = setTimeout(() => reachGoal(counter, goal), 1200);
    return () => clearTimeout(t);
  }, [counter, goal]);
  return null;
}

/** Форма оплаты: цель «razbor_checkout_click» при отправке, обычный POST на /api/razbor/checkout. */
export function RazborCheckoutForm({ counter, children }: { counter?: string; children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      method="post"
      action="/api/razbor/checkout"
      aria-busy={busy}
      onSubmit={() => {
        reachGoal(counter, "razbor_checkout_click");
        setBusy(true);
      }}
      className={busy ? "opacity-70 pointer-events-none" : undefined}
    >
      {children}
    </form>
  );
}

export function PrintButton() {
  return (
    <button type="button" className="btn no-print" onClick={() => window.print()}>
      Сохранить в PDF
    </button>
  );
}

/** Копирует `url` (абсолютный или путь сайта) или адрес текущей страницы. */
export function CopyLinkButton({ url }: { url?: string } = {}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost no-print"
      onClick={async () => {
        const href = url ? new URL(url, window.location.origin).href : window.location.href;
        try {
          await navigator.clipboard.writeText(href);
          setDone(true);
          setTimeout(() => setDone(false), 2500);
        } catch {
          window.prompt("Скопируй ссылку:", href);
        }
      }}
    >
      {done ? "Ссылка скопирована" : "Скопировать ссылку"}
    </button>
  );
}

/**
 * Ждёт подтверждения оплаты: раз в 2 с спрашивает /api/razbor/status, не дольше `max` попыток (≈60 с).
 * Когда статус итоговый — перерисовывает серверную страницу; по истечении времени показывает `fallback`.
 */
export function PaymentWaiter({ order, max = 30, fallback }: { order: string; max?: number; fallback: ReactNode }) {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (tries >= max) return;
    let stop = false;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/razbor/status?o=${encodeURIComponent(order)}`, { cache: "no-store" });
        const s = (await r.json()) as { status?: string };
        if (!stop && (s.status === "paid" || s.status === "canceled" || s.status === "refunded")) return router.refresh();
      } catch {}
      if (!stop) setTries((n) => n + 1);
    }, 2000);
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [tries, max, order, router]);
  if (tries >= max) return <>{fallback}</>;
  return (
    <p className="text-sm text-muted mt-4" aria-live="polite">
      Проверяем статус платежа… Страница обновится сама.
    </p>
  );
}
