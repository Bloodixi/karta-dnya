"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isPrivatePath } from "@/components/MetrikaCounter";
import { UMAMI_WEBSITE_ID } from "@/lib/umami";

type Umami = { track: (payload: (p: Record<string, unknown>) => Record<string, unknown>) => void };

/**
 * Счётчик Umami. Просмотр отправляем сами при каждом переходе: адрес — только путь, без ?параметров.
 * На личных страницах (/r/*, «Спасибо», чек) скрипт не грузится и просмотры не уходят.
 */
export default function UmamiCounter() {
  const pathname = usePathname();
  const prev = useRef<string | null>(null);
  useEffect(() => {
    if (isPrivatePath(pathname)) return;
    const w = window as unknown as { umami?: Umami };
    const send = () => {
      if (prev.current === pathname) return;
      const referrer = prev.current ? `${location.origin}${prev.current}` : document.referrer;
      w.umami?.track((p) => ({ ...p, url: pathname, referrer }));
      prev.current = pathname;
    };
    if (w.umami) return send();
    let s = document.getElementById("umami-js") as HTMLScriptElement | null;
    if (!s) {
      s = document.createElement("script");
      s.id = "umami-js";
      s.async = true;
      s.src = "/u/k.js";
      s.dataset.websiteId = UMAMI_WEBSITE_ID;
      s.dataset.autoTrack = "false";
      s.dataset.domains = "karta-dnya.ru";
      document.head.appendChild(s);
    }
    s.addEventListener("load", send, { once: true });
  }, [pathname]);
  return null;
}
