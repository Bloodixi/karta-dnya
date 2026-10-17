/**
 * Разбор в подарок: проверка полей формы, данные подарка для страницы результата и отложенная отправка письма
 * получателю (/api/razbor/gift-send). Только сервер.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { giftStartYm } from "./giftSeason";
import { giftHasLink, normGiftText as norm } from "./giftText";
import { productOf } from "./razborProducts";
import { getOrder, listOrders, type Gift, type Order } from "./razborStore";
import { readDocToken } from "./razborToken";
import { SITE } from "./site";

export const GIFT_FROM_MAX = 40;
export const GIFT_WISH_MAX = 300;
/** Дальше года вперёд отправку не откладываем. */
export const GIFT_DAYS_MAX = 366;

const DAY = 86_400_000;
const MSK = 3 * 3_600_000; // Москва — UTC+3 круглый год

/** Сегодня по Москве, ГГГГ-ММ-ДД (со сдвигом на `days` дней). */
export function todayMsk(days = 0): string {
  return new Date(Date.now() + MSK + days * DAY).toISOString().slice(0, 10);
}

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

/** E-mail из формы: пустая строка, если адрес не похож на настоящий (длина по RFC 5321 — до 254). */
export function cleanEmail(v: unknown): string {
  const s = String(v ?? "").trim();
  return s.length <= 254 && EMAIL_RE.test(s) ? s : "";
}

/** Однострочный текст: без управляющих символов, пробелы схлопнуты. */
const oneLine = (s: string) => norm(s).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim();

/** Пожелание: переводы строк сохраняем (не больше одной пустой строки подряд), прочие управляющие символы — в пробел. */
const multiLine = (s: string) =>
  norm(s)
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u2028\u2029]+/g, " ")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const HAS_LINK = { test: giftHasLink };

export type GiftError = "gift_name" | "gift_from" | "gift_wish" | "gift_email" | "gift_consent" | "gift_date";

/**
 * Поля подарка из формы оплаты. `name` — уже очищенное имя получателя (оно же имя в разборе); null — имя
 * проверяет сам продукт (совместимость — два имени, детский разбор — имя ребёнка необязательно, сертификат — без имени).
 * Ошибка — код для ?err= на странице продукта.
 */
export function parseGift(form: FormData, name: string | null): { gift: Gift } | { error: GiftError } {
  if (name !== null && !name) return { error: "gift_name" };
  const from = oneLine(String(form.get("gift_from") ?? ""));
  if (!from || from.length > GIFT_FROM_MAX || HAS_LINK.test(from)) return { error: "gift_from" };
  const wish = multiLine(String(form.get("gift_wish") ?? ""));
  if (wish.length > GIFT_WISH_MAX || HAS_LINK.test(wish)) return { error: "gift_wish" };
  const toRaw = String(form.get("gift_to") ?? "").trim();
  const to = toRaw ? cleanEmail(toRaw) : "";
  if (toRaw && !to) return { error: "gift_email" };
  // оферта, п. 5.4: покупатель подтверждает, что получатель не против письма
  if (to && form.get("gift_ok") !== "1") return { error: "gift_consent" };
  let sendAt: string | undefined;
  if (to && form.get("gift_when") === "date") {
    const d = String(form.get("gift_at") ?? "").trim();
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;
    if (!ok || d < todayMsk() || d > todayMsk(GIFT_DAYS_MAX)) return { error: "gift_date" };
    // сегодняшняя дата — то же, что «сразу»
    if (d > todayMsk()) sendAt = d;
  }
  return { gift: { from, ...(wish ? { wish } : {}), ...(to ? { to_email: to } : {}), ...(sendAt ? { send_at: sendAt } : {}) } };
}

/**
 * Месяц, с которого считается прогноз: для отложенного подарка — месяц и год отправки письма (дата уже по Москве;
 * письмо с 25 декабря — подарок к Новому году, прогноз с января), иначе — `now` (текущий месяц по Москве).
 */
export function giftYm(g: Gift | undefined, now: { yr: number; mo: number }): { yr: number; mo: number } {
  return (g?.send_at && giftStartYm(g.send_at)) || now;
}

/** «a***@mail.ru» — адрес для страницы «Спасибо» без полного раскрытия. */
export function maskEmail(e: string): string {
  const at = e.lastIndexOf("@");
  if (at < 1) return "***";
  return `${e[0]}***${e.slice(at)}`;
}

/** Поля подарка для metadata платежа ЮKassa (значение — до 512 знаков): по ним заказ восстанавливается без файла. */
export function giftMetadata(g: Gift | undefined): Record<string, string> {
  if (!g) return {};
  return { gift_from: g.from, ...(g.wish ? { gift_wish: g.wish } : {}), ...(g.to_email ? { gift_to: g.to_email } : {}), ...(g.send_at ? { gift_at: g.send_at } : {}) };
}

/** Подарок из metadata платежа (обратное к giftMetadata). */
export function giftFromMetadata(md: Record<string, string | undefined>): Gift | undefined {
  if (!md.gift_from) return undefined;
  return {
    from: md.gift_from,
    ...(md.gift_wish ? { wish: md.gift_wish } : {}),
    ...(md.gift_to ? { to_email: md.gift_to } : {}),
    ...(md.gift_at && /^\d{4}-\d{2}-\d{2}$/.test(md.gift_at) ? { send_at: md.gift_at } : {}),
  };
}

/** Что можно показать на странице разбора: без e-mail и дат отправки. */
export type GiftView = { to: string; from: string; wish?: string };

/**
 * Кому подарок — для плашки и страницы «Спасибо»: имя получателя разбора, пара в совместимости.
 * В детском разборе имя — ребёнка, а получатель — родитель: без имени.
 */
export function giftTo(o: Order): string {
  const p = productOf(o.product);
  if (p === "child") return "";
  if (p === "compat") return [o.name, o.name2].filter(Boolean).join(" и ");
  return o.name;
}

function view(o: Order | null): GiftView | null {
  if (!o?.gift?.from) return null;
  return { to: giftTo(o), from: o.gift.from, ...(o.gift.wish ? { wish: o.gift.wish } : {}) };
}

/**
 * Плашка «Подарок для Анны от Ольги» на странице результата: по заказу, номеру заказа или токену разбора
 * (в подписанном токене есть номер заказа). Не подарок или заказа нет — null.
 */
export async function giftFor(src: Order | string): Promise<GiftView | null> {
  if (typeof src !== "string") return view(src);
  const id = src.includes(".") ? readDocToken(src)?.order : src;
  if (!id) return null;
  return view(await getOrder(id));
}

/**
 * Пора ли слать письмо получателю: оплачен (боевой платёж или тестовый магазин — чтобы путь можно было прогнать),
 * есть адрес, ещё не отправлено, дата наступила. Сертификат без адреса получателя покупатель передаёт сам.
 */
export function giftDue(o: Order, today = todayMsk()): boolean {
  const g = o.gift;
  return Boolean(o.status === "paid" && (o.receipt_due || o.test) && g?.to_email && !g.sent_at && (!g.send_at || g.send_at <= today));
}

/** Созревшие подарки (для ежедневного вызова /api/razbor/gift-send). */
export function dueGifts(): Promise<Order[]> {
  const today = todayMsk();
  return listOrders((o) => giftDue(o, today));
}

/**
 * Письмо покупателю «Подарок доставлен»: подарок был отложен (send_at), письмо получателю ушло не раньше трёх дней
 * назад (повтор на следующий день, если почта не ответила), покупателю ещё не писали.
 */
export function giverDue(o: Order, now = Date.now()): boolean {
  const g = o.gift;
  return Boolean(o.status === "paid" && o.email && g?.send_at && g.sent_at && !g.giver_mail_at && now - Date.parse(g.sent_at) < 3 * DAY);
}

export function dueGivers(): Promise<Order[]> {
  const now = Date.now();
  return listOrders((o) => giverDue(o, now));
}

/* ---------- Сертификат: подписанный код в ссылке получателя ---------- */

function secret(): string {
  const s = process.env.RAZBOR_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV !== "production") return "dev-only-razbor-secret";
  throw new Error("RAZBOR_SECRET не задан");
}

const sig = (kind: string, id: string) => createHmac("sha256", secret()).update(`${kind}:${id}`).digest("base64url").slice(0, 22);

function sigOk(kind: string, id: string, s: string): boolean {
  const a = Buffer.from(sig(kind, id));
  const b = Buffer.from(s);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Код сертификата: номер заказа и HMAC (RAZBOR_SECRET). Одноразовость — по cert_at в заказе. */
export const certCode = (id: string) => `${id}.${sig("cert", id)}`;

/** Номер заказа из кода сертификата или null, если подпись не сошлась. */
export function readCertCode(code: string): string | null {
  const [id, s] = String(code ?? "").split(".");
  return id && s && /^[A-Za-z0-9_-]{12}$/.test(id) && sigOk("cert", id, s) ? id : null;
}

export const certUrl = (id: string) => `${SITE.url}/razbor/sertifikat?c=${certCode(id)}`;

/* ---------- Напоминание через год ---------- */

/** Подписанная ссылка отписки от письма «Прогноз на следующий год». */
export const unsubUrl = (id: string) => `${SITE.url}/razbor/otpiska?o=${id}&s=${sig("yearly", id)}`;
export const unsubOk = (id: string, s: string) => /^[A-Za-z0-9_-]{12}$/.test(id) && sigOk("yearly", id, String(s ?? ""));

/** Через сколько после оплаты напоминаем: 11 месяцев (≈ 335 дней); тестовый заказ — через сутки, чтобы путь можно было проверить. */
const YEARLY_AFTER = 335 * DAY;
const YEARLY_TEST_AFTER = DAY;

/** Пора ли писать «Прогноз на следующий год»: согласие при оплате, не отписан, документ есть (сертификат — активирован), письмо не уходило. */
export function yearlyDue(o: Order, now = Date.now()): boolean {
  if (o.status !== "paid" || !o.consent_yearly || o.yearly_sent_at || o.yearly_off_at || !o.email || !o.date || !o.paid_at) return false;
  const age = now - Date.parse(o.paid_at);
  // боевой заказ — не позже 13 месяцев: старые заказы при первом запуске не получат запоздалых писем
  return o.test ? age >= YEARLY_TEST_AFTER : age >= YEARLY_AFTER && age <= 395 * DAY;
}

export function dueYearly(): Promise<Order[]> {
  const now = Date.now();
  return listOrders((o) => yearlyDue(o, now));
}
