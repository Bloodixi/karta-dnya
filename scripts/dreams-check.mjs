// Проверка сонника: слова по символам (короткий текст + толкование + варианты + расширенный разбор `long`)
// и повторы между символами — одинаковые предложения и одинаковые зачины (первые 4 слова предложения).
// Запуск: node scripts/dreams-check.mjs [--all] [--json]. Код выхода 1, если найдены повторы внутри расширенных текстов.
import fs from "node:fs";

const dreams = JSON.parse(fs.readFileSync("content/data/dreams.json", "utf8"));
const args = new Set(process.argv.slice(2));

const words = (s) => (s.match(/[\p{L}\d-]+/gu) || []).length;
const baseText = (d) => [d.short, d.meaning, ...d.variants.flatMap((v) => [v.when, v.means])].join(" ");
const longParts = (l) =>
  l ? [...l.intro, ...l.details.flatMap((x) => [x.title, x.text]), ...(l.forWhom || []).map((x) => x.text), l.repeat, ...l.faq.flatMap((f) => [f.q, f.a])] : [];
const sentences = (s) => s.split(/(?<=[.!?…])\s+/).map((x) => x.trim()).filter((x) => words(x) >= 4);
const norm = (s) => s.toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\d ]+/gu, " ").replace(/\s+/g, " ").trim();
const opener = (s) => norm(s).split(" ").slice(0, 4).join(" ");

const rows = dreams.map((d) => ({ slug: d.slug, base: words(baseText(d)), long: words(longParts(d.long).join(" ")), faq: d.long?.faq.length || 0, details: d.long?.details.length || 0 }));
const withLong = rows.filter((r) => r.long);
const sum = (a, k) => a.reduce((s, r) => s + r[k], 0);
const total = (r) => r.base + r.long;

console.log(`символов: ${rows.length}, с расширенным разбором: ${withLong.length}`);
console.log(`слов в среднем по всем: ${Math.round(rows.reduce((s, r) => s + total(r), 0) / rows.length)}`);
if (withLong.length) {
  const t = withLong.map(total).sort((a, b) => a - b);
  console.log(`расширенные: в среднем ${Math.round(sum(withLong, "base") / withLong.length)} → ${Math.round(t.reduce((a, b) => a + b, 0) / t.length)} слов, мин ${t[0]}, макс ${t.at(-1)}`);
  const bad = withLong.filter((r) => total(r) < 420 || total(r) > 700 || r.details < 5 || r.details > 8 || r.faq < 3 || r.faq > 4);
  if (bad.length) console.log("вне рамок (всего не 420–700 слов, деталей не 5–8 или FAQ не 3–4):", bad.map((r) => `${r.slug}(${r.long}/${r.details}/${r.faq})`).join(", "));
}
if (args.has("--all")) for (const r of rows) console.log(`${r.slug.padEnd(24)} ${String(r.base).padStart(4)} + ${String(r.long).padStart(4)} = ${total(r)}`);

// повторы: в расширенных текстах между собой и с базовыми текстами всех символов
const seenSent = new Map();
const seenOpen = new Map();
const add = (m, key, slug) => { if (!m.has(key)) m.set(key, new Set()); m.get(key).add(slug); };
for (const d of dreams) {
  // вопросы FAQ («К чему снится …») в зачинах не считаем: это естественная форма поискового вопроса
  const questions = new Set((d.long?.faq || []).map((f) => f.q));
  for (const p of [d.short, d.meaning, ...longParts(d.long)]) {
    for (const s of sentences(p)) {
      add(seenSent, norm(s), d.slug);
      if (d.long && !questions.has(p)) add(seenOpen, opener(s), d.slug);
    }
  }
}
const dupSent = [...seenSent].filter(([, s]) => s.size > 1);
const longSlugs = new Set(withLong.map((r) => r.slug));
const dupSentLong = dupSent.filter(([, s]) => [...s].some((x) => longSlugs.has(x)));
const dupOpen = [...seenOpen].filter(([, s]) => s.size > 1);
console.log(`\nодинаковых предложений между символами: ${dupSent.length} (с участием расширенных: ${dupSentLong.length})`);
for (const [k, s] of dupSentLong) console.log(`  «${k}» — ${[...s].join(", ")}`);
console.log(`одинаковых зачинов (4 слова) в расширенных текстах у разных символов: ${dupOpen.length}`);
for (const [k, s] of dupOpen) console.log(`  «${k}…» — ${[...s].join(", ")}`);
if (args.has("--json")) console.log(JSON.stringify(rows));
process.exit(dupSentLong.length || dupOpen.length ? 1 : 0);
