/** Адреса уведомлений ЮKassa (yookassaIp). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { isYookassaIp } from "./yookassaIp";

test("IPv4 из диапазонов ЮKassa", () => {
  for (const ip of ["185.71.76.0", "185.71.76.31", "185.71.77.5", "77.75.153.0", "77.75.153.127", "77.75.156.11", "77.75.156.35", "77.75.154.128", "77.75.154.255", " 185.71.76.1 "]) {
    assert.equal(isYookassaIp(ip), true, ip);
  }
});

test("IPv4 на границах и чужие", () => {
  for (const ip of ["185.71.76.32", "185.71.77.32", "77.75.153.128", "77.75.156.12", "77.75.154.127", "8.8.8.8", "127.0.0.1", "10.0.0.1", "45.146.91.183"]) {
    assert.equal(isYookassaIp(ip), false, ip);
  }
});

test("IPv4 в виде IPv6 (::ffff:)", () => {
  assert.equal(isYookassaIp("::ffff:185.71.76.10"), true);
  assert.equal(isYookassaIp("::FFFF:77.75.156.35"), true);
  assert.equal(isYookassaIp("::ffff:8.8.8.8"), false);
  // шестнадцатеричная запись того же адреса (185.71.76.10 = b947:4c0a) — BlockList сопоставляет её с IPv4-сетями
  assert.equal(isYookassaIp("::ffff:b947:4c0a"), true);
  assert.equal(isYookassaIp("::ffff:808:808"), false);
});

test("IPv6 из 2a02:5180::/32 и чужие", () => {
  assert.equal(isYookassaIp("2a02:5180::1"), true);
  assert.equal(isYookassaIp("2a02:5180:ffff:ffff::abcd"), true);
  assert.equal(isYookassaIp("2A02:5180:0:0:0:0:0:1"), true);
  assert.equal(isYookassaIp("2a02:5181::1"), false);
  assert.equal(isYookassaIp("2001:db8::1"), false);
  assert.equal(isYookassaIp("::1"), false);
});

test("мусор и пустое — false", () => {
  for (const ip of ["", "?", "unknown", "185.71.76", "185.71.76.1.5", "185.71.76.1, 8.8.8.8", "::ffff:", "999.71.76.1"]) {
    assert.equal(isYookassaIp(ip), false, ip);
  }
});
