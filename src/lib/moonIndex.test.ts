/** Окно индексации лунных дней (moonIndexWindow): сегодня ± 7 дней по Москве. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { isMoonDayIndexed, moonIndexKeys, moonIndexWindow } from "./moon";

test("moonIndexWindow: ± 7 дней, через границы месяца и года", () => {
  assert.deepEqual(moonIndexWindow("2026-10-28"), { from: "2026-10-21", to: "2026-11-04" });
  assert.deepEqual(moonIndexWindow("2026-12-29"), { from: "2026-12-22", to: "2027-01-05" });
});

test("isMoonDayIndexed: границы включены, за ними — нет", () => {
  const t = "2026-10-28";
  for (const k of ["2026-10-21", "2026-10-28", "2026-11-04"]) assert.equal(isMoonDayIndexed(k, t), true, k);
  for (const k of ["2026-10-20", "2026-11-05", "2026-09-01", "2026-12-31"]) assert.equal(isMoonDayIndexed(k, t), false, k);
});

test("moonIndexKeys: 15 дат подряд, все в окне", () => {
  const keys = moonIndexKeys("2026-03-01");
  assert.equal(keys.length, 15);
  assert.equal(keys[0], "2026-02-22");
  assert.equal(keys.at(-1), "2026-03-08");
  assert.ok(keys.every((k) => isMoonDayIndexed(k, "2026-03-01")));
});
