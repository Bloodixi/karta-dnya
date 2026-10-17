/**
 * Чтение тела запроса с потолком размера: формы и JSON сайта занимают единицы килобайт, а req.formData()/req.json()
 * без ограничения прочитали бы в память сколько угодно. Только сервер.
 */

export const BODY_LIMIT = 16 * 1024;

export class BodyTooLarge extends Error {}

/** Ответ 413 для маршрутов. */
export const tooLarge = () => new Response("Payload Too Large", { status: 413, headers: { "Cache-Control": "no-store", Connection: "close" } });

/** Байты тела, не больше `max`; больше — BodyTooLarge (по content-length сразу, иначе — как только поток превысит). */
export async function readBody(req: Request, max = BODY_LIMIT): Promise<Uint8Array> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > max) throw new BodyTooLarge();
  if (!req.body) return new Uint8Array(0);
  const reader = req.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => {});
      throw new BodyTooLarge();
    }
    parts.push(value);
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.byteLength;
  }
  return out;
}

/** Форма (urlencoded или multipart) с потолком размера. Ошибка разбора — как у req.formData(). */
export async function readForm(req: Request, max = BODY_LIMIT): Promise<FormData> {
  const body = await readBody(req, max);
  return new Response(body as BodyInit, { headers: { "content-type": req.headers.get("content-type") ?? "application/x-www-form-urlencoded" } }).formData();
}

/** JSON с потолком размера. Ошибка разбора — SyntaxError, как у req.json(). */
export async function readJson<T = unknown>(req: Request, max = BODY_LIMIT): Promise<T> {
  return JSON.parse(new TextDecoder().decode(await readBody(req, max))) as T;
}
