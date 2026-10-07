import Link from "next/link";
import { NUMEROLOGY_TOOLS } from "@/lib/site";

/** Блок перелинковки инструментов нумерологии; текущая страница исключается. */
export default function NumerologyNav({ current, title = "Другие расчёты нумерологии" }: { current: string; title?: string }) {
  const items = NUMEROLOGY_TOOLS.filter((t) => t.href !== current);
  return (
    <section className="mt-12">
      <div className="ornament mb-4">
        <h2 className="text-2xl">{title}</h2>
        <span className="mono">{items.length} инструментов</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <Link key={t.href} href={t.href} className="card card-hover p-4 block">
            <p className="display text-lg">{t.title}</p>
            <p className="text-sm text-muted mt-1">{t.text}</p>
          </Link>
        ))}
      </div>
      <p className="text-muted text-sm mt-4">
        Все инструменты и статьи раздела — в <Link href="/numerologiya" className="text-accent underline">хабе «Нумерология»</Link>.
      </p>
    </section>
  );
}
