/** Проверка точности астро-движка: `npm run test:astro` (node:test через tsx). */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Astro from "astronomy-engine";
import {
  aspects,
  events,
  ingresses,
  longitude,
  moonQuarters,
  moonSign,
  mskNoon,
  positions,
  retrogradePeriods,
  sky,
  solarHouses,
  voidOfCourse,
} from "./engine";
import { BODIES, SIGNS } from "./types";

const DAY = 86_400_000;
const utc = (y: number, m: number, d: number, h = 0, min = 0) => new Date(Date.UTC(y, m - 1, d, h, min));
const dayKey = (iso: string) => iso.slice(0, 10);
const hoursApart = (a: Date, b: string) => Math.abs(a.getTime() - new Date(b).getTime()) / 3_600_000;

test("Солнце в равноденствия и солнцестояния 2026 (±1°)", () => {
  // Равноденствие 20.03.2026 14:46 UTC, солнцестояние 21.06.2026 08:25 UTC — на 12:00 МСК этих/соседних дат отклонение < 1°.
  const aries = positions(mskNoon("2026-03-20")).find((p) => p.body === "sun")!;
  assert.ok(Math.min(aries.lon, 360 - aries.lon) < 1, `Солнце 20.03: ${aries.lon}`);
  assert.ok(aries.sign === "oven" || aries.sign === "ryby");

  const cancer = positions(mskNoon("2026-06-22")).find((p) => p.body === "sun")!;
  assert.ok(Math.abs(cancer.lon - 90) < 1, `Солнце 22.06: ${cancer.lon}`);
  assert.equal(cancer.sign, "rak");

  // Точный момент равноденствия: долгота ≈ 0 с точностью до угловой минуты.
  const exact = longitude("sun", utc(2026, 3, 20, 14, 46));
  assert.ok(Math.min(exact, 360 - exact) < 1 / 60, `Солнце в момент равноденствия: ${exact}`);
});

test("позиции: 10 тел, поля согласованы, детерминизм и кэш", () => {
  const d = mskNoon("2026-10-06");
  const pos = positions(d);
  assert.equal(pos.length, 10);
  assert.deepEqual(pos.map((p) => p.body), BODIES);
  for (const p of pos) {
    assert.ok(p.lon >= 0 && p.lon < 360);
    assert.equal(p.sign, SIGNS[p.signIndex]);
    assert.ok(p.degree >= 0 && p.degree < 30);
    assert.ok(Math.abs(p.signIndex * 30 + p.degree - p.lon) < 1e-9);
    assert.equal(p.retrograde, p.speed < 0);
  }
  assert.equal(positions(new Date(d.getTime())), pos, "кэш по ISO-дате");
  assert.deepEqual(positions(d).map((p) => p.lon), pos.map((p) => p.lon));
});

test("Солнце и Луна никогда не ретроградны; скорость Луны 11–15°/сут, Солнца ~1°/сут", () => {
  for (let i = 0; i < 24; i++) {
    const d = utc(2026, 1, 1 + i * 15, 9);
    const pos = positions(d);
    const sun = pos.find((p) => p.body === "sun")!;
    const moon = pos.find((p) => p.body === "moon")!;
    assert.ok(!sun.retrograde && sun.speed > 0.95 && sun.speed < 1.03, `Солнце ${d.toISOString()}: ${sun.speed}`);
    assert.ok(!moon.retrograde && moon.speed > 11 && moon.speed < 15.5, `Луна ${d.toISOString()}: ${moon.speed}`);
  }
});

test("новолуния и полнолуния 2026 совпадают с открытыми таблицами (±1 ч) и с SearchMoonQuarter", () => {
  // timeanddate.com, UTC
  const expectedNew = ["2026-01-18T19:52", "2026-02-17T12:01", "2026-03-19T01:23", "2026-04-17T11:52", "2026-05-16T20:01", "2026-06-15T02:54",
    "2026-07-14T09:44", "2026-08-12T17:37", "2026-09-11T03:27", "2026-10-10T15:50", "2026-11-09T07:02", "2026-12-09T00:52"];
  const expectedFull = ["2026-01-03T10:03", "2026-02-01T22:09", "2026-03-03T11:38", "2026-04-02T02:12", "2026-05-01T17:23", "2026-05-31T08:45",
    "2026-06-29T23:57", "2026-07-29T14:36", "2026-08-28T04:18", "2026-09-26T16:49", "2026-10-26T04:12", "2026-11-24T14:53", "2026-12-24T01:28"];

  const evs = moonQuarters(utc(2026, 1, 1), utc(2027, 1, 1));
  const news = evs.filter((e) => e.kind === "new-moon");
  const fulls = evs.filter((e) => e.kind === "full-moon");
  assert.equal(news.length, 12);
  assert.equal(fulls.length, 13);
  news.forEach((e, i) => assert.ok(hoursApart(new Date(e.date), expectedNew[i] + ":00Z") <= 1, `новолуние ${e.date} vs ${expectedNew[i]}`));
  fulls.forEach((e, i) => assert.ok(hoursApart(new Date(e.date), expectedFull[i] + ":00Z") <= 1, `полнолуние ${e.date} vs ${expectedFull[i]}`));

  // Сверка с самой библиотекой: первая четверть после 01.01.2026
  let q = Astro.SearchMoonQuarter(utc(2026, 1, 1));
  const firstQ = evs.find((e) => e.kind === "first-quarter")!;
  while (q.quarter !== 1) q = Astro.NextMoonQuarter(q);
  assert.equal(firstQ.date, q.time.date.toISOString());
  // Фаза в момент полнолуния — full, знак Луны противоположен Солнцу
  for (const f of fulls) {
    const s = sky(new Date(f.date));
    assert.equal(s.moon.phase, "full");
    assert.ok(s.moon.illumination > 99);
    const sun = s.positions.find((p) => p.body === "sun")!;
    const moon = s.positions.find((p) => p.body === "moon")!;
    assert.equal((moon.signIndex - sun.signIndex + 12) % 12, 6);
  }
  const s = sky(new Date(news[0].date));
  assert.equal(s.moon.phase, "new");
  assert.ok(s.moon.age < 0.01 && s.moon.illumination < 0.5);
});

test("ретроградные периоды Меркурия 2026: три периода, точность до суток", () => {
  // Открытые источники (astrology calendars, UTC): 26.02–20.03, 29.06–23.07, 24.10–13.11.
  const expected: [string, string][] = [["2026-02-26", "2026-03-20"], ["2026-06-29", "2026-07-23"], ["2026-10-24", "2026-11-13"]];
  const evs = retrogradePeriods("mercury", utc(2026, 1, 1), utc(2027, 1, 1));
  const starts = evs.filter((e) => e.kind === "retro-start").map((e) => dayKey(e.date));
  const ends = evs.filter((e) => e.kind === "retro-end").map((e) => dayKey(e.date));
  assert.equal(starts.length, 3, `старты: ${starts}`);
  assert.equal(ends.length, 3, `концы: ${ends}`);
  expected.forEach(([s, e], i) => {
    assert.ok(Math.abs(new Date(starts[i]).getTime() - new Date(s).getTime()) <= DAY, `старт ${starts[i]} vs ${s}`);
    assert.ok(Math.abs(new Date(ends[i]).getTime() - new Date(e).getTime()) <= DAY, `конец ${ends[i]} vs ${e}`);
  });
  // Внутри периода скорость отрицательна, снаружи — положительна
  assert.ok(positions(utc(2026, 3, 5)).find((p) => p.body === "mercury")!.retrograde);
  assert.ok(!positions(utc(2026, 5, 5)).find((p) => p.body === "mercury")!.retrograde);
});

test("Луна проходит знак за ~2.3 суток (1.9–2.75); ингрессов Луны за год ≈ 160", () => {
  const evs = ingresses("moon", utc(2026, 1, 1), utc(2027, 1, 1));
  assert.ok(evs.length >= 157 && evs.length <= 162, `ингрессов Луны: ${evs.length}`);
  for (let i = 1; i < evs.length; i++) {
    const gap = (new Date(evs[i].date).getTime() - new Date(evs[i - 1].date).getTime()) / DAY;
    assert.ok(gap > 1.9 && gap < 2.75, `интервал ${gap} между ${evs[i - 1].date} и ${evs[i].date}`);
    assert.equal(evs[i].fromSign, evs[i - 1].sign, "знаки идут подряд");
    assert.equal((SIGNS.indexOf(evs[i].sign!) - SIGNS.indexOf(evs[i].fromSign!) + 12) % 12, 1);
  }
  // Точность до минуты: за минуту до ингресса старый знак, в момент — новый
  const e = evs[10];
  assert.equal(moonSign(new Date(new Date(e.date).getTime() - 60_000)), e.fromSign);
  assert.equal(moonSign(new Date(e.date)), e.sign);
});

test("ингрессы Солнца 2026: 12 штук, знаки по порядку, Скорпион 23.10 09:38 UTC", () => {
  const evs = ingresses("sun", utc(2026, 1, 1), utc(2027, 1, 1));
  assert.equal(evs.length, 12);
  const scorpio = evs.find((e) => e.sign === "skorpion")!;
  assert.ok(hoursApart(new Date(scorpio.date), "2026-10-23T09:38:00Z") < 0.1, scorpio.date);
  const aries = evs.find((e) => e.sign === "oven")!;
  assert.ok(hoursApart(new Date(aries.date), "2026-03-20T14:46:00Z") < 0.1, aries.date);
});

test("events(): сортировка по дате, состав, пустой диапазон", () => {
  const evs = events(utc(2026, 10, 1), utc(2026, 11, 1));
  for (let i = 1; i < evs.length; i++) assert.ok(evs[i].date >= evs[i - 1].date);
  const kinds = new Set(evs.map((e) => e.kind));
  assert.ok(kinds.has("ingress") && kinds.has("new-moon") && kinds.has("full-moon") && kinds.has("retro-start"));
  assert.ok(evs.some((e) => e.body === "mercury" && e.kind === "retro-start" && dayKey(e.date) === "2026-10-24"));
  assert.ok(evs.some((e) => e.body === "venus" && e.kind === "retro-start" && dayKey(e.date) === "2026-10-03"));
  assert.deepEqual(events(utc(2026, 1, 2), utc(2026, 1, 1)), []);
});

test("аспекты: орбисы, applying, одна пара — один аспект", () => {
  const pos = positions(mskNoon("2026-10-06"));
  const asp = aspects(pos);
  for (const a of asp) {
    assert.ok(a.orb >= 0 && a.orb <= 8);
    assert.notEqual(a.a, a.b);
  }
  const pairs = new Set(asp.map((a) => `${a.a}-${a.b}`));
  assert.equal(pairs.size, asp.length);
  // 06.10.2026: Луна 19°45′ Льва сходится к Юпитеру 20°32′ Льва
  const mj = asp.find((a) => a.a === "moon" && a.b === "jupiter")!;
  assert.equal(mj.kind, "conjunction");
  assert.ok(mj.applying);
  // Синтетика: оппозиция через 0°, расходящаяся
  const synthetic = aspects([
    { body: "sun", lon: 2, sign: "oven", signIndex: 0, degree: 2, speed: 1, retrograde: false },
    { body: "mars", lon: 181, sign: "vesy", signIndex: 6, degree: 1, speed: 0.5, retrograde: false },
  ]);
  assert.equal(synthetic.length, 1);
  assert.equal(synthetic[0].kind, "opposition");
  assert.ok(Math.abs(synthetic[0].orb - 1) < 1e-9);
  assert.equal(synthetic[0].applying, false);
});

test("Луна без курса: окончание совпадает с ингрессом, признак согласован со sky()", () => {
  const d = mskNoon("2026-10-06");
  const voc = voidOfCourse(d);
  assert.equal(moonSign(new Date(voc.until.getTime() - 60_000)), "lev");
  assert.equal(moonSign(voc.until), "deva");
  assert.equal(voc.active, false); // соединение с Юпитером ещё впереди
  assert.equal(voc.lastAspect?.body, "jupiter");
  assert.equal(sky(d).moon.voidOfCourse, false);
  // После последнего аспекта и до выхода из знака — без курса
  const after = new Date(voc.lastAspect!.date.getTime() + 60 * 60_000);
  const voc2 = voidOfCourse(after);
  assert.equal(voc2.until.getTime(), voc.until.getTime());
  assert.equal(voc2.active, true, `ожидали без курса, нашли ${voc2.lastAspect?.kind} с ${voc2.lastAspect?.body}`);
});

test("солярные дома и московский полдень", () => {
  const d = mskNoon("2026-10-06");
  assert.equal(d.toISOString(), "2026-10-06T09:00:00.000Z");
  assert.throws(() => mskNoon("06.10.2026"));
  const pos = positions(d);
  const houses = solarHouses("vesy", pos);
  assert.equal(houses.find((h) => h.body === "sun")!.house, 1); // Солнце в Весах
  assert.equal(houses.find((h) => h.body === "moon")!.house, 11); // Луна во Льве: Лев − Весы = −2 → 11
  assert.equal(houses.find((h) => h.body === "saturn")!.house, 7); // Сатурн в Овне
  assert.equal(solarHouses("oven", pos).find((h) => h.body === "saturn")!.house, 1);
});
