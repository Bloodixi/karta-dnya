/** Ограничение частоты запросов (rateLimit) и IP клиента за прокси. */
import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, clientIpFromHeaders, rateLimit, sharedRateLimit } from "./rateLimit";

const realNow = Date.now;
let now = 1_000_000;
const tick = (ms: number) => (now += ms);
Date.now = () => now;
afterEach(() => {
  now = 1_000_000;
});
process.on("exit", () => (Date.now = realNow));

test("take: не больше limit за окно, отказ не учитывается", () => {
  const l = rateLimit(3, 1000);
  assert.equal(l.take("a"), true);
  assert.equal(l.take("a"), true);
  assert.equal(l.check("a"), true);
  assert.equal(l.take("a"), true);
  assert.equal(l.check("a"), false);
  assert.equal(l.take("a"), false);
  assert.equal(l.take("b"), true, "другой ключ — свой счётчик");
  tick(999);
  assert.equal(l.take("a"), false);
  tick(1);
  assert.equal(l.take("a"), true, "окно скользящее: старые попадания вышли");
});

test("check не расходует лимит", () => {
  const l = rateLimit(1, 1000);
  for (let i = 0; i < 5; i++) assert.equal(l.check("x"), true);
  assert.equal(l.take("x"), true);
  assert.equal(l.take("x"), false);
});

test("переполнение ключей: сначала выбрасываются устаревшие, свежий лимит остаётся", () => {
  const l = rateLimit(1, 1000);
  for (let i = 0; i < 4999; i++) l.take(`old${i}`);
  tick(1000); // все old* устарели
  assert.equal(l.take("hot"), true);
  l.take("new"); // 5001-й ключ — чистка
  assert.equal(l.take("hot"), false, "свежий ключ не выброшен");
  for (let i = 0; i < 3; i++) assert.equal(l.take(`old${i}`), true, "устаревшие начинаются заново");
});

test("переполнение свежими ключами: выбрасываются самые старые (сознательный компромисс по памяти)", () => {
  const l = rateLimit(1, 1000);
  assert.equal(l.take("first"), true);
  for (let i = 0; i < 5000; i++) l.take(`k${i}`);
  assert.equal(l.take("first"), true, "самый старый ключ вытеснен — его счётчик сброшен");
});

test("sharedRateLimit: один счётчик на имя", () => {
  const a = sharedRateLimit("test-shared", 1, 1000);
  const b = sharedRateLimit("test-shared", 99, 99);
  assert.equal(a, b);
  assert.equal(a.take("ip"), true);
  assert.equal(b.take("ip"), false);
});

test("clientIp: X-Real-IP, иначе последний X-Forwarded-For, иначе ?", () => {
  assert.equal(clientIpFromHeaders(new Headers({ "x-real-ip": " 1.2.3.4 ", "x-forwarded-for": "9.9.9.9" })), "1.2.3.4");
  assert.equal(clientIpFromHeaders(new Headers({ "x-forwarded-for": "6.6.6.6, 5.5.5.5" })), "5.5.5.5", "первые адреса клиент может подделать");
  assert.equal(clientIpFromHeaders(new Headers()), "?");
  assert.equal(clientIp(new Request("http://localhost/", { headers: { "x-real-ip": "7.7.7.7" } })), "7.7.7.7");
});
