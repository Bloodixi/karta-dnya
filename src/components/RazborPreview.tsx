import type { ReactNode } from "react";
import Link from "next/link";
import type { Block, RazborDoc, Section } from "@/lib/razbor";
import { sampleDoc, type SampleKind } from "@/lib/razborSamples";

/**
 * Превью платного документа рядом с ценой: три «страницы» веером — обложка, «Твои/Ваши числа» и содержательная страница
 * (месяц прогноза у разбора, «Любовь и близость» у совместимости, квадрат Пифагора у детского). Фрагменты настоящие —
 * из примера (lib/razborSamples), вся стопка ведёт на страницу примера. Серверный компонент, без JS.
 */

const ORDER = [1, 4, 7, 2, 5, 8, 3, 6, 9];
const plain = (t: string) => t.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
const find = (doc: RazborDoc, id: string): Section | undefined => doc.sections.find((s) => s.id === id);
function block<K extends Block["kind"]>(s: Section | undefined, kind: K): Extract<Block, { kind: K }> | undefined {
  return s?.blocks.find((b): b is Extract<Block, { kind: K }> => b.kind === kind);
}

const KICKER: Record<SampleKind, string> = { razbor: "личный разбор", compat: "совместимость пары", child: "детский разбор" };
const EXAMPLE: Record<SampleKind, string> = { razbor: "разбора", compat: "совместимости", child: "детского разбора" };
const TITLE: Record<SampleKind, string> = { razbor: "Разбор по дате рождения", compat: "Совместимость пары", child: "Детский разбор" };

/** Мелкая моноширинная подпись страницы (как .mono, но в масштабе листа). */
function Tiny({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-mono uppercase tracking-[0.08em] text-[0.45rem] sm:text-[0.5rem] leading-tight text-muted ${className}`}>{children}</p>;
}

function Sheet({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div
      className={`absolute top-2 w-[7rem] h-[9.75rem] sm:w-[8rem] sm:h-[11.5rem] overflow-hidden rounded-[3px] border border-line bg-surface p-2 sm:p-2.5 shadow-[0_10px_24px_-14px_rgb(0_0_0/0.45)] transition-transform duration-300 motion-reduce:transition-none ${className}`}
    >
      {children}
    </div>
  );
}

function Cover({ kind, doc }: { kind: SampleKind; doc: RazborDoc }) {
  return (
    <div className="h-full border border-gold/70 rounded-[2px] p-1.5 flex flex-col">
      <Tiny>Карта дня · {KICKER[kind]}</Tiny>
      <p className="display text-[0.72rem] sm:text-[0.8rem] leading-[1.15] mt-auto max-w-[4.5rem] hyphens-auto text-accent-text">{TITLE[kind]}</p>
      <span className="block h-px w-8 bg-gold mt-2" />
      <p className="text-[0.55rem] sm:text-[0.6rem] mt-2 leading-snug">{doc.who}</p>
      <Tiny className="mt-0.5 mb-1">{doc.date}</Tiny>
    </div>
  );
}

function Numbers({ doc }: { doc: RazborDoc }) {
  const s = find(doc, "chisla");
  const facts = block(s, "facts")?.items.slice(0, 4) ?? [];
  return (
    <>
      <p className="display text-[0.7rem] sm:text-[0.8rem] leading-tight">{s?.title ?? "Числа"}</p>
      <ul className="mt-1.5 border-t border-line">
        {facts.map((f) => (
          <li key={f.label} className="flex items-center gap-1.5 py-1 sm:py-1.5 border-b border-line min-w-0">
            <span className="display text-base sm:text-lg leading-none text-accent w-5 shrink-0">{f.value}</span>
            <span className="min-w-0">
              <Tiny className="truncate">{f.label}</Tiny>
              {f.hint ? <span className="block text-[0.45rem] sm:text-[0.5rem] text-muted leading-tight truncate">{plain(f.hint)}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function Months({ doc }: { doc: RazborDoc }) {
  const s = find(doc, "mesyacy");
  const items = block(s, "months")?.items.slice(0, 2) ?? [];
  return (
    <>
      <p className="display text-[0.7rem] sm:text-[0.8rem] leading-tight">{s?.title ?? "Прогноз на 12 месяцев"}</p>
      <ol className="mt-1.5 border-t border-line">
        {items.map((m) => (
          <li key={m.label} className="grid grid-cols-[1rem_1fr] gap-x-1.5 py-1.5 border-b border-line">
            <span className="display text-sm sm:text-base leading-none text-accent">{m.number}</span>
            <div className="min-w-0">
              <Tiny className="!text-ink">{m.label}</Tiny>
              <p className="text-[0.5rem] sm:text-[0.55rem] leading-snug mt-0.5 line-clamp-4">{plain(m.text)}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function Text({ doc, id, fallback }: { doc: RazborDoc; id: string; fallback: string }) {
  const s = find(doc, id);
  const text = s?.blocks.filter((b): b is Extract<Block, { kind: "p" }> => b.kind === "p").map((b) => plain(b.text)).join(" ") ?? "";
  return (
    <>
      <p className="display text-[0.7rem] sm:text-[0.8rem] leading-tight">{s?.title ?? fallback}</p>
      <span className="block h-px w-6 bg-gold mt-1.5" />
      <p className="text-[0.5rem] sm:text-[0.55rem] leading-snug mt-1.5 line-clamp-[12]">{text}</p>
    </>
  );
}

function Square({ doc }: { doc: RazborDoc }) {
  const s = find(doc, "kvadrat");
  const grid = block(s, "grid");
  return (
    <>
      <p className="display text-[0.7rem] sm:text-[0.8rem] leading-tight">{s?.title ?? "Квадрат Пифагора"}</p>
      <div className="grid grid-cols-3 gap-0.5 mt-2">
        {ORDER.map((d) => {
          const c = grid?.cells.find((x) => x.digit === d);
          const n = c?.count ?? 0;
          return (
            <div key={d} className="border border-line rounded-[2px] px-0.5 py-1 text-center min-w-0">
              <p className="display text-[0.6rem] sm:text-[0.7rem] leading-none truncate">{n ? String(d).repeat(n) : "—"}</p>
              <p className="text-[0.4rem] sm:text-[0.45rem] text-muted leading-tight mt-0.5 truncate">{c?.title ?? ""}</p>
            </div>
          );
        })}
      </div>
      {grid ? <Tiny className="mt-1.5">Рабочие числа: {grid.work.join(", ")}</Tiny> : null}
    </>
  );
}

/**
 * `kind` — какой документ показываем; `href` — страница примера.
 * Размер: на телефоне веер ~15.5rem × 11rem, с sm — ~17rem × 12.75rem.
 */
export default function RazborPreview({ kind, href, className = "" }: { kind: SampleKind; href: string; className?: string }) {
  const doc = sampleDoc(kind);
  const third =
    kind === "razbor" ? <Months doc={doc} /> : kind === "compat" ? <Text doc={doc} id="lyubov" fallback="Любовь и близость" /> : <Square doc={doc} />;
  return (
    <Link
      href={href}
      className={`group block no-print rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${className}`}
    >
      <div aria-hidden="true" className="relative mx-auto w-[15.5rem] h-[11rem] sm:w-[17rem] sm:h-[12.75rem]">
        <Sheet className="left-0 -rotate-6 group-hover:-rotate-[8deg] group-hover:-translate-x-1 z-10">
          <Cover kind={kind} doc={doc} />
        </Sheet>
        <Sheet className="left-[4.25rem] sm:left-[4.5rem] -rotate-1 -translate-y-1 z-20">
          <Numbers doc={doc} />
        </Sheet>
        <Sheet className="left-[8.5rem] sm:left-[9rem] rotate-[4deg] group-hover:rotate-[6deg] group-hover:translate-x-1 z-30">
          {third}
        </Sheet>
      </div>
      <span className="mono block text-center mt-2 !text-accent-text underline underline-offset-4 decoration-accent-text/40 group-hover:decoration-accent-text">
        Пример {EXAMPLE[kind]} целиком
      </span>
    </Link>
  );
}
