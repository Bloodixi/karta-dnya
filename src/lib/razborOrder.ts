/**
 * Заказ разбора поверх платежа ЮKassa. Основная запись — файл заказа на томе (razborStore),
 * дубликат данных — в metadata платежа: по нему заказ восстанавливается, если файла нет. Только сервер.
 */
import { getPayment, recentPayments, type Payment, type Refund } from "./yookassa";
import { getOrder, listOrders, patchOrder, refundOrder, settleOrder, type Order } from "./razborStore";
import { escapeHtml as h, notifyPayment } from "./notify";
import { makeChildToken, makeCompatToken, makeToken } from "./razborToken";
import { issueReceipt } from "./razborReceipt";
import { mailBuyer, mailGift, mailReceipt } from "./razborMail";
import { giftDue, giftFromMetadata, maskEmail } from "./razborGift";
import type { RazborInput } from "./razbor";
import { compatUpsellPath, PRODUCTS, productOf } from "./razborProducts";
import { resumePath } from "./razborResume";
import { remindAbandoned } from "./razborAbandon";
import { SITE } from "./site";
import { sharedRateLimit } from "./rateLimit";

export const PAY_COOKIE = "razbor_pay";

/** Последние соответствия заказ → платёж в памяти процесса (на случай, если cookie не дошла). */
const recent = new Map<string, string>();
export function rememberOrder(orderId: string, paymentId: string) {
  recent.set(orderId, paymentId);
  if (recent.size > 500) recent.delete(recent.keys().next().value!);
}

/** Номер заказа: randomBytes(9) в base64url — ровно 12 символов [A-Za-z0-9_-]. */
export function isOrderId(id: string): boolean {
  return /^[A-Za-z0-9_-]{12}$/.test(id);
}

/**
 * Платежи ЮKassa за сутки — кэш на минуту, общий для всех запросов: опрос со страницы «Спасибо»
 * и перебор номеров заказов не должны дёргать API на каждый запрос. Статус платежа отсюда не берём —
 * найденный платёж перечитывается отдельно (getPayment), список нужен только чтобы найти его id.
 */
const RECENT_TTL = 60_000;
let recentCache: { at: number; list: Promise<Payment[]> } | null = null;
function cachedRecentPayments(): Promise<Payment[]> {
  if (!recentCache || Date.now() - recentCache.at > RECENT_TTL) {
    const list = recentPayments();
    recentCache = { at: Date.now(), list };
    // ошибку не кэшируем: следующий запрос попробует снова
    list.catch(() => {
      if (recentCache?.list === list) recentCache = null;
    });
  }
  return recentCache.list;
}

export function inputFromPayment(p: Payment): RazborInput | null {
  const md = p.metadata ?? {};
  const [y, m, d] = (md.date ?? "").split("-").map(Number);
  const yr = Number(md.yr);
  const mo = Number(md.mo);
  if (!y || !m || !d || !yr || !mo) return null;
  // платежи до введения версий metadata.v не несут — это версия 1
  const v = Number(md.v) || 1;
  return { d, m, y, yr, mo, v, name: md.name || undefined };
}

/** Ищет платёж заказа: cookie → память процесса → платежи ЮKassa за сутки. */
export async function findPayment(orderId: string, cookiePaymentId?: string): Promise<Payment | null> {
  for (const id of [cookiePaymentId, recent.get(orderId)]) {
    if (!id) continue;
    try {
      const p = await getPayment(id);
      if (p.metadata?.order === orderId) return p;
    } catch {}
  }
  try {
    const found = (await cachedRecentPayments()).find((p) => p.metadata?.order === orderId);
    if (!found) return null;
    const p = await getPayment(found.id);
    return p.metadata?.order === orderId ? p : null;
  } catch {
    return null;
  }
}

/** Вторая дата (совместимость, пакет) из metadata: date2 ГГГГ-ММ-ДД и name2. */
function secondFromPayment(p: Payment): { d: number; m: number; y: number; name?: string } | null {
  const md = p.metadata ?? {};
  const [y, m, d] = (md.date2 ?? "").split("-").map(Number);
  return y && m && d ? { d, m, y, name: md.name2 || undefined } : null;
}

/**
 * Ссылки заказа по продукту: token — основной документ (разбор, совместимость или детский разбор),
 * token2 — совместимость в пакете. Совместимость без второй даты не собирается.
 */
function tokensFromPayment(p: Payment, i: RazborInput, order: string): { token: string; token2?: string } | null {
  const product = productOf(p.metadata?.p);
  if (product === "child") return { token: makeChildToken(i, order) };
  if (product === "razbor") return { token: makeToken(i, order) };
  const b = secondFromPayment(p);
  if (!b) return null;
  const a = { d: i.d, m: i.m, y: i.y, name: i.name };
  const pair = makeCompatToken({ a, b, yr: i.yr, mo: i.mo, v: Number(p.metadata?.v2 ?? p.metadata?.v) || 1 }, order);
  return product === "compat" ? { token: pair } : { token: makeToken(i, order), token2: pair };
}

/** Заказ из metadata платежа — когда файла заказа нет. */
export function orderFromPayment(p: Payment): Order | null {
  const md = p.metadata ?? {};
  const i = inputFromPayment(p);
  if (!i || !md.order) return null;
  const t = tokensFromPayment(p, i, md.order);
  if (!t) return null;
  const product = productOf(md.p);
  const gift = giftFromMetadata(md);
  return {
    id: md.order, token: t.token, date: md.date, name: md.name ?? "", email: md.email ?? "", amount: Number(p.amount.value),
    status: "pending", payment_id: p.id, created_at: p.created_at, paid_at: "", yr: i.yr, mo: i.mo,
    ...(gift ? { gift } : {}),
    ...(product !== "razbor" ? { product } : {}),
    ...(md.date2 ? { date2: md.date2, name2: md.name2 ?? "" } : {}),
    ...(t.token2 ? { token2: t.token2 } : {}),
    ...(p.test ? { test: true } : {}),
  };
}

/**
 * После оплаты: чек «Мой налог» и письмо покупателю (каждое — один раз на заказ).
 * Возвращает строки для уведомления владельцу и заказ с обновлёнными полями.
 */
const finishing = new Map<string, Promise<{ order?: Order; lines: string[] }>>();
function finishPaid(order: Order): Promise<{ order?: Order; lines: string[] }> {
  // вебхук и страница «Спасибо» могут прийти одновременно — второй ждёт первый, чек не пробивается дважды
  const running = finishing.get(order.id);
  if (running) return running;
  const job = doFinishPaid(order).finally(() => finishing.delete(order.id));
  finishing.set(order.id, job);
  return job;
}

async function doFinishPaid(order: Order): Promise<{ order?: Order; lines: string[] }> {
  order = (await patchOrder(order.id, { receipt_due: true })) ?? { ...order, receipt_due: true };
  // возврат мог прийти раньше: по возвращённому заказу чек не пробиваем и письмо со ссылкой не шлём
  if (order.status !== "paid") return { order, lines: [`<b>Заказ уже не оплачен (${h(order.status)})</b> — чек и письмо не отправлялись`] };
  const r = await issueReceipt(order);
  const o = r.receipt ?? order;
  const m = await mailBuyer(o);
  const lines = [
    o.receipt_url ? `<a href="${h(`${SITE.url}/razbor/chek/${o.id}`)}">Чек «Мой налог»</a> · <a href="${h(o.receipt_url)}">ФНС</a>` : `<b>⚠️ Чек не пробит</b> (${h(r.error)}) — сайт повторит при следующем открытии заказа`,
    m.sent ? `✉️ Письмо отправлено на ${h(o.email)}` : `<b>⚠️ Письмо не отправлено</b> (${h(m.error)})`,
  ];
  if (o.gift) {
    const g = o.gift;
    let line = g.to_email ? `письмо получателю ${g.send_at ? `уйдёт ${h(g.send_at)}` : "сразу"}` : "ссылку передаст покупатель";
    if (giftDue(o)) {
      const s = await mailGift(o);
      line = s.sent ? "письмо получателю отправлено" : `<b>⚠️ письмо получателю не отправлено</b> (${h(s.error)}) — повторит ежедневный запуск`;
    }
    lines.push(`🎁 Подарок от ${h(g.from)}: ${line}`);
  }
  return { order: (await getOrder(o.id)) ?? o, lines };
}

/**
 * Оплата в тестовом магазине: заказ отмечается тестовым, чек не пробивается. Письмо покупателю — с [ТЕСТ] в теме
 * (проверка писем и PDF-вложения), подарок получателю — тоже с [ТЕСТ], если пора отправлять.
 */
async function finishTest(order: Order): Promise<{ lines: string[] }> {
  let o = (await patchOrder(order.id, { test: true })) ?? { ...order, test: true };
  const m = await mailBuyer(o);
  o = (await getOrder(o.id)) ?? o;
  const lines = [m.sent ? `✉️ Письмо [ТЕСТ] отправлено на ${h(o.email)}` : `<b>⚠️ Письмо [ТЕСТ] не отправлено</b> (${h(m.error)})`];
  const g = o.gift;
  if (!g) return { lines };
  let line = g.to_email ? `письмо получателю ${g.send_at ? `уйдёт ${h(g.send_at)}` : "сразу"} (с пометкой [ТЕСТ])` : "ссылку передаст покупатель";
  if (giftDue(o)) {
    const s = await mailGift(o);
    line = s.sent ? "письмо получателю отправлено с пометкой [ТЕСТ]" : `<b>⚠️ письмо получателю не отправлено</b> (${h(s.error)}) — повторит ежедневный запуск`;
  }
  lines.push(`🎁 Подарок от ${h(g.from)}: ${line}`);
  return { lines };
}

const RETRY_GAP = 5 * 60_000;
const RETRY_MAX = 12;

/** Повтор для оплаченного заказа без чека или письма (сеть ФНС или почты была недоступна). Владельцу — что получилось. */
/** Чек и письмо доделаны (чек «под вопросом» автоматически не повторяется). */
const finished = (o: Order) => (Boolean(o.receipt_uuid) || Boolean(o.receipt_unsure)) && (Boolean(o.mail_sent_at) || !o.email);

async function retryPaid(o: Order): Promise<Order> {
  if (!o.receipt_due || finished(o)) return o;
  if ((o.retries ?? 0) >= RETRY_MAX && !o.stuck_at) {
    o = (await patchOrder(o.id, { stuck_at: new Date().toISOString() })) ?? o;
    await notifyPayment(
      [
        `<b>⚠️ Заказ ${h(o.id)}: после ${RETRY_MAX} попыток не сделано</b>`,
        `${o.receipt_uuid ? "" : o.receipt_unsure ? "чек под вопросом (проверь в «Мой налог») · " : "чек не пробит · "}${o.mail_sent_at || !o.email ? "" : "письмо не отправлено"}`,
        "Сделай вручную и проверь логи сайта.",
      ].join("\n"),
    ).catch(() => {});
    return o;
  }
  // статус заказа открывается без входа: повторяем не чаще раза в 5 минут и не больше 12 раз,
  // чтобы при сбоях ФНС не наплодить чеков (ответ мог потеряться после регистрации дохода) и писем
  if ((o.retries ?? 0) >= RETRY_MAX || (o.retry_at && Date.now() - Date.parse(o.retry_at) < RETRY_GAP)) return o;
  o = (await patchOrder(o.id, { retry_at: new Date().toISOString(), retries: (o.retries ?? 0) + 1 })) ?? o;
  if (o.status !== "paid") return o; // возврат между чтением и повтором
  const before = { receipt: Boolean(o.receipt_uuid), mail: Boolean(o.mail_sent_at) };
  const f = await finishPaid(o);
  const after = f.order ?? o;
  const fresh = (await getOrder(o.id)) ?? after;
  const lines = [...f.lines];
  // письмо ушло раньше без чека — чек отдельным письмом (покупатель должен его получить)
  if (before.mail && !before.receipt && fresh.receipt_uuid && fresh.email && !fresh.receipt_mail_at) {
    const m = await mailReceipt(fresh);
    lines.push(m.sent ? "🧾 Чек отправлен покупателю отдельным письмом" : `<b>⚠️ Письмо с чеком не отправлено</b> (${h(m.error)})`);
  }
  if ((!before.receipt && fresh.receipt_uuid) || (!before.mail && fresh.mail_sent_at)) {
    await notifyPayment([`<b>↻ Заказ ${h(o.id)} доделан</b>`, ...lines].join("\n"), true);
  }
  return (await getOrder(o.id)) ?? fresh;
}

/**
 * Фоновый повтор (таймер на VPS раз в 15 минут): оплаченные боевые заказы за 3 дня, у которых нет чека или письма —
 * покупатель мог закрыть «Спасибо», а сайт перезапуститься до чека. Те же паузы и лимит, что у повтора со страницы.
 * Затем — письма о брошенной оплате (razborAbandon).
 */
export async function retryStuck(): Promise<{ checked: number; done: number; abandoned: number }> {
  const since = Date.now() - 3 * 86400_000;
  const stuck = await listOrders((o) => o.status === "paid" && Boolean(o.receipt_due) && !finished(o) && !o.stuck_at && Date.parse(o.paid_at) > since);
  let done = 0;
  for (const o of stuck) {
    const r = await retryPaid(o).catch((e) => (console.error("razbor retry:", o.id, e instanceof Error ? e.message : "error"), o));
    if (finished(r)) done++;
  }
  // письмо «Оплата не завершилась» — тем же запуском таймера
  const abandoned = await remindAbandoned(applyPayment).catch((e) => (console.error("razbor abandon:", e instanceof Error ? e.message : "error"), 0));
  return { checked: stuck.length, done, abandoned };
}

/** Предупреждения о несовпадении суммы для заказов без файла — в памяти процесса, чтобы не повторять на каждый опрос. */
const mismatchWarned = new Set<string>();

/**
 * Оплата должна быть в рублях и не меньше цены заказа (из файла; без файла — текущая цена разбора).
 * Иначе заказ не отмечается оплаченным, владелец получает одно предупреждение в Telegram.
 */
async function amountMismatch(id: string, p: Payment): Promise<boolean> {
  const o = await getOrder(id);
  const price = o?.amount || PRODUCTS[productOf(p.metadata?.p)].price;
  const value = Number(p.amount?.value);
  if (p.amount?.currency === "RUB" && Number.isFinite(value) && value >= price) return false;
  const warned = o ? Boolean(o.mismatch_at) : mismatchWarned.has(id);
  if (!warned) {
    if (o) await patchOrder(id, { mismatch_at: new Date().toISOString() });
    else {
      mismatchWarned.add(id);
      if (mismatchWarned.size > 500) mismatchWarned.delete(mismatchWarned.values().next().value!);
    }
    await notifyPayment(
      [
        `<b>⚠️ Оплата не сошлась с заказом</b>${p.test ? " · тест" : ""}`,
        `Пришло: ${h(p.amount?.value)} ${h(p.amount?.currency)}, ожидалось не меньше ${h(price)} RUB.`,
        "Заказ не открыт. Проверь платёж в кабинете ЮKassa.",
        `<i>Заказ ${h(id)} · платёж ${h(p.id)}</i>`,
      ].join("\n"),
    );
  }
  console.error("razbor: сумма не сошлась", id, p.id, p.amount);
  return true;
}

/**
 * Сверяет заказ с уже перепроверенным в API платежом и, если статус стал итоговым, записывает его.
 * Уведомление владельцу уходит один раз — при первом переходе в paid (вебхук или страница «Спасибо», кто раньше).
 */
export async function applyPayment(p: Payment): Promise<Order | null> {
  const id = p.metadata?.order;
  if (!id) return null;
  if (p.status !== "succeeded" && p.status !== "canceled") return (await getOrder(id)) ?? orderFromPayment(p);
  if (p.status === "succeeded" && (await amountMismatch(id, p))) return (await getOrder(id)) ?? orderFromPayment(p);
  // receipt_due — вместе с переходом в paid: если процесс упадёт до чека и письма, повтор (retryStuck) их доделает
  const { order, changed } = await settleOrder(id, p.status === "succeeded" ? "paid" : "canceled", () => orderFromPayment(p), p.id, p.test ? { test: true } : { receipt_due: true });
  if (changed && order) {
    const test = p.test ? " · тест" : "";
    if (order.status === "paid") {
      const url = `${SITE.url}/r/${order.id}`;
      const product = productOf(order.product);
      // Чек, письмо (ждёт PDF до минуты) и уведомление владельцу — после ответа: ЮKassa ждёт ответ на уведомление
      // недолго и при задержке шлёт его повторно. Заказ уже «paid»; повтор чека/письма защищён finishPaid и mail_sent_at.
      void (async () => {
      // тестовый магазин чек в налоговую не пробивает; письма покупателю и получателю подарка — с [ТЕСТ]
      const f = p.test ? await finishTest(order) : await finishPaid(order);
      await notifyPayment(
        [
          `<b>💳 Оплачен${product === "razbor" ? " разбор" : `о: ${h(PRODUCTS[product].short)}`} — ${h(p.amount.value)} ₽</b>${test}`,
          "",
          `${product === "child" ? "Дата рождения ребёнка" : "Дата рождения"}: ${h(order.date)}${order.name ? `\nИмя: ${h(order.name)}` : ""}${order.date2 ? `\nВторая дата: ${h(order.date2)}${order.name2 ? `, ${h(order.name2)}` : ""}` : ""}${order.email ? `\nE-mail: ${h(order.email)}` : ""}`,
          "",
          `<a href="${h(url)}">Открыть ${product === "compat" ? "совместимость" : "разбор"}</a>${order.token2 ? ` · <a href="${h(`${url}/para`)}">совместимость</a>` : ""}`,
          ...f.lines,
          `<i>Заказ ${h(order.id)} · платёж ${h(p.id)}</i>`,
        ].join("\n"),
      );
      })().catch((e) => console.error("razbor finish:", order.id, e instanceof Error ? e.message : "error"));
    } else if (order.status === "canceled") {
      await notifyPayment(
        `<b>✖️ Оплата отменена — ${h(p.amount.value)} ₽</b>${test}\n<i>Заказ ${h(order.id)} · платёж ${h(p.id)}</i>`,
        true,
      );
    }
  }
  return order;
}

/**
 * Лимит на живую проверку заказа по IP — общий для /api/razbor/status и страницы «Спасибо»: каждая проверка
 * может обратиться к ЮKassa. Страница опрашивает раз в 2 с (≈30 запросов в минуту) — 60 с запасом.
 */
export const orderStateLimiter = () => sharedRateLimit("razbor-order-state", 60, 60_000);

/**
 * Возврат (уведомление refund.succeeded, возврат уже перечитан из API). Полный — заказ refunded, ссылки /r/<id> и
 * /razbor/chek/<id> закрываются. Чек «Мой налог» сайт сам не аннулирует (фискальное действие) — владелец делает это
 * в «Мой налог» по уведомлению.
 */
export async function applyRefund(r: Refund): Promise<Order | null> {
  if (r.status !== "succeeded") return null;
  const p = await getPayment(r.payment_id);
  const id = p.metadata?.order;
  if (!id) return null; // чужой платёж магазина
  const refunded = Number(p.refunded_amount?.value ?? r.amount.value);
  const full = Number.isFinite(refunded) && refunded >= Number(p.amount.value);
  const { order, changed } = await refundOrder(id, r.id, full, () => orderFromPayment(p));
  if (changed && order) {
    const test = p.test ? " · тест" : "";
    const receipt = order.receipt_url ? ` (<a href="${h(order.receipt_url)}">чек ФНС</a>)` : "";
    await notifyPayment(
      [
        full
          ? `<b>↩️ Возврат по заказу ${h(id)} — ${h(r.amount.value)} ₽</b>${test}`
          : `<b>↩️ Частичный возврат по заказу ${h(id)} — ${h(r.amount.value)} из ${h(p.amount.value)} ₽</b>${test}`,
        full
          ? `Ссылка на разбор и страница чека закрыты. Аннулируй чек в «Мой налог»${receipt}.`
          : `Заказ остаётся открытым. Проверь чек в «Мой налог»${receipt}.`,
        `<i>Заказ ${h(id)} · платёж ${h(p.id)} · возврат ${h(r.id)}</i>`,
      ].join("\n"),
    );
  }
  return order;
}

export type OrderState = {
  status: "unknown" | "pending" | "paid" | "canceled" | "refunded";
  path?: string;
  short?: string;
  receipt?: string;
  amount?: number; // сумма оплаты, ₽ — для цели Метрики на странице «Спасибо» (у тестовой оплаты нет)
  /** Подарок: имя получателя, замаскированный адрес и день письма (нет адреса — ссылку передаёт покупатель). */
  gift?: { to: string; email?: string; at?: string; sent?: boolean };
  product?: "razbor" | "compat" | "pack" | "child";
  /** Пакет: короткая ссылка на совместимость. */
  pair?: string;
  /** Допродажа после обычного разбора себе: совместимость с первой датой покупателя. */
  upsell?: string;
  /** Не оплачен: страница продукта с формой, заполненной из заказа («Вернуться к оплате»). */
  resume?: string;
  /** Такого заказа нет: ни файла, ни платежа в ЮKassa (или номер не похож на номер заказа). */
  missing?: boolean;
};

/**
 * Состояние заказа для страницы «Спасибо»: файл заказа, а пока он не итоговый — живой статус платежа в ЮKassa.
 * offline — только файл заказа, без ЮKassa, чека и писем (лимит запросов исчерпан); неоплаченный — «ждём».
 */
export async function orderState(orderId: string, cookiePaymentId?: string, offline = false): Promise<OrderState> {
  if (!isOrderId(orderId)) return { status: "unknown", missing: true };
  let o = await getOrder(orderId);
  if (offline) {
    if (o?.status !== "paid") return { status: o?.status === "canceled" || o?.status === "refunded" ? o.status : "pending", ...(o ? { product: productOf(o.product), resume: resumePath(o) } : {}) };
  } else if (o?.status !== "paid" && o?.status !== "refunded") {
    let p: Payment | null = null;
    if (o?.payment_id) {
      try {
        p = await getPayment(o.payment_id);
      } catch (e) {
        console.error("razbor orderState:", orderId, e);
      }
    }
    if (!p) p = await findPayment(orderId, cookiePaymentId);
    if (p && p.metadata?.order === orderId) o = (await applyPayment(p)) ?? o;
    if (!o && !p) return { status: "unknown", missing: true };
  }
  if (!o) return { status: "unknown" };
  if (o.status !== "paid") return { status: o.status, product: productOf(o.product), resume: resumePath(o) };
  if (!o.receipt_url) o = (await getOrder(o.id)) ?? o; // чек мог пробиться в вебхуке после первого чтения
  if (!offline && o.receipt_due && (!o.receipt_uuid || (o.email && !o.mail_sent_at))) o = await retryPaid(o).catch(() => o!);
  if (o.status !== "paid") return { status: o.status }; // возврат мог прийти, пока шла проверка
  const g = o.gift;
  const gift = g ? { to: o.name, ...(g.to_email ? { email: maskEmail(g.to_email) } : {}), ...(g.send_at ? { at: g.send_at } : {}), ...(g.sent_at ? { sent: true } : {}) } : undefined;
  const product = productOf(o.product);
  return {
    status: "paid", path: `/razbor/r/${o.token}`, short: `/r/${o.id}`, receipt: o.receipt_url ? `/razbor/chek/${o.id}` : undefined, ...(o.test ? {} : { amount: o.amount }), ...(gift ? { gift } : {}),
    product,
    ...(product === "pack" && o.token2 ? { pair: `/r/${o.id}/para` } : {}),
    ...(product === "razbor" && !g ? { upsell: compatUpsellPath(o.date) } : {}),
  };
}
