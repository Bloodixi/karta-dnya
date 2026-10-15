/** Заказы разбора: JSON-файлы <RAZBOR_DATA_DIR>/orders/<id>.json на постоянном томе Coolify (/data). Только сервер. */
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type OrderStatus = "pending" | "paid" | "canceled";

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
  retry_at?: string; // последний повтор чека/письма
  retries?: number;
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
export function settleOrder(id: string, status: Exclude<OrderStatus, "pending">, fallback: () => Order | null, paymentId: string): Promise<{ order: Order | null; changed: boolean }> {
  return serial(id, async () => {
    const o = (await getOrder(id)) ?? fallback();
    if (!o) return { order: null, changed: false };
    if (o.status === "paid" || o.status === status) return { order: o, changed: false };
    const next: Order = { ...o, status, payment_id: paymentId || o.payment_id, paid_at: status === "paid" ? new Date().toISOString() : o.paid_at };
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
