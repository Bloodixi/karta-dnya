import { createHmac, timingSafeEqual } from "node:crypto";
import { yookassaReady } from "./yookassa";

/**
 * Тестовые покупки владельца на боевом сайте: /api/razbor/test?k=<RAZBOR_TEST_KEY> ставит cookie на сутки,
 * и пока она есть, checkout создаёт платёж в тестовом магазине ЮKassa (карта 5555 5555 5555 4477).
 * Такой заказ помечается test: без чека «Мой налог», письма — с [ТЕСТ] в теме. ?off=1 — выключить.
 */
export const TEST_COOKIE = "razbor_test";
export const TEST_MAX_AGE = 86400;

function key(): string | null {
  const k = process.env.RAZBOR_TEST_KEY;
  return k && k.length >= 24 && yookassaReady("test") ? k : null;
}

const sign = (k: string, exp: number) => createHmac("sha256", k).update(`razbor-test:${exp}`).digest("base64url");

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Значение cookie — срок и подпись ключом: сам ключ в браузере не хранится, утёкшая cookie живёт не дольше суток. */
export function testCookieValue(now = Date.now()): string | null {
  const k = key();
  if (!k) return null;
  const exp = Math.floor(now / 1000) + TEST_MAX_AGE;
  return `${exp}.${sign(k, exp)}`;
}

export function testKeyOk(given: string | null): boolean {
  const k = key();
  return Boolean(given && k && same(given, k));
}

export function testCookieOk(v: string | undefined, now = Date.now()): boolean {
  const k = key();
  const m = v?.match(/^(\d{10})\.([\w-]{43})$/);
  if (!k || !m) return false;
  const exp = Number(m[1]);
  return exp > now / 1000 && same(m[2], sign(k, exp));
}
