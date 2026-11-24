import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { PSYCHOMATRIX_CELLS, PSYCHOMATRIX_LINES, pythagoras } from "./pythagoras";

test("psychomatrix reference covers all 9 cells and 8 lines", () => {
  assert.equal(PSYCHOMATRIX_CELLS.length, 9);
  assert.deepEqual(
    PSYCHOMATRIX_CELLS.map((c) => c.digit),
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
  );
  for (const c of PSYCHOMATRIX_CELLS) {
    assert.ok(c.low.length >= 10 && c.norm.length >= 10 && c.high.length >= 10, `cell ${c.digit}`);
  }
  assert.equal(PSYCHOMATRIX_LINES.length, 8);
  const res = pythagoras(14, 3, 1987);
  assert.equal(res.work.length, 4);
});

test("calculator pages expose WebApplication JSON-LD, RazborCta and ScrollToResult", () => {
  const root = process.cwd();
  const natal = fs.readFileSync(path.join(root, "src/app/astrologiya/natalnaya-karta/page.tsx"), "utf8");
  const nameNum = fs.readFileSync(path.join(root, "src/app/numerologiya/chislo-imeni/page.tsx"), "utf8");
  const compat = fs.readFileSync(path.join(root, "src/app/numerologiya/sovmestimost/page.tsx"), "utf8");
  const pyth = fs.readFileSync(path.join(root, "src/app/kvadrat-pifagora/page.tsx"), "utf8");

  for (const [label, src] of [
    ["natalnaya-karta", natal],
    ["chislo-imeni", nameNum],
    ["sovmestimost", compat],
    ["kvadrat-pifagora", pyth],
  ] as const) {
    assert.ok(src.includes('"@type": "WebApplication"'), `${label} missing WebApplication JSON-LD`);
  }
  assert.ok(natal.includes('<RazborCta from="natalnaya-karta"'), "natalnaya-karta missing RazborCta");
  assert.ok(nameNum.includes('<RazborCta from="chislo-imeni"'), "chislo-imeni missing RazborCta");
  assert.ok(nameNum.includes("<ScrollToResult"), "chislo-imeni missing ScrollToResult");
  assert.ok(pyth.includes("PSYCHOMATRIX_CELLS") && pyth.includes("PSYCHOMATRIX_LINES"), "kvadrat-pifagora missing SSR tables");
});
