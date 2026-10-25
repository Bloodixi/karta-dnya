/**
 * Оплата разбора: applyPayment / applyRefund / orderFromPayment / settleOrder.
 * Без сети и ключей: fetch подменён (ЮKassa и Telegram), заказы — во временной папке, почта и «Мой налог» не настроены.
 */
import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";

// окружение до первого вызова: сеть и ключи выключены, уведомления владельцу — в подменённый fetch
for (const k of Object.keys(process.env)) {
  if (/^(YOOKASSA_|SMTP_|NALOG_|TELEGRAM_|RAZBOR_PRICE|PACK_PRICE)/.test(k)) delete process.env[k];
}
process.env.TELEGRAM_BOT_TOKEN = "test-bot-token";
process.env.TELEGRAM_OWNER_CHAT = "1";

import type { Payment, Refund } from "./yookassa";
import { applyPayment, applyRefund, orderFromPayment } from "./razborOrder";
import { getOrder, lockCount, saveOrder, settleOrder, type Order } from "./razborStore";
import { readDocToken } from "./razborToken";
import { PRODUCTS } from "./razborProducts";

let dataDir = "";
const realFetch = globalThis.fetch;
/** Тексты уведомлений в Telegram. */
let tg: string[] = [];
/** Платежи «в ЮKassa» для getPayment. */
const payments = new Map<string, Payment>();
const foreign: string[] = [];

before(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), "razbor-test-"));
  process.env.RAZBOR_DATA_DIR = dataDir;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const u = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (u.startsWith("https://api.telegram.org/")) {
      tg.push(JSON.parse(String(init?.body)).text);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    const m = u.match(/^https:\/\/api\.yookassa\.ru\/v3\/payments\/([\w-]+)$/);
    if (m) {
      const p = payments.get(m[1]);
      return p ? new Response(JSON.stringify(p), { status: 200 }) : new Response("{}", { status: 404 });
    }
    foreign.push(u);
    throw new Error(`сеть в тестах запрещена: ${u}`);
  }) as typeof fetch;
});

after(async () => {
  globalThis.fetch = realFetch;
  assert.deepEqual(foreign, [], "были обращения к посторонним адресам");
  await rm(dataDir, { recursive: true, force: true });
});

beforeEach(() => {
  tg = [];
});

const newId = () => randomBytes(9).toString("base64url");
const payId = () => `pay-${randomBytes(8).toString("hex")}`;
const about = (id: string) => tg.filter((t) => t.includes(id));

async function waitFor(cond: () => boolean, ms = 3000): Promise<void> {
  const end = Date.now() + ms;
  while (!cond()) {
    if (Date.now() > end) throw new Error("не дождались");
    await new Promise((r) => setTimeout(r, 10));
  }
}
const settle = (ms = 150) => new Promise((r) => setTimeout(r, ms));

function payment(order: string, over: Partial<Payment> = {}, md: Record<string, string> = {}): Payment {
  return {
    id: payId(),
    status: "succeeded",
    paid: true,
    amount: { value: `${PRODUCTS.razbor.price}.00`, currency: "RUB" },
    metadata: { order, date: "1990-05-17", name: "Анна", yr: "2026", mo: "10", v: "2", email: "anna@example.com", ...md },
    created_at: "2026-10-25T10:00:00.000Z",
    ...over,
  };
}

function draft(id: string, over: Partial<Order> = {}): Order {
  return {
    id, token: "t", date: "1990-05-17", name: "Анна", email: "anna@example.com", amount: PRODUCTS.razbor.price,
    status: "pending", payment_id: "", created_at: "2026-10-25T10:00:00.000Z", paid_at: "", yr: 2026, mo: 10, ...over,
  };
}

/* ---------- orderFromPayment ---------- */

test("orderFromPayment: metadata v1 (старый платёж без v и p) — обычный разбор, токен v=1", () => {
  const id = newId();
  const p = payment(id, {}, { v: "" });
  delete p.metadata!.v;
  const o = orderFromPayment(p)!;
  assert.equal(o.id, id);
  assert.equal(o.status, "pending");
  assert.equal(o.product, undefined);
  assert.equal(o.amount, PRODUCTS.razbor.price);
  assert.equal(o.payment_id, p.id);
  const t = readDocToken(o.token)!;
  assert.equal(t.p, "razbor");
  assert.equal(t.order, id);
  assert.deepEqual({ d: t.input.d, m: (t.input as { m: number }).m, v: (t.input as { v: number }).v }, { d: 17, m: 5, v: 1 });
});

test("orderFromPayment: metadata v2 — версия попадает в токен", () => {
  const id = newId();
  const o = orderFromPayment(payment(id))!;
  const t = readDocToken(o.token)!;
  assert.equal(t.p, "razbor");
  assert.equal((t.input as { v: number }).v, 2);
  assert.equal((t.input as { name?: string }).name, "Анна");
});

test("orderFromPayment: пакет — token разбора и token2 совместимости с версией v2", () => {
  const id = newId();
  const o = orderFromPayment(payment(id, {}, { p: "pack", date2: "1988-01-02", name2: "Иван", v2: "3" }))!;
  assert.equal(o.product, "pack");
  assert.equal(o.date2, "1988-01-02");
  assert.equal(readDocToken(o.token)!.p, "razbor");
  const pair = readDocToken(o.token2!)!;
  assert.equal(pair.p, "compat");
  assert.equal((pair.input as { v: number }).v, 3);
});

test("orderFromPayment: совместимость — версия из v (v2 только у пакета)", () => {
  const o = orderFromPayment(payment(newId(), {}, { p: "compat", date2: "1988-01-02", name2: "Иван", v: "4" }))!;
  assert.equal(o.product, "compat");
  assert.equal(o.token2, undefined);
  const t = readDocToken(o.token)!;
  assert.equal(t.p, "compat");
  assert.equal((t.input as { v: number }).v, 4);
});

test("orderFromPayment: совместимость без второй даты, без даты или без номера заказа — null", () => {
  const id = newId();
  assert.equal(orderFromPayment(payment(id, {}, { p: "compat" })), null);
  assert.equal(orderFromPayment(payment(id, {}, { date: "" })), null);
  assert.equal(orderFromPayment(payment(id, {}, { order: "" })), null);
  assert.equal(orderFromPayment({ ...payment(id), metadata: undefined }), null);
});

test("orderFromPayment: сертификат, подарок, тест и согласие на письмо через год", () => {
  const id = newId();
  const c = orderFromPayment(payment(id, { test: true }, { p: "cert", date: "", gift_from: "Оля", gift_to: "x@example.com", gift_at: "2026-12-31" }))!;
  assert.equal(c.product, "cert");
  assert.equal(c.token, "");
  assert.equal(c.test, true);
  assert.deepEqual(c.gift, { from: "Оля", to_email: "x@example.com", send_at: "2026-12-31" });
  assert.equal(orderFromPayment(payment(id, {}, { p: "cert", date: "" })), null, "сертификат без подарка");
  const y = orderFromPayment(payment(id, {}, { yearly: "1", gift_from: "Оля", gift_at: "плохая дата" }))!;
  assert.equal(y.consent_yearly, true);
  assert.deepEqual(y.gift, { from: "Оля" });
});

/* ---------- applyPayment ---------- */

test("applyPayment: без номера заказа — null, pending — заказ не меняется", async () => {
  assert.equal(await applyPayment({ ...payment(newId()), metadata: {} }), null);
  const id = newId();
  await saveOrder(draft(id));
  const o = await applyPayment(payment(id, { status: "pending", paid: false }));
  assert.equal(o?.status, "pending");
  assert.equal((await getOrder(id))?.status, "pending");
  assert.equal(about(id).length, 0);
});

test("applyPayment: оплата отмечает заказ paid, receipt_due, одно уведомление", async () => {
  const id = newId();
  await saveOrder(draft(id));
  const p = payment(id);
  const o = await applyPayment(p);
  assert.equal(o?.status, "paid");
  assert.equal(o?.receipt_due, true);
  assert.equal(o?.payment_id, p.id);
  assert.ok(o?.paid_at);
  await waitFor(() => about(id).length >= 1);
  assert.match(about(id)[0], /Оплачен разбор/);
  assert.match(about(id)[0], /Чек не пробит/); // «Мой налог» не настроен — чек не пробивается
  assert.match(about(id)[0], /Письмо не отправлено/);
});

test("повторный вебхук: settleOrder идемпотентен — второго заказа и уведомления нет", async () => {
  const id = newId();
  await saveOrder(draft(id));
  const p = payment(id);
  await applyPayment(p);
  await waitFor(() => about(id).length >= 1);
  const first = await getOrder(id);
  const again = await applyPayment(p);
  await settle();
  assert.equal(again?.status, "paid");
  assert.equal(again?.paid_at, first?.paid_at, "время оплаты не перезаписано");
  assert.equal(about(id).length, 1, "уведомление об оплате одно");
  const files = (await readdir(path.join(dataDir, "orders"))).filter((n) => n.startsWith(id));
  assert.deepEqual(files, [`${id}.json`]);
});

test("вебхук и страница «Спасибо» одновременно — один переход в paid", async () => {
  const id = newId();
  await saveOrder(draft(id));
  const p = payment(id);
  const fb = () => null;
  const r = await Promise.all([settleOrder(id, "paid", fb, p.id), settleOrder(id, "paid", fb, p.id), applyPayment(p)]);
  assert.equal(r[0].changed, true);
  assert.equal(r[1].changed, false);
  assert.equal(r[2]?.status, "paid");
  await settle();
  assert.equal(about(id).length, 0, "applyPayment пришёл вторым — без уведомления");
  await waitFor(() => lockCount() === 0);
});

test("applyPayment без файла заказа — заказ восстанавливается из metadata и сохраняется", async () => {
  const id = newId();
  const p = payment(id, { test: true });
  const o = await applyPayment(p);
  assert.equal(o?.status, "paid");
  assert.equal(o?.test, true);
  assert.equal(o?.receipt_due, undefined, "тестовый магазин — без чека");
  const saved = await getOrder(id);
  assert.equal(saved?.status, "paid");
  assert.equal(readDocToken(saved!.token)?.order, id);
  await waitFor(() => about(id).length >= 1);
  assert.match(about(id)[0], /тест/);
});

test("applyPayment: отмена — canceled и одно уведомление; повтор — без уведомления", async () => {
  const id = newId();
  await saveOrder(draft(id));
  const p = payment(id, { status: "canceled", paid: false });
  assert.equal((await applyPayment(p))?.status, "canceled");
  assert.equal((await applyPayment(p))?.status, "canceled");
  assert.equal(about(id).length, 1);
  assert.match(about(id)[0], /Оплата отменена/);
});

test("applyPayment: оплаченный заказ не отменяется, возвращённый не открывается снова", async () => {
  const paid = newId();
  await saveOrder(draft(paid, { status: "paid", paid_at: "2026-10-25T10:00:00.000Z" }));
  assert.equal((await applyPayment(payment(paid, { status: "canceled" })))?.status, "paid");
  const refunded = newId();
  await saveOrder(draft(refunded, { status: "refunded" }));
  assert.equal((await applyPayment(payment(refunded)))?.status, "refunded");
  await settle();
  assert.equal(about(paid).length + about(refunded).length, 0);
});

/* ---------- amountMismatch (через applyPayment) ---------- */

test("сумма меньше цены заказа — не оплачен, mismatch_at, одно предупреждение", async () => {
  const id = newId();
  await saveOrder(draft(id, { amount: 490 }));
  const p = payment(id, { amount: { value: "1.00", currency: "RUB" } });
  assert.equal((await applyPayment(p))?.status, "pending");
  const o = await getOrder(id);
  assert.equal(o?.status, "pending");
  assert.ok(o?.mismatch_at);
  assert.equal((await applyPayment(p))?.status, "pending");
  assert.equal(about(id).length, 1);
  assert.match(about(id)[0], /не сошлась/);
});

test("чужая валюта и нечисловая сумма — не оплачен", async () => {
  const a = newId();
  await saveOrder(draft(a));
  assert.equal((await applyPayment(payment(a, { amount: { value: "10000.00", currency: "USD" } })))?.status, "pending");
  const b = newId();
  await saveOrder(draft(b));
  assert.equal((await applyPayment(payment(b, { amount: { value: "abc", currency: "RUB" } })))?.status, "pending");
});

test("сумма больше или равна цене — оплачен; без файла цена берётся из продукта", async () => {
  const a = newId();
  await saveOrder(draft(a, { amount: 490 }));
  assert.equal((await applyPayment(payment(a, { amount: { value: "500.00", currency: "RUB" } })))?.status, "paid");
  // без файла: цена пакета больше цены разбора — сумма разбора за пакет не проходит
  const b = newId();
  const low = payment(b, { amount: { value: `${PRODUCTS.razbor.price}.00`, currency: "RUB" } }, { p: "pack", date2: "1988-01-02", v2: "1" });
  assert.equal((await applyPayment(low))?.status, "pending");
  assert.equal(await getOrder(b), null, "файл заказа не создан");
  await applyPayment(low);
  assert.equal(about(b).length, 1, "предупреждение без файла — одно (память процесса)");
});

test("отмена с любой суммой не считается несовпадением", async () => {
  const id = newId();
  await saveOrder(draft(id));
  const o = await applyPayment(payment(id, { status: "canceled", amount: { value: "0.00", currency: "RUB" } }));
  assert.equal(o?.status, "canceled");
  assert.equal((await getOrder(id))?.mismatch_at, undefined);
});

/* ---------- applyRefund ---------- */

function refund(paymentId: string, over: Partial<Refund> = {}): Refund {
  return { id: `ref-${randomBytes(8).toString("hex")}`, payment_id: paymentId, status: "succeeded", amount: { value: "490.00", currency: "RUB" }, created_at: "2026-10-26T10:00:00.000Z", ...over };
}

test("applyRefund: полный возврат — refunded, одно уведомление; повтор того же возврата — без изменений", async () => {
  const id = newId();
  await saveOrder(draft(id, { status: "paid", paid_at: "2026-10-25T10:00:00.000Z", amount: 490 }));
  const p = payment(id, { amount: { value: "490.00", currency: "RUB" }, refunded_amount: { value: "490.00", currency: "RUB" } });
  payments.set(p.id, p);
  const r = refund(p.id);
  const o = await applyRefund(r);
  assert.equal(o?.status, "refunded");
  assert.ok(o?.refunded_at);
  assert.deepEqual(o?.refund_ids, [r.id]);
  assert.equal((await applyRefund(r))?.status, "refunded");
  assert.equal(about(id).length, 1);
  assert.match(about(id)[0], /Возврат по заказу/);
  // после возврата повторное payment.succeeded заказ не открывает
  assert.equal((await applyPayment(p))?.status, "refunded");
});

test("applyRefund: частичный возврат — заказ остаётся paid, возврат учтён", async () => {
  const id = newId();
  await saveOrder(draft(id, { status: "paid", paid_at: "2026-10-25T10:00:00.000Z" }));
  const p = payment(id, { amount: { value: "490.00", currency: "RUB" }, refunded_amount: { value: "100.00", currency: "RUB" } });
  payments.set(p.id, p);
  const r = refund(p.id, { amount: { value: "100.00", currency: "RUB" } });
  const o = await applyRefund(r);
  assert.equal(o?.status, "paid");
  assert.deepEqual(o?.refund_ids, [r.id]);
  assert.match(about(id)[0], /Частичный возврат/);
});

test("applyRefund: без refunded_amount полнота считается по сумме возврата", async () => {
  const id = newId();
  await saveOrder(draft(id, { status: "paid", paid_at: "2026-10-25T10:00:00.000Z" }));
  const p = payment(id, { amount: { value: "490.00", currency: "RUB" } });
  payments.set(p.id, p);
  assert.equal((await applyRefund(refund(p.id)))?.status, "refunded");
});

test("applyRefund: неуспешный возврат и чужой платёж магазина — null", async () => {
  assert.equal(await applyRefund(refund("pay-0000000000", { status: "pending" })), null);
  const p = { ...payment(newId()), metadata: {} };
  payments.set(p.id, p);
  assert.equal(await applyRefund(refund(p.id)), null);
});

test("applyRefund: платежа нет в ЮKassa — ошибка наружу (вебхук ответит не 200 и ЮKassa повторит)", async () => {
  await assert.rejects(applyRefund(refund("pay-unknown-0000")));
});
