import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { ARTICLE_LINKS, articlesFor } from "./article-links";
import { ARCANA_NUMBERS, findMatrixArcana, findMatrixPositions } from "./matrix";
import { firstSentence } from "./meta";

test("matrix arcana data and article links cover all 22 arcana", () => {
  assert.equal(ARCANA_NUMBERS.length, 22);
  for (const n of ARCANA_NUMBERS) {
    const a = findMatrixArcana(n);
    const pos = findMatrixPositions(n);
    assert.ok(a, `missing arcana ${n}`);
    assert.ok(pos, `missing positions for arcana ${n}`);
    assert.ok(firstSentence(a.plus).length >= 15, `short plus for ${n}`);
    assert.ok(firstSentence(a.minus).length >= 15, `short minus for ${n}`);
    assert.ok(firstSentence(pos.dengi).length >= 15, `short dengi for ${n}`);
    assert.ok(firstSentence(pos.otnosheniya).length >= 15, `short otnosheniya for ${n}`);
    assert.ok(a.advice.length >= 10, `short advice for ${n}`);
  }

  const configured = ARTICLE_LINKS["/matrica-sudby/arkany/*"];
  assert.ok(configured, "article-links.ts missing /matrica-sudby/arkany/*");
  assert.ok(configured.includes("numerologiya/matrica-sudby-rasshifrovka"));
  assert.ok(configured.includes("numerologiya/karmicheskiy-hvost-v-matrice-sudby"));

  const resolved = articlesFor("/matrica-sudby/arkany/1");
  assert.ok(
    resolved.some((a) => `${a.section}/${a.slug}` === "numerologiya/matrica-sudby-rasshifrovka"),
    "articlesFor should resolve matrica-sudby-rasshifrovka",
  );
});

test("matrica-sudby arkany and sovmestimost pages have Answer-First, links and JSON-LD", () => {
  const root = process.cwd();
  const arcanaPage = fs.readFileSync(path.join(root, "src/app/matrica-sudby/arkany/[n]/page.tsx"), "utf8");
  const pairPage = fs.readFileSync(path.join(root, "src/app/matrica-sudby/sovmestimost/page.tsx"), "utf8");

  assert.ok(arcanaPage.includes("Коротко: {a.n} аркан"), "arkany/[n] missing Answer-First card");
  assert.ok(arcanaPage.includes('<ArticleLinks path="/matrica-sudby/arkany/*"'), "arkany/[n] missing ArticleLinks");
  assert.ok(
    arcanaPage.includes('href="/razbor-rebenka" className="text-accent-text underline"'),
    "arkany/[n] missing /razbor-rebenka bridge",
  );
  assert.ok(arcanaPage.includes("dateModified,"), "arkany/[n] Article JSON-LD missing dateModified");

  assert.ok(pairPage.includes('"@type": "WebApplication"'), "sovmestimost missing WebApplication JSON-LD");
  assert.ok(
    pairPage.includes("Как читать совместимость пары за 30 секунд"),
    "sovmestimost missing Answer-First block",
  );
});
