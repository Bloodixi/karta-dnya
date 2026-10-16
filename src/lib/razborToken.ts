/** Ссылка на оплаченный разбор без базы данных: данные заказа в base64url + HMAC-подпись (RAZBOR_SECRET). Только сервер. */
import { createHmac, timingSafeEqual } from "node:crypto";
import { isValidDate } from "./numerology";
import type { RazborInput } from "./razbor";
import type { CompatInput, Person } from "./razborCompat";

function secret(): string {
  const s = process.env.RAZBOR_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV !== "production") return "dev-only-razbor-secret";
  throw new Error("RAZBOR_SECRET не задан");
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url").slice(0, 32);
const seal = (o: object) => {
  const payload = Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

/**
 * orderId — номер заказа в подписанных данных: по нему длинная ссылка закрывается после возврата
 * (/razbor/r проверяет статус заказа). Старые ссылки без номера остаются бессрочными.
 * Токен обычного разбора не содержит поля p — как до появления других продуктов.
 */
export function makeToken(i: RazborInput, orderId?: string): string {
  return seal({ d: i.d, m: i.m, y: i.y, n: i.name || undefined, yr: i.yr, mo: i.mo, v: i.v, o: orderId || undefined });
}

/** Совместимость пары: p = "compat", вторая дата — d2/m2/y2/n2. */
export function makeCompatToken(i: CompatInput, orderId?: string): string {
  return seal({ p: "compat", d: i.a.d, m: i.a.m, y: i.a.y, n: i.a.name || undefined, d2: i.b.d, m2: i.b.m, y2: i.b.y, n2: i.b.name || undefined, yr: i.yr, mo: i.mo, v: i.v, o: orderId || undefined });
}

/** Детский разбор: p = "child", дата и имя ребёнка. */
export function makeChildToken(i: RazborInput, orderId?: string): string {
  return seal({ p: "child", d: i.d, m: i.m, y: i.y, n: i.name || undefined, yr: i.yr, mo: i.mo, v: i.v, o: orderId || undefined });
}

/** Документ по ссылке: какой продукт и его входные данные. */
export type DocToken =
  | { p: "razbor"; input: RazborInput; order?: string }
  | { p: "compat"; input: CompatInput; order?: string }
  | { p: "child"; input: RazborInput; order?: string };

type Raw = Record<string, unknown>;

function open(token: string): Raw | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const want = Buffer.from(sign(payload));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const o = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return o && typeof o === "object" ? (o as Raw) : null;
  } catch {
    return null;
  }
}

const int = (v: unknown) => (Number.isInteger(v) ? (v as number) : NaN);
const name = (v: unknown) => (typeof v === "string" ? v.slice(0, 60) : undefined);
const orderOf = (v: unknown) => (typeof v === "string" && /^[A-Za-z0-9_-]{12}$/.test(v) ? v : undefined);

function person(o: Raw, sfx: "" | "2"): Person | null {
  const d = int(o[`d${sfx}`]), m = int(o[`m${sfx}`]), y = int(o[`y${sfx}`]);
  if (!isValidDate(d, m, y)) return null;
  return { d, m, y, name: name(o[`n${sfx}`]) };
}

export function readDocToken(token: string): DocToken | null {
  const o = open(token);
  if (!o) return null;
  const yr = int(o.yr), mo = int(o.mo);
  if (!Number.isInteger(yr) || !Number.isInteger(mo) || mo < 1 || mo > 12) return null;
  const v = Number.isInteger(o.v) && (o.v as number) > 0 ? (o.v as number) : 1;
  const order = orderOf(o.o);
  const a = person(o, "");
  if (!a) return null;
  if (o.p === undefined) return { p: "razbor", input: { d: a.d, m: a.m, y: a.y, name: a.name, yr, mo, v }, order };
  if (o.p === "child") return { p: "child", input: { d: a.d, m: a.m, y: a.y, name: a.name, yr, mo, v }, order };
  if (o.p === "compat") {
    const b = person(o, "2");
    return b ? { p: "compat", input: { a, b, yr, mo, v }, order } : null;
  }
  return null;
}

/** Только обычный разбор (буклет, письма, подарок): токены совместимости и детского разбора здесь не читаются. */
export function readToken(token: string): (RazborInput & { order?: string }) | null {
  const t = readDocToken(token);
  return t?.p === "razbor" ? { ...t.input, order: t.order } : null;
}

/** Токен из сегмента адреса: битое %-кодирование — пустая строка (страница ответит 404, а не 500). */
export function tokenParam(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return "";
  }
}
