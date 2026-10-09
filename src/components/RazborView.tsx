import type { ReactNode } from "react";
import type { Block, Section } from "@/lib/razbor";

/** `**жирный**` внутри абзаца → <strong>. Остальная разметка не нужна: банк текстов пишет только так. */
function rich(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

const ORDER = [1, 4, 7, 2, 5, 8, 3, 6, 9];

function BlockView({ b }: { b: Block }) {
  switch (b.kind) {
    case "p":
      return b.text.trim() ? <p>{rich(b.text)}</p> : null;
    case "list":
      return b.items.length ? (
        <ol className="razbor-list">
          {b.items.map((it, i) => (
            <li key={i}>{rich(it)}</li>
          ))}
        </ol>
      ) : null;
    case "facts":
      return (
        <div className={`razbor-keep not-prose grid gap-3 my-5 ${b.items.length > 2 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2"}`}>
          {b.items.map((f) => (
            <div key={f.label} className="card p-4">
              <p className="mono">{f.label}</p>
              <p className="display text-4xl mt-1 text-accent">{f.value}</p>
              {f.hint && <p className="text-sm text-muted mt-1 leading-snug">{f.hint}</p>}
            </div>
          ))}
        </div>
      );
    case "grid":
      return (
        <figure className="razbor-keep my-5">
          <div className="grid grid-cols-3 gap-2 max-w-md">
            {ORDER.map((d) => {
              const c = b.cells.find((x) => x.digit === d);
              const count = c?.count ?? 0;
              return (
                <div key={d} className="card p-3 text-center">
                  <p className="display text-xl break-all">{count ? String(d).repeat(count) : "—"}</p>
                  <p className="text-xs text-muted mt-1 leading-tight">{c?.title || `Ячейка ${d}`}</p>
                </div>
              );
            })}
          </div>
          <figcaption className="text-xs text-muted mt-2">Ячейки читаются по столбцам: 1, 4, 7 · 2, 5, 8 · 3, 6, 9. Рабочие числа: {b.work.join(", ")}.</figcaption>
        </figure>
      );
    case "months":
      return (
        <ol className="razbor-months my-5 border-t border-line">
          {b.items.map((m) => (
            <li key={m.label} className="razbor-keep grid grid-cols-[3rem_1fr] gap-x-4 py-4 border-b border-line">
              <span className="display text-3xl text-accent leading-none pt-1" aria-label={`личный месяц ${m.number}`}>
                {m.number}
              </span>
              <div>
                <p className="mono !text-ink">{m.label}</p>
                {m.text.trim() && <p className="!mt-1 !mb-0">{rich(m.text)}</p>}
              </div>
            </li>
          ))}
        </ol>
      );
  }
}

export function RazborToc({ sections }: { sections: { id: string; title: string }[] }) {
  return (
    <nav aria-label="Оглавление разбора" className="card p-5 razbor-toc">
      <p className="mono mb-3">Содержание</p>
      <ol className="grid gap-1 sm:grid-cols-2 text-sm list-decimal pl-5 marker:text-muted">
        {sections.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="hover:text-accent underline-offset-4 hover:underline">
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Серверный рендер разделов разбора (полного или бесплатной части). */
export default function RazborView({ sections, toc = true }: { sections: Section[]; toc?: boolean }) {
  return (
    <div className="razbor-doc">
      {toc && <RazborToc sections={sections} />}
      <div className="prose prose-article razbor-body mt-6">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="razbor-section">
            <h2>{s.title}</h2>
            {s.subtitle && <p className="mono !mt-0">{s.subtitle}</p>}
            {s.blocks.map((b, i) => (
              <BlockView key={i} b={b} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
