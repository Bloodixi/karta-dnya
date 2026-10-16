/** Наш вид чека «Мой налог» (страница и письмо): реквизиты из заказа, QR-код ведёт на официальный чек ФНС. Только сервер. */
import QRCode from "qrcode";
import { PRODUCTS, productOf } from "./razborProducts";
import type { Order } from "./razborStore";
import { SELLER, SITE } from "./site";

export type ReceiptView = {
  number: string;
  date: string; // 15.10.2026
  time: string; // 13:47
  seller: string;
  inn: string;
  item: string;
  amount: string; // 1,00 ₽
  fnsUrl: string;
  pageUrl: string;
};

export const RECEIPT_ITEM = PRODUCTS.razbor.receipt;

const rub = (n: number) => `${n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽`;

export function receiptView(o: Order): ReceiptView | null {
  if (!o.receipt_uuid || !o.receipt_url) return null;
  const at = new Date(o.paid_at || o.created_at);
  const part = (opt: Intl.DateTimeFormatOptions) => at.toLocaleString("ru-RU", { timeZone: "Europe/Moscow", ...opt });
  return {
    number: o.receipt_uuid,
    date: part({ day: "2-digit", month: "2-digit", year: "numeric" }),
    time: part({ hour: "2-digit", minute: "2-digit" }),
    seller: SELLER.name,
    inn: SELLER.inn,
    item: PRODUCTS[productOf(o.product)].receipt,
    amount: rub(o.amount),
    fnsUrl: o.receipt_url,
    pageUrl: `${SITE.url}/razbor/chek/${o.id}`,
  };
}

export function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M" });
}

export function qrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, { type: "png", margin: 1, width: 360, errorCorrectionLevel: "M" });
}
