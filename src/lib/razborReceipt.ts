/** Чек «Мой налог» за оплаченный разбор. Только сервер. */
import { createReceipt, nalogReady } from "./moyNalog";
import { PRODUCTS, productOf } from "./razborProducts";
import { patchOrder, type Order } from "./razborStore";

/** Название услуги в чеке обычного разбора; у других продуктов — своё (razborProducts). */
export const RECEIPT_SERVICE = PRODUCTS.razbor.receipt;

/**
 * Пробивает чек один раз на заказ (receipt_uuid в заказе — признак, что уже пробит).
 * Ошибку не бросает: оплата и выдача разбора важнее, владелец получит уведомление «оформи чек вручную».
 */
export async function issueReceipt(order: Order): Promise<{ receipt?: Order; error?: string }> {
  if (order.receipt_uuid) return { receipt: order };
  if (!nalogReady()) return { error: "не настроен вход в «Мой налог»" };
  try {
    const r = await createReceipt({ name: PRODUCTS[productOf(order.product)].receipt, amount: order.amount, operationTime: new Date(order.paid_at || Date.now()) });
    return { receipt: (await patchOrder(order.id, { receipt_uuid: r.uuid, receipt_url: r.url })) ?? { ...order, receipt_uuid: r.uuid, receipt_url: r.url } };
  } catch (e) {
    console.error("razbor receipt:", order.id, e);
    return { error: String((e as Error).message ?? e).slice(0, 200) };
  }
}
