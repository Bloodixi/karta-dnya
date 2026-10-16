/**
 * Продукты разбора: что купили в заказе (product в заказе, токене и metadata платежа), цена, название в чеке,
 * страница продукта. Старые заказы без поля product — обычный разбор. Только сервер (цены из env).
 */
import { buildChild, CHILD } from "./razborChild";
import { buildCompat, COMPAT } from "./razborCompat";
import { buildRazbor, envPrice, RAZBOR, type RazborDoc } from "./razbor";
import type { DocToken } from "./razborToken";

export type Product = "razbor" | "compat" | "pack" | "child";

export type ProductInfo = {
  /** Название на странице и в описании платежа. */
  title: string;
  /** Коротко — для уведомлений, писем и списка в «Потеряли ссылку?». */
  short: string;
  price: number;
  /** Страница продукта (лендинг с бесплатной частью и оплатой). */
  path: string;
  /** Название услуги в чеке «Мой налог». */
  receipt: string;
};

export const PRODUCTS: Record<Product, ProductInfo> = {
  razbor: { title: RAZBOR.title, short: "Разбор по дате рождения", price: RAZBOR.price, path: "/razbor", receipt: "Разбор по дате рождения (karta-dnya.ru)" },
  compat: { title: COMPAT.title, short: COMPAT.short, price: COMPAT.price, path: "/sovmestimost-razbor", receipt: "Совместимость пары по датам рождения (karta-dnya.ru)" },
  pack: {
    title: "Разбор по дате рождения и совместимость пары",
    short: "Разбор + совместимость",
    price: envPrice(process.env.PACK_PRICE, 690),
    path: "/razbor",
    receipt: "Разбор по дате рождения и совместимость пары (karta-dnya.ru)",
  },
  child: { title: CHILD.title, short: CHILD.short, price: CHILD.price, path: "/razbor-rebenka", receipt: "Детский разбор по дате рождения (karta-dnya.ru)" },
};

/** Продукт из заказа, токена или metadata: всё незнакомое (и отсутствие поля в старых заказах) — обычный разбор. */
export function productOf(v: unknown): Product {
  return v === "compat" || v === "pack" || v === "child" ? v : "razbor";
}

/** Доплата за совместимость к разбору в пакете (690 − 490 = 200 ₽). */
export const packAddon = () => Math.max(0, PRODUCTS.pack.price - PRODUCTS.razbor.price);

/** Допродажа совместимости: страница совместимости с первой датой покупателя (только дата, без имени). */
export function compatUpsellPath(date: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${PRODUCTS.compat.path}?a=${date}` : PRODUCTS.compat.path;
}

/** Документ по ссылке: разбор, совместимость или детский разбор. */
export function buildDoc(t: DocToken): RazborDoc {
  return t.p === "compat" ? buildCompat(t.input) : t.p === "child" ? buildChild(t.input) : buildRazbor(t.input);
}

/** Тексты страницы результата по виду документа. */
export const DOC_PAGE: Record<DocToken["p"], { title: string; description: string; kicker: string; dates: string; disclaimer: string }> = {
  razbor: {
    title: RAZBOR.title,
    description: "Личный нумерологический разбор по дате рождения: числа, квадрат Пифагора, личный год и прогноз на двенадцать месяцев. Страница доступна только по ссылке.",
    kicker: "личный разбор",
    dates: "дата рождения",
    disclaimer: "Разбор носит развлекательный и ознакомительный характер и не является консультацией специалиста. Решения остаются за тобой.",
  },
  compat: {
    title: COMPAT.title,
    description: "Совместимость пары по датам рождения: числа судьбы, образ пары, любовь, быт, споры, общий год и три совета. Страница доступна только по ссылке.",
    kicker: "совместимость пары",
    dates: "даты рождения",
    disclaimer: "Совместимость носит развлекательный и ознакомительный характер и не является консультацией специалиста. Решения остаются за вами.",
  },
  child: {
    title: CHILD.title,
    description: "Детский разбор по дате рождения для родителя: характер, сильные стороны, как поддержать, возраст и квадрат Пифагора. Страница доступна только по ссылке.",
    kicker: "детский разбор для родителя",
    dates: "дата рождения",
    disclaimer: "Разбор носит развлекательный и ознакомительный характер и не является консультацией психолога, педагога или врача. Решения остаются за тобой.",
  },
};
