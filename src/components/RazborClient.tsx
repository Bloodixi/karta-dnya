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

/** Форма оплаты: цель «razbor_checkout» при отправке, обычный POST на /api/razbor/checkout. */
export function RazborCheckoutForm({ counter, children }: { counter?: string; children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      method="post"
      action="/api/razbor/checkout"
      aria-busy={busy}
      onSubmit={() => {
        reachGoal(counter, "razbor_checkout");
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

export function CopyLinkButton() {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost no-print"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setDone(true);
          setTimeout(() => setDone(false), 2500);
        } catch {
          window.prompt("Скопируй ссылку:", window.location.href);
        }
      }}
    >
      {done ? "Ссылка скопирована" : "Скопировать ссылку"}
    </button>
  );
}

/** Ждёт подтверждения оплаты: обновляет серверную страницу каждые 3 с, не больше `max` раз, потом показывает `fallback`. */
export function PaymentWaiter({ max = 40, fallback }: { max?: number; fallback: ReactNode }) {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (tries >= max) return;
    const t = setTimeout(() => {
      setTries((n) => n + 1);
      router.refresh();
    }, 3000);
    return () => clearTimeout(t);
  }, [tries, max, router]);
  if (tries >= max) return <>{fallback}</>;
  return (
    <p className="text-sm text-muted mt-4" aria-live="polite">
      Проверяем статус платежа… Страница обновится сама.
    </p>
  );
}
