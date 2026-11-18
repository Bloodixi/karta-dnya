// Проверка перед сборкой: «гороскоп на завтра» не должен говорить «сегодня».
// Смотрит content/data/horoscopes/zavtra/*.json с ключом от FROM и падает со списком мест, если найдёт слово.
// Источник текстов — scripts/horoscope-polish.py (там такая же проверка и просьба в промпте).
import fs from "node:fs";
import path from "node:path";

const FROM = "2026-10-17"; // более ранние файлы написаны до правки и на странице «завтра» уже не показываются
const FROM_NO_DRAFT = "2026-11-15"; // с этой даты черновики в продакшене запрещены
const FIELDS = ["general", "love", "career", "health", "advice", "mood"];
const TODAY = /(^|[^а-яё])сегодня/i;
const root = path.join(process.cwd(), "content", "data", "horoscopes");
const dir = path.join(root, "zavtra");

const bad = [];
const drafts = [];
let files = [];
try {
  files = fs.readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f.slice(0, 10) >= FROM);
} catch {
  files = [];
}
for (const f of files) {
  let arr;
  try {
    arr = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  } catch (e) {
    bad.push(`${f}: не читается (${e.message})`);
    continue;
  }
  for (const t of Array.isArray(arr) ? arr : []) {
    for (const k of FIELDS) {
      const v = typeof t?.[k] === "string" ? t[k] : "";
      const m = v.match(TODAY);
      if (m) bad.push(`${f} ${t.sign}.${k}: «…${v.slice(Math.max(0, m.index - 30), m.index + 40)}…»`);
    }
  }
}

for (const period of ["segodnya", "zavtra", "nedelya", "mesyats", "god"]) {
  const pdir = path.join(root, period);
  let pfiles = [];
  try {
    pfiles = fs.readdirSync(pdir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f.slice(0, 10) >= FROM_NO_DRAFT);
  } catch {
    pfiles = [];
  }
  for (const f of pfiles) {
    let arr;
    try {
      arr = JSON.parse(fs.readFileSync(path.join(pdir, f), "utf8"));
    } catch (e) {
      drafts.push(`${period}/${f}: не читается (${e.message})`);
      continue;
    }
    for (const t of Array.isArray(arr) ? arr : []) {
      if (!t?.model || t.model === "draft") {
        drafts.push(`${period}/${f} ${t?.sign ?? "?"}: model=${t?.model ?? "null"}`);
      }
    }
  }
}

if (bad.length) {
  console.error(`horoscope-check: в гороскопе на завтра встречается «сегодня» (${bad.length}):\n` + bad.slice(0, 30).join("\n"));
  process.exit(1);
}
if (drafts.length) {
  console.error(`horoscope-check: найдены неотредактированные черновики (model=draft, ${drafts.length}):\n` + drafts.slice(0, 30).join("\n"));
  process.exit(1);
}
console.log(`horoscope-check: zavtra без «сегодня» (${files.length} файлов), черновиков >= ${FROM_NO_DRAFT} нет`);
