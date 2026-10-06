"use client";

import { useSyncExternalStore } from "react";
import Icon from "./Icons";

type Theme = "light" | "dark";

function current(): Theme {
  const t = document.documentElement.dataset.theme;
  if (t === "light" || t === "dark") return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  window.addEventListener("themechange", cb);
  return () => { mq.removeEventListener("change", cb); window.removeEventListener("themechange", cb); };
}

/** Переключатель темы: хранится в localStorage, до гидрации выставляется скриптом в layout. */
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, current, () => "light" as Theme);
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
    window.dispatchEvent(new Event("themechange"));
  };
  const label = theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему";
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className="icon-badge !w-9 !h-9 cursor-pointer hover:border-accent hover:text-accent">
      <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
    </button>
  );
}
