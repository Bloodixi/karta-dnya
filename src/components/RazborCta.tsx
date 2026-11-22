import RazborLink from "@/components/RazborLink";
import { formatDate, parseDate } from "@/lib/numerology";

/**
 * Спокойное приглашение к полному разбору. from — метка страницы для цели «razbor_cta_click».
 * Если страница знает дату (ГГГГ-ММ-ДД) — подставляем её в ссылку и текст, и /razbor сразу покажет бесплатную часть.
 */
export default function RazborCta({ from, date, name, className = "mt-10" }: { from: string; date?: string; name?: string; className?: string }) {
  const parsed = parseDate(date);
  const dmy = parsed ? formatDate(parsed) : null;
  return (
    <aside className={`card p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 ${className}`}>
      <div className="flex-1">
        <p className="display text-xl">{dmy ? `Полный разбор по дате ${dmy}` : "Полный разбор по дате рождения"}</p>
        <p className="text-sm text-muted mt-1">
          {dmy
            ? `Бесплатная часть для ${dmy} откроется сразу, без повторного ввода даты — внутри число судьбы, квадрат Пифагора, личный год и 12 месяцев вперёд.`
            : "Число судьбы, квадрат Пифагора, личный год и двенадцать месяцев вперёд — одним связным текстом, который можно сохранить."}
        </p>
      </div>
      <RazborLink from={from} date={date} name={name} className="btn self-start md:self-center whitespace-nowrap">
        {dmy ? `Открыть разбор для ${dmy}` : "Бесплатная часть по твоей дате"}
      </RazborLink>
    </aside>
  );
}
