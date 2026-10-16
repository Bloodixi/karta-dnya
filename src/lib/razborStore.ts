/** Заказы разбора: JSON-файлы <RAZBOR_DATA_DIR>/orders/<id>.json на постоянном томе Coolify (/data). Только сервер. */
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type OrderStatus = "pending" | "paid" | "canceled" | "refunded";

/** Подарок: кто дарит, пожелание, куда и когда отправить письмо получателю. Имя получателя — order.name. */
export type Gift = {
  from: string; // как подписан подарок, до 40 знаков
  wish?: string; // пожелание, до 300 знаков
  to_email?: string; // e-mail получателя; нет — ссылку передаёт покупатель
  send_at?: string; // ГГГГ-ММ-ДД по Москве; нет — сразу после оплаты
  sent_at?: string; // письмо получателю отправлено
  access_mail_at?: string[]; // письма «Потеряли ссылку?» на адрес получателя за последние сутки
};

export type Order = {
  id: string;
  token: string;
  date: string; // ГГГГ-ММ-ДД
  name: string;
  email: string;
  amount: number;
  status: OrderStatus;
  payment_id: string;
  created_at: string;
  paid_at: string;
  yr: number; // год расчёта личного года
  mo: number; // месяц, с которого идёт помесячный прогноз
  receipt_uuid?: string; // чек «Мой налог»
  receipt_url?: string;
  mail_sent_at?: string; // письмо покупателю с разбором и чеком
  receipt_due?: boolean; // боевая оплата: чек и письмо обязательны (тестовые заказы — без них)
  test?: boolean; // оплачен в тестовом магазине: чек не пробивается, письмо получателю подарка уходит с пометкой [ТЕСТ]
  retry_at?: string; // последний повтор чека/письма
  retries?: number;
  refunded_at?: string; // полный возврат: ссылки /r и чек закрыты
  refund_ids?: string[]; // учтённые возвраты ЮKassa (уведомление — один раз на возврат)
  access_mail_at?: string[]; // письма «Потеряли ссылку?» за последние сутки (суточный потолок на адрес)
  mismatch_at?: string; // оплата не сошлась с заказом (валюта/сумма) — владелец уже предупреждён
  gift?: Gift; // заказ в подарок
};

const ID_RE = /^[\w-]{6,64}$/;

function dir(): string {
  const base = process.env.RAZBOR_DATA_DIR || (process.env.NODE_ENV === "production" ? "/data" : path.join(process.cwd(), ".data"));
  return path.join(base, "orders");
}

const file = (id: string) => path.join(dir(), `${id}.json`);

export async function getOrder(id: string): Promise<Order | null> {
  if (!ID_RE.test(id)) return null;
  try {
    return JSON.parse(await readFile(file(id), "utf8")) as Order;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") console.error("razbor store read:", id, e);
    return null;
  }
}

/** Атомарная запись: во временный файл и rename, чтобы при сбое не остался обрезанный JSON. */
export async function saveOrder(o: Order): Promise<void> {
  if (!ID_RE.test(o.id)) throw new Error(`bad order id ${o.id}`);
  await mkdir(dir(), { recursive: true });
  const tmp = `${file(o.id)}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(o, null, 1));
  await rename(tmp, file(o.id));
}

/** Запросы к одному заказу выполняются по очереди: вебхук и опрос страницы «Спасибо» не перезапишут друг друга. */
const locks = new Map<string, Promise<unknown>>();
function serial<T>(id: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(id) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(id, next.catch(() => {}));
  void next.finally(() => { if (locks.get(id) === next) locks.delete(id); }).catch(() => {});
  return next;
}

/**
 * Переводит заказ в итоговый статус. Идемпотентно: `changed` = true только при первом переходе
 * (по нему шлём уведомление). Если файла нет (том потерян, заказ из старой версии), создаёт его из `fallback`.
 */
export function settleOrder(id: string, status: "paid" | "canceled", fallback: () => Order | null, paymentId: string): Promise<{ order: Order | null; changed: boolean }> {
  return serial(id, async () => {
    const o = (await getOrder(id)) ?? fallback();
    if (!o) return { order: null, changed: false };
    // возврат итоговый: повторное уведомление payment.succeeded не должно снова открыть заказ
    if (o.status === "paid" || o.status === "refunded" || o.status === status) return { order: o, changed: false };
    const next: Order = { ...o, status, payment_id: paymentId || o.payment_id, paid_at: status === "paid" ? new Date().toISOString() : o.paid_at };
    await saveOrder(next);
    return { order: next, changed: true };
  });
}

/**
 * Учитывает возврат ЮKassa. Полный возврат переводит заказ в refunded (короткая ссылка и чек перестают открываться).
 * `changed` = true только при первом учёте этого возврата.
 */
export function refundOrder(id: string, refundId: string, full: boolean, fallback: () => Order | null): Promise<{ order: Order | null; changed: boolean }> {
  return serial(id, async () => {
    const o = (await getOrder(id)) ?? fallback();
    if (!o) return { order: null, changed: false };
    if (o.refund_ids?.includes(refundId)) return { order: o, changed: false };
    const next: Order = {
      ...o,
      refund_ids: [...(o.refund_ids ?? []), refundId].slice(-20),
      ...(full ? { status: "refunded" as const, refunded_at: new Date().toISOString() } : {}),
    };
    await saveOrder(next);
    return { order: next, changed: true };
  });
}

/** Дописывает поля в заказ (по очереди с settleOrder). */
export function patchOrder(id: string, patch: Partial<Order>): Promise<Order | null> {
  return serial(id, async () => {
    const o = await getOrder(id);
    if (!o) return null;
    const next = { ...o, ...patch };
    await saveOrder(next);
    return next;
  });
}

/** Дописывает поля в подарок заказа поверх свежей записи (не затирая sent_at и остальное). */
export function patchGift(id: string, patch: Partial<Gift>): Promise<Order | null> {
  return serial(id, async () => {
    const o = await getOrder(id);
    if (!o?.gift) return o;
    const next = { ...o, gift: { ...o.gift, ...patch } };
    await saveOrder(next);
    return next;
  });
}

/** Все заказы с тома, отобранные `keep`. Заказов немного — читаем каталог целиком. */
export async function listOrders(keep: (o: Order) => boolean): Promise<Order[]> {
  let names: string[] = [];
  try {
    names = (await readdir(dir())).filter((n) => n.endsWith(".json"));
  } catch {
    return [];
  }
  const out: Order[] = [];
  for (const n of names) {
    const o = await getOrder(n.slice(0, -5));
    if (o && keep(o)) out.push(o);
  }
  return out;
}

/**
 * Оплаченные подарки, уже отправленные получателю на этот адрес (для «Потеряли ссылку?»). Подарки с отправкой
 * в будущем не выдаём: сюрприз не должен открыться раньше дня, выбранного покупателем.
 */
export async function paidGiftsByRecipient(email: string): Promise<Order[]> {
  const want = email.trim().toLowerCase();
  const out = await listOrders((o) => o.status === "paid" && Boolean(o.gift?.sent_at) && o.gift?.to_email?.toLowerCase() === want);
  return out.sort((a, b) => b.paid_at.localeCompare(a.paid_at));
}

/** Оплаченные заказы по e-mail покупателя (для «Потеряли ссылку?»). */
export async function paidOrdersByEmail(email: string): Promise<Order[]> {
  const want = email.trim().toLowerCase();
  const out = await listOrders((o) => o.status === "paid" && o.email.toLowerCase() === want);
  return out.sort((a, b) => b.paid_at.localeCompare(a.paid_at));
}
