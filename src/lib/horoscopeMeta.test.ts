/** Проверка длины title и description для хабов гороскопа (<= 65 и 140..160 знаков). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { hubMeta } from "./horoscopeMeta";
import { PERIOD_KEYS } from "./daily";
import { SITE } from "./site";

function renderedTitleLen(t: string | { absolute: string }): number {
  return typeof t === "string" ? `${t} — ${SITE.name}`.length : t.absolute.length;
}

test("hubMeta: rendered title <= 65 и description 140..160 для всех периодов и длинных дат", () => {
  for (const date of ["2026-09-25", "2026-10-26", "2026-11-18", "2026-12-31"]) {
    for (const p of PERIOD_KEYS) {
      const m = hubMeta(p, date);
      const tLen = renderedTitleLen(m.title);
      assert.ok(tLen <= 65, `title too long (${tLen}) for ${p} @ ${date}: ${JSON.stringify(m.title)}`);
      assert.ok(m.description.length >= 140 && m.description.length <= 160,
        `desc len ${m.description.length} out of 140..160 for ${p} @ ${date}`);
    }
  }
});
