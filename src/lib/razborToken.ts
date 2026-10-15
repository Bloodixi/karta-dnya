/** Ссылка на оплаченный разбор без базы данных: данные заказа в base64url + HMAC-подпись (RAZBOR_SECRET). Только сервер. */
import { createHmac, timingSafeEqual } from "node:crypto";
import { isValidDate } from "./numerology";
import type { RazborInput } from "./razbor";

function secret(): string {
  const s = process.env.RAZBOR_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV !== "production") return "dev-only-razbor-secret";
  throw new Error("RAZBOR_SECRET не задан");
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url").slice(0, 32);

/**
 * orderId — номер заказа в подписанных данных: по нему длинная ссылка закрывается после возврата
 * (/razbor/r проверяет статус заказа). Старые ссылки без номера остаются бессрочными.
 */
export function makeToken(i: RazborInput, orderId?: string): string {
  const payload = Buffer.from(JSON.stringify({ d: i.d, m: i.m, y: i.y, n: i.name || undefined, yr: i.yr, mo: i.mo, v: i.v, o: orderId || undefined })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readToken(token: string): (RazborInput & { order?: string }) | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const want = Buffer.from(sign(payload));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const o = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!isValidDate(o.d, o.m, o.y) || !Number.isInteger(o.yr) || !Number.isInteger(o.mo) || o.mo < 1 || o.mo > 12) return null;
    return { d: o.d, m: o.m, y: o.y, name: typeof o.n === "string" ? o.n.slice(0, 60) : undefined, yr: o.yr, mo: o.mo, v: Number.isInteger(o.v) && o.v > 0 ? o.v : 1, order: typeof o.o === "string" && /^[A-Za-z0-9_-]{12}$/.test(o.o) ? o.o : undefined };
  } catch {
    return null;
  }
}
