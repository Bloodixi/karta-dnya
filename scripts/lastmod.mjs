// Даты последней правки файлов из git → content/data/lastmod.json (для lastmod в sitemap).
// Запускается перед сборкой (npm prebuild). Без git или в неполном (shallow) клоне файл не трогает — берётся закоммиченный.
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const OUT = "content/data/lastmod.json";
const git = (...a) => execFileSync("git", a, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 << 20 }).trim();
try {
  if (git("rev-parse", "--is-shallow-repository") !== "false") throw new Error("shallow");
  const log = git("log", "--format=@%cs", "--name-only", "--", "src/app", "src/lib", "content/articles", "content/data", ":!content/data/horoscopes", `:!${OUT}`);
  const dates = {};
  let day = "";
  for (const line of log.split("\n")) {
    if (line.startsWith("@")) day = line.slice(1);
    else if (line && !(line in dates)) dates[line] = day; // log идёт от новых к старым — первая встреча и есть последняя правка
  }
  const sorted = Object.fromEntries(Object.keys(dates).sort().filter((f) => fs.existsSync(f)).map((f) => [f, dates[f]]));
  fs.writeFileSync(OUT, JSON.stringify(sorted, null, 1) + "\n");
  console.log(`lastmod: ${Object.keys(sorted).length} файлов → ${OUT}`);
} catch (e) {
  console.log(`lastmod: git недоступен (${e.message.split("\n")[0]}), оставляю ${OUT} как есть`);
}
