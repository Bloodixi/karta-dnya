/** Секрет таймеров VPS (cronAuth). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { cronAuthorized } from "./cronAuth";

const SECRET = "s".repeat(24);
const req = (h: Record<string, string> = {}) => new Request("http://localhost/api/razbor/retry", { headers: h });

test("верный секрет в X-Cron-Secret или Authorization: Bearer", () => {
  process.env.RAZBOR_CRON_SECRET = SECRET;
  assert.equal(cronAuthorized(req({ "x-cron-secret": SECRET })), true);
  assert.equal(cronAuthorized(req({ authorization: `Bearer ${SECRET}` })), true);
  assert.equal(cronAuthorized(req({ authorization: `bearer   ${SECRET}` })), true);
});

test("неверный, пустой, без заголовка — отказ", () => {
  process.env.RAZBOR_CRON_SECRET = SECRET;
  assert.equal(cronAuthorized(req()), false);
  assert.equal(cronAuthorized(req({ "x-cron-secret": "" })), false);
  assert.equal(cronAuthorized(req({ "x-cron-secret": SECRET.slice(1) })), false);
  assert.equal(cronAuthorized(req({ "x-cron-secret": SECRET + "s" })), false);
  assert.equal(cronAuthorized(req({ authorization: `Basic ${SECRET}` })), false);
  // X-Cron-Secret важнее Authorization: неверный первый не спасает верный второй
  assert.equal(cronAuthorized(req({ "x-cron-secret": "wrong", authorization: `Bearer ${SECRET}` })), false);
});

test("секрет не задан или короче 16 — всегда отказ (даже пустой заголовок)", () => {
  delete process.env.RAZBOR_CRON_SECRET;
  assert.equal(cronAuthorized(req()), false);
  assert.equal(cronAuthorized(req({ "x-cron-secret": "" })), false);
  process.env.RAZBOR_CRON_SECRET = "short";
  assert.equal(cronAuthorized(req({ "x-cron-secret": "short" })), false);
});
