/** Подписи подарков: код сертификата и ссылка отписки (razborGift), подарок в metadata и сроки писем. */
import { test } from "node:test";
import assert from "node:assert/strict";

delete process.env.RAZBOR_SECRET;

import { certCode, giftDue, giftFromMetadata, giftMetadata, maskEmail, readCertCode, unsubOk, unsubUrl } from "./razborGift";
import type { Order } from "./razborStore";

const ID = "AbCdEf123_-x";
const sOf = (url: string) => new URL(url).searchParams.get("s")!;

test("код сертификата: свой читается, подделка и чужой номер — null", () => {
  const code = certCode(ID);
  assert.equal(readCertCode(code), ID);
  const [, sig] = code.split(".");
  assert.equal(readCertCode(`BbCdEf123_-x.${sig}`), null, "подпись от другого заказа");
  assert.equal(readCertCode(`${ID}.${(sig[0] === "A" ? "B" : "A") + sig.slice(1)}`), null);
  assert.equal(readCertCode(`${ID}.${sig.slice(1)}`), null, "короче");
  assert.equal(readCertCode(ID), null);
  assert.equal(readCertCode(""), null);
  assert.equal(readCertCode(`short.${sig}`), null, "номер не из 12 символов");
});

test("подпись отписки: верная проходит, подпись сертификата или другого заказа — нет", () => {
  const url = unsubUrl(ID);
  assert.equal(new URL(url).searchParams.get("o"), ID);
  const s = sOf(url);
  assert.equal(unsubOk(ID, s), true);
  assert.equal(unsubOk("BbCdEf123_-x", s), false);
  assert.equal(unsubOk(ID, certCode(ID).split(".")[1]), false, "подпись другого назначения");
  assert.equal(unsubOk(ID, ""), false);
  assert.equal(unsubOk("../etc/passwd", s), false);
  assert.equal(unsubOk(ID, undefined as unknown as string), false);
});

test("подарок: metadata туда и обратно, плохая дата отправки отбрасывается", () => {
  const g = { from: "Оля", wish: "С днём рождения", to_email: "a@example.com", send_at: "2026-12-31" };
  assert.deepEqual(giftFromMetadata(giftMetadata(g)), g);
  assert.deepEqual(giftMetadata(undefined), {});
  assert.equal(giftFromMetadata({}), undefined);
  assert.deepEqual(giftFromMetadata({ gift_from: "Оля", gift_at: "31.12.2026" }), { from: "Оля" });
});

test("maskEmail", () => {
  assert.equal(maskEmail("anna@mail.ru"), "a***@mail.ru");
  assert.equal(maskEmail("bad"), "***");
});

test("giftDue: только оплаченный боевой или тестовый, с адресом, не отправленный, дата наступила", () => {
  const base: Order = {
    id: ID, token: "", date: "", name: "", email: "", amount: 490, status: "paid", payment_id: "", created_at: "", paid_at: "",
    yr: 2026, mo: 10, receipt_due: true, gift: { from: "Оля", to_email: "a@example.com" },
  };
  assert.equal(giftDue(base, "2026-10-25"), true);
  assert.equal(giftDue({ ...base, status: "pending" }, "2026-10-25"), false);
  assert.equal(giftDue({ ...base, receipt_due: undefined }, "2026-10-25"), false);
  assert.equal(giftDue({ ...base, receipt_due: undefined, test: true }, "2026-10-25"), true);
  assert.equal(giftDue({ ...base, gift: { from: "Оля" } }, "2026-10-25"), false);
  assert.equal(giftDue({ ...base, gift: { ...base.gift!, sent_at: "x" } }, "2026-10-25"), false);
  assert.equal(giftDue({ ...base, gift: { ...base.gift!, send_at: "2026-10-26" } }, "2026-10-25"), false);
  assert.equal(giftDue({ ...base, gift: { ...base.gift!, send_at: "2026-10-25" } }, "2026-10-25"), true);
});
