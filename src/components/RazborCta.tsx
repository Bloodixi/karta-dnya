import Link from "next/link";
import { parseDate } from "@/lib/numerology";

/** Спокойное приглашение к полному разбору. Если страница знает дату (ГГГГ-ММ-ДД) — подставляем её в ссылку. */
export default function RazborCta({ date, className = "mt-10" }: { date?: string; className?: string }) {
  const d = parseDate(date);
  return (
    <aside className={`card p-5 md:p-6 max-w-3xl flex flex-col sm:flex-row sm:items-center gap-4 ${className}`}>
      <div className="flex-1">
        <p className="display text-xl">Полный разбор по дате рождения</p>
        <p className="text-sm text-muted mt-1">Число судьбы, квадрат Пифагора, личный год и двенадцать месяцев вперёд — одним связным текстом, который можно сохранить.</p>
      </div>
      <Link href={d ? `/razbor?d=${d.iso}#razbor-teaser` : "/razbor"} className="btn btn-ghost self-start sm:self-center whitespace-nowrap">
        Посмотреть, что внутри
      </Link>
    </aside>
  );
}
