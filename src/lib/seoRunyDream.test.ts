import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { articlesFor } from "./article-links";
import { findDream, getRunes } from "./content";

test("/runy has CollectionPage JSON-LD, 24-rune summary table and RazborCta", () => {
  const root = process.cwd();
  const src = fs.readFileSync(path.join(root, "src/app/runy/page.tsx"), "utf8");
  assert.ok(src.includes('"@type": "CollectionPage"'), "/runy missing CollectionPage JSON-LD");
  assert.ok(src.includes('"@type": "ItemList"'), "/runy missing ItemList JSON-LD");
  assert.ok(src.includes("<table") && src.includes("uprightSummary"), "/runy missing 24-rune summary table");
  assert.ok(src.includes("симметричная (не переворачивается)"), "/runy table missing symmetric rune note");
  assert.ok(src.includes('<RazborCta from="runy"'), "/runy missing RazborCta");

  const runes = getRunes();
  assert.equal(runes.length, 24);
  assert.equal(runes.filter((r) => !r.reversed).length, 9);
});

test("/kamni/po-date-rozhdeniya has WebApplication JSON-LD and ArticleLinks", () => {
  const root = process.cwd();
  const src = fs.readFileSync(path.join(root, "src/app/kamni/po-date-rozhdeniya/page.tsx"), "utf8");
  assert.ok(src.includes('"@type": "WebApplication"'), "/kamni/po-date-rozhdeniya missing WebApplication JSON-LD");
  assert.ok(src.includes("<ArticleLinks"), "/kamni/po-date-rozhdeniya missing ArticleLinks");

  const linked = articlesFor("/kamni/po-date-rozhdeniya");
  const slugs = linked.map((a) => `${a.section}/${a.slug}`);
  assert.ok(slugs.includes("kamni/kak-ochistit-kamni"), "missing kamni/kak-ochistit-kamni link");
  assert.ok(
    slugs.includes("kamni/chernyy-turmalin-kak-nosit-i-komu-podhodit"),
    "missing kamni/chernyy-turmalin-kak-nosit-i-komu-podhodit link",
  );
});

test("/sonnik/rebenok-plachet has thematic DREAM_RELATED links and targeted phrasing", () => {
  const root = process.cwd();
  const src = fs.readFileSync(path.join(root, "src/app/[section]/[slug]/page.tsx"), "utf8");
  assert.ok(src.includes("DREAM_RELATED"), "DreamPage missing DREAM_RELATED map");
  assert.ok(src.includes('href: "/sonnik/rebenok"'), "rebenok-plachet missing /sonnik/rebenok link");
  assert.ok(src.includes('href: "/sonnik/mladenets"'), "rebenok-plachet missing /sonnik/mladenets link");
  assert.ok(src.includes('href: "/praktiki/dnevnik-snov"'), "rebenok-plachet missing /praktiki/dnevnik-snov link");

  const dream = findDream("rebenok-plachet");
  assert.ok(dream, "missing dream rebenok-plachet");
  const fullText = [
    dream.short,
    dream.meaning,
    ...(dream.long?.intro ?? []),
    dream.long?.repeat ?? "",
    ...(dream.long?.faq.flatMap((f) => [f.q, f.a]) ?? []),
  ]
    .join(" ")
    .toLowerCase();
  assert.ok(fullText.includes("плач ребёнка"), "rebenok-plachet missing phrase 'плач ребёнка'");
  assert.ok(fullText.includes("к чему снится плач ребёнка"), "rebenok-plachet missing phrase 'к чему снится плач ребёнка'");
});
