"use client";

import { useEffect, useRef, useState } from "react";

const STORE = "razbor_paid_goals";
const FRAME = "/razbor/spasibo/cel";

/** Номер заказа — это доступ к разбору (/r/<номер>), поэтому в localStorage кладём только его хеш. */
async function orderKey(order: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`razbor-paid:${order}`));
  return Array.from(new Uint8Array(buf).slice(0, 12), (b) => b.toString(16).padStart(2, "0")).join("");
}

function sentKeys(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function markSent(key: string) {
  try {
    localStorage.setItem(STORE, JSON.stringify([...sentKeys().filter((k) => k !== key), key].slice(-20)));
  } catch {}
}

/**
 * Цель Метрики «razbor_paid» с суммой (order_price, currency RUB) — один раз на заказ в этом браузере.
 * На самой странице «Спасибо» счётчика нет (в адресе номер заказа), цель отправляет скрытый iframe с чистым
 * адресом /razbor/spasibo/cel; сюда он отвечает, ушла ли цель. Не ушла (блокировщик, сеть) — попробуем при
 * следующем открытии страницы.
 */
export default function RazborPaidGoal({ order, amount }: { order: string; amount: number }) {
  const [key, setKey] = useState<string | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let stop = false;
    orderKey(order)
      .then((k) => {
        if (!stop && !sentKeys().includes(k)) setKey(k);
      })
      .catch(() => {});
    return () => {
      stop = true;
    };
  }, [order]);

  useEffect(() => {
    if (!key) return;
    const onMessage = (e: MessageEvent) => {
      const win = frame.current?.contentWindow;
      if (!win || e.origin !== window.location.origin || e.source !== win) return;
      const d = e.data as { type?: string; ok?: boolean } | null;
      if (d?.type === "razbor-goal-ready") {
        win.postMessage({ type: "razbor-paid", price: amount }, window.location.origin);
      } else if (d?.type === "razbor-goal-done") {
        if (d.ok) markSent(key);
        setKey(null);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [key, amount]);

  if (!key) return null;
  return <iframe ref={frame} src={FRAME} title="Служебная страница" hidden aria-hidden="true" tabIndex={-1} referrerPolicy="no-referrer" />;
}
