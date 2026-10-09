/** Мини-клиент ЮKassa API v3 (только сервер). Ключи — YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY. */
import { randomUUID } from "node:crypto";

const API = "https://api.yookassa.ru/v3";

export type Payment = {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  amount: { value: string; currency: string };
  metadata?: Record<string, string>;
  confirmation?: { type: string; confirmation_url?: string };
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

export function createPayment(opts: { amount: number; description: string; returnUrl: string; metadata: Record<string, string>; email?: string }): Promise<Payment> {
  const body: Record<string, unknown> = {
    amount: { value: opts.amount.toFixed(2), currency: "RUB" },
    capture: true,
    confirmation: { type: "redirect", return_url: opts.returnUrl },
    description: opts.description.slice(0, 128),
    metadata: opts.metadata,
  };
  // Чек по 54-ФЗ — только если магазин этого требует (у самозанятых чек в «Мой налог» ЮKassa формирует сама).
  if (process.env.YOOKASSA_RECEIPT === "1" && opts.email) {
    body.receipt = {
      customer: { email: opts.email },
      items: [{ description: opts.description.slice(0, 128), quantity: "1.00", amount: body.amount, vat_code: 1, payment_mode: "full_payment", payment_subject: "service" }],
    };
  }
  return call<Payment>("/payments", { method: "POST", body: JSON.stringify(body), headers: { "Idempotence-Key": randomUUID() } });
}

export function getPayment(id: string): Promise<Payment> {
  if (!/^[\w-]{10,64}$/.test(id)) return Promise.reject(new Error("bad payment id"));
  return call<Payment>(`/payments/${id}`);
}

/** Платежи за последние сутки — запасной путь найти платёж по номеру заказа, если потерялась cookie. */
export async function recentPayments(): Promise<Payment[]> {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const r = await call<{ items: Payment[] }>(`/payments?limit=100&created_at.gte=${encodeURIComponent(since)}`);
  return r.items ?? [];
}
