/** Мини-клиент ЮKassa API v3 (только сервер). Ключи — YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY. */
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

export function yookassaReady(): boolean {
  return Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY);
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString("base64");
  const res = await fetch(API + path, {
    ...init,
    cache: "no-store",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`ЮKassa ${path}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

/** idempotenceKey — номер заказа: повтор того же запроса (сеть, двойной клик) не создаст второй платёж. */
/** method — способ, выбранный на сайте: «sbp» ведёт сразу на QR-код СБП, без выбора на странице ЮKassa. */
export function createPayment(opts: { amount: number; description: string; returnUrl: string; metadata: Record<string, string>; email?: string; idempotenceKey: string; method?: "sbp" }): Promise<Payment> {
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
  if (process.env.YOOKASSA_RECEIPT === "1" && opts.email) {
    body.receipt = {
      customer: { email: opts.email },
      items: [{ description: opts.description.slice(0, 128), quantity: "1.00", amount: body.amount, vat_code: 1, payment_mode: "full_payment", payment_subject: "service" }],
    };
  }
  return call<Payment>("/payments", { method: "POST", body: JSON.stringify(body), headers: { "Idempotence-Key": opts.idempotenceKey } });
}

export function getPayment(id: string): Promise<Payment> {
  if (!/^[\w-]{10,64}$/.test(id)) return Promise.reject(new Error("bad payment id"));
  return call<Payment>(`/payments/${id}`);
}

export function getRefund(id: string): Promise<Refund> {
  if (!/^[\w-]{10,64}$/.test(id)) return Promise.reject(new Error("bad refund id"));
  return call<Refund>(`/refunds/${id}`);
}

/** Платежи за последние сутки — запасной путь найти платёж по номеру заказа, если потерялась cookie. */
export async function recentPayments(): Promise<Payment[]> {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const r = await call<{ items: Payment[] }>(`/payments?limit=100&created_at.gte=${encodeURIComponent(since)}`);
  return r.items ?? [];
}
