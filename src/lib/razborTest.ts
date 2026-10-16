import { createHash, timingSafeEqual } from "node:crypto";
import { yookassaReady } from "./yookassa";

/**
 * Тестовые покупки владельца на боевом сайте: /api/razbor/test?k=<RAZBOR_TEST_KEY> ставит cookie на сутки,
 * и пока она есть, checkout создаёт платёж в тестовом магазине ЮKassa (карта 5555 5555 5555 4477).
 * Такой заказ помечается test: без чека «Мой налог», письма — с [ТЕСТ] в теме. ?off=1 — выключить.
 */
export const TEST_COOKIE = "razbor_test";
export const TEST_MAX_AGE = 86400;

/** Значение cookie — хэш ключа, сам ключ в браузере не хранится. */
export function testCookieValue(): string | null {
  const key = process.env.RAZBOR_TEST_KEY;
  if (!key || key.length < 24 || !yookassaReady("test")) return null;
  return createHash("sha256").update(`razbor-test:${key}`).digest("base64url");
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function testKeyOk(k: string | null): boolean {
  const key = process.env.RAZBOR_TEST_KEY;
  return Boolean(k && key && testCookieValue() && same(k, key));
}

export function testCookieOk(v: string | undefined): boolean {
  const want = testCookieValue();
  return Boolean(v && want && same(v, want));
}
