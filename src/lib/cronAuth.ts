import { createHash, timingSafeEqual } from "node:crypto";

/** Секрет таймеров VPS из заголовка X-Cron-Secret (или Authorization: Bearer …) — сравнение по хешу, без утечки длины и времени. */
export function cronAuthorized(req: Request): boolean {
  const want = process.env.RAZBOR_CRON_SECRET;
  if (!want || want.length < 16) return false;
  const got = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = createHash("sha256").update(want).digest();
  const b = createHash("sha256").update(got).digest();
  return timingSafeEqual(a, b);
}
