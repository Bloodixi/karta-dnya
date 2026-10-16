/**
 * Заказ разбора поверх платежа ЮKassa. Основная запись — файл заказа на томе (razborStore),
 * дубликат данных — в metadata платежа: по нему заказ восстанавливается, если файла нет. Только сервер.
 */
import { getPayment, recentPayments, type Payment, type Refund } from "./yookassa";
import { getOrder, patchOrder, refundOrder, settleOrder, type Order } from "./razborStore";
import { escapeHtml as h, notifyPayment } from "./notify";
import { makeToken } from "./razborToken";
import { issueReceipt } from "./razborReceipt";
import { mailBuyer, mailGift } from "./razborMail";
import { giftDue, giftFromMetadata, maskEmail } from "./razborGift";
import { RAZBOR, type RazborInput } from "./razbor";
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

/** Заказ из metadata платежа — когда файла заказа нет. */
export function orderFromPayment(p: Payment): Order | null {
  const md = p.metadata ?? {};
  const i = inputFromPayment(p);
  if (!i || !md.order) return null;
  const gift = giftFromMetadata(md);
  return {
    id: md.order, token: makeToken(i, md.order), date: md.date, name: md.name ?? "", email: md.email ?? "", amount: Number(p.amount.value),
    status: "pending", payment_id: p.id, created_at: p.created_at, paid_at: "", yr: i.yr, mo: i.mo,
    ...(gift ? { gift } : {}),
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

/** Оплата в тестовом магазине: отмечаем заказ тестовым и, если подарок пора отправлять, шлём письмо получателю. */
async function finishTest(order: Order): Promise<{ lines: string[] }> {
  const o = (await patchOrder(order.id, { test: true })) ?? { ...order, test: true };
  const g = o.gift;
  if (!g) return { lines: [] };
  let line = g.to_email ? `письмо получателю ${g.send_at ? `уйдёт ${h(g.send_at)}` : "сразу"} (с пометкой [ТЕСТ])` : "ссылку передаст покупатель";
  if (giftDue(o)) {
    const s = await mailGift(o);
    line = s.sent ? "письмо получателю отправлено с пометкой [ТЕСТ]" : `<b>⚠️ письмо получателю не отправлено</b> (${h(s.error)}) — повторит ежедневный запуск`;
  }
  return { lines: [`🎁 Подарок от ${h(g.from)}: ${line}`] };
}

const RETRY_GAP = 5 * 60_000;
const RETRY_MAX = 12;

/** Повтор для оплаченного заказа без чека или письма (сеть ФНС или почты была недоступна). Владельцу — что получилось. */
async function retryPaid(o: Order): Promise<Order> {
  if (!o.receipt_due || (o.receipt_uuid && (o.mail_sent_at || !o.email))) return o;
  // статус заказа открывается без входа: повторяем не чаще раза в 5 минут и не больше 12 раз,
  // чтобы при сбоях ФНС не наплодить чеков (ответ мог потеряться после регистрации дохода) и писем
  if ((o.retries ?? 0) >= RETRY_MAX || (o.retry_at && Date.now() - Date.parse(o.retry_at) < RETRY_GAP)) return o;
  o = (await patchOrder(o.id, { retry_at: new Date().toISOString(), retries: (o.retries ?? 0) + 1 })) ?? o;
  if (o.status !== "paid") return o; // возврат между чтением и повтором
  const before = { receipt: Boolean(o.receipt_uuid), mail: Boolean(o.mail_sent_at) };
  const f = await finishPaid(o);
  const after = f.order ?? o;
  const fresh = (await getOrder(o.id)) ?? after;
  if ((!before.receipt && fresh.receipt_uuid) || (!before.mail && fresh.mail_sent_at)) {
    await notifyPayment([`<b>↻ Заказ ${h(o.id)} доделан</b>`, ...f.lines].join("\n"), true);
  }
  return fresh;
}

/** Предупреждения о несовпадении суммы для заказов без файла — в памяти процесса, чтобы не повторять на каждый опрос. */
const mismatchWarned = new Set<string>();

/**
 * Оплата должна быть в рублях и не меньше цены заказа (из файла; без файла — текущая цена разбора).
 * Иначе заказ не отмечается оплаченным, владелец получает одно предупреждение в Telegram.
 */
async function amountMismatch(id: string, p: Payment): Promise<boolean> {
  const o = await getOrder(id);
  const price = o?.amount || RAZBOR.price;
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
  const { order, changed } = await settleOrder(id, p.status === "succeeded" ? "paid" : "canceled", () => orderFromPayment(p), p.id);
  if (changed && order) {
    const test = p.test ? " · тест" : "";
    if (order.status === "paid") {
      const url = `${SITE.url}/r/${order.id}`;
      // тестовый магазин чек в налоговую не пробивает и письмо покупателю не шлёт; письмо получателю подарка — с [ТЕСТ]
      const f = p.test ? await finishTest(order) : await finishPaid(order);
      await notifyPayment(
        [
          `<b>💳 Оплачен разбор — ${h(p.amount.value)} ₽</b>${test}`,
          "",
          `Дата рождения: ${h(order.date)}${order.name ? `\nИмя: ${h(order.name)}` : ""}${order.email ? `\nE-mail: ${h(order.email)}` : ""}`,
          "",
          `<a href="${h(url)}">Открыть разбор</a>`,
          ...f.lines,
          `<i>Заказ ${h(order.id)} · платёж ${h(p.id)}</i>`,
        ].join("\n"),
      );
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
  amount?: number; // сумма оплаты, ₽ — для цели Метрики на странице «Спасибо»
  /** Подарок: имя получателя, замаскированный адрес и день письма (нет адреса — ссылку передаёт покупатель). */
  gift?: { to: string; email?: string; at?: string; sent?: boolean };
};

/**
 * Состояние заказа для страницы «Спасибо»: файл заказа, а пока он не итоговый — живой статус платежа в ЮKassa.
 * offline — только файл заказа, без ЮKassa, чека и писем (лимит запросов исчерпан); неоплаченный — «ждём».
 */
export async function orderState(orderId: string, cookiePaymentId?: string, offline = false): Promise<OrderState> {
  if (!isOrderId(orderId)) return { status: "unknown" };
  let o = await getOrder(orderId);
  if (offline) {
    if (o?.status !== "paid") return { status: o?.status === "canceled" || o?.status === "refunded" ? o.status : "pending" };
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
  }
  if (!o) return { status: "unknown" };
  if (o.status !== "paid") return { status: o.status };
  if (!o.receipt_url) o = (await getOrder(o.id)) ?? o; // чек мог пробиться в вебхуке после первого чтения
  if (!offline && o.receipt_due && (!o.receipt_uuid || (o.email && !o.mail_sent_at))) o = await retryPaid(o).catch(() => o!);
  if (o.status !== "paid") return { status: o.status }; // возврат мог прийти, пока шла проверка
  const g = o.gift;
  const gift = g ? { to: o.name, ...(g.to_email ? { email: maskEmail(g.to_email) } : {}), ...(g.send_at ? { at: g.send_at } : {}), ...(g.sent_at ? { sent: true } : {}) } : undefined;
  return { status: "paid", path: `/razbor/r/${o.token}`, short: `/r/${o.id}`, receipt: o.receipt_url ? `/razbor/chek/${o.id}` : undefined, amount: o.amount, ...(gift ? { gift } : {}) };
}
