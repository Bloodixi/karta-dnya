/** Проверка натальной карты: `npx tsx --test src/lib/astro/natal.test.ts`. */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as Astro from "astronomy-engine";
import {
  ascendant, equalCusps, houseOf, localToUtc, midheaven, natalChart, obliquity, placidusCusps, ramc, tzOffsetMinutes, formatDegree,
} from "./natal";
import { norm360, separation } from "./engine";

const utc = (y: number, m: number, d: number, h = 0, min = 0, s = 0) => new Date(Date.UTC(y, m - 1, d, h, min, s));
const MOSCOW = { lat: 55.76, lon: 37.62, tz: "Europe/Moscow" };

test("Солнце в знаке по дате рождения (время неизвестно)", () => {
  const cases: [string, string][] = [
    ["1990-05-12", "telets"],
    ["2000-01-01", "kozerog"],
    ["1985-08-20", "lev"],
    ["1975-11-30", "strelets"],
    ["1969-07-20", "rak"],
  ];
  for (const [date, sign] of cases) {
    const chart = natalChart({ date, time: null, ...MOSCOW });
    const sun = chart.planets.find((p) => p.body === "sun")!;
    assert.equal(sun.sign, sign, `${date}: ${sun.sign}`);
    assert.equal(sun.house, null);
    assert.equal(chart.houses, null);
    assert.equal(chart.moonApprox, true);
    assert.equal(chart.timeKnown, false);
  }
});

test("звёздное время: Meeus, пример 12.a (1987-04-10 0h UT, GAST 13h10m46.1351s)", () => {
  const gast = Astro.SiderealTime(utc(1987, 4, 10));
  assert.ok(Math.abs(gast - (13 + 10 / 60 + 46.1351 / 3600)) * 3600 < 0.1, `GAST ${gast}`);
});

test("ASC/MC на общедоступных примерах (Astrodienst, рейтинг AA), допуск 1°", () => {
  // Альберт Эйнштейн: 14.03.1879, 11:30 LMT, Ульм (48°24′N, 9°59′E) → UT 10:50; ASC 11°39′ Рака, MC ≈ 12°50′ Рыб.
  const ein = utc(1879, 3, 14, 10, 50, 2);
  const e1 = obliquity(ein);
  const r1 = ramc(ein, 9.99);
  assert.ok(separation(ascendant(r1, 48.4, e1), 90 + 11.65) < 1, `ASC Эйнштейна: ${ascendant(r1, 48.4, e1)}`);
  assert.ok(separation(midheaven(r1, e1), 330 + 12.83) < 1, `MC Эйнштейна: ${midheaven(r1, e1)}`);

  // Диана Спенсер: 01.07.1961, 19:45 BST (18:45 UT), Сандрингем (52°50′N, 0°30′E); ASC 18°24′ Стрельца, MC 23°03′ Весов.
  const di = utc(1961, 7, 1, 18, 45);
  const e2 = obliquity(di);
  const r2 = ramc(di, 0.5);
  assert.ok(separation(ascendant(r2, 52.83, e2), 240 + 18.4) < 1, `ASC Дианы: ${ascendant(r2, 52.83, e2)}`);
  assert.ok(separation(midheaven(r2, e2), 180 + 23.05) < 1, `MC Дианы: ${midheaven(r2, e2)}`);
});

test("ASC лежит на восточном горизонте, MC — на меридиане (независимая проверка через Horizon)", () => {
  const when = utc(1961, 7, 1, 18, 45);
  const lat = 52.83;
  const lon = 0.5;
  const eps = obliquity(when);
  const r = ramc(when, lon);
  const time = Astro.MakeTime(when);
  const rot = Astro.Rotation_ECL_EQD(time);
  const obs = new Astro.Observer(lat, lon, 0);
  const horizon = (eclLon: number) => {
    const v = Astro.VectorFromSphere(new Astro.Spherical(0, eclLon, 1), time);
    const eq = Astro.EquatorFromVector(Astro.RotateVector(rot, v));
    return Astro.Horizon(when, obs, eq.ra, eq.dec, "");
  };
  const asc = horizon(ascendant(r, lat, eps));
  assert.ok(Math.abs(asc.altitude) < 0.5, `высота ASC ${asc.altitude}`);
  assert.ok(asc.azimuth > 0 && asc.azimuth < 180, `азимут ASC ${asc.azimuth} (восток)`);
  const mc = horizon(midheaven(r, eps));
  assert.ok(Math.abs(mc.azimuth - 180) < 1, `азимут MC ${mc.azimuth}`);
});

test("Плацидус: 12 куспидов, противоположные дома, порядок, ASC = 1-й, MC = 10-й", () => {
  const when = utc(1990, 5, 12, 10, 30);
  const eps = obliquity(when);
  const r = ramc(when, MOSCOW.lon);
  const cusps = placidusCusps(r, MOSCOW.lat, eps);
  assert.equal(cusps.length, 12);
  assert.ok(separation(cusps[0], ascendant(r, MOSCOW.lat, eps)) < 1e-9);
  assert.ok(separation(cusps[9], midheaven(r, eps)) < 1e-9);
  for (let i = 0; i < 6; i++) assert.ok(separation(norm360(cusps[i] + 180), cusps[i + 6]) < 1e-9, `дома ${i + 1} и ${i + 7}`);
  // куспиды идут по возрастанию долготы (каждый следующий в пределах 0..180° от предыдущего)
  for (let i = 0; i < 12; i++) {
    const span = norm360(cusps[(i + 1) % 12] - cusps[i]);
    assert.ok(span > 0 && span < 180, `дом ${i + 1}: ширина ${span}`);
  }
  // Диана: Astrodienst даёт 2-й дом ≈ 0° Водолея, 3-й ≈ 18° Рыб, 11-й ≈ 16° Скорпиона, 12-й ≈ 3° Стрельца
  const di = utc(1961, 7, 1, 18, 45);
  const c = placidusCusps(ramc(di, 0.5), 52.83, obliquity(di));
  assert.ok(separation(c[1], 300.5) < 1, `2-й дом Дианы ${c[1]}`);
  assert.ok(separation(c[2], 348.6) < 1, `3-й дом Дианы ${c[2]}`);
});

test("дома: распределение планет и равнодомная система за полярным кругом", () => {
  const chart = natalChart({ date: "1990-05-12", time: "14:30", ...MOSCOW });
  assert.equal(chart.utc, "1990-05-12T10:30:00.000Z");
  assert.equal(chart.offsetMinutes, 240); // летнее время 1990 года
  assert.equal(chart.houses?.system, "placidus");
  for (const p of chart.planets) {
    assert.ok(p.house && p.house >= 1 && p.house <= 12);
    assert.equal(p.house, houseOf(p.lon, chart.houses!.cusps));
  }
  const polar = natalChart({ date: "1990-05-12", time: "14:30", lat: 69.0, lon: 33.0, tz: "Europe/Moscow" });
  assert.equal(polar.houses?.system, "equal");
  assert.deepEqual(polar.houses?.cusps, equalCusps(polar.houses!.asc));
  assert.equal(houseOf(10, [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]), 1);
  assert.equal(houseOf(359, [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]), 12);
});

test("местное время → UTC с историческими правилами таймзон", () => {
  assert.equal(tzOffsetMinutes("Europe/Moscow", utc(1980, 1, 15, 12)), 180);
  assert.equal(tzOffsetMinutes("Europe/Moscow", utc(2026, 1, 15, 12)), 180);
  assert.equal(localToUtc("2024-07-01", "12:00", "Asia/Yekaterinburg").toISOString(), "2024-07-01T07:00:00.000Z");
  assert.equal(localToUtc("2024-07-01", "00:30", "America/New_York").toISOString(), "2024-07-01T04:30:00.000Z");
  assert.throws(() => localToUtc("2024-7-1", "12:00", "Europe/Moscow"));
  assert.equal(formatDegree(90 + 11.65), "11°39′");
  assert.equal(formatDegree(29.9999), "29°59′"); // округление не выводит за границу знака
});
