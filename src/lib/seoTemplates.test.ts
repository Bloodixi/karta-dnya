import assert from "node:assert/strict";
import test from "node:test";
import { getNumerology, getZodiac } from "./content";
import { firstSentence } from "./meta";
import { getStoneSigns, stonesForSign, stoneTasksForSign } from "./stones";

test("firstSentence returns crisp first sentence", () => {
  assert.equal(firstSentence("Первая мысль. Вторая мысль."), "Первая мысль.");
  assert.equal(firstSentence("Без точки"), "Без точки");
});

test("all 12 numerology numbers have gender and finance sections", () => {
  const nums = getNumerology();
  assert.equal(nums.length, 12);
  for (const n of nums) {
    assert.ok(n.forWomen && n.forWomen.length > 40, `missing forWomen for ${n.number}`);
    assert.ok(n.forMen && n.forMen.length > 40, `missing forMen for ${n.number}`);
    assert.ok(n.finance && n.finance.length > 40, `missing finance for ${n.number}`);
  }
});

test("all 12 zodiac signs have stone tasks and gender recommendations", () => {
  const zodiac = getZodiac();
  const signs = getStoneSigns();
  assert.equal(zodiac.length, 12);
  for (const z of zodiac) {
    const info = signs[z.slug];
    assert.ok(info?.forWomen && info.forWomen.length > 40, `missing forWomen for ${z.slug}`);
    assert.ok(info?.forMen && info.forMen.length > 40, `missing forMen for ${z.slug}`);
    const tasks = stoneTasksForSign(stonesForSign(z.slug));
    assert.equal(tasks.length, 4);
    for (const row of tasks) {
      assert.ok(row.picked.length >= 1, `empty task ${row.task} for ${z.slug}`);
    }
  }
});
