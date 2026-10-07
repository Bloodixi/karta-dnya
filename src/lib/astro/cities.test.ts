/** Поиск городов для натальной карты: `npx tsx --test src/lib/astro/cities.test.ts`. */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fromLatinLayout, indexCities, normalize, searchCities, slugify, translit, type City } from "./cities";

const SAMPLE: City[] = [
  { name: "Москва", country: "RU", lat: 55.76, lon: 37.62, tz: "Europe/Moscow", alt: ["Moscow"] },
  { name: "Санкт-Петербург", country: "RU", lat: 59.94, lon: 30.31, tz: "Europe/Moscow", alt: ["Ленинград", "Питер", "СПб"] },
  { name: "Орёл", country: "RU", lat: 52.97, lon: 36.07, tz: "Europe/Moscow" },
  { name: "Королёв", country: "RU", lat: 55.92, lon: 37.83, tz: "Europe/Moscow" },
  { name: "Благовещенск", country: "RU", lat: 50.27, lon: 127.54, tz: "Asia/Yakutsk" },
  { name: "Благовещенск", country: "RU", lat: 55.04, lon: 55.98, tz: "Asia/Yekaterinburg" },
  { name: "Алматы", country: "KZ", lat: 43.24, lon: 76.95, tz: "Asia/Almaty", alt: ["Алма-Ата"] },
];

test("нормализация: ё/е, дефисы, транслит, слаг, раскладка", () => {
  assert.equal(normalize("Орёл"), "орел");
  assert.equal(normalize("Санкт-Петербург"), "санкт петербург");
  assert.equal(translit("Москва"), "moskva");
  assert.equal(slugify("Санкт-Петербург"), "sankt-peterburg");
  assert.equal(slugify("Нижний Новгород"), "nizhniy-novgorod");
  assert.equal(fromLatinLayout("vjcrdf"), "москва");
});

test("индекс: уникальные слаги у одноимённых городов", () => {
  const idx = indexCities(SAMPLE);
  const slugs = idx.map((c) => c.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.ok(slugs.includes("blagoveschensk") && slugs.includes("blagoveschensk-ru"));
});

test("поиск: подстрока, ё/е, старые названия, латиница и неверная раскладка", () => {
  const idx = indexCities(SAMPLE);
  assert.equal(searchCities(idx, "моск")[0]?.name, "Москва");
  assert.equal(searchCities(idx, "орел")[0]?.name, "Орёл");
  assert.equal(searchCities(idx, "Королев")[0]?.name, "Королёв");
  assert.equal(searchCities(idx, "ленинград")[0]?.name, "Санкт-Петербург");
  assert.equal(searchCities(idx, "петербург")[0]?.name, "Санкт-Петербург");
  assert.equal(searchCities(idx, "moskva")[0]?.name, "Москва");
  assert.equal(searchCities(idx, "Moscow")[0]?.name, "Москва");
  assert.equal(searchCities(idx, "vjcrdf")[0]?.name, "Москва");
  assert.equal(searchCities(idx, "алма-ата")[0]?.name, "Алматы");
  assert.deepEqual(searchCities(idx, "м"), []);
  assert.deepEqual(searchCities(idx, "zzzz"), []);
});

test("справочник cities.json: объём, поля, таймзоны, уникальные слаги", () => {
  const file = path.join(process.cwd(), "content/data/astro/cities.json");
  const list = JSON.parse(fs.readFileSync(file, "utf8")) as City[];
  assert.ok(list.length >= 600, `городов: ${list.length}`);
  const countries = new Set(list.map((c) => c.country));
  for (const cc of ["RU", "BY", "KZ", "UA", "UZ", "AM", "GE", "MD", "KG", "US", "GB", "DE"]) assert.ok(countries.has(cc), `нет страны ${cc}`);
  for (const c of list) {
    assert.ok(c.name && Math.abs(c.lat) <= 90 && Math.abs(c.lon) <= 180, `плохая запись ${JSON.stringify(c)}`);
    assert.doesNotThrow(() => new Intl.DateTimeFormat("ru-RU", { timeZone: c.tz }), `неизвестная таймзона ${c.tz} у ${c.name}`);
  }
  const idx = indexCities(list);
  assert.equal(new Set(idx.map((c) => c.slug)).size, idx.length);
  assert.equal(searchCities(idx, "Москва")[0]?.slug, "moskva");
  assert.equal(searchCities(idx, "Минск")[0]?.country, "BY");
  assert.equal(searchCities(idx, "Киев")[0]?.country, "UA");
});
