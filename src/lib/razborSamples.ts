/**
 * Вымышленные люди для примеров платных документов (/razbor/primer, /sovmestimost-razbor/primer, /razbor-rebenka/primer)
 * и для превью «страниц» на лендингах. Даты фиксированы: пример и превью всегда показывают один и тот же текст
 * (прогноз и возраст — от текущего месяца по Москве).
 */
import { buildChild, CHILD_VERSION } from "./razborChild";
import { buildCompat, COMPAT_VERSION } from "./razborCompat";
import { buildRazbor, nowMsk, RAZBOR_VERSION, type RazborDoc } from "./razbor";

export const SAMPLE_RAZBOR = { d: 8, m: 6, y: 1990, name: "Мария" };
export const SAMPLE_COMPAT = { a: { d: 8, m: 6, y: 1990, name: "Мария" }, b: { d: 14, m: 11, y: 1987, name: "Андрей" } };
export const SAMPLE_CHILD = { d: 12, m: 4, y: 2018, name: "Миша" };

export type SampleKind = "razbor" | "compat" | "child";

/** Полный документ примера на текущий месяц по Москве. */
export function sampleDoc(kind: SampleKind): RazborDoc {
  const now = nowMsk();
  if (kind === "compat") return buildCompat({ ...SAMPLE_COMPAT, ...now, v: COMPAT_VERSION });
  if (kind === "child") return buildChild({ ...SAMPLE_CHILD, ...now, v: CHILD_VERSION });
  return buildRazbor({ ...SAMPLE_RAZBOR, ...now, v: RAZBOR_VERSION });
}
