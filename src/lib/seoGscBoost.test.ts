import assert from "node:assert/strict";
import test from "node:test";
import { articlesFor } from "./article-links";
import { findStone, getArticle } from "./content";

test("target GSC stones have Answer-First, table facts, caution and FAQ", () => {
  for (const slug of ["shungit", "yantar", "agat", "nefrit"]) {
    const stone = findStone(slug);
    assert.ok(stone, `missing stone ${slug}`);
    assert.ok(stone.answerFirst && stone.answerFirst.length >= 120, `missing answerFirst for ${slug}`);
    assert.ok(stone.origin && stone.origin.length >= 10, `missing origin for ${slug}`);
    assert.ok(stone.waterSafe && stone.waterSafe.length >= 10, `missing waterSafe for ${slug}`);
    assert.ok(stone.caution && stone.caution.length >= 40, `missing caution for ${slug}`);
    assert.ok(stone.varieties && stone.varieties.length >= 3, `missing varieties for ${slug}`);
    assert.ok(stone.faq && stone.faq.length >= 2, `missing stone faq for ${slug}`);
    const linked = articlesFor(`/kamni/${slug}`);
    assert.ok(linked.length >= 2, `expected >= 2 linked articles for ${slug}`);
  }
});

test("zatmeniya-2027 has 5-eclipse calendar table, 5 FAQs and bridges", async () => {
  const article = await getArticle("astrologiya", "zatmeniya-2027");
  assert.ok(article, "missing zatmeniya-2027 article");
  assert.ok(article.faq.length >= 5, `expected >= 5 FAQs, got ${article.faq.length}`);
  assert.ok(article.html.includes("6 февраля 2027"), "missing 6 Feb eclipse row");
  assert.ok(article.html.includes("20–21 февраля 2027"), "missing 20-21 Feb eclipse row");
  assert.ok(article.html.includes("18 июля 2027"), "missing 18 Jul eclipse row");
  assert.ok(article.html.includes("2 августа 2027"), "missing 2 Aug eclipse row");
  assert.ok(article.html.includes("17 августа 2027"), "missing 17 Aug eclipse row");
  assert.ok(article.html.includes("/kamni/po-date-rozhdeniya"), "missing stone-by-date bridge");
  assert.ok(article.html.includes("/razbor?from=prognoz-2027"), "missing razbor bridge");
});
