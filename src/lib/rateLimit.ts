/**
 * Ограничение частоты запросов в памяти процесса (скользящее окно). Сайт работает одним процессом,
 * поэтому общего хранилища не нужно; после перезапуска счётчики обнуляются — это допустимо.
 */

const MAX_KEYS = 5000;

export type Limiter = {
  /** Можно ли сейчас — без учёта запроса. */
  check(key: string): boolean;
  /** Учитывает запрос; false — лимит исчерпан (тогда запрос не учитывается). */
  take(key: string): boolean;
};

/** Не больше `limit` запросов за `windowMs` на один ключ (IP, e-mail…). */
export function rateLimit(limit: number, windowMs: number): Limiter {
  const hits = new Map<string, number[]>();
  const fresh = (key: string, now: number) => (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  return {
    check(key) {
      return fresh(key, Date.now()).length < limit;
    },
    take(key) {
      const now = Date.now();
      const list = fresh(key, now);
      if (list.length >= limit) {
        hits.set(key, list);
        return false;
      }
      list.push(now);
      hits.set(key, list);
      if (hits.size > MAX_KEYS) {
        // сначала выбрасываем устаревшие ключи, если не помогло — самые старые
        for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
        while (hits.size > MAX_KEYS) hits.delete(hits.keys().next().value!);
      }
      return true;
    },
  };
}

/**
 * Лимитер с общим именем: один и тот же счётчик для страницы и API-маршрута. Next собирает их в разные
 * серверные бандлы, поэтому модульная переменная могла бы раздвоиться — храним в globalThis.
 */
export function sharedRateLimit(name: string, limit: number, windowMs: number): Limiter {
  const g = globalThis as typeof globalThis & { __rateLimits?: Map<string, Limiter> };
  g.__rateLimits ??= new Map();
  let l = g.__rateLimits.get(name);
  if (!l) g.__rateLimits.set(name, (l = rateLimit(limit, windowMs)));
  return l;
}

/**
 * IP клиента. Его ставит прокси сервера (Traefik): X-Real-IP или последний адрес X-Forwarded-For;
 * первые значения X-Forwarded-For клиент может подделать.
 */
export function clientIp(req: Request): string {
  return clientIpFromHeaders(req.headers);
}

/** То же для серверных компонентов (headers() из next/headers). */
export function clientIpFromHeaders(h: Headers): string {
  return h.get("x-real-ip")?.trim() || (h.get("x-forwarded-for") ?? "").split(",").pop()?.trim() || "?";
}
