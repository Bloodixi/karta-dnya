import type { Horoscope } from "@/lib/daily";

export default function HoroscopeCard({ h, title }: { h: Horoscope; title?: string }) {
  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl">{title || h.label}</h2>
        <span className="chip">настроение: {h.mood}</span>
      </div>
      <p className="mt-3 text-lg">{h.general}</p>
      <div className="grid gap-4 sm:grid-cols-3 mt-5 text-sm">
        <div>
          <p className="font-semibold">Любовь <span className="stars">{"★".repeat(h.score.love)}</span></p>
          <p className="text-muted mt-1">{h.love}</p>
        </div>
        <div>
          <p className="font-semibold">Работа и деньги <span className="stars">{"★".repeat(h.score.career)}</span></p>
          <p className="text-muted mt-1">{h.career}</p>
        </div>
        <div>
          <p className="font-semibold">Самочувствие <span className="stars">{"★".repeat(h.score.energy)}</span></p>
          <p className="text-muted mt-1">{h.health}</p>
        </div>
      </div>
      <p className="mt-5 border-l-2 border-gold pl-3 italic">{h.advice}</p>
    </section>
  );
}
