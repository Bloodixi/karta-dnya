import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("article page renders AuthorCard, authorJsonLd, image and dateModified for all sections", () => {
  const root = process.cwd();
  const src = fs.readFileSync(path.join(root, "src/app/[section]/[slug]/page.tsx"), "utf8");
  assert.ok(!src.includes('const author = key === "astrologiya" ? horoscopeAuthor() : null;'), "author must not be restricted to astrologiya");
  assert.ok(src.includes("const author = horoscopeAuthor();"), "article page must resolve author");
  assert.ok(src.includes("dateModified: modified"), "Article JSON-LD must include dateModified");
  assert.ok(src.includes("a.cover ? { image: `${SITE.url}${a.cover.file}` }"), "Article JSON-LD must include image when cover exists");
  assert.ok(src.includes('readJsonData<Record<string, string>>("lastmod.json"'), "article page must read lastmod.json");
});

test("tarot tool pages have WebApplication JSON-LD, ArticleLinks, pageTitle and RazborCta", () => {
  const root = process.cwd();
  const spread = fs.readFileSync(path.join(root, "src/app/taro/rasklady/[slug]/page.tsx"), "utf8");
  const wish = fs.readFileSync(path.join(root, "src/app/taro/na-zhelanie/page.tsx"), "utf8");
  const yesno = fs.readFileSync(path.join(root, "src/app/taro/da-net/page.tsx"), "utf8");
  const three = fs.readFileSync(path.join(root, "src/app/taro/tri-karty/page.tsx"), "utf8");
  const links = fs.readFileSync(path.join(root, "src/lib/article-links.ts"), "utf8");

  assert.ok(spread.includes("pageTitle(s.title)"), "rasklady/[slug] must use pageTitle(s.title)");
  assert.ok(spread.includes("<RazborCta"), "rasklady/[slug] must render RazborCta");
  assert.ok(wish.includes('<RazborCta from="taro-na-zhelanie"'), "na-zhelanie must render RazborCta");

  for (const [name, src] of [
    ["rasklady/[slug]", spread],
    ["na-zhelanie", wish],
    ["da-net", yesno],
    ["tri-karty", three],
  ] as const) {
    assert.ok(src.includes('"@type": "WebApplication"'), `${name} missing WebApplication JSON-LD`);
    assert.ok(src.includes("<ArticleLinks"), `${name} missing ArticleLinks`);
  }

  for (const key of ['"/taro/na-zhelanie"', '"/taro/da-net"', '"/taro/tri-karty"']) {
    assert.ok(links.includes(key), `article-links.ts missing ${key}`);
  }
});
