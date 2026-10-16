/**
 * Разбор в подарок: проверка полей формы, данные подарка для страницы результата и отложенная отправка письма
 * получателю (/api/razbor/gift-send). Только сервер.
 */
import { getOrder, listOrders, type Gift, type Order } from "./razborStore";
import { readToken } from "./razborToken";

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

/** NFKC и без невидимых форматирующих символов (мягкий перенос, нулевой пробел, BOM…): храним ровно то, что проверили. */
const norm = (s: string) => s.normalize("NFKC").replace(/\p{Cf}+/gu, "").replace(/[。．｡]/g, ".");

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

/**
 * Подпись и пожелание уходят чужому человеку от имени сайта — ссылок и адресов в них быть не должно.
 * Сначала NFKC (полноширинные точки и буквы → обычные), затем запрет: любой «схемы:», «@», IP и
 * «слово.слово» без пробела после точки (домены любых зон, включая .рф и punycode).
 */
const LINKISH = [/[a-z][a-z0-9+.-]*:\/\//i, /\b(?:mailto|tel|javascript|data):/i, /@/, /\b\d{1,3}(?:\.\d{1,3}){3}\b/, /[\p{L}\p{N}-]+\.[\p{L}\p{N}-]{2,}/u, /\bwww\b/i];
const HAS_LINK = { test: (v: string) => LINKISH.some((re) => re.test(norm(v))) };

export type GiftError = "gift_name" | "gift_from" | "gift_wish" | "gift_email" | "gift_date";

/**
 * Поля подарка из формы оплаты. `name` — уже очищенное имя получателя (оно же имя в разборе).
 * Ошибка — код для ?err= на странице разбора.
 */
export function parseGift(form: FormData, name: string): { gift: Gift } | { error: GiftError } {
  if (!name) return { error: "gift_name" };
  const from = oneLine(String(form.get("gift_from") ?? ""));
  if (!from || from.length > GIFT_FROM_MAX || HAS_LINK.test(from)) return { error: "gift_from" };
  const wish = multiLine(String(form.get("gift_wish") ?? ""));
  if (wish.length > GIFT_WISH_MAX || HAS_LINK.test(wish)) return { error: "gift_wish" };
  const toRaw = String(form.get("gift_to") ?? "").trim();
  const to = toRaw ? cleanEmail(toRaw) : "";
  if (toRaw && !to) return { error: "gift_email" };
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

function view(o: Order | null): GiftView | null {
  if (!o?.gift?.from) return null;
  return { to: o.name, from: o.gift.from, ...(o.gift.wish ? { wish: o.gift.wish } : {}) };
}

/**
 * Плашка «Подарок для Анны от Ольги» на странице результата: по заказу, номеру заказа или токену разбора
 * (в подписанном токене есть номер заказа). Не подарок или заказа нет — null.
 */
export async function giftFor(src: Order | string): Promise<GiftView | null> {
  if (typeof src !== "string") return view(src);
  const id = src.includes(".") ? readToken(src)?.order : src;
  if (!id) return null;
  return view(await getOrder(id));
}

/** Пора ли слать письмо получателю: оплачен (боевой платёж), есть адрес, ещё не отправлено, дата наступила. */
export function giftDue(o: Order, today = todayMsk()): boolean {
  const g = o.gift;
  return Boolean(o.status === "paid" && o.receipt_due && g?.to_email && !g.sent_at && (!g.send_at || g.send_at <= today));
}

/** Созревшие подарки (для ежедневного вызова /api/razbor/gift-send). */
export function dueGifts(): Promise<Order[]> {
  const today = todayMsk();
  return listOrders((o) => giftDue(o, today));
}
