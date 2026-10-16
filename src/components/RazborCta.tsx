import RazborLink from "@/components/RazborLink";

/**
 * Спокойное приглашение к полному разбору. from — метка страницы для цели «razbor_cta_click».
 * Если страница знает дату (ГГГГ-ММ-ДД) — подставляем её в ссылку, и /razbor сразу покажет бесплатную часть.
 */
export default function RazborCta({ from, date, className = "mt-10" }: { from: string; date?: string; className?: string }) {
  return (
    <aside className={`card p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 ${className}`}>
      <div className="flex-1">
        <p className="display text-xl">Полный разбор по дате рождения</p>
        <p className="text-sm text-muted mt-1">Число судьбы, квадрат Пифагора, личный год и двенадцать месяцев вперёд — одним связным текстом, который можно сохранить.</p>
      </div>
      <RazborLink from={from} date={date} className="btn self-start md:self-center whitespace-nowrap">
        Бесплатная часть по твоей дате
      </RazborLink>
    </aside>
  );
}
