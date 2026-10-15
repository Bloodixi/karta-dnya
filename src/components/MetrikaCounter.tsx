"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Ym = ((id: number, action: string, ...args: unknown[]) => void) & { a?: unknown[]; l?: number };

/** Личные страницы покупателя: адрес = доступ к разбору или чеку, в Метрику он попасть не должен. */
export function isPrivatePath(path: string): boolean {
  return /^\/(r|razbor\/r|razbor\/chek)(\/|$)/.test(path) || /^\/razbor\/spasibo\/?$/.test(path);
}

let loaded = false;

function load(id: number) {
  const w = window as unknown as { ym?: Ym };
  w.ym ??= Object.assign((...args: unknown[]) => void (w.ym!.a ??= []).push(args), { l: Date.now() }) as Ym;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://mc.yandex.ru/metrika/tag.js";
  document.head.appendChild(s);
  // defer: просмотры отправляем сами (ниже), чтобы решать, какие адреса учитывать
  w.ym(id, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false, defer: true });
  loaded = true;
}

/**
 * Счётчик Метрики. Не загружается на личных страницах; на остальных отправляет просмотр при каждом переходе
 * внутри сайта (Next.js меняет страницы без перезагрузки, сама Метрика такие переходы не видит).
 */
export default function MetrikaCounter({ id }: { id: number }) {
  const pathname = usePathname();
  const prev = useRef<string | null>(null);
  useEffect(() => {
    if (isPrivatePath(pathname)) {
      // счётчик уже работает (пришли сюда переходом со страницы сайта) — он отправил бы клики и «отказы»
      // с адресом этой страницы; перезагрузка открывает её уже без счётчика
      if (loaded) window.location.reload();
      prev.current = null;
      return;
    }
    if (!loaded) load(id);
    const url = window.location.href;
    if (prev.current === url) return;
    const ym = (window as unknown as { ym?: Ym }).ym;
    ym?.(id, "hit", url, prev.current ? { referer: prev.current } : {});
    prev.current = url;
  }, [pathname, id]);
  return null;
}
