import assert from "node:assert/strict";
import test from "node:test";
import { razborHref } from "../components/RazborLink";
import { buildRazbor, buildTeaser } from "./razbor";
import { resumePath } from "./razborResume";

test("resumePath: без from поведение прежнее, с from добавляет параметр", () => {
  const base = { product: undefined, date: "1990-05-17", name: "Анна", date2: undefined, name2: undefined, gift: undefined };
  assert.equal(resumePath(base), "/razbor?d=1990-05-17&n=%D0%90%D0%BD%D0%BD%D0%B0#oplata");
  assert.equal(resumePath(base, "resume"), "/razbor?d=1990-05-17&n=%D0%90%D0%BD%D0%BD%D0%B0&from=resume#oplata");

  const compat = { product: "compat" as const, date: "1990-05-17", name: "Анна", date2: "1988-02-03", name2: "Сергей", gift: undefined };
  assert.equal(
    resumePath(compat, "abandon"),
    "/sovmestimost-razbor?a=1990-05-17&b=1988-02-03&na=%D0%90%D0%BD%D0%BD%D0%B0&nb=%D0%A1%D0%B5%D1%80%D0%B3%D0%B5%D0%B9&from=abandon#oplata",
  );

  const cert = { product: "cert" as const, date: "", name: "", date2: undefined, name2: undefined, gift: { from: "Оля" } };
  assert.equal(resumePath(cert), "/razbor#oplata");
  assert.equal(resumePath(cert, "resume"), "/razbor?from=resume#oplata");
});

test("razborHref: подставляет ?d=, &n= и #razbor-teaser при валидной дате", () => {
  assert.equal(razborHref(), "/razbor");
  assert.equal(razborHref("1800-01-01"), "/razbor");
  assert.equal(razborHref("1990-03-14"), "/razbor?d=1990-03-14#razbor-teaser");
  assert.equal(razborHref("1990-03-14", "  "), "/razbor?d=1990-03-14#razbor-teaser");
  assert.equal(razborHref("1990-03-14", "Анна 123!"), "/razbor?d=1990-03-14&n=%D0%90%D0%BD%D0%BD%D0%B0#razbor-teaser");
});

test("buildTeaser: раздел «Личный год» показывает весь первый абзац без обрезки", () => {
  const input = { d: 14, m: 3, y: 1990, yr: 2026, mo: 11 };
  const fullGod = buildRazbor(input).sections.find((s) => s.id === "god")!;
  const fullFirst = fullGod.blocks.find((b) => b.kind === "p");
  const teaserGod = buildTeaser(input).sections.find((s) => s.id === "god")!;
  assert.ok(fullFirst && fullFirst.kind === "p");
  assert.deepEqual(teaserGod.blocks, [fullFirst]);
});
