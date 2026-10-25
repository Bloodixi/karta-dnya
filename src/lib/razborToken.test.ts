/** Подписанные ссылки на документ разбора (razborToken): подделка подписи, изменённые данные, старые токены. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

delete process.env.RAZBOR_SECRET; // вне production — dev-секрет, настоящий ключ не нужен

import { makeChildToken, makeCompatToken, makeToken, readDocToken, readToken, tokenParam } from "./razborToken";

const INPUT = { d: 17, m: 5, y: 1990, yr: 2026, mo: 10, v: 2, name: "Анна" };
const ORDER = "AbCdEf123_-x";
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const decode = (t: string) => JSON.parse(Buffer.from(t.split(".")[0], "base64url").toString("utf8"));
const signWith = (secret: string, payload: string) => createHmac("sha256", secret).update(payload).digest("base64url").slice(0, 32);

test("makeToken → readToken: данные и номер заказа", () => {
  const t = makeToken(INPUT, ORDER);
  assert.deepEqual(readToken(t), { ...INPUT, order: ORDER });
  assert.deepEqual(readDocToken(t), { p: "razbor", input: INPUT, order: ORDER });
  assert.equal(decode(t).p, undefined, "в токене обычного разбора нет поля p");
});

test("старый токен без номера заказа читается, order отсутствует", () => {
  const t = makeToken(INPUT);
  assert.equal(decode(t).o, undefined);
  const r = readToken(t)!;
  assert.equal(r.order, undefined);
  assert.equal(r.d, 17);
});

test("старый токен без версии — v=1", () => {
  const payload = b64({ d: 17, m: 5, y: 1990, yr: 2026, mo: 10 });
  const t = `${payload}.${signWith("dev-only-razbor-secret", payload)}`;
  assert.equal(readToken(t)?.v, 1);
});

test("подделка подписи — null", () => {
  const t = makeToken(INPUT, ORDER);
  const [payload, sig] = t.split(".");
  const flipped = (sig[0] === "A" ? "B" : "A") + sig.slice(1);
  assert.equal(readToken(`${payload}.${flipped}`), null);
  assert.equal(readToken(`${payload}.${sig.slice(0, -1)}`), null, "укороченная подпись");
  assert.equal(readToken(`${payload}.${sig}x`), null, "удлинённая подпись");
  assert.equal(readToken(payload), null, "без подписи");
  assert.equal(readToken(""), null);
  assert.equal(readToken(`${payload}.${signWith("другой-секрет-длиннее-16", payload)}`), null, "подпись чужим ключом");
});

test("изменённый payload со старой подписью — null", () => {
  const t = makeToken(INPUT, ORDER);
  const sig = t.split(".")[1];
  for (const change of [{ d: 18 }, { o: "ZZZZZZZZZZZZ" }, { o: undefined }, { yr: 2030 }]) {
    const payload = b64({ ...decode(t), ...change });
    assert.equal(readDocToken(`${payload}.${sig}`), null, JSON.stringify(change));
  }
});

test("верная подпись, но негодные данные — null", () => {
  const sealed = (o: object) => {
    const p = b64(o);
    return `${p}.${signWith("dev-only-razbor-secret", p)}`;
  };
  assert.equal(readDocToken(sealed({ d: 31, m: 2, y: 1990, yr: 2026, mo: 10 })), null, "31 февраля");
  assert.equal(readDocToken(sealed({ d: 1, m: 1, y: 1990, yr: 2026, mo: 13 })), null, "месяц 13");
  assert.equal(readDocToken(sealed({ d: 1, m: 1, y: 1990, yr: 2026, mo: 1, p: "unknown" })), null, "неизвестный продукт");
  const p = Buffer.from("не json").toString("base64url");
  assert.equal(readDocToken(`${p}.${signWith("dev-only-razbor-secret", p)}`), null, "не JSON");
  // кривой номер заказа не мешает открыть документ, но и не считается номером
  assert.equal(readDocToken(sealed({ d: 1, m: 1, y: 1990, yr: 2026, mo: 1, o: "../../etc" }))?.order, undefined);
});

test("совместимость и детский разбор не читаются как обычный разбор", () => {
  const compat = makeCompatToken({ a: { d: 1, m: 2, y: 1990, name: "А" }, b: { d: 3, m: 4, y: 1991 }, yr: 2026, mo: 10, v: 1 }, ORDER);
  const child = makeChildToken(INPUT, ORDER);
  assert.equal(readToken(compat), null);
  assert.equal(readToken(child), null);
  const c = readDocToken(compat)!;
  assert.equal(c.p, "compat");
  assert.equal(c.order, ORDER);
  assert.equal(readDocToken(child)?.p, "child");
});

test("RAZBOR_SECRET: короткий ключ в production — ошибка, свой ключ меняет подпись", () => {
  const env = process.env as Record<string, string | undefined>;
  const before = env.NODE_ENV;
  const devToken = makeToken(INPUT, ORDER);
  try {
    env.RAZBOR_SECRET = "коротко";
    env.NODE_ENV = "production";
    assert.throws(() => makeToken(INPUT));
    env.RAZBOR_SECRET = "x".repeat(32);
    assert.equal(readToken(devToken), null, "dev-токен не проходит с боевым ключом");
    assert.ok(readToken(makeToken(INPUT, ORDER)));
  } finally {
    env.NODE_ENV = before;
    delete env.RAZBOR_SECRET;
  }
});

test("tokenParam: битое %-кодирование — пустая строка", () => {
  assert.equal(tokenParam("abc%2Edef"), "abc.def");
  assert.equal(tokenParam("%E0%A4%A"), "");
});
