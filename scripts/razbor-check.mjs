// Проверка банка текстов разбора: полнота ключей и длины полей (см. content/data/razbor/README.md).
import { readFileSync, existsSync } from "node:fs";

const DIR = new URL("../content/data/razbor/", import.meta.url);
const N12 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "11", "22", "33"];
const N9 = N12.slice(0, 9);
const N31 = Array.from({ length: 31 }, (_, i) => String(i + 1));
const BANNED = /(\bИИ\b|нейросет|искусственн\w* интеллект|гарантир|порч|проклят|диагноз|вылеч|разбогате)/i;

const spec = {
  "destiny.json": { keys: N12, fields: { title: [5, 40], essence: [1400, 2000], strengths: [800, 1200], shadows: [800, 1200], calling: [800, 1200] } },
  "destiny-life.json": { keys: N12, fields: { love: [900, 1300], work: [900, 1300], pairNote: [300, 600] }, arrays: { advice: [5, 120, 250] }, nums: ["easy", "hard"] },
  "birthday.json": { keys: N31, string: [500, 900] },
  "pythagoras.json": { keys: N9, fields: { title: [5, 40], intro: [250, 450] }, arrays: { levels: [4, 350, 650] } },
  "year.json": { keys: N9, fields: { title: [5, 40], theme: [800, 1200], first: [450, 750], second: [450, 750], advice: [300, 500] } },
  "month.json": { keys: N9, string: [280, 480] },
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
  for (const k of sp.keys) {
    const v = data[k];
    const w = `${file}[${k}]`;
    if (v === undefined) { err(`${w}: нет ключа`); continue; }
    if (sp.string) { checkText(w, v, sp.string); continue; }
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
