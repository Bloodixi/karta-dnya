/* eslint-disable @next/next/no-html-link-for-pages -- без сети переход должен быть полной загрузкой через сервис-воркер и его кэш, не клиентским */
import type { Metadata } from "next";
import CardBack from "@/components/CardBack";
import OfflineRetry from "@/components/OfflineRetry";

/** Запасная страница сервис-воркера (/sw.js): её показываем, когда сети нет, а нужной страницы нет в кэше. */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Нет связи",
  description: "Страница без интернета: карта дня и главная открываются из сохранённой копии, остальное загрузится, как только связь вернётся. Попробуйте обновить страницу.",
  alternates: { canonical: "/offline" },
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div>
      <section className="night">
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-16 md:pt-16 md:pb-20 grid gap-8 md:grid-cols-[1fr_auto] items-center text-center md:text-left">
          <div>
            <p className="mono mb-4">без интернета</p>
            <h1 className="text-3xl md:text-5xl leading-[1.1]">Нет связи</h1>
            <p className="text-muted mt-4 max-w-xl mx-auto md:mx-0 text-lg">
              Эта страница ещё не сохранена на устройстве. Карта дня и главная открываются и без сети — из последней копии. Остальное загрузится, когда связь вернётся.
            </p>
            <div className="mt-7 flex flex-wrap justify-center md:justify-start gap-3">
              <OfflineRetry />
              <a href="/karta-dnya" className="btn btn-ghost">Карта дня</a>
              <a href="/" className="btn btn-ghost">Главная</a>
            </div>
          </div>
          <div className="w-24 md:w-32 justify-self-center row-start-1 md:row-start-auto" aria-hidden="true">
            <CardBack className="block w-full h-auto rounded-[4px]" />
          </div>
        </div>
      </section>
      <div className="night-edge" />
    </div>
  );
}
