"use client";

/** Кнопка «Попробовать снова» на странице «Нет связи»: перезагружает адрес, который не открылся. */
export default function OfflineRetry() {
  return (
    <button type="button" onClick={() => window.location.reload()} className="btn cursor-pointer">
      Попробовать снова
    </button>
  );
}
