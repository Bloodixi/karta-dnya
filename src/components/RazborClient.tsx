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

/**
 * Липкая кнопка оплаты на телефоне: видна, пока читаешь бесплатную часть (`from`), и прячется,
 * как только блок оплаты (`to`) дошёл до экрана или остался выше. Стоит над нижней панелью TabBar.
 */
export function RazborStickyCta({ price, from = "razbor-teaser", to = "oplata" }: { price: number; from?: string; to?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const start = document.getElementById(from);
    const end = document.getElementById(to);
    if (!start || !end) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const h = window.innerHeight;
      // 9rem ≈ панель TabBar и сама кнопка: блок оплаты, выглянувший из-под них, уже считается видимым
      setShow(start.getBoundingClientRect().top < h * 0.6 && end.getBoundingClientRect().top > h - 144);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [from, to]);
  return (
    <div
      inert={!show}
      className={`md:hidden no-print fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-bg/95 backdrop-blur px-4 py-2.5 transition-[opacity,transform,visibility] duration-200 ${show ? "opacity-100 translate-y-0" : "invisible opacity-0 translate-y-2"}`}
    >
      <a href={`#${to}`} className="btn w-full justify-center">
        Открыть полный разбор — {price} ₽
      </a>
    </div>
  );
}
