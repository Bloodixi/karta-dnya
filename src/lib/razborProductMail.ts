/**
 * Тексты письма покупателю по продукту (совместимость, пакет, детский разбор) и дополнительные ссылки:
 * совместимость из пакета, допродажа совместимости после обычного разбора. Только сервер.
 */
import { buildChild } from "./razborChild";
import { buildCompat, firstSentences } from "./razborCompat";
import { compatUpsellPath, PRODUCTS, productOf } from "./razborProducts";
import type { Order } from "./razborStore";
import { readDocToken } from "./razborToken";
import { SITE } from "./site";

const plain = (t: string) => t.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();

/** Имя без управляющих символов, до 40 знаков (как в razborMail). */
const clean = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);

/** «Главное» для совместимости и детского разбора: образ/характер, сила или возраст, первый совет. Ошибка — пусто. */
export function docHighlights(token: string): string[] {
  try {
    const t = readDocToken(token);
    if (!t || t.p === "razbor") return [];
    const doc = t.p === "compat" ? buildCompat(t.input) : buildChild(t.input);
    const first = (id: string) => {
      const s = doc.sections.find((x) => x.id === id);
      const p = s?.blocks.find((b) => b.kind === "p");
      return s && p?.kind === "p" ? { title: plain(s.title), text: firstSentences(plain(p.text), 1) } : null;
    };
    const ids = t.p === "compat" ? ["obraz", "sila", "god"] : ["harakter", "sily", "vozrast"];
    return ids
      .map(first)
      .filter((x): x is { title: string; text: string } => !!x && !!x.text)
      .map((x) => `${x.title}. ${x.text}`);
  } catch {
    return [];
  }
}

export type ProductMail = { subject: string; intro: string; button: string; mainTitle: string; main: string[] };

/** Тема, вступление и «главное» письма для совместимости, пакета и детского разбора; обычный разбор — null (текст как раньше). */
export function productMail(order: Order): ProductMail | null {
  const product = productOf(order.product);
  if (product === "razbor") return null;
  const name = clean(order.name || "");
  const name2 = clean(order.name2 || "");
  if (product === "compat") {
    const pair = name && name2 ? `${name} и ${name2}` : "";
    return {
      subject: pair ? `Совместимость пары ${pair} готова` : "Совместимость пары по датам рождения готова",
      intro: `Спасибо за заказ. Совместимость пары${pair ? ` ${pair}` : ""} по датам рождения готова и открывается по ссылке`,
      button: "Открыть совместимость",
      mainTitle: "Главное о вашей паре",
      main: docHighlights(order.token),
    };
  }
  if (product === "child") {
    return {
      subject: name ? `Детский разбор готов: ${name}` : "Детский разбор по дате рождения готов",
      intro: "Спасибо за заказ. Детский разбор по дате рождения готов и открывается по ссылке",
      button: "Открыть детский разбор",
      mainTitle: "Главное из разбора",
      main: docHighlights(order.token),
    };
  }
  return {
    subject: name ? `${name}, твой разбор и совместимость готовы` : "Твой разбор и совместимость пары готовы",
    intro: "Спасибо за заказ. Твой разбор по дате рождения готов и открывается по ссылке",
    button: "Открыть разбор",
    mainTitle: "Главное о тебе",
    main: [],
  };
}

/** Дополнительные ссылки письма: совместимость из пакета или допродажа совместимости после обычного разбора себе. */
export function extraLinks(order: Order): { label: string; url: string; note: string }[] {
  const product = productOf(order.product);
  if (product === "pack" && order.token2) {
    const pair = [clean(order.name || ""), clean(order.name2 || "")].filter(Boolean).join(" и ");
    return [{ label: "Открыть совместимость", url: `${SITE.url}/r/${order.id}/para`, note: `Совместимость пары${pair ? ` ${pair}` : ""} — по второй ссылке:` }];
  }
  if (product === "razbor" && !order.gift) {
    const u = new URL(compatUpsellPath(order.date), SITE.url);
    u.searchParams.set("utm_source", "email");
    u.searchParams.set("utm_medium", "razbor");
    u.searchParams.set("utm_campaign", "compat");
    return [{ label: `Совместимость с близким — ${PRODUCTS.compat.price} ₽`, url: u.href, note: "Хочешь посмотреть, как твои числа сочетаются с числами близкого человека?" }];
  }
  return [];
}
