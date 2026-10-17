/** Письмо покупателю после оплаты: ссылка на разбор, «Главное о тебе», подарок близкому и чек «Мой налог» (оферта, п. 4.3). Только сервер. */
import { mailReady, sendMail, type Attachment, type Inline } from "./mailer";
import { escapeHtml as h } from "./notify";
import { buildRazbor } from "./razbor";
import { extraLinks, productMail } from "./razborProductMail";
import { PRODUCTS, productOf } from "./razborProducts";
import { getOrder, patchGift, patchOrder, processShared, type Order } from "./razborStore";
import { readToken } from "./razborToken";
import { bookletStyle } from "./razborBookletData";
import { genitive } from "./razborBooklet";
import { fetchBookletPdf, pdfFileName } from "./razborPdf";
import { qrPng, receiptView } from "./receiptView";
import { SELLER, SITE } from "./site";

/** Строки текста разбора без markdown-выделения. */
const plain = (t: string) => t.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();

/** Первые n предложений абзаца. */
const sentences = (t: string, n: number) => (plain(t).match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [plain(t)]).slice(0, n).join("").trim();

/** Имя для темы и обращения: без переводов строк и управляющих символов, не длиннее 40 знаков. */
const cleanName = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);

/**
 * «Главное о тебе» — три коротких вывода из собранного разбора: список из первого блока «Сведения» (с версии 4),
 * иначе 1–2 предложения раздела «Число судьбы: суть» и заголовок личного года. Ошибка сборки — без блока.
 */
export function razborHighlights(token: string): string[] {
  try {
    const input = readToken(token);
    if (!input) return [];
    const doc = buildRazbor(input);
    const get = (id: string) => doc.sections.find((s) => s.id === id);
    const first = get("svod")?.blocks[0];
    if (first?.kind === "list" && first.items.length) return first.items.slice(0, 3).map(plain).filter(Boolean);
    const out: string[] = [];
    const sut = get("sut");
    const p = sut?.blocks.find((b) => b.kind === "p");
    if (sut && p?.kind === "p") {
      const lead = sentences(p.text, 2);
      out.push(/^Число судьбы/.test(lead) ? lead : `${plain(sut.title)}. ${lead}`);
    }
    const god = get("god");
    if (god) out.push(plain(god.title));
    return out;
  } catch {
    return [];
  }
}

const GIFT_URL = `${SITE.url}/razbor?g=1&utm_source=email&utm_medium=razbor&utm_campaign=gift`;

/** ГГГГ-ММ-ДД → ДД.ММ.ГГГГ */
const ru = (iso: string) => iso.split("-").reverse().join(".");

/** Текст пожелания в HTML: экранирован, переводы строк — <br>. */
const wishHtml = (t: string) => h(t).replace(/\n/g, "<br>");

/** Код ошибки SMTP без текста ответа: в тексте бывает адрес получателя. */
function smtpWhy(e: unknown): string {
  const err = e as { code?: string; responseCode?: number };
  return [err.code, err.responseCode].filter(Boolean).join(" ") || "ошибка отправки";
}

const btn = (href: string, label: string, bg: string, color: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${bg}" style="background:${bg};border-radius:8px;border:1px solid #5b3fa8"><a href="${h(href)}" target="_blank" style="display:inline-block;padding:11px 20px;font-family:Arial,sans-serif;font-size:15px;color:${color};text-decoration:none;font-weight:bold">${h(label)}</a></td></tr></table>`;

/** Блок «Главное о тебе» в рамке. */
const highlightsHtml = (title: string, main: string[]) =>
  main.length
    ? `<tr><td style="padding:8px 0 4px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f3fb;border-radius:12px"><tr><td style="padding:18px 20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222">
<div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5b3fa8;font-weight:bold">${h(title)}</div>
${main.map((m) => `<p style="margin:10px 0 0">— ${h(m)}</p>`).join("\n")}
<p style="margin:12px 0 0;font-size:13px;color:#666">Остальное — в разборе по ссылке выше.</p>
</td></tr></table>
</td></tr>`
    : "";

/**
 * PDF буклета во вложение письма: сервис собирает его до минуты; не успел или недоступен — письмо без вложения,
 * со ссылкой «Скачать PDF» (сервис доведёт рендер до кэша, по ссылке файл отдастся сразу).
 */
async function bookletAttachment(order: Order, name: string): Promise<{ pdf: Attachment | null; href: string }> {
  const href = `${SITE.url}/r/${order.id}/buklet/pdf`;
  const pdf = await fetchBookletPdf(`/r/${order.id}/buklet`, bookletStyle(undefined), 60_000);
  return { pdf: pdf ? { filename: pdfFileName(name, ru(order.date)), content: pdf, contentType: "application/pdf" } : null, href };
}

/** Строка о PDF: вложение есть — сказать об этом, нет — ссылка на скачивание. */
const pdfText = (b: { pdf: Attachment | null; href: string } | null) =>
  !b ? "" : b.pdf ? "Разбор в виде буклета A5 — в PDF во вложении: его удобно читать офлайн или распечатать." : `Разбор в виде буклета A5 в PDF: ${b.href}`;
const pdfHtml = (b: { pdf: Attachment | null; href: string } | null) =>
  !b ? "" : b.pdf
    ? `<tr><td style="padding:0 0 12px;font-size:14px;color:#444">Разбор в виде буклета A5 — в PDF во вложении: его удобно читать офлайн или распечатать.</td></tr>`
    : `<tr><td style="padding:0 0 12px;font-size:14px;color:#444">Разбор в виде буклета A5: <a href="${h(b.href)}" style="color:#5b3fa8;font-weight:bold">Скачать PDF</a></td></tr>`;

/** Отправляет письмо один раз на заказ (mail_sent_at). Ошибку не бросает — вернёт её текст для уведомления владельцу. */
export async function mailBuyer(order: Order): Promise<{ sent?: boolean; error?: string }> {
  if (order.mail_sent_at) return { sent: true };
  if (!order.email) return { error: "покупатель не указал e-mail" };
  if (!mailReady()) return { error: "не настроена отправка писем" };
  const url = `${SITE.url}/r/${order.id}`;
  const name = cleanName(order.name || "");
  const gift = order.gift;
  // совместимость, пакет, детский разбор — свои тема, вступление и «главное»; обычный разбор — как раньше
  const pm = productMail(order);
  const links = extraLinks(order);
  // в подарке имя — получателя, в детском разборе — ребёнка, в совместимости — одного из пары: обращаемся без имени
  const hello = name && !gift && !(pm && order.product !== "pack") ? `${name}, здравствуй!` : "Здравствуй!";
  // имя получателя в родительном («для Ольги»); не уверены в склонении — фраза без имени
  const gen = name ? genitive(name) : null;
  const forName = gen ? ` для ${gen}` : "";
  const subject = (order.test ? "[ТЕСТ] " : "") + (pm?.subject ?? (gift
    ? (gen ? `Подарочный разбор для ${gen} готов` : name ? `Подарочный разбор готов: ${name}` : "Подарочный разбор готов")
    : name ? `${name}, твой разбор по дате рождения готов` : "Твой разбор по дате рождения готов"));
  const intro = pm?.intro ?? (gift ? `Спасибо за заказ. Это подарок${gen ? ` для ${gen}` : ""}: разбор по дате рождения готов и открывается по ссылке` : "Спасибо за заказ. Твой разбор по дате рождения готов и открывается по ссылке");
  const keep = gift ? "Ссылка бессрочная — сохрани письмо." : "Ссылка твоя навсегда — сохрани письмо.";
  const delivery = !gift
    ? ""
    : gift.to_email
      ? gift.send_at
        ? `${ru(gift.send_at)} письмо с подарком${forName} уйдёт на ${gift.to_email}. До этого дня ссылку видишь только ты.`
        : `Письмо с подарком${forName} мы отправляем на ${gift.to_email} вместе с этим письмом.`
      : "Письмо получателю мы не отправляем: передай ссылку сам(а) — так, как тебе удобно.";
  const mainTitle = pm?.mainTitle ?? (gift ? "Главное из разбора" : "Главное о тебе");
  const main = pm && order.product !== "pack" ? pm.main : razborHighlights(order.token);
  // PDF-буклет есть только у разбора (и пакета, где первый документ — разбор); совместимость и детский — без вложения
  const booklet = order.product === "compat" || order.product === "child" ? null : await bookletAttachment(order, name);
  const r = receiptView(order);
  const inline: Inline[] = r ? [{ cid: "qr@karta-dnya.ru", filename: `chek-${r.number}.png`, content: await qrPng(r.fnsUrl), contentType: "image/png" }] : [];
  const receiptText = r
    ? [
        `Чек № ${r.number} от ${r.date} ${r.time} (МСК)`,
        `Продавец: ${r.seller}, ИНН ${r.inn}, режим НО: НПД`,
        `1. ${r.item} — ${r.amount}`,
        `Итого: ${r.amount}, безналичный расчёт`,
        `Чек: ${r.pageUrl}`,
        `Проверить на сайте ФНС: ${r.fnsUrl}`,
        "",
      ]
    : [];
  const text = [
    hello,
    "",
    `${intro}:`,
    url,
    "",
    keep,
    "",
    pdfText(booklet),
    "",
    ...(delivery ? [delivery, ""] : []),
    ...links.flatMap((l) => [l.note, l.url, ""]),
    ...(main.length ? [`${mainTitle}:`, ...main.map((m) => `— ${m}`), "", "Остальное — в разборе по ссылке выше.", ""] : []),
    "Подарить разбор близкому:",
    GIFT_URL,
    "",
    ...receiptText,
    `Заказ ${order.id}, ${order.amount} ₽.`,
    "Если ссылка не открывается или остались вопросы — просто ответь на это письмо.",
    "",
    `${SITE.name} · ${SITE.url}`,
    `Продавец: ${SELLER.name}, ИНН ${SELLER.inn}`,
  ].join("\n");
  const mainHtml = highlightsHtml(mainTitle, main);
  const html = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff"><tr><td align="left" style="padding:8px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222">
<tr><td style="padding:0 0 8px"><p style="margin:0">${h(hello)}</p></td></tr>
<tr><td style="padding:0 0 12px"><p style="margin:0">${h(intro)}:</p></td></tr>
<tr><td style="padding:0 0 8px">${btn(url, pm?.button ?? "Открыть разбор", "#5b3fa8", "#ffffff")}</td></tr>
<tr><td style="padding:0 0 4px;font-size:13px;color:#666">Ссылка: <a href="${h(url)}" style="color:#5b3fa8">${h(url)}</a></td></tr>
<tr><td style="padding:0 0 12px;font-size:14px;font-weight:bold">${h(keep)}</td></tr>
${pdfHtml(booklet)}
${delivery ? `<tr><td style="padding:0 0 12px"><p style="margin:0;border-left:3px solid #5b3fa8;padding-left:12px">${h(delivery)}</p></td></tr>` : ""}
${links.map((l) => `<tr><td style="padding:4px 0 12px"><p style="margin:0 0 8px">${h(l.note)}</p>${btn(l.url, l.label, "#ffffff", "#5b3fa8")}</td></tr>`).join("\n")}
${mainHtml}
<tr><td style="padding:16px 0 8px">${btn(GIFT_URL, "Подарить разбор близкому", "#ffffff", "#5b3fa8")}</td></tr>
${r ? `<tr><td style="padding:8px 0"><table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;max-width:400px;border:1px solid #e5e1d8;border-radius:12px;background:#fffdf8;font-size:14px;color:#222">
<tr><td style="padding:20px 22px">
<div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#888">Кассовый чек · приход</div>
<div style="font-size:20px;font-weight:bold;margin-top:2px">Чек № ${h(r.number)}</div>
<div style="color:#777;margin-top:2px">${h(r.date)} · ${h(r.time)} (МСК)</div>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:14px">
<tr><td style="padding:2px 0;color:#777">Продавец</td><td style="padding:2px 0;text-align:right">${h(r.seller)}</td></tr>
<tr><td style="padding:2px 0;color:#777">ИНН</td><td style="padding:2px 0;text-align:right">${h(r.inn)}</td></tr>
<tr><td style="padding:2px 0;color:#777">Режим НО</td><td style="padding:2px 0;text-align:right">НПД</td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:12px;border-top:1px dashed #ccc">
<tr><td style="padding:10px 0 2px">1. ${h(r.item)}</td><td style="padding:10px 0 2px;text-align:right;white-space:nowrap">${h(r.amount)}</td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:10px;border-top:1px dashed #ccc">
<tr><td style="padding:10px 0 0;font-size:17px;font-weight:bold">Итого</td><td style="padding:10px 0 0;text-align:right;font-size:17px;font-weight:bold">${h(r.amount)}</td></tr>
<tr><td colspan="2" style="color:#777;padding-top:2px">Безналичный расчёт</td></tr>
</table>
<div style="text-align:center;margin-top:16px;border-top:1px dashed #ccc;padding-top:16px">
<img src="cid:qr@karta-dnya.ru" width="140" height="140" alt="QR-код чека ФНС" style="display:inline-block;border:0">
<div style="font-size:13px;margin-top:6px"><a href="${h(r.pageUrl)}" style="color:#5b3fa8">Открыть чек</a> · <a href="${h(r.fnsUrl)}" style="color:#777">проверить на сайте ФНС</a></div>
</div>
</td></tr></table></td></tr>` : ""}
<tr><td style="padding:8px 0"><p style="margin:0">Заказ ${h(order.id)}, ${h(order.amount)} ₽.<br>Если ссылка не открывается или остались вопросы — просто ответь на это письмо.</p></td></tr>
<tr><td style="padding:8px 0;font-size:12px;color:#888">${h(SITE.name)} · <a href="${h(SITE.url)}" style="color:#888">${h(SITE.url.replace(/^https?:\/\//, ""))}</a><br>Продавец: ${h(SELLER.name)}, ИНН ${h(SELLER.inn)}</td></tr>
</table>
</td></tr></table>`;
  try {
    await sendMail({ to: order.email, subject, text, html, inline, ...(booklet?.pdf ? { attachments: [booklet.pdf] } : {}) });
    await patchOrder(order.id, { mail_sent_at: new Date().toISOString() });
    return { sent: true };
  } catch (e) {
    // в тексте ошибки SMTP бывает адрес покупателя — в лог и владельцу только код ответа
    const why = smtpWhy(e);
    console.error("razbor mail:", order.id, why);
    return { error: why };
  }
}

/**
 * Чек отдельным письмом — когда основное письмо ушло раньше, чем «Мой налог» пробил чек (повтор после сбоя ФНС).
 * Один раз на заказ (receipt_mail_at). Ошибку не бросает.
 */
export async function mailReceipt(order: Order): Promise<{ sent?: boolean; error?: string }> {
  if (order.receipt_mail_at) return { sent: true };
  const r = receiptView(order);
  if (!r || !order.email) return { error: "нет чека или адреса" };
  if (!mailReady()) return { error: "не настроена отправка писем" };
  const text = [
    "Здравствуй!",
    "",
    `Отправляем чек по заказу ${order.id}: он пробился чуть позже письма со ссылкой.`,
    "",
    `Чек № ${r.number} от ${r.date} ${r.time} (МСК)`,
    `Продавец: ${r.seller}, ИНН ${r.inn}, режим НО: НПД`,
    `1. ${r.item} — ${r.amount}`,
    `Итого: ${r.amount}, безналичный расчёт`,
    `Чек: ${r.pageUrl}`,
    `Проверить на сайте ФНС: ${r.fnsUrl}`,
    "",
    `Твой разбор: ${SITE.url}/r/${order.id}`,
    "",
    `${SITE.name} · ${SITE.url}`,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:560px">
<p>Здравствуй!</p><p>Отправляем чек по заказу ${h(order.id)}: он пробился чуть позже письма со ссылкой.</p>
<p><b>Чек № ${h(r.number)}</b> от ${h(r.date)} ${h(r.time)} (МСК)<br>Продавец: ${h(r.seller)}, ИНН ${h(r.inn)}, НПД<br>1. ${h(r.item)} — ${h(r.amount)}<br><b>Итого: ${h(r.amount)}</b>, безналичный расчёт</p>
<p><img src="cid:qr@karta-dnya.ru" width="140" height="140" alt="QR-код чека ФНС"></p>
<p><a href="${h(r.pageUrl)}" style="color:#5b3fa8">Открыть чек</a> · <a href="${h(r.fnsUrl)}" style="color:#777">проверить на сайте ФНС</a></p>
<p style="font-size:12px;color:#888">${h(SITE.name)} · ${h(SITE.url.replace(/^https?:\/\//, ""))}<br>Продавец: ${h(SELLER.name)}, ИНН ${h(SELLER.inn)}</p></div>`;
  try {
    const inline: Inline[] = [{ cid: "qr@karta-dnya.ru", filename: `chek-${r.number}.png`, content: await qrPng(r.fnsUrl), contentType: "image/png" }];
    await sendMail({ to: order.email, subject: `Чек по заказу ${order.id}`, text, html, inline });
    await patchOrder(order.id, { receipt_mail_at: new Date().toISOString() });
    return { sent: true };
  } catch (e) {
    const why = smtpWhy(e);
    console.error("razbor receipt mail:", order.id, why);
    return { error: why };
  }
}

/** Письмо получателю подарка уходит один раз: вебхук, страница «Спасибо» и ежедневный запуск не пошлют его дважды. */
const giftSending = processShared("razborGiftSending", () => new Map<string, Promise<{ sent?: boolean; error?: string }>>());

/**
 * Письмо получателю подарка (gift.to_email) — один раз на заказ (gift.sent_at). Дату отправки и статус оплаты
 * проверяет вызывающий (razborGift.giftDue). Ошибку не бросает.
 */
export function mailGift(order: Order): Promise<{ sent?: boolean; error?: string }> {
  const running = giftSending.get(order.id);
  if (running) return running;
  const job = doMailGift(order.id).finally(() => giftSending.delete(order.id));
  giftSending.set(order.id, job);
  return job;
}

async function doMailGift(id: string): Promise<{ sent?: boolean; error?: string }> {
  const order = await getOrder(id);
  const gift = order?.gift;
  if (!order || !gift?.to_email) return { error: "нет адреса получателя" };
  if (gift.sent_at) return { sent: true };
  if (order.status !== "paid") return { error: "заказ не оплачен" };
  if (!mailReady()) return { error: "не настроена отправка писем" };
  const url = `${SITE.url}/r/${order.id}`;
  const name = cleanName(order.name || "");
  const from = cleanName(gift.from);
  const wish = gift.wish?.trim() ?? "";
  // «от Вити», «по просьбе Вити»; несколько слов или незнакомое имя — без родительного
  const fromGen = genitive(from);
  const wishTitle = fromGen ? `Пожелание от ${fromGen}` : `Пожелание — ${from}`;
  const hello = name ? `${name}, привет!` : "Привет!";
  // тестовый магазин: письмо уходит, чтобы путь можно было прогнать, но с пометкой в теме
  const subject = `${order.test ? "[ТЕСТ] " : ""}${name ? `${name}, ` : ""}${from} дарит тебе нумерологический разбор`;
  const lead = `${from} дарит тебе нумерологический разбор по дате рождения — личный текст о твоих числах, характере, сильных сторонах и ближайших двенадцати месяцах.`;
  const main = razborHighlights(order.token);
  const booklet = await bookletAttachment(order, name);
  const text = [
    hello,
    "",
    lead,
    "",
    ...(wish ? [`${wishTitle}:`, wish, ""] : []),
    "Разбор открывается по ссылке:",
    url,
    "",
    "Ссылка твоя навсегда — сохрани письмо.",
    "",
    pdfText(booklet),
    "",
    ...(main.length ? ["Главное о тебе:", ...main.map((m) => `— ${m}`), "", "Остальное — в разборе по ссылке выше.", ""] : []),
    `Письмо отправлено по просьбе ${fromGen ?? `дарителя (${from})`}: подарок оформлен на сайте «${SITE.name}». Если оно пришло по ошибке — просто не обращай на него внимания.`,
    "",
    `${SITE.name} · ${SITE.url}`,
  ].join("\n");
  const html = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff"><tr><td align="left" style="padding:8px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222">
<tr><td style="padding:0 0 8px"><p style="margin:0">${h(hello)}</p></td></tr>
<tr><td style="padding:0 0 12px"><p style="margin:0">${h(lead)}</p></td></tr>
${wish ? `<tr><td style="padding:4px 0 14px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fffdf8;border:1px solid #e5e1d8;border-radius:12px"><tr><td style="padding:16px 20px;font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#222">
<div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#5b3fa8;font-weight:bold">${h(wishTitle)}</div>
<p style="margin:8px 0 0;font-style:italic">${wishHtml(wish)}</p>
</td></tr></table>
</td></tr>` : ""}
<tr><td style="padding:0 0 8px">${btn(url, "Открыть подарок", "#5b3fa8", "#ffffff")}</td></tr>
<tr><td style="padding:0 0 4px;font-size:13px;color:#666">Ссылка: <a href="${h(url)}" style="color:#5b3fa8">${h(url)}</a></td></tr>
<tr><td style="padding:0 0 12px;font-size:14px;font-weight:bold">Ссылка твоя навсегда — сохрани письмо.</td></tr>
${pdfHtml(booklet)}
${highlightsHtml("Главное о тебе", main)}
<tr><td style="padding:12px 0 8px;font-size:13px;color:#666">Письмо отправлено по просьбе ${h(fromGen ?? `дарителя (${from})`)}: подарок оформлен на сайте «${h(SITE.name)}». Если оно пришло по ошибке — просто не обращай на него внимания.</td></tr>
<tr><td style="padding:8px 0;font-size:12px;color:#888">${h(SITE.name)} · <a href="${h(SITE.url)}" style="color:#888">${h(SITE.url.replace(/^https?:\/\//, ""))}</a></td></tr>
</table>
</td></tr></table>`;
  try {
    await sendMail({ to: gift.to_email, subject, text, html, ...(booklet.pdf ? { attachments: [booklet.pdf] } : {}) });
    await patchGift(order.id, { sent_at: new Date().toISOString() });
    return { sent: true };
  } catch (e) {
    const why = smtpWhy(e);
    console.error("razbor gift mail:", order.id, why);
    return { error: why };
  }
}

/** Просьба об отзыве через 7 дней после оплаты (razborReview.askReviews). Один раз на заказ; ошибку не бросает. */
export async function mailReviewAsk(order: Order, formUrl: string): Promise<{ sent?: boolean; error?: string }> {
  if (!order.email || !mailReady()) return { error: "нет адреса или почты" };
  const what = PRODUCTS[productOf(order.product)].short.toLowerCase();
  const text = [
    "Здравствуй!",
    "",
    `Неделю назад ты получил(а) на «${SITE.name}» ${what}. Расскажи, пожалуйста, как тебе этот текст: что совпало, что оказалось полезным, чего не хватило.`,
    "Это займёт минуту — оценка и пара строк:",
    formUrl,
    "",
    "Отзыв читаем мы сами, по нему правим тексты. На сайте его покажем, только если ты сам(а) отметишь это в форме.",
    "",
    `Твой документ по-прежнему открывается по ссылке: ${SITE.url}/r/${order.id}`,
    "",
    `${SITE.name} · ${SITE.url}`,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:560px">
<p>Здравствуй!</p>
<p>Неделю назад ты получил(а) на «${h(SITE.name)}» ${h(what)}. Расскажи, пожалуйста, как тебе этот текст: что совпало, что оказалось полезным, чего не хватило.</p>
<p>${btn(formUrl, "Оставить отзыв", "#5b3fa8", "#ffffff")}</p>
<p style="font-size:14px;color:#555">Отзыв читаем мы сами, по нему правим тексты. На сайте его покажем, только если ты сам(а) отметишь это в форме.</p>
<p style="font-size:14px">Твой документ по-прежнему открывается <a href="${h(`${SITE.url}/r/${order.id}`)}" style="color:#5b3fa8">по ссылке</a>.</p>
<p style="font-size:12px;color:#888">${h(SITE.name)} · ${h(SITE.url.replace(/^https?:\/\//, ""))}</p></div>`;
  try {
    await sendMail({ to: order.email, subject: "Как тебе разбор? Одна минута на отзыв", text, html });
    return { sent: true };
  } catch (e) {
    const why = smtpWhy(e);
    console.error("razbor review mail:", order.id, why);
    return { error: why };
  }
}

/** «Потеряли ссылку?»: все оплаченные разборы на этот e-mail одним письмом. Подаркам получателя — без чека покупателя. */
export async function mailAccess(email: string, orders: Order[], gifts: Order[] = []): Promise<void> {
  const rows = [
    ...orders.flatMap((o) => {
      const chek = o.receipt_uuid ? `${SITE.url}/razbor/chek/${o.id}` : "";
      const product = productOf(o.product);
      if (product === "razbor") return [{ url: `${SITE.url}/r/${o.id}`, chek, title: `Разбор${o.name ? (genitive(cleanName(o.name)) ? ` для ${genitive(cleanName(o.name))}` : `: ${cleanName(o.name)}`) : ""}, дата рождения ${ru(o.date)}` }];
      const dates = o.date2 ? `${ru(o.date)} и ${ru(o.date2)}` : ru(o.date);
      if (product === "pack")
        return [
          { url: `${SITE.url}/r/${o.id}`, chek, title: `${PRODUCTS.pack.short}: разбор, дата рождения ${ru(o.date)}` },
          ...(o.token2 ? [{ url: `${SITE.url}/r/${o.id}/para`, chek: "", title: `${PRODUCTS.pack.short}: совместимость, даты ${dates}` }] : []),
        ];
      return [{ url: `${SITE.url}/r/${o.id}`, chek, title: `${PRODUCTS[product].short}, ${product === "compat" ? "даты" : "дата"} рождения ${dates}` }];
    }),
    ...gifts.map((o) => ({
      url: `${SITE.url}/r/${o.id}`,
      chek: "",
      title: `Подарок${o.gift?.from ? ` от ${cleanName(o.gift.from)}` : ""}: разбор по дате рождения ${ru(o.date)}`,
    })),
  ];
  const text = [
    "Здравствуй!",
    "",
    "Ты запросил(а) ссылки на свои разборы на сайте «Карта дня»:",
    "",
    ...rows.flatMap((r) => [r.title, r.url, ...(r.chek ? [`Чек: ${r.chek}`] : []), ""]),
    "Если ты не запрашивал(а) это письмо — просто не обращай на него внимания.",
    "",
    `${SITE.name} · ${SITE.url}`,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:560px">
<p>Здравствуй!</p>
<p>Ты запросил(а) ссылки на свои разборы на сайте «Карта дня»:</p>
${rows.map((r) => `<p style="margin:14px 0"><b>${h(r.title)}</b><br><a href="${h(r.url)}">${h(r.url)}</a>${r.chek ? `<br><span style="font-size:13px">Чек: <a href="${h(r.chek)}">${h(r.chek)}</a></span>` : ""}</p>`).join("\n")}
<p style="font-size:13px;color:#777">Если ты не запрашивал(а) это письмо — просто не обращай на него внимания.</p>
<p style="font-size:12px;color:#888">${h(SITE.name)} · <a href="${h(SITE.url)}">${h(SITE.url.replace(/^https?:\/\//, ""))}</a></p>
</div>`;
  await sendMail({ to: email, subject: "Ссылки на твои разборы — Карта дня", text, html });
}
