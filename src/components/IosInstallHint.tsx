"use client";

import { useEffect, useState } from "react";
import Icon from "./Icons";

const KEY = "kd-install-hint";

/** Safari на iPhone/iPad, сайт открыт не с экрана «Домой». В других браузерах iOS добавление устроено иначе — там молчим. */
function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|GSA|Instagram|FBAN|FBAV|Telegram|VKClient/.test(ua);
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  return ios && safari && !standalone;
}

/** Подсказка «Добавить на экран» для iOS: один раз (флаг в localStorage), закрывается крестиком. */
export default function IosInstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(KEY) === "1";
    } catch {
      return; // хранилище недоступно (приватный режим) — не показываем, чтобы не повторять на каждой странице
    }
    if (seen || !isIosSafari()) return;
    const t = setTimeout(() => {
      setShow(true);
      try {
        localStorage.setItem(KEY, "1");
      } catch {
        /* не удалось запомнить — покажем ещё раз в другой день, не страшно */
      }
    }, 6000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;
  return (
    <div
      role="dialog"
      aria-label="Добавить сайт на экран «Домой»"
      className="md:hidden fixed inset-x-3 z-30 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] card bg-surface p-4 pr-12 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.45)]"
    >
      <p className="font-medium">Карта дня — на экране «Домой»</p>
      <p className="text-sm text-muted mt-1">
        Нажмите «Поделиться» внизу Safari и выберите «На экран „Домой“». Карта дня будет открываться одним касанием, даже без сети.
      </p>
      <button
        type="button"
        onClick={() => setShow(false)}
        aria-label="Закрыть подсказку"
        className="absolute top-2 right-2 inline-grid place-items-center w-10 h-10 text-muted hover:text-ink cursor-pointer"
      >
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}
