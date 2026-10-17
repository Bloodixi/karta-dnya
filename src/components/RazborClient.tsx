"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BirthDateInput from "@/components/BirthDateInput";
import { YearlyConsent } from "@/components/GiftModeFields";
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

/** Форма оплаты: цель `goal` (по умолчанию «razbor_checkout_click») при отправке, обычный POST на /api/razbor/checkout. */
export function RazborCheckoutForm({ counter, goal = "razbor_checkout_click", children }: { counter?: string; goal?: string; children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      method="post"
      action="/api/razbor/checkout"
      aria-busy={busy}
      onSubmit={() => {
        reachGoal(counter, goal);
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

/**
 * «Скачать PDF»: обычная ссылка на …/buklet/pdf (без download — если PDF ещё не готов, откроется страница «готовится»).
 * Сервер собирает буклет до минуты — пока ждём, кнопка подсказывает; файл скачается сам, страница останется.
 */
export function PdfLink({ href, className = "btn" }: { href: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!busy) return;
    const t = setTimeout(() => setBusy(false), 90_000);
    return () => clearTimeout(t);
  }, [busy]);
  return (
    <a href={href} className={`${className} no-print`} rel="nofollow" aria-busy={busy} onClick={() => setBusy(true)}>
      {busy ? "Готовлю PDF — до минуты…" : "Скачать PDF"}
    </a>
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
 * Ждёт подтверждения оплаты: спрашивает /api/razbor/status сначала раз в 2 с, потом реже (5 и 15 с) — СБП и 3-D Secure
 * подтверждаются минутами; всего `max` попыток (≈10 мин).
 * Когда статус итоговый — перерисовывает серверную страницу; по истечении времени показывает `fallback`.
 */
const pollDelay = (n: number) => (n < 15 ? 2000 : n < 39 ? 5000 : 15000);

export function PaymentWaiter({ order, max = 71, fallback }: { order: string; max?: number; fallback: ReactNode }) {
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
    }, pollDelay(tries));
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
export function RazborStickyCta({ price, from = "razbor-teaser", to = "oplata", label = "Открыть полный разбор" }: { price: number; from?: string; to?: string; label?: string }) {
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
        {label} — {price} ₽
      </a>
    </div>
  );
}

const FIELD = "border border-line rounded-lg px-3 py-2 bg-surface min-w-0";

/** Кнопки оплаты: СБП и карта (name="method" — выбор способа в ЮKassa). */
export function PayButtons({ price }: { price: number }) {
  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1">
        <button type="submit" name="method" value="sbp" className="btn btn-lg max-sm:w-full">
          Оплатить {price} ₽ по СБП
        </button>
        <button type="submit" name="method" value="" className="min-h-11 text-sm text-accent-text underline underline-offset-4 cursor-pointer max-sm:mx-auto">
          Картой или другим способом
        </button>
      </div>
      <p className="text-xs text-muted mt-2">СБП — оплата по QR-коду или в приложении банка, без ввода карты.</p>
    </>
  );
}

/** Пакет «разбор + совместимость» в форме оплаты разбора: вторая дата и имя близкого. */
export type PackOffer = { addon: number; total: number; on?: boolean; date2?: string; name2?: string; today: string };

/** Черновик формы оплаты в sessionStorage вкладки: после ошибки сервера (?err=…) поля не приходится заполнять заново. */
const DRAFT_KEY = "razbor-checkout";
type Draft = { date: string; gift: boolean; name: string; from: string; wish: string; to: string; when: "now" | "date"; at: string; ok: boolean; email: string; pack?: boolean; date2?: string; name2?: string; bdate?: string };

function readDraft(date: string): Draft | null {
  try {
    const d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null") as Draft | null;
    return d && d.date === date ? d : null;
  } catch {
    return null;
  }
}

const LINK_HINT = "Без ссылок и адресов: письмо уходит от имени сайта. Даты вроде 14.03 можно.";

/** Новогодний подарок в форме: год прогноза, готовые дни отправки (31 декабря, 1 января) и выбран ли он сразу (?ny=1). */
export type NyOffer = { year: number; dates: { iso: string; label: string }[]; on: boolean };

/**
 * Переключатель «Себе / В подарок» в форме оплаты, поля подарка и e-mail покупателя. В режиме «Себе» имя из формы
 * бесплатной части уходит скрытым полем; в подарок — свои поля даты рождения (gift_date) и имени получателя:
 * пустые, если только дата из верхней формы не была введена как дата получателя (?g=1).
 * Лимиты и проверка ссылок совпадают с серверной (razborGift.ts, giftText.ts): подпись 40, пожелание 300 знаков,
 * дата — до года вперёд, согласие получателя на письмо (оферта, п. 5.4).
 * Цель Метрики «razbor_gift_mode» — один раз, при первом выборе «В подарок».
 */
export function RazborGiftFields({ counter, date, name: initialName, today, maxDate, gift: initial = false, err, price, pack: offer, ny }: { counter?: string; date: string; name: string; today: string; maxDate: string; gift?: boolean; err?: string; price?: number; pack?: PackOffer; ny?: NyOffer }) {
  const [gift, setGift] = useState(initial);
  // ?g=1 — дата и имя в верхней форме уже получателя; иначе там свои, а поля получателя пустые
  const [name, setName] = useState(initial ? initialName : "");
  const [bdate, setBdate] = useState(initial ? date : "");
  const [bdateKey, setBdateKey] = useState(0);
  const nyFirst = ny?.on ? ny.dates[0]?.iso : undefined;
  const [from, setFrom] = useState("");
  const [wish, setWish] = useState("");
  const [to, setTo] = useState("");
  const [when, setWhen] = useState<"now" | "date">(nyFirst ? "date" : "now");
  const [at, setAt] = useState(nyFirst ?? "");
  const [ok, setOk] = useState(false);
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(Boolean(nyFirst) || err === "gift_wish" || err === "gift_email" || err === "gift_consent" || err === "gift_date");
  const [ready, setReady] = useState(false);
  const [pack, setPack] = useState(Boolean(offer?.on));
  const [date2, setDate2] = useState(offer?.date2 ?? "");
  const [name2, setName2] = useState(offer?.name2 ?? "");
  const packSent = useRef(false);
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
      if (d.gift && d.bdate !== undefined) {
        setBdate(d.bdate);
        setBdateKey((k) => k + 1);
      }
      setFrom(d.from);
      setWish(d.wish);
      setTo(d.to);
      setWhen(d.when === "date" ? "date" : "now");
      setAt(d.at);
      setOk(d.ok);
      setEmail(d.email);
      if (d.pack !== undefined) setPack(d.pack);
      if (d.date2) setDate2(d.date2);
      if (d.name2) setName2(d.name2);
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
    const d: Draft = { date, gift, name, from, wish, to, when, at, ok, email, pack, date2, name2, bdate };
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {}
  }, [ready, date, gift, name, from, wish, to, when, at, ok, email, pack, date2, name2, bdate]);

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
  const togglePack = (on: boolean) => {
    setPack(on);
    if (on && !packSent.current) {
      packSent.current = true;
      reachGoal(counter, "pack_toggle");
    }
  };
  const packOn = Boolean(offer && pack && !gift);
  return (
    <>
      <fieldset className="mt-5">
        <legend className="text-sm mb-2">Кому разбор</legend>
        <div className="inline-flex rounded-lg border border-line overflow-hidden text-sm">
          {[
            { v: false, label: "Себе" },
            { v: true, label: "В подарок" },
          ].map((o) => (
            <label key={o.label} className={`px-4 py-2 min-h-11 flex items-center cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-accent ${gift === o.v ? "bg-ink text-bg" : "bg-surface"}`}>
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
          {ny?.on ? <input type="hidden" name="ny" value="1" /> : null}
          <label className="grid gap-1 text-sm" onChange={(e) => {
            const t: EventTarget = e.target;
            if (t instanceof HTMLInputElement && t.type === "text") setBdate(t.value);
          }}>
            Дата рождения получателя
            <BirthDateInput key={bdateKey} name="gift_date" defaultValue={bdate} max={today} invalid={err === "gift_bdate"} className={FIELD + " min-h-11 tabular-nums w-48 aria-[invalid=true]:border-danger"} />
            <span className="text-xs text-muted">Разбор строится по этой дате — не по той, что в форме выше.</span>
          </label>
          <label className="grid gap-1 text-sm">
            Как зовут получателя
            <input type="text" name="name" required value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Например, Анна" aria-invalid={bad("gift_name")} className={FIELD} />
            <span className="text-xs text-muted">Это имя будет в разборе и в письме.</span>
          </label>
          <label className="grid gap-1 text-sm">
            От кого
            <input ref={fromRef} type="text" name="gift_from" required value={from} onChange={(e) => setFrom(e.target.value)} maxLength={40} placeholder="Например, мама и папа" aria-invalid={bad("gift_from") ?? (fromLink || undefined)} className={FIELD} />
            <span className={`text-xs ${fromLink ? "text-danger" : "text-muted"}`} aria-live="polite">{fromLink ? LINK_HINT : "Так подпишем подарок, до 40 знаков: например, «Ольга»."}</span>
          </label>

          <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} onInvalidCapture={() => setOpen(true)} className="text-sm">
            <summary className="cursor-pointer text-accent-text underline underline-offset-2 py-2">Добавить пожелание и отправку получателю</summary>
            <div className="grid gap-4 mt-3">
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
                      <div className="flex flex-wrap items-center gap-2">
                        <input type="date" name="gift_at" required min={today} max={maxDate} value={at} onChange={(e) => setAt(e.target.value)} aria-invalid={bad("gift_date")} className={FIELD + " w-48"} />
                        {ny?.dates.map((d) => (
                          <button key={d.iso} type="button" onClick={() => setAt(d.iso)} aria-pressed={at === d.iso} className={`chip min-h-11 cursor-pointer ${at === d.iso ? "bg-ink text-bg" : ""}`}>
                            {d.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-muted">
                      Письмо уходит в 9 утра по Москве. Ссылка на разбор в любом случае сразу придёт тебе.
                      {when === "date" ? " Прогноз по месяцам начнётся с месяца отправки — с того, когда разбор откроют; письмо с 25 декабря — прогноз с января." : ""}
                    </span>
                  </fieldset>
                  <label className="flex items-start gap-2">
                    <input type="checkbox" name="gift_ok" value="1" required checked={ok} onChange={(e) => setOk(e.target.checked)} aria-invalid={bad("gift_consent")} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
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

      {offer && !gift ? (
        <div className="mt-5 rounded-lg border border-line p-4 max-w-md">
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="pack" value="1" checked={pack} onChange={(e) => togglePack(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]" />
            <span>
              <strong>+ совместимость с близким за {offer.addon} ₽</strong>
              <span className="block text-muted">Отдельный текст о вашей паре по двум датам: образ пары, любовь, быт, споры, общий год и три совета.</span>
            </span>
          </label>
          {pack ? (
            <div className="grid gap-3 mt-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Дата рождения близкого
                <input type="date" name="date2" required min="1900-01-01" max={offer.today} value={date2} onChange={(e) => setDate2(e.target.value)} aria-invalid={bad("date2")} className={FIELD} />
              </label>
              <label className="grid gap-1 text-sm">
                Имя близкого
                <input type="text" name="name2" required maxLength={60} value={name2} onChange={(e) => setName2(e.target.value)} placeholder="Например, Сергей" aria-invalid={bad("name2")} className={FIELD} />
              </label>
              <p className="text-xs text-muted sm:col-span-2">Пара — любая: партнёр, друг, родитель, коллега. Придут две ссылки: на разбор и на совместимость.</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {!gift ? <YearlyConsent /> : null}
      <label className="grid gap-1 text-sm mt-5 max-w-sm">
        {gift ? "Твой e-mail — пришлём сюда ссылку на разбор и чек" : packOn ? "E-mail — пришлём сюда обе ссылки и чек" : "E-mail — пришлём сюда ссылку на разбор и чек"}
        <input type="email" name="email" required autoComplete="email" maxLength={200} placeholder="you@example.ru" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={err === "email" || undefined} className={FIELD} />
      </label>
      {price ? <PayButtons price={packOn && offer ? offer.total : price} /> : null}
    </>
  );
}
