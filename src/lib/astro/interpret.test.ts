/** Тесты модели интерпретации по фикстуре неба. Запуск: npx tsx --test src/lib/astro/interpret.test.ts */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SIGNS, type AstroEvent, type PeriodKey, type Sky } from "./types";
import { draftText, getAstroData, interpret, solarHouse } from "./interpret";

const sky = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/lib/astro/fixtures/sky-2026-10-06.json"), "utf8")) as Sky;
const KEY = "2026-10-06";
const events: AstroEvent[] = [
  { kind: "retro-end", body: "mercury", date: "2026-10-16T12:00:00.000Z" },
  { kind: "new-moon", body: "moon", date: "2026-10-18T06:00:00.000Z", sign: "vesy" },
  { kind: "ingress", body: "mars", date: "2026-10-25T03:00:00.000Z", sign: "strelets", fromSign: "skorpion" },
];
const PERIODS: PeriodKey[] = ["segodnya", "zavtra", "vchera", "nedelya", "mesyats", "god"];

test("справочники загружены, библиотека фраз достаточного объёма", () => {
  const d = getAstroData();
  assert.equal(Object.keys(d.planets).length, 10);
  assert.equal(Object.keys(d.signs).length, 12);
  assert.equal(d.houses.length, 12);
  assert.equal(Object.keys(d.aspects).length, 5);
  assert.ok(d.phrases.length >= 600, `фраз: ${d.phrases.length}`);
  assert.ok(d.aspectPhrases.length >= 60, `аспектных фраз: ${d.aspectPhrases.length}`);
  assert.equal(new Set(d.phrases.map((p) => p.text)).size, d.phrases.length, "фразы не должны дублироваться");
  for (const body of ["moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]) {
    for (let h = 1; h <= 12; h++) assert.ok(d.phrases.some((p) => p.body === body && p.house === h && !p.retro), `нет фразы ${body} дом ${h}`);
  }
  for (const el of ["fire", "earth", "air", "water"]) for (let h = 1; h <= 12; h++) {
    assert.ok(d.phrases.some((p) => p.body === "moon" && p.house === h && p.element === el), `нет фразы Луны ${el} дом ${h}`);
  }
  for (const body of ["mercury", "venus", "mars"]) for (let h = 1; h <= 12; h++) {
    assert.ok(d.phrases.some((p) => p.body === body && p.house === h && p.retro), `нет ретро-фразы ${body} дом ${h}`);
  }
  for (const s of ["general", "love", "career", "health"]) assert.ok(d.phrases.some((p) => p.house === "any" && p.sphere === s), `нет нейтральной фразы ${s}`);
});

test("солярный дом", () => {
  assert.equal(solarHouse(1, 1), 1);
  assert.equal(solarHouse(7, 1), 7);
  assert.equal(solarHouse(0, 11), 2);
  assert.equal(solarHouse(6, 0), 7);
});

test("все знаки, все периоды: события, веса, оценки, факты", () => {
  for (const period of PERIODS) {
    for (const sign of SIGNS) {
      const i = interpret(sign, period, KEY, sky, events);
      assert.ok(i.events.length >= 10, `${sign}/${period}: мало событий`);
      for (const e of i.events) {
        assert.ok(e.weight >= 0 && e.weight <= 1, `${sign}: вес ${e.weight} вне [0,1]`);
        assert.ok(e.house >= 1 && e.house <= 12);
        assert.ok(e.draft.length > 20, `${sign}: пустой черновик для ${e.body}`);
        assert.ok(["general", "love", "career", "health"].includes(e.sphere));
      }
      for (let k = 1; k < i.events.length; k++) assert.ok(i.events[k - 1].weight >= i.events[k].weight, "события по убыванию веса");
      for (const v of Object.values(i.scores)) assert.ok(Number.isInteger(v) && v >= 1 && v <= 5, `${sign}: оценка ${v}`);
      assert.ok(i.sky.length >= 3 && i.sky.length <= 5, `${sign}/${period}: фактов ${i.sky.length}`);
    }
  }
});

test("на день Луна — главное событие; на год — дальние планеты", () => {
  const day = interpret("rak", "segodnya", KEY, sky);
  assert.equal(day.events[0].body, "moon");
  const year = interpret("rak", "god", "2026-01-01", sky);
  assert.ok(["uranus", "neptune", "pluto"].includes(year.events[0].body), year.events[0].body);
});

test("ретроградный Меркурий отмечен и усилен, факт с датой окончания", () => {
  const i = interpret("vesy", "segodnya", KEY, sky, events);
  const m = i.events.find((e) => e.body === "mercury" && !e.aspect);
  assert.ok(m?.retrograde);
  assert.ok(i.sky.some((f) => f.includes("Меркурий ретрограден до 16 октября")), i.sky.join("\n"));
});

test("тексты не повторяются между знаками в один день", () => {
  const texts = SIGNS.map((s) => draftText(interpret(s, "segodnya", KEY, sky, events), "2026-10-06T00:00:00.000Z"));
  assert.equal(new Set(texts.map((t) => t.general)).size, 12, "general различается");
  for (const t of texts) {
    for (const f of ["general", "love", "career", "health", "advice", "mood"] as const) assert.ok(t[f].length > 0, `${t.sign}: пустое поле ${f}`);
    assert.ok(t.general.split(/(?<=[.!?])\s/).length >= 2, `${t.sign}: general из ≥ 2 предложений`);
    assert.equal(t.model, "draft");
  }
});

test("фразы ротируются по дням: 7 соседних дней без повтора для одной планеты в одном доме", () => {
  const seen = new Set<string>();
  for (let d = 1; d <= 7; d++) {
    const key = `2026-10-${String(d).padStart(2, "0")}`;
    const i = interpret("telets", "segodnya", key, sky);
    const moon = i.events.find((e) => e.body === "moon" && !e.aspect)!;
    assert.ok(!seen.has(moon.draft), `повтор фразы на ${key}`);
    seen.add(moon.draft);
  }
});

test("детерминизм: двойной вызов равен", () => {
  for (const sign of SIGNS) {
    const a = interpret(sign, "nedelya", "2026-10-05", sky, events);
    const b = interpret(sign, "nedelya", "2026-10-05", sky, events);
    assert.deepEqual(a, b);
    assert.deepEqual(draftText(a, "x"), draftText(b, "x"));
  }
});
