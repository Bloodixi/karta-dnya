import { SITE } from "./site";
import { UMAMI_INTERNAL_URL, UMAMI_WEBSITE_ID } from "./umami";

/**
 * Событие в Umami с сервера: оплата учитывается по вебхуку ЮKassa, а не в браузере — её не съест блокировщик
 * и не потеряет закрытая вкладка. Ошибки не мешают заказу: 3 секунды и молча дальше.
 */
export async function umamiServerEvent(name: string, url: string, data?: Record<string, string | number>): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;
  try {
    await fetch(`${UMAMI_INTERNAL_URL}/api/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (karta-dnya server)" },
      body: JSON.stringify({ type: "event", payload: { website: UMAMI_WEBSITE_ID, hostname: new URL(SITE.url).host, url, name, language: "ru-RU", ...(data ? { data } : {}) } }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (e) {
    console.error("umami event:", name, e instanceof Error ? e.message : "error");
  }
}
