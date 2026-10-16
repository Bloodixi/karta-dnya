// Проверка банка текстов разбора: полнота ключей и длины полей (см. content/data/razbor/README.md).
import { readFileSync, existsSync } from "node:fs";

const DIR = new URL("../content/data/razbor/", import.meta.url);
const N12 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "11", "22", "33"];
const N9 = N12.slice(0, 9);
const N31 = Array.from({ length: 31 }, (_, i) => String(i + 1));
const BANDS = ["young", "build", "mature", "senior"];
const pairs = (a, b) => a.flatMap((x) => b.map((y) => `${x}.${y}`));
/** «a.b» при a ≤ b — пары базовых цифр (45 ключей). */
const PAIRS_LE = N9.flatMap((a) => N9.filter((b) => +b >= +a).map((b) => `${a}.${b}`));
const CATS = ["start", "plan", "bonds", "show", "work", "change", "rest"];
const BANNED = /(\bИИ\b|нейросет|искусственн\w* интеллект|гарантир|порч|проклят|диагноз|вылеч|разбогате)/i;

const spec = {
  "destiny.json": { keys: N12, fields: { title: [5, 40], essence: [1400, 2000], strengths: [800, 1200], shadows: [800, 1200], calling: [800, 1200] } },
  "destiny-life.json": { keys: N12, fields: { love: [900, 1300], work: [900, 1300], pairNote: [300, 600] }, arrays: { advice: [5, 120, 250] }, nums: ["easy", "hard"] },
  "birthday.json": { keys: N31, string: [500, 900] },
  "pythagoras.json": { keys: N9, fields: { title: [5, 40], intro: [250, 450] }, arrays: { levels: [4, 350, 650] } },
  "year.json": { keys: N9, fields: { title: [5, 40], theme: [800, 1200], first: [450, 750], second: [450, 750], advice: [300, 500] } },
  "month.json": { keys: N9, string: [280, 480] },
  "month-year.json": { keys: pairs(N9, N9), string: [450, 750] },
  "svod-year.json": { keys: pairs(N12, N9), string: [600, 900] },
  "year-age.json": { keys: pairs(N9, BANDS), string: [300, 500] },
  "love-age.json": { keys: pairs(N12, BANDS), string: [300, 450] },
  "work-age.json": { keys: pairs(N12, BANDS), string: [300, 450] },
  "pinnacle.json": { nested: { pinnacle: { keys: [...N9, "11"], fields: { title: [5, 40], text: [600, 900], short: [140, 240] } } }, groups: { stage: ["1", "2", "3", "4"] }, optional: { stage: ["4early"] }, string: [250, 450] },
  "svod.json": { groups: { destiny: N12, birthday: N31, strong: N9, weak: N9 }, single: ["noweak"], string: [160, 320] },
  // Версия 4
  "year-late.json": { keys: N9, fields: { rest: [400, 650], bridge: [200, 350] } },
  "month-cat.json": { keys: pairs(N9, N9), oneOf: CATS },
  "gist.json": { groups: { destiny: N12, year: N9, cell: N9 }, string: [60, 140] },
  "pair.json": { keys: PAIRS_LE, string: [300, 450] },
  "month-destiny.json": { keys: pairs(N12, N9), string: [90, 180] },
  "month-destiny2.json": { keys: pairs(N12, N9), string: [90, 180] },
  "month-destiny-plan.json": { keys: N12, string: [90, 180] },
  "advice.json": { groupArrays: { cell: N9, year: N9, period: [...N9, "11"] }, array: [2, 120, 250] },
};

const only = process.argv[2];
let errors = 0;
const err = (m) => { errors++; console.log("✗ " + m); };
const checkText = (where, s, [min, max]) => {
  if (typeof s !== "string" || !s.trim()) return err(`${where}: пусто`);
  const n = s.length;
  if (n < min * 0.9 || n > max * 1.15) err(`${where}: ${n} знаков, нужно ${min}–${max}`);
  const b = s.match(BANNED);
  if (b) err(`${where}: запрещённое «${b[0]}»`);
};

for (const [file, sp] of Object.entries(spec)) {
  if (only && only !== file) continue;
  const url = new URL(file, DIR);
  if (!existsSync(url)) { err(`${file}: нет файла`); continue; }
  let data;
  try { data = JSON.parse(readFileSync(url, "utf8")); } catch (e) { err(`${file}: не JSON — ${e.message}`); continue; }
  for (const [g, ns] of Object.entries(sp.nested ?? {})) {
    for (const k of ns.keys) for (const [f, lim] of Object.entries(ns.fields)) checkText(`${file}.${g}[${k}].${f}`, data[g]?.[k]?.[f], lim);
  }
  for (const [g, keys] of Object.entries(sp.groups ?? {})) {
    for (const k of keys) checkText(`${file}.${g}[${k}]`, data[g]?.[k], sp.string);
  }
  for (const [g, keys] of Object.entries(sp.optional ?? {})) {
    for (const k of keys) if (data[g]?.[k] !== undefined) checkText(`${file}.${g}[${k}]`, data[g][k], sp.string);
  }
  for (const [g, keys] of Object.entries(sp.groupArrays ?? {})) {
    const [count, min, max] = sp.array;
    for (const k of keys) {
      const a = data[g]?.[k];
      if (!Array.isArray(a) || a.length !== count) { err(`${file}.${g}[${k}]: нужен массив из ${count}`); continue; }
      a.forEach((s, i) => checkText(`${file}.${g}[${k}][${i}]`, s, [min, max]));
    }
  }
  for (const f of sp.single ?? []) checkText(`${file}.${f}`, data[f], sp.string);
  for (const k of sp.keys ?? []) {
    const v = data[k];
    const w = `${file}[${k}]`;
    if (v === undefined) { err(`${w}: нет ключа`); continue; }
    if (sp.string) { checkText(w, v, sp.string); continue; }
    if (sp.oneOf) { if (!sp.oneOf.includes(v)) err(`${w}: «${v}» — нужно одно из ${sp.oneOf.join(", ")}`); continue; }
    for (const [f, lim] of Object.entries(sp.fields ?? {})) checkText(`${w}.${f}`, v[f], lim);
    for (const [f, [count, min, max]] of Object.entries(sp.arrays ?? {})) {
      if (!Array.isArray(v[f]) || v[f].length !== count) { err(`${w}.${f}: нужен массив из ${count}`); continue; }
      v[f].forEach((s, i) => checkText(`${w}.${f}[${i}]`, s, [min, max]));
    }
    for (const f of sp.nums ?? []) {
      if (!Array.isArray(v[f]) || !v[f].length || v[f].some((x) => !Number.isInteger(x) || x < 1 || x > 9)) err(`${w}.${f}: нужен массив чисел 1–9`);
    }
  }
}
console.log(errors ? `Ошибок: ${errors}` : "Банк текстов разбора в порядке.");
process.exit(errors ? 1 : 0);
