/**
 * «Вернуться к оплате»: страница продукта с формой, заполненной из заказа (даты, имена, режим подарка, пакет).
 * Параметры — те же, что понимают формы и что checkout отдаёт при ошибке (retry): /razbor — d, n, g, p, d2, n2;
 * /sovmestimost-razbor — a, b, na, nb; /razbor-rebenka — d, n. Поля подарка (подпись, пожелание) и e-mail
 * в адрес не кладём — их форма вернёт из черновика вкладки, если он ещё есть.
 */
import type { Order } from "./razborStore";
import { PRODUCTS, productOf } from "./razborProducts";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function resumePath(o: Pick<Order, "product" | "date" | "name" | "date2" | "name2" | "gift">): string {
  const product = productOf(o.product);
  const q = new URLSearchParams();
  const date = ISO.test(o.date ?? "") ? o.date : "";
  const date2 = ISO.test(o.date2 ?? "") ? o.date2! : "";
  const name = (o.name ?? "").trim();
  const name2 = (o.name2 ?? "").trim();
  if (product === "compat") {
    if (date) q.set("a", date);
    if (date2) q.set("b", date2);
    if (name) q.set("na", name);
    if (name2) q.set("nb", name2);
  } else {
    if (date) q.set("d", date);
    if (name) q.set("n", name);
    if (product === "pack") {
      q.set("p", "1");
      if (date2) q.set("d2", date2);
      if (name2) q.set("n2", name2);
    }
  }
  if (o.gift && product !== "pack" && product !== "cert") q.set("g", "1");
  const s = q.toString();
  return `${PRODUCTS[product].path}${s ? `?${s}` : ""}#oplata`;
}
