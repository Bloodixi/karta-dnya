/**
 * Готовый PDF буклета разбора: отдельный сервис на VPS (Playwright Chromium, tools/vps/pdf в proect-workspace)
 * открывает страницу …/buklet?print=1 на сайте и печатает её в PDF, кэширует на 30 дней. Только сервер.
 * Адрес и секрет — PDF_SERVICE_URL (http://10.0.2.1:8767 — шлюз сети coolify) и PDF_SERVICE_SECRET.
 */
import { escapeHtml as h } from "./notify";
import type { BookletStyle } from "./razborBooklet";

export const pdfReady = () => Boolean(process.env.PDF_SERVICE_URL && (process.env.PDF_SERVICE_SECRET ?? "").length >= 16);

/**
 * PDF буклета по пути страницы (/r/<номер>/buklet или /razbor/r/<токен>/buklet) или null: сервис не настроен,
 * недоступен, занят или не успел за timeoutMs. Сервис доводит начатый рендер до кэша — повтор через минуту получит готовый.
 */
export async function fetchBookletPdf(path: string, style: BookletStyle, timeoutMs: number): Promise<Buffer | null> {
  if (!pdfReady()) return null;
  try {
    const r = await fetch(`${process.env.PDF_SERVICE_URL!.replace(/\/$/, "")}/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Pdf-Secret": process.env.PDF_SERVICE_SECRET! },
      body: JSON.stringify({ path, style }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!r.ok || r.headers.get("content-type") !== "application/pdf") {
      console.error("razbor pdf: сервис ответил", r.status);
      return null;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    return buf.subarray(0, 5).toString() === "%PDF-" ? buf : null;
  } catch (e) {
    console.error("razbor pdf:", (e as Error).name);
    return null;
  }
}

/** «Разбор-Анна.pdf»: имя без знаков, недопустимых в именах файлов; без имени — по дате рождения (ДД.ММ.ГГГГ). */
export function pdfFileName(name: string | undefined, date: string): string {
  const n = (name ?? "").replace(/[^\p{L}\p{N} -]+/gu, " ").trim().replace(/\s+/g, "-").slice(0, 40);
  return `Разбор-${n || date.replace(/[^\d.]/g, "")}.pdf`;
}

const NOINDEX = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "private, no-store" };

export function pdfResponse(pdf: Buffer, fileName: string): Response {
  // для старых клиентов без filename* — латинское имя
  const ascii = /^[\x20-\x7e]+$/.test(fileName) && !/["\\]/.test(fileName) ? fileName : "razbor-karta-dnya.pdf";
  return new Response(new Uint8Array(pdf), {
    headers: {
      ...NOINDEX,
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.length),
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  });
}

/** PDF не получили: страница «готовится» со ссылкой на буклет (печать из браузера) и повтором. */
export function pdfWaitResponse(bukletHref: string, pdfHref: string): Response {
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>PDF готовится — Карта дня</title>
<style>body{margin:0;font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#faf8f4;color:#221d2e}
main{max-width:34rem;margin:12vh auto;padding:0 16px}h1{font-size:1.6rem;margin:0 0 .6rem;font-weight:600}
p{margin:.6rem 0}a.btn{display:inline-block;margin:.8rem .6rem 0 0;padding:.65rem 1.1rem;border-radius:999px;background:#5b3fa8;color:#fff;text-decoration:none}
a.alt{background:transparent;color:#5b3fa8;border:1px solid #5b3fa8}</style></head>
<body><main><h1>PDF готовится</h1>
<p>Буклет собирается на сервере — обычно это меньше минуты. Попробуй скачать ещё раз через минуту.</p>
<p>Можно не ждать: открой буклет и сохрани его в PDF через печать браузера.</p>
<p><a class="btn" href="${h(pdfHref)}">Скачать PDF ещё раз</a><a class="btn alt" href="${h(bukletHref)}">Открыть буклет</a></p>
</main></body></html>`;
  return new Response(html, { status: 503, headers: { ...NOINDEX, "Content-Type": "text/html; charset=utf-8", "Retry-After": "60" } });
}
