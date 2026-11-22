import assert from "node:assert/strict";
import test from "node:test";
import { clockDescription, clockFaq, clockSpellings, clockTitle, getClockNumbers } from "./clock";
import { SECTIONS } from "./site";

test("clockSpellings and metadata fit limits for top clock numbers", () => {
  const all = getClockNumbers();
  assert.ok(all.length >= 20);
  const targetSlugs = ["12-21", "15-15", "01-01", "02-20", "02-02", "11-11", "22-22", "00-00"];
  for (const slug of targetSlugs) {
    const c = all.find((x) => x.slug === slug);
    assert.ok(c, `missing clock ${slug}`);
    const sp = clockSpellings(c.time);
    assert.equal(sp.length, 4);
    const title = clockTitle(c);
    const titleText = typeof title === "string" ? title : title.absolute;
    assert.ok(titleText.length <= 60, `title too long for ${slug}: ${titleText}`);
    const desc = clockDescription(c);
    assert.ok(desc.length >= 100 && desc.length <= 155, `desc length ${desc.length} for ${slug}`);
    const faq = clockFaq(c);
    assert.ok(faq.some((f) => f.q.includes(sp[0]) && f.q.includes(sp[1])), `missing spelling FAQ for ${slug}`);
    assert.ok(faq.some((f) => f.q.includes("часто видишь")), `missing often FAQ for ${slug}`);
  }
});

test("astrologiya section metadata has SEO title and description within limits", () => {
  const a = SECTIONS.astrologiya;
  assert.ok(a.seoTitle, "astrologiya seoTitle missing");
  assert.ok(`${a.seoTitle} — Карта дня`.length <= 65);
  assert.ok(a.description.length >= 130 && a.description.length <= 165);
});
