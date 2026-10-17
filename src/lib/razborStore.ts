/** Заказы разбора: JSON-файлы <RAZBOR_DATA_DIR>/orders/<id>.json на постоянном томе Coolify (/data). Только сервер. */
import { mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Product } from "./razborProducts";

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

/** Отзыв покупателя. На сайт попадает только вручную (content/data/razbor/reviews.json) и только при publish. */
export type Review = { stars: number; text: string; name: string; publish: boolean; at: string };

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
  review_asked_at?: string; // письмо с просьбой об отзыве отправлено (через 7 дней после оплаты)
  review?: Review; // отзыв покупателя (один на заказ, можно обновить)
  receipt_unsure?: boolean; // регистрация дохода без ответа: чек мог пробиться, автоповтор выключен
  receipt_mail_at?: string; // чек, пробитый после письма, отправлен покупателю отдельным письмом
  stuck_at?: string; // владелец предупреждён: повторы исчерпаны, чек или письмо не сделаны
  receipt_due?: boolean; // боевая оплата: чек и письмо обязательны (тестовые заказы — без них)
  test?: boolean; // оплачен в тестовом магазине: чек не пробивается, письма покупателю и получателю подарка — с [ТЕСТ]
  retry_at?: string; // последний повтор чека/письма
  retries?: number;
  refunded_at?: string; // полный возврат: ссылки /r и чек закрыты
  refund_ids?: string[]; // учтённые возвраты ЮKassa (уведомление — один раз на возврат)
  access_mail_at?: string[]; // письма «Потеряли ссылку?» за последние сутки (суточный потолок на адрес)
  mismatch_at?: string; // оплата не сошлась с заказом (валюта/сумма) — владелец уже предупреждён
  gift?: Gift; // заказ в подарок
  product?: Product; // что куплено; нет — обычный разбор (все заказы до фазы 3)
  date2?: string; // совместимость и пакет: вторая дата рождения, ГГГГ-ММ-ДД
  name2?: string; // и имя второго человека
  token2?: string; // пакет: ссылка на совместимость (token — на разбор)
};

const ID_RE = /^[\w-]{6,64}$/;

/**
 * Общее состояние процесса (очереди, защита от двойной отправки, кэши). Next собирает маршруты в разные серверные
 * бандлы, и модульная переменная может раздвоиться — тогда защита «один раз на заказ» перестаёт работать.
 * Поэтому храним в globalThis под именем.
 */
export function processShared<T>(name: string, init: () => T): T {
  const g = globalThis as typeof globalThis & { __razborShared?: Map<string, unknown> };
  g.__razborShared ??= new Map();
  if (!g.__razborShared.has(name)) g.__razborShared.set(name, init());
  return g.__razborShared.get(name) as T;
}

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
  await writeFile(tmp, JSON.stringify(o, null, 1), { mode: 0o600 }); // в заказе e-mail и даты рождения
  await rename(tmp, file(o.id));
  dropOrdersCache();
}

/** Запросы к одному заказу выполняются по очереди: вебхук и опрос страницы «Спасибо» не перезапишут друг друга. */
const locks = processShared("razborLocks", () => new Map<string, Promise<void>>());
function serial<T>(id: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(id) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  // в Map лежит «хвост» очереди; он же сравнивается при очистке, иначе запись не удалится никогда
  const tail = next.then(() => {}, () => {});
  locks.set(id, tail);
  void tail.then(() => { if (locks.get(id) === tail) locks.delete(id); });
  return next;
}

/** Размер очереди блокировок (для проверки, что она чистится). */
export const lockCount = () => locks.size;

/**
 * Переводит заказ в итоговый статус. Идемпотентно: `changed` = true только при первом переходе
 * (по нему шлём уведомление). Если файла нет (том потерян, заказ из старой версии), создаёт его из `fallback`.
 */
export function settleOrder(id: string, status: "paid" | "canceled", fallback: () => Order | null, paymentId: string, extra: Partial<Order> = {}): Promise<{ order: Order | null; changed: boolean }> {
  return serial(id, async () => {
    const o = (await getOrder(id)) ?? fallback();
    if (!o) return { order: null, changed: false };
    // возврат итоговый: повторное уведомление payment.succeeded не должно снова открыть заказ
    if (o.status === "paid" || o.status === "refunded" || o.status === status) return { order: o, changed: false };
    const next: Order = { ...o, ...(status === "paid" ? extra : {}), status, payment_id: paymentId || o.payment_id, paid_at: status === "paid" ? new Date().toISOString() : o.paid_at };
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

/**
 * Снимок всех заказов в памяти для частых чтений («Потеряли ссылку?»): каталог не перечитывается на каждый запрос.
 * Живёт 2 минуты и сбрасывается при любой записи заказа этим процессом.
 */
const ORDERS_TTL = 2 * 60_000;
const ordersCache = processShared("razborOrdersCache", () => ({ v: null as { at: number; list: Promise<Order[]> } | null }));
function dropOrdersCache() {
  ordersCache.v = null;
}
function cachedOrders(): Promise<Order[]> {
  if (!ordersCache.v || Date.now() - ordersCache.v.at > ORDERS_TTL) {
    const list = listOrders(() => true);
    const v = { at: Date.now(), list };
    ordersCache.v = v;
    list.catch(() => { if (ordersCache.v === v) ordersCache.v = null; });
  }
  return ordersCache.v.list;
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
  const out = (await cachedOrders()).filter((o) => o.status === "paid" && Boolean(o.gift?.sent_at) && o.gift?.to_email?.toLowerCase() === want);
  return out.sort((a, b) => b.paid_at.localeCompare(a.paid_at));
}

/** Оплаченные заказы по e-mail покупателя (для «Потеряли ссылку?»). */
export async function paidOrdersByEmail(email: string): Promise<Order[]> {
  const want = email.trim().toLowerCase();
  const out = (await cachedOrders()).filter((o) => o.status === "paid" && o.email.toLowerCase() === want);
  return out.sort((a, b) => b.paid_at.localeCompare(a.paid_at));
}

/** Сколько хранить брошенные заказы (не оплачены или отменены): в них e-mail и даты рождения. */
export const ABANDONED_KEEP_DAYS = 7;

/** Заказ можно удалить: не оплачен (pending/canceled), не подарок, без следов оплаты и чека, старше `days` дней. */
export function isAbandoned(o: Order, now = Date.now(), days = ABANDONED_KEEP_DAYS): boolean {
  if (o.status !== "pending" && o.status !== "canceled") return false;
  if (o.gift || o.paid_at || o.receipt_uuid || o.receipt_unsure || o.refund_ids?.length) return false;
  const t = Date.parse(o.created_at);
  return Number.isFinite(t) && now - t > days * 86_400_000;
}

/**
 * Ежедневная чистка: удаляет файлы брошенных заказов старше 7 дней. Оплаченные, возвращённые, тестовые оплаченные
 * и подарки не трогает. Каждый файл перечитывается под очередью заказа: вебхук, пришедший в ту же секунду, не потеряется.
 * Если платёж всё же пройдёт позже, заказ восстановится из metadata платежа (settleOrder с fallback).
 */
export async function purgeAbandoned(now = Date.now()): Promise<number> {
  const old = await listOrders((o) => isAbandoned(o, now));
  let n = 0;
  for (const { id } of old) {
    const gone = await serial(id, async () => {
      const o = await getOrder(id);
      if (!o || !isAbandoned(o, now)) return false;
      await unlink(file(id));
      return true;
    }).catch((e) => (console.error("razbor purge:", id, e), false));
    if (gone) n++;
  }
  if (n) dropOrdersCache();
  return n;
}
