/**
 * Чеки самозанятого в «Мой налог» (lknpd.nalog.ru — тот же API, что у веб-версии). Только сервер.
 * ЮKassa с 29.12.2025 чеки самозанятых не отправляет, поэтому доход регистрируем сами после оплаты.
 * Вход: NALOG_INN, NALOG_DEVICE_ID, NALOG_REFRESH_TOKEN (выданы входом по SMS, tools/nalog/auth_*.py).
 * Если ФНС выдаст новый refreshToken, он сохраняется на томе (<RAZBOR_DATA_DIR>/nalog.json) и важнее переменной.
 */
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const API = "https://lknpd.nalog.ru/api";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

export type Receipt = { uuid: string; url: string };

export function nalogReady(): boolean {
  return Boolean(process.env.NALOG_INN && process.env.NALOG_DEVICE_ID && process.env.NALOG_REFRESH_TOKEN);
}

const stateFile = () =>
  path.join(process.env.RAZBOR_DATA_DIR || (process.env.NODE_ENV === "production" ? "/data" : path.join(process.cwd(), ".data")), "nalog.json");

async function refreshToken(): Promise<string> {
  try {
    const s = JSON.parse(await readFile(stateFile(), "utf8")) as { refreshToken?: string };
    if (s.refreshToken) return s.refreshToken;
  } catch {}
  return process.env.NALOG_REFRESH_TOKEN!;
}

async function saveRefreshToken(t: string): Promise<void> {
  const f = stateFile();
  await mkdir(path.dirname(f), { recursive: true });
  await writeFile(`${f}.tmp`, JSON.stringify({ refreshToken: t }), { mode: 0o600 });
  await rename(`${f}.tmp`, f);
}

async function post<T>(p: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(API + p, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": UA,
      Referer: "https://lknpd.nalog.ru/",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Мой налог ${p}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

let cached: { token: string; until: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && cached.until > Date.now()) return cached.token;
  const rt = await refreshToken();
  const d = await post<{ token: string; refreshToken?: string; tokenExpireIn?: string }>("/v1/auth/token", {
    deviceInfo: { sourceDeviceId: process.env.NALOG_DEVICE_ID, sourceType: "WEB", appVersion: "1.0.0", metaDetails: { userAgent: UA } },
    refreshToken: rt,
  });
  if (d.refreshToken && d.refreshToken !== rt) await saveRefreshToken(d.refreshToken);
  const exp = d.tokenExpireIn ? Date.parse(d.tokenExpireIn) : NaN;
  cached = { token: d.token, until: (Number.isFinite(exp) ? exp : Date.now() + 10 * 60_000) - 60_000 };
  return d.token;
}

/** Время по Москве в формате, который ждёт ФНС: 2026-10-15T13:10:39+03:00. */
function msk(d: Date): string {
  return new Date(d.getTime() + 3 * 3600_000).toISOString().slice(0, 19) + "+03:00";
}

export function receiptUrl(uuid: string): string {
  return `${API}/v1/receipt/${process.env.NALOG_INN}/${uuid}/print`;
}

/** Регистрирует доход от физлица (безнал) и возвращает чек. operationTime — момент оплаты. */
export async function createReceipt(o: { name: string; amount: number; operationTime: Date }): Promise<Receipt> {
  const t = await accessToken();
  const d = await post<{ approvedReceiptUuid: string }>(
    "/v1/income",
    {
      paymentType: "WIRE",
      ignoreMaxTotalIncomeRestriction: false,
      client: { contactPhone: null, displayName: null, inn: null, incomeType: "FROM_INDIVIDUAL" },
      requestTime: msk(new Date()),
      operationTime: msk(o.operationTime),
      services: [{ name: o.name.slice(0, 256), amount: o.amount, quantity: 1 }],
      totalAmount: o.amount.toFixed(2),
    },
    t,
  );
  return { uuid: d.approvedReceiptUuid, url: receiptUrl(d.approvedReceiptUuid) };
}

/** Аннулирует чек: при возврате денег (refund) или если чек пробит по ошибке (mistake). */
export async function cancelReceipt(uuid: string, reason: "refund" | "mistake" = "refund"): Promise<void> {
  const t = await accessToken();
  const now = msk(new Date());
  await post(
    "/v1/cancel",
    { operationTime: now, requestTime: now, comment: reason === "refund" ? "Возврат средств" : "Чек сформирован ошибочно", receiptUuid: uuid, partnerCode: null },
    t,
  );
}
