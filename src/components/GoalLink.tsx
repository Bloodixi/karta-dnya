"use client";

/** Внешняя ссылка, клик по которой отправляет цель в Яндекс.Метрику (счётчик передаёт серверный компонент). */
export default function GoalLink({ href, goal, counter, className, children }: { href: string; goal: string; counter?: string; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={className}
      onClick={() => {
        const ym = (window as unknown as { ym?: (id: number, action: string, goal: string) => void }).ym;
        if (counter && ym) ym(Number(counter), "reachGoal", goal);
      }}
    >
      {children}
    </a>
  );
}
