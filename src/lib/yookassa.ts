/**
 * Мини-клиент ЮKassa API v3 (только сервер). Ключи — YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY.
 * Тестовый магазин (YOOKASSA_TEST_SHOP_ID / YOOKASSA_TEST_SECRET_KEY) — только для проверок владельца (razborTest.ts):
 * платёж создаётся в нём явно, а чтение платежа/возврата, не найденного в боевом, повторяется в тестовом.
 */
const API = "https://api.yookassa.ru/v3";

export type Payment = {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  test?: boolean;
  amount: { value: string; currency: string };
  refunded_amount?: { value: string; currency: string };
  metadata?: Record<string, string>;
  confirmation?: { type: string; confirmation_url?: string };
  created_at: string;
};

export type Refund = {
  id: string;
  payment_id: string;
  status: "pending" | "succeeded" | "canceled";
  amount: { value: string; currency: string };
  created_at: string;
};

export type Shop = "live" | "test";

function shopKeys(shop: Shop): [string | undefined, string | undefined] {
  const e = process.env;
  return shop === "test" ? [e.YOOKASSA_TEST_SHOP_ID, e.YOOKASSA_TEST_SECRET_KEY] : [e.YOOKASSA_SHOP_ID, e.YOOKASSA_SECRET_KEY];
}

export function yookassaReady(shop: Shop = "live"): boolean {
  const [id, key] = shopKeys(shop);
  return Boolean(id && key);
}

class YookassaError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit = {}, shop: Shop = "live"): Promise<T> {
  const auth = Buffer.from(shopKeys(shop).join(":")).toString("base64");
  const res = await fetch(API + path, {
    ...init,
    cache: "no-store",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new YookassaError(`ЮKassa ${path}: ${res.status} ${(await res.text()).slice(0, 300)}`, res.status);
  return (await res.json()) as T;
}

/** Чтение по id: в боевом магазине, а если там такого нет (404) — в тестовом, когда он настроен. */
async function read<T>(path: string): Promise<T> {
  try {
    return await call<T>(path);
  } catch (e) {
    if (e instanceof YookassaError && e.status === 404 && yookassaReady("test")) return call<T>(path, {}, "test");
    throw e;
  }
}

/** idempotenceKey — номер заказа: повтор того же запроса (сеть, двойной клик) не создаст второй платёж. */
/** method — способ, выбранный на сайте: «sbp» ведёт сразу на QR-код СБП, без выбора на странице ЮKassa. */
export function createPayment(opts: { amount: number; description: string; returnUrl: string; metadata: Record<string, string>; email?: string; idempotenceKey: string; method?: "sbp"; shop?: Shop }): Promise<Payment> {
  const body: Record<string, unknown> = {
    amount: { value: opts.amount.toFixed(2), currency: "RUB" },
    capture: true,
    confirmation: { type: "redirect", return_url: opts.returnUrl },
    description: opts.description.slice(0, 128),
    metadata: opts.metadata,
    ...(opts.method ? { payment_method_data: { type: opts.method } } : {}),
  };
  // Чек по 54-ФЗ передаём только при YOOKASSA_RECEIPT=1 — если в магазине включены чеки ЮKassa.
  // В тестовом магазине чеки выключены; у самозанятого чек в «Мой налог» формирует сама ЮKassa.
  if (process.env.YOOKASSA_RECEIPT === "1" && opts.email && opts.shop !== "test") {
    body.receipt = {
      customer: { email: opts.email },
      items: [{ description: opts.description.slice(0, 128), quantity: "1.00", amount: body.amount, vat_code: 1, payment_mode: "full_payment", payment_subject: "service" }],
    };
  }
  return call<Payment>("/payments", { method: "POST", body: JSON.stringify(body), headers: { "Idempotence-Key": opts.idempotenceKey } }, opts.shop);
}

export function getPayment(id: string): Promise<Payment> {
  if (!/^[\w-]{10,64}$/.test(id)) return Promise.reject(new Error("bad payment id"));
  return read<Payment>(`/payments/${id}`);
}

export function getRefund(id: string): Promise<Refund> {
  if (!/^[\w-]{10,64}$/.test(id)) return Promise.reject(new Error("bad refund id"));
  return read<Refund>(`/refunds/${id}`);
}

/** Платежи за последние сутки — запасной путь найти платёж по номеру заказа, если потерялась cookie. */
export async function recentPayments(): Promise<Payment[]> {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const path = `/payments?limit=100&created_at.gte=${encodeURIComponent(since)}`;
  const r = await call<{ items: Payment[] }>(path);
  // тестовый магазин — запасной: его сбой не мешает искать боевые платежи
  const t = yookassaReady("test") ? await call<{ items: Payment[] }>(path, {}, "test").catch(() => null) : null;
  return [...(r.items ?? []), ...(t?.items ?? [])];
}
