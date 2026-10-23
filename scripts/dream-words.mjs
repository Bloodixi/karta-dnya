#!/usr/bin/env node
// Считает слова, видимые на странице символа сонника (/sonnik/<slug>):
// h1, short, meaning, long (intro, details, forWhom, repeat, faq) и заголовки шаблона
// из src/app/[section]/[slug]/page.tsx. long берётся из dreams.json, поверх — из dreams-long-*.json.
// Запуск: node scripts/dream-words.mjs [--long-only] [--min 600] [slug ...]
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const dataDir = path.join(root, "content/data");
const dreams = JSON.parse(fs.readFileSync(path.join(dataDir, "dreams.json"), "utf8"));
const overrides = {};
for (const f of fs.readdirSync(dataDir).filter((f) => /^dreams-long-.*\.json$/.test(f)).sort()) {
  Object.assign(overrides, JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8")));
}

const words = (s) => (String(s || "").match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || []).length;

export function pageWords(d) {
  const long = overrides[d.slug] || d.long;
  const parts = [`К чему снится ${d.word}`, d.short, d.meaning];
  if (long) {
    parts.push(...long.intro, `${d.word} во сне: детали и ситуации`);
    for (const x of long.details) parts.push(x.title, x.text);
    for (const x of long.forWhom || []) parts.push(`${d.word} во сне — ${x.who}`, x.text);
    parts.push("Если сон повторяется", long.repeat);
  }
  if (d.variants.length) {
    parts.push(long ? "Коротко о вариантах" : "Варианты сна");
    for (const v of d.variants) parts.push(v.when, v.means);
  }
  if (long?.faq?.length) {
    parts.push("Частые вопросы");
    for (const f of long.faq) parts.push(f.q, f.a);
  }
  return parts.reduce((n, p) => n + words(p), 0);
}

const args = process.argv.slice(2);
const longOnly = args.includes("--long-only");
const mi = args.indexOf("--min");
const min = mi >= 0 ? Number(args[mi + 1]) : 600;
const slugs = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--min");

let rows = dreams
  .filter((d) => !longOnly || d.long || overrides[d.slug])
  .filter((d) => !slugs.length || slugs.includes(d.slug))
  .map((d) => ({ slug: d.slug, words: pageWords(d), long: Boolean(d.long || overrides[d.slug]) }))
  .sort((a, b) => a.words - b.words);
for (const r of rows) console.log(`${String(r.words).padStart(5)}  ${r.long ? "L" : " "}  ${r.slug}${r.words < min ? "  < " + min : ""}`);
if (rows.length) {
  const w = rows.map((r) => r.words);
  console.log(`\nсимволов: ${rows.length}, мин ${Math.min(...w)}, макс ${Math.max(...w)}, ниже ${min}: ${rows.filter((r) => r.words < min).length}`);
}
