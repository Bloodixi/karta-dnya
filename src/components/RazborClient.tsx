"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { giftHasLink } from "@/lib/giftText";

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
export function CopyLinkButton({ url, label = "Скопировать ссылку" }: { url?: string; label?: string } = {}) {
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
      {done ? "Ссылка скопирована" : label}
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

const FIELD = "border border-line rounded-lg px-3 py-2 bg-surface min-w-0";

/** Черновик формы оплаты в sessionStorage вкладки: после ошибки сервера (?err=…) поля не приходится заполнять заново. */
const DRAFT_KEY = "razbor-checkout";
type Draft = { date: string; gift: boolean; name: string; from: string; wish: string; to: string; when: "now" | "date"; at: string; ok: boolean; email: string };

function readDraft(date: string): Draft | null {
  try {
    const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null") as Draft | null;
    return d && d.date === date ? d : null;
  } catch {
    return null;
  }
}

const LINK_HINT = "Без ссылок и адресов: письмо уходит от имени сайта. Даты вроде 14.03 можно.";

/**
 * Переключатель «Себе / В подарок» в форме оплаты, поля подарка и e-mail покупателя. В режиме «Себе» имя из формы
 * бесплатной части уходит скрытым полем; в подарок — его можно поправить (это имя получателя в разборе).
 * Лимиты и проверка ссылок совпадают с серверной (razborGift.ts, giftText.ts): подпись 40, пожелание 300 знаков,
 * дата — до года вперёд, согласие получателя на письмо (оферта, п. 5.4).
 * Цель Метрики «razbor_gift_mode» — один раз, при первом выборе «В подарок».
 */
export function RazborGiftFields({ counter, date, name: initialName, today, maxDate, gift: initial = false, err }: { counter?: string; date: string; name: string; today: string; maxDate: string; gift?: boolean; err?: string }) {
  const [gift, setGift] = useState(initial);
  const [name, setName] = useState(initialName);
  const [from, setFrom] = useState("");
  const [wish, setWish] = useState("");
  const [to, setTo] = useState("");
  const [when, setWhen] = useState<"now" | "date">("now");
  const [at, setAt] = useState("");
  const [ok, setOk] = useState(false);
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(err === "gift_wish" || err === "gift_email" || err === "gift_consent" || err === "gift_date");
  const [ready, setReady] = useState(false);
  const sent = useRef(false);
  const fromRef = useRef<HTMLInputElement>(null);
  const wishRef = useRef<HTMLTextAreaElement>(null);

  // после ошибки сервера — вернуть введённое; без ошибки черновик больше не нужен
  useEffect(() => {
    const d = err ? readDraft(date) : null;
    if (d) {
      /* eslint-disable react-hooks/set-state-in-effect -- sessionStorage есть только в браузере: читаем после гидрации */
      setGift(d.gift);
      if (d.gift) setName(d.name);
      setFrom(d.from);
      setWish(d.wish);
      setTo(d.to);
      setWhen(d.when === "date" ? "date" : "now");
      setAt(d.at);
      setOk(d.ok);
      setEmail(d.email);
      if (d.wish || d.to) setOpen(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    } else {
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {}
    }
    setReady(true);
  }, [err, date]);

  useEffect(() => {
    if (!ready) return;
    const d: Draft = { date, gift, name, from, wish, to, when, at, ok, email };
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {}
  }, [ready, date, gift, name, from, wish, to, when, at, ok, email]);

  const fromLink = giftHasLink(from);
  const wishLink = giftHasLink(wish);
  // подсказка до отправки: браузер не даст отправить форму, пока в подписи или пожелании ссылка
  useEffect(() => {
    fromRef.current?.setCustomValidity(fromLink ? LINK_HINT : "");
    wishRef.current?.setCustomValidity(wishLink ? LINK_HINT : "");
  }, [fromLink, wishLink, gift, open]);

  const pick = (g: boolean) => {
    setGift(g);
    if (g && !sent.current) {
      sent.current = true;
      reachGoal(counter, "razbor_gift_mode");
    }
  };
  const bad = (code: string) => (err === code ? true : undefined);
  const hasTo = Boolean(to.trim());
  return (
    <>
      <fieldset className="mt-5">
        <legend className="text-sm mb-2">Кому разбор</legend>
        <div className="inline-flex rounded-lg border border-line overflow-hidden text-sm">
          {[
            { v: false, label: "Себе" },
            { v: true, label: "В подарок" },
          ].map((o) => (
            <label key={o.label} className={`px-4 py-2 cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-accent ${gift === o.v ? "bg-ink text-bg" : "bg-surface"}`}>
              <input type="radio" name="for" value={o.v ? "gift" : "self"} checked={gift === o.v} onChange={() => pick(o.v)} className="sr-only" />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      {!gift ? (
        <input type="hidden" name="name" value={initialName} />
      ) : (
        <div className="grid gap-4 mt-4 max-w-md">
          <p className="text-sm text-muted">Разбор строится по дате рождения, введённой выше, — это должна быть дата получателя.</p>
          <label className="grid gap-1 text-sm">
            Как зовут получателя
            <input type="text" name="name" required value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Например, Анна" aria-invalid={bad("gift_name")} className={FIELD} />
            <span className="text-xs text-muted">Это имя будет в разборе и в письме.</span>
          </label>
          <label className="grid gap-1 text-sm">
            От кого
            <input ref={fromRef} type="text" name="gift_from" required value={from} onChange={(e) => setFrom(e.target.value)} maxLength={40} placeholder="Например, Ольга или «мама и папа»" aria-invalid={bad("gift_from") ?? (fromLink || undefined)} className={FIELD} />
            <span className={`text-xs ${fromLink ? "text-red-600" : "text-muted"}`} aria-live="polite">{fromLink ? LINK_HINT : "Так подпишем подарок, до 40 знаков."}</span>
          </label>

          <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} onInvalidCapture={() => setOpen(true)} className="text-sm">
            <summary className="cursor-pointer text-accent underline underline-offset-2">Добавить пожелание и отправку получателю</summary>
            <div className="grid gap-4 mt-3">
              <label className="grid gap-1">
                Пожелание (необязательно)
                <textarea ref={wishRef} name="gift_wish" value={wish} onChange={(e) => setWish(e.target.value)} maxLength={300} rows={3} placeholder="Пара тёплых слов — их увидит получатель" aria-invalid={bad("gift_wish") ?? (wishLink || undefined)} className={FIELD} />
                <span className={`text-xs ${wishLink ? "text-red-600" : "text-muted"}`} aria-live="polite">{wishLink ? LINK_HINT : "До 300 знаков, без ссылок."}</span>
              </label>
              <label className="grid gap-1">
                E-mail получателя (необязательно)
                <input type="email" name="gift_to" maxLength={200} autoComplete="off" placeholder="friend@example.ru" value={to} onChange={(e) => setTo(e.target.value)} aria-invalid={bad("gift_email")} className={FIELD} />
                <span className="text-xs text-muted">Оставь пустым — ссылка придёт только тебе, и ты передашь её сам(а).</span>
              </label>
              {hasTo && (
                <>
                  <fieldset className="grid gap-2">
                    <legend className="mb-1">Когда отправить письмо получателю</legend>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="gift_when" value="now" checked={when === "now"} onChange={() => setWhen("now")} />
                      Сразу после оплаты
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="gift_when" value="date" checked={when === "date"} onChange={() => setWhen("date")} />
                      В выбранный день, например ко дню рождения
                    </label>
                    {when === "date" && (
                      <input type="date" name="gift_at" required min={today} max={maxDate} value={at} onChange={(e) => setAt(e.target.value)} aria-invalid={bad("gift_date")} className={FIELD + " w-48"} />
                    )}
                    <span className="text-xs text-muted">
                      Письмо уходит утром по Москве. Ссылка на разбор в любом случае сразу придёт тебе.
                      {when === "date" ? " Прогноз по месяцам начнётся с месяца отправки — с того, когда разбор откроют." : ""}
                    </span>
                  </fieldset>
                  <label className="flex items-start gap-2">
                    <input type="checkbox" name="gift_ok" value="1" required checked={ok} onChange={(e) => setOk(e.target.checked)} aria-invalid={bad("gift_consent")} className="mt-1" />
                    <span>
                      Получатель не будет против письма от сайта с моим подарком (<Link href="/oferta" className="underline">оферта, п. 5.4</Link>)
                    </span>
                  </label>
                </>
              )}
            </div>
          </details>
        </div>
      )}

      <label className="grid gap-1 text-sm mt-5 max-w-sm">
        {gift ? "Твой e-mail — пришлём сюда ссылку на разбор и чек" : "E-mail — пришлём сюда ссылку на разбор и чек"}
        <input type="email" name="email" required autoComplete="email" maxLength={200} placeholder="you@example.ru" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={err === "email" || undefined} className={FIELD} />
      </label>
    </>
  );
}
