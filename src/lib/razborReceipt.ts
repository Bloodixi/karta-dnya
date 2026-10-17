/** Чек «Мой налог» за оплаченный разбор. Только сервер. */
import { createReceipt, nalogReady, ReceiptUnsure } from "./moyNalog";
import { escapeHtml as h, notifyPayment } from "./notify";
import { PRODUCTS, productOf } from "./razborProducts";
import { patchOrder, processShared, type Order } from "./razborStore";

/** Название услуги в чеке обычного разбора; у других продуктов — своё (razborProducts). */
export const RECEIPT_SERVICE = PRODUCTS.razbor.receipt;

const UNSURE = "ответ ФНС не дошёл — проверь в «Мой налог», есть ли чек; сайт его не повторяет";

/**
 * Чеки, пробитые этим процессом: если запись в заказ не удалась, повтор (retryStuck, вебхук) всё равно не пробьёт второй.
 * Переживает только до перезапуска — дальше страхует receipt_unsure, если его удалось записать.
 */
const issued = processShared("razborReceiptsIssued", () => new Map<string, { receipt_uuid: string; receipt_url: string }>());

/**
 * Пробивает чек один раз на заказ (receipt_uuid в заказе — признак, что уже пробит).
 * Ошибку не бросает: оплата и выдача разбора важнее, владелец получит уведомление «оформи чек вручную».
 */
export async function issueReceipt(order: Order): Promise<{ receipt?: Order; error?: string }> {
  if (order.receipt_uuid) return { receipt: order };
  const known = issued.get(order.id);
  if (known) return { receipt: { ...order, ...known } };
  if (order.receipt_unsure) return { error: UNSURE };
  if (!nalogReady()) return { error: "не настроен вход в «Мой налог»" };
  let r: { uuid: string; url: string };
  try {
    r = await createReceipt({ name: PRODUCTS[productOf(order.product)].receipt, amount: order.amount, operationTime: new Date(order.paid_at || Date.now()) });
  } catch (e) {
    console.error("razbor receipt:", order.id, e);
    if (e instanceof ReceiptUnsure) {
      await patchOrder(order.id, { receipt_unsure: true }).catch(() => {});
      return { error: UNSURE };
    }
    return { error: String((e as Error).message ?? e).slice(0, 200) };
  }
  // чек уже пробит: дальше нельзя возвращать обычную ошибку, иначе повтор пробьёт его ещё раз
  const fields = { receipt_uuid: r.uuid, receipt_url: r.url };
  issued.set(order.id, fields);
  try {
    return { receipt: (await patchOrder(order.id, fields)) ?? { ...order, ...fields } };
  } catch (e) {
    console.error("razbor receipt: чек пробит, но не записан в заказ", order.id, r.uuid, r.url, e);
    // хотя бы запрет автоповтора; если диск не пишет вовсе — остаётся память процесса и уведомление владельцу
    const marked = await patchOrder(order.id, { receipt_unsure: true }).then(() => true, () => false);
    await notifyPayment(
      [
        `<b>⚠️ Чек пробит, но не записан в заказ ${h(order.id)}</b>`,
        `Чек: ${h(r.uuid)}`,
        h(r.url),
        marked ? "Автоповтор чека выключен (receipt_unsure)." : "<b>Заказ не записывается вовсе</b> — после перезапуска сайт может пробить чек повторно, проверь том /data.",
        `Ошибка: ${h(String((e as Error).message ?? e).slice(0, 200))}`,
      ].join("\n"),
    ).catch(() => {});
    return { receipt: { ...order, ...fields } };
  }
}
