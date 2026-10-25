/** Cookie тестовых покупок владельца (razborTest): ключ, срок, подпись. */
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";

const KEY = "k".repeat(32);
function env(on: boolean) {
  for (const k of ["RAZBOR_TEST_KEY", "YOOKASSA_TEST_SHOP_ID", "YOOKASSA_TEST_SECRET_KEY"]) delete process.env[k];
  if (on) {
    process.env.RAZBOR_TEST_KEY = KEY;
    process.env.YOOKASSA_TEST_SHOP_ID = "000000";
    process.env.YOOKASSA_TEST_SECRET_KEY = "test_fake_key";
  }
}

import { TEST_MAX_AGE, testCookieOk, testCookieValue, testKeyOk } from "./razborTest";

beforeEach(() => env(true));

test("cookie живёт сутки и проверяется", () => {
  const now = Date.UTC(2026, 9, 25);
  const v = testCookieValue(now)!;
  assert.match(v, /^\d{10}\.[\w-]{43}$/);
  assert.equal(Number(v.split(".")[0]), now / 1000 + TEST_MAX_AGE);
  assert.equal(testCookieOk(v, now), true);
  assert.equal(testCookieOk(v, now + (TEST_MAX_AGE - 1) * 1000), true);
  assert.equal(testCookieOk(v, now + TEST_MAX_AGE * 1000), false, "истекла");
});

test("подделка: свой срок со старой подписью, чужая подпись, мусор", () => {
  const now = Date.now();
  const v = testCookieValue(now)!;
  const [exp, sig] = v.split(".");
  assert.equal(testCookieOk(`${Number(exp) + 86400}.${sig}`, now), false, "продлённый срок");
  assert.equal(testCookieOk(`${exp}.${(sig[0] === "A" ? "B" : "A") + sig.slice(1)}`, now), false);
  assert.equal(testCookieOk(undefined, now), false);
  assert.equal(testCookieOk("", now), false);
  assert.equal(testCookieOk(`${exp}.${sig}.x`, now), false);
  process.env.RAZBOR_TEST_KEY = "z".repeat(32);
  assert.equal(testCookieOk(v, now), false, "ключ сменили — старые cookie недействительны");
});

test("без ключа, с коротким ключом или без тестового магазина — выключено", () => {
  const v = testCookieValue()!;
  env(false);
  assert.equal(testCookieValue(), null);
  assert.equal(testCookieOk(v), false);
  assert.equal(testKeyOk(KEY), false);
  env(true);
  process.env.RAZBOR_TEST_KEY = "short";
  assert.equal(testCookieValue(), null);
  env(true);
  delete process.env.YOOKASSA_TEST_SECRET_KEY;
  assert.equal(testCookieOk(v), false);
});

test("testKeyOk: точное совпадение ключа", () => {
  assert.equal(testKeyOk(KEY), true);
  assert.equal(testKeyOk(KEY.slice(1)), false);
  assert.equal(testKeyOk(KEY + "k"), false);
  assert.equal(testKeyOk(""), false);
  assert.equal(testKeyOk(null), false);
});
