"use client";

import { useState, useSyncExternalStore } from "react";

const noop = () => () => {};

/** «Скопировать ссылку» и, где браузер умеет, «Поделиться» (системное меню телефона). */
export default function ShareButtons({ url }: { url: string }) {
  const canShare = useSyncExternalStore(noop, () => typeof navigator !== "undefined" && typeof navigator.share === "function", () => false);
  const [status, setStatus] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Ссылка скопирована");
    } catch {
      window.prompt("Скопируйте ссылку", url);
    }
  }

  async function share() {
    try {
      await navigator.share({ url, title: document.title });
    } catch {
      /* пользователь закрыл меню — ничего не делаем */
    }
  }

  return (
    <>
      <button type="button" onClick={copy} className="btn btn-ghost">Скопировать ссылку</button>
      {canShare && <button type="button" onClick={share} className="btn btn-ghost">Поделиться</button>}
      <span role="status" className="text-sm text-muted">{status}</span>
    </>
  );
}
