/**
 * Сертификат на разбор: получатель по ссылке из письма (/razbor/sertifikat?c=<код>) сам вводит дату рождения и имя —
 * заказ получает документ обычного разбора (token, date, name, cert_at). Код одноразовый: второй раз дату не ввести.
 * Только сервер.
 */
import { cleanEmail } from "./razborGift";
import { mailCertRedeemed } from "./razborMail";
import { nowMsk, RAZBOR_VERSION } from "./razbor";
import { productOf } from "./razborProducts";
import { getOrder, patchGift, patchOrder, type Order } from "./razborStore";
import { makeToken } from "./razborToken";
import type { BirthDate } from "./numerology";

export type CertState = "ok" | "redeemed" | "unpaid" | "closed" | "missing";

/** Что с сертификатом: можно активировать, уже активирован, ещё не оплачен, возвращён/отменён или не найден. */
export function certState(o: Order | null): CertState {
  if (!o || productOf(o.product) !== "cert") return "missing";
  if (o.status === "refunded" || o.status === "canceled") return "closed";
  if (o.status !== "paid") return "unpaid";
  return o.cert_at ? "redeemed" : "ok";
}

/** Активация в процессе: двойной клик и два запроса не активируют сертификат дважды. */
const redeeming = new Map<string, Promise<{ order?: Order; state: CertState }>>();

/** Активирует сертификат датой и именем получателя. Уже активирован — вернёт «redeemed» и заказ как есть. */
export function redeemCert(id: string, date: BirthDate, name: string, email: unknown): Promise<{ order?: Order; state: CertState }> {
  const running = redeeming.get(id);
  if (running) return running;
  const job = doRedeem(id, date, name, cleanEmail(email)).finally(() => redeeming.delete(id));
  redeeming.set(id, job);
  return job;
}

async function doRedeem(id: string, date: BirthDate, name: string, email: string): Promise<{ order?: Order; state: CertState }> {
  const o = await getOrder(id);
  const state = certState(o);
  if (state !== "ok" || !o) return { order: o ?? undefined, state };
  // прогноз — с месяца активации: получатель открывает подарок сейчас
  const { yr, mo } = nowMsk();
  const token = makeToken({ d: date.d, m: date.m, y: date.y, name: name || undefined, yr, mo, v: RAZBOR_VERSION }, id);
  const next = await patchOrder(id, { date: date.iso, name, token, yr, mo, cert_at: new Date().toISOString() });
  if (!next) return { state: "missing" };
  if (email) {
    // адрес получателя — в подарок заказа: по нему сработает «Потеряли ссылку?» (письмо получателю больше не нужно)
    if (!next.gift?.to_email) await patchGift(id, { to_email: email, sent_at: next.gift?.sent_at ?? new Date().toISOString() }).catch(() => null);
    await mailCertRedeemed(next, email);
  }
  return { order: next, state: "ok" };
}
