import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import RuneGlyph from "@/components/RuneGlyph";
import { runeOfDay, formatDateRu, shiftKey, todayKey } from "@/lib/daily";
import type { Faq as FaqItem } from "@/lib/content";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Руна дня: какая руна выпала на сегодня и что она значит",
  description: "Руна дня Старшего Футарка на сегодня: одна руна, её значение, совет и простая практика на день. Обновляется каждую полночь по московскому времени.",
  alternates: { canonical: "/runy/runa-dnya" },
};

const FAQ: FaqItem[] = [
  { q: "Как работает руна дня?", a: "Руна выбирается по дате по московскому времени: у всех посетителей на сегодня одна и та же руна, а в полночь она сменяется. Никаких случайных обновлений при перезагрузке страницы нет." },
  { q: "Что делать, если выпала перевёрнутая руна?", a: "Перевёрнутое положение смещает акцент трактовки: это скорее приглашение быть внимательнее к теме руны, чем плохой знак. Прочитайте раздел о перевёрнутом положении и выберите один небольшой шаг." },
  { q: "Можно ли вытянуть другую руну, если трактовка не нравится?", a: "Руна дня задаётся датой, поэтому она одна. Если вы хотите самостоятельно вытянуть знак, воспользуйтесь набором рун или откройте любую страницу из справочника рун." },
  { q: "Это предсказание на день?", a: "Нет. Руна дня — повод для размышления, а не прогноз. Прочитайте трактовку, выберите одну мысль и посмотрите, как она соотносится с вашим днём." },
];

export default function RuneOfDayPage() {
  const date = todayKey();
  const today = runeOfDay(date);
  const tomorrow = runeOfDay(shiftKey(date, 1));
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/runy", label: "Руны" }, { href: "/runy/runa-dnya", label: "Руна дня" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Руна дня — {formatDateRu(date)}</h1>
      <p className="text-muted mt-2 max-w-2xl">
        Одна руна Старшего Футарка на сегодня для всех. Прочитайте трактовку, возьмите из неё одну мысль и понаблюдайте, как она проявится в течение дня. Это не предсказание, а повод для внимательности.
      </p>
      {today ? (
        <div className="mt-8 grid gap-8 md:grid-cols-[240px_1fr] items-start">
          <div className="md:sticky md:top-24">
            <RuneGlyph slug={today.rune.slug} att={today.rune.att} size={220} className={`mx-auto ${today.reversed ? "rotate-180" : ""}`} />
            <p className="text-xs text-muted mt-3 text-center">{today.rune.orig} · {today.rune.keywords.slice(0, 3).join(" · ")}</p>
          </div>
          <div className="prose">
            <p className="chip">{today.reversed ? "перевёрнутое положение" : "прямое положение"}</p>
            <h2>Руна {today.rune.name}</h2>
            <p>{today.rune.about}</p>
            <h2>Значение на сегодня</h2>
            <p>{today.reversed && today.rune.reversed ? today.rune.reversed : today.rune.upright}</p>
            <h2>В отношениях</h2>
            <p>{today.rune.love}</p>
            <h2>В делах</h2>
            <p>{today.rune.work}</p>
            <h2>Как прожить этот день</h2>
            <p>{today.rune.practice}</p>
            <h2>Совет дня</h2>
            <blockquote>{today.rune.advice}</blockquote>
            {tomorrow && (
              <p className="text-sm text-muted">
                Руна на завтра: <Link href={`/runy/${tomorrow.rune.slug}`}>{tomorrow.rune.name}</Link>{tomorrow.reversed ? " (перевёрнутая)" : ""}. Загляните завтра за толкованием.
              </p>
            )}
            <p>
              <Link href={`/runy/${today.rune.slug}`}>Подробнее о руне {today.rune.name}</Link> · <Link href="/runy">все 24 руны</Link> · <Link href="/karta-dnya">карта дня Таро</Link>
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-muted">Руны готовятся, загляните чуть позже.</p>
      )}
      <Faq items={FAQ} />
    </div>
  );
}
