"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RazborDoc } from "@/lib/razbor";
import {
  BOOKLET_FONT_FAMILIES,
  BOOKLET_FONTS_URL,
  STYLES,
  bookCss,
  bookHtml,
  emptyPlan,
  type BookletPlan,
  type BookletQuestions,
  type BookletStyle,
} from "@/lib/razborBooklet";

type View = "spreads" | "single";
type PageRow = { page: number; fill: number; freeMm: number; designed: boolean; chain: string | null; firstSid: string | null; sids: string[]; keepSid: string | null; fills: string[]; fh: Record<string, number>; ftop: Record<string, number> };
type Measure = { pages: PageRow[]; chains: Record<string, PageRow[]> };

/* Подгонка: после раскладки меряем последнюю страницу каждой цепочки.
 * Короткий «хвост» на новой странице (< 30%) — уменьшаем кегль цепочки (до 3 шагов) или вставку;
 * свободное место (> 15%) — вставка по размеру: вопросы со строками, цитата, орнамент. */
const MM = 96 / 25.4;
const FILL_ORDER = ["q3x", "q3", "q2x", "q2", "quote", "orn", null] as const;
type Fill = string | null;
const smaller = (k: Fill): Fill => FILL_ORDER[Math.min(FILL_ORDER.indexOf(k as (typeof FILL_ORDER)[number]) + 1, FILL_ORDER.length - 1)];
const pickFill = (freeMm: number): Fill => (freeMm >= 100 ? "q3x" : freeMm >= 82 ? "q3" : freeMm >= 70 ? "q2x" : freeMm >= 58 ? "q2" : freeMm >= 34 ? "quote" : freeMm >= 14 ? "orn" : null);
const DESIGNED = ["cover", "ded", "toc", "opener", "cal", "cardpage", "journal", "back"];

function measure(book: HTMLElement): Measure {
  const out: Measure = { pages: [], chains: {} };
  book.querySelectorAll<HTMLElement>(".pagedjs_page").forEach((p, i) => {
    const area = p.querySelector<HTMLElement>(".pagedjs_page_content");
    if (!area) return;
    const r = area.getBoundingClientRect();
    const designed = [...area.querySelectorAll("section")].some((s) => DESIGNED.some((c) => s.classList.contains(c)));
    let bottom = r.top;
    area.querySelectorAll("p, li, h2, h3, h4, figure, .sq, .kcard, .nums, blockquote, .q i, .fill-orn, table, .nl i, .periods").forEach((e) => {
      const b = e.getBoundingClientRect();
      if (b.height > 0) bottom = Math.max(bottom, b.bottom);
    });
    const tagged = area.querySelectorAll<HTMLElement>("[data-chain]");
    const chain = tagged.length ? tagged[tagged.length - 1].dataset.chain ?? null : null;
    const sids = [...area.querySelectorAll<HTMLElement>("[data-sid]")].map((e) => e.dataset.sid!);
    // заголовок раздела, с которого начинается страница: перед его разделом можно вставить заполнитель
    const k0 = area.querySelector<HTMLElement>(".keep, .sh"), k0top = k0 ? (k0.getBoundingClientRect().top - r.top) / r.height : 1;
    const keepSid = k0 && k0top < 0.15 ? k0.closest<HTMLElement>("[data-sid]")?.dataset.sid ?? null : null;
    const fl = [...area.querySelectorAll<HTMLElement>("[data-f]")];
    const row: PageRow = {
      page: i + 1, fill: (bottom - r.top) / r.height, freeMm: (r.bottom - bottom) / MM, designed, chain, firstSid: sids[0] || null, sids, keepSid,
      fills: fl.map((e) => e.dataset.f!),
      fh: Object.fromEntries(fl.map((e) => [e.dataset.f!, e.getBoundingClientRect().height / MM])),
      ftop: Object.fromEntries(fl.map((e) => [e.dataset.f!, (e.getBoundingClientRect().top - r.top) / r.height])),
    };
    out.pages.push(row);
    if (chain && !designed) (out.chains[chain] ||= []).push(row);
  });
  return out;
}

const removePagedStyles = () => document.querySelectorAll("style[data-pagedjs-inserted-styles]").forEach((e) => e.remove());

/** Печатный буклет A5: раскладка paged.js в браузере, подгонка страниц, печать или PDF через window.print. */
export default function RazborBooklet({ doc, questions, initialStyle, qr, backHref }: { doc: RazborDoc; questions: BookletQuestions; initialStyle: BookletStyle; qr: string; backHref: string }) {
  const bookRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<BookletStyle>(initialStyle);
  const [view, setView] = useState<View>("spreads");
  const [status, setStatus] = useState("собираю страницы…");
  const [ready, setReady] = useState(false);

  /** На экране страницы масштабируются под ширину окна; на печати масштаб снимает CSS. */
  const fit = useCallback(() => {
    const pages = bookRef.current?.querySelector<HTMLElement>(".pagedjs_pages");
    if (!pages) return;
    const pw = (148 * 96) / 25.4;
    // на узком экране развороты не помещаются — страницы идут столбцом (см. SCREEN_CSS)
    const single = view === "single" || document.documentElement.clientWidth < 700;
    const need = single ? pw + 8 : pw * 2 + 8, avail = document.documentElement.clientWidth - 32;
    pages.style.zoom = String(Math.min(1, avail / need));
  }, [view]);

  useEffect(() => {
    fit();
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, [fit, ready]);

  useEffect(() => {
    const book = bookRef.current;
    if (!book) return;
    let cancelled = false;
    (async () => {
      const { Previewer } = await import("pagedjs");
      await Promise.all(BOOKLET_FONT_FAMILIES.map((f) => document.fonts.load(`16px "${f}"`, "Ааz1").catch(() => [])));
      const css = bookCss(style, doc.who);
      const layout = async (plan: BookletPlan) => {
        removePagedStyles();
        book.innerHTML = "";
        const tpl = document.createElement("div");
        tpl.innerHTML = bookHtml(doc, questions, style, plan, qr);
        const flow = await new Previewer().preview(tpl, [{ [`buklet-${style}.css`]: css }], book);
        const pages = book.querySelector<HTMLElement>(".pagedjs_pages");
        if (pages) pages.style.zoom = "1";
        return flow;
      };

      const plan = emptyPlan();
      const tried: Record<string, boolean> = {}, ups: Record<string, number> = {}, settled: Record<string, boolean> = {};
      let flow = { total: 0 };
      let m: Measure = { pages: [], chains: {} };
      for (let pass = 1; pass <= 14; pass++) {
        if (cancelled) return;
        setStatus(`подгоняю страницы… проход ${pass}`);
        flow = await layout(plan);
        if (cancelled) return;
        m = measure(book);
        let changed = false;
        for (const c of Object.keys(m.chains)) {
          const rows = m.chains[c], last = rows[rows.length - 1], isM = c.startsWith("M");
          // дыра в середине цепочки: следующая страница начинается с заголовка раздела — вставка перед этим разделом
          for (let k = 0; k < rows.length - 1; k++) {
            const nx = m.pages[rows[k].page], sid = nx && (nx.keepSid || nx.sids.find((x) => !rows[k].sids.includes(x)));
            if (rows[k].fill >= 0.75 || !sid) continue;
            if (!tried["pre:" + sid]) {
              tried["pre:" + sid] = true;
              const kk = pickFill(rows[k].freeMm - 8);
              if (kk) { plan.pre[sid] = kk; changed = true; }
            } else if (plan.pre[sid] && !rows[k].fills.includes("pre:" + sid)) { plan.pre[sid] = smaller(plan.pre[sid]); settled["pre:" + sid] = true; changed = true; }
            else if (plan.pre[sid] && rows[k].fill < 0.7 && !settled["pre:" + sid] && (ups["pre:" + sid] || 0) < 2 && plan.pre[sid] !== "q3x") {
              ups["pre:" + sid] = (ups["pre:" + sid] || 0) + 1; plan.pre[sid] = FILL_ORDER[Math.max(0, FILL_ORDER.indexOf(plan.pre[sid] as (typeof FILL_ORDER)[number]) - 1)]; changed = true;
            }
          }
          const prev = rows[rows.length - 2];
          if (plan.fill[c] && !settled[c + ":tail"] && prev && prev.fill < 0.7 && last.fills.includes("end:" + c) && !prev.fills.includes("end:" + c) && (last.ftop["end:" + c] ?? 1) < 0.12) {
            plan.fill[c] = smaller(plan.fill[c]); settled[c] = true; changed = true;
          } else if (rows.length > 1 && last.fill < (isM ? 0.6 : 0.3)) {
            if (plan.fill[c] && !settled[c + ":tail"]) { plan.fill[c] = smaller(plan.fill[c]); settled[c] = true; changed = true; }
            else if ((plan.fit[c] || 0) < (isM ? 4 : 3)) { plan.fit[c] = (plan.fit[c] || 0) + 1; changed = true; }
            else if (!isM && !settled[c + ":tail"]) {
              // кегль уже минимальный, а хвост остался — заполняем страницу хвоста вставкой
              settled[c + ":tail"] = true; settled[c] = true;
              const per = Math.floor((last.freeMm - 14 - 3 * 9) / 3 / 7);
              plan.fill[c] = per >= 2 ? `qfit:${Math.min(per, 7)}` : pickFill(last.freeMm - 6); changed = true;
            }
          } else if (!isM && tried[c] && !settled[c] && plan.fill[c] && plan.fill[c] !== "q3x" && last.fill < 0.7 && (ups[c] || 0) < 2) {
            ups[c] = (ups[c] || 0) + 1; plan.fill[c] = FILL_ORDER[Math.max(0, FILL_ORDER.indexOf(plan.fill[c] as (typeof FILL_ORDER)[number]) - 1)]; changed = true;
          } else if (!isM && !tried[c] && last.fill < 0.85) {
            tried[c] = true;
            const k = pickFill(last.freeMm - 6);
            if (k) { plan.fill[c] = k; changed = true; }
          }
        }
        if (!changed) break;
      }
      // Финальная доводка: конец цепочки всё ещё недозаполнен — вставка подбирается точно по свободному месту
      const before = JSON.stringify(plan.fill);
      for (const c of Object.keys(m.chains)) {
        if (c.startsWith("M")) continue;
        const rows = m.chains[c], last = rows[rows.length - 1];
        if (last.fill >= 0.7) continue;
        const per = Math.floor((last.freeMm + (last.fh["end:" + c] || 0) - 8 - 14 - 3 * 9) / 3 / 7);
        if (per >= 2) plan.fill[c] = `qfit:${Math.min(per, 9)}`;
      }
      if (JSON.stringify(plan.fill) !== before && !cancelled) {
        const saved = JSON.parse(before);
        flow = await layout(plan);
        const m2 = measure(book);
        if (Object.keys(m2.chains).some((c) => !c.startsWith("M") && m2.chains[c].length > (m.chains[c]?.length || 0))) {
          plan.fill = saved; flow = await layout(plan); m = measure(book);
        } else m = m2;
      }
      // брошюра печатается листами A4 по 4 страницы A5: дневник добирает страницы до кратного 4
      const rest = flow.total % 4;
      if (rest && !cancelled) { plan.pad = 4 - rest; flow = await layout(plan); m = measure(book); }
      if (cancelled) return;
      const weak = m.pages.filter((p) => !p.designed && p.fill < 0.7);
      (window as unknown as { __bukletPlan?: unknown }).__bukletPlan = { plan, weak: weak.map((p) => p.page) };
      setStatus(`${STYLES[style].name}: ${flow.total} страниц A5 · ${flow.total / 4} листов A4`);
      setReady(true);
    })().catch((e) => {
      if (!cancelled) setStatus("не удалось собрать буклет — обнови страницу");
      console.error(e);
    });
    return () => {
      cancelled = true;
    };
  }, [doc, questions, style, qr]);

  // стили paged.js (@page A5 и раскладка) не должны остаться на сайте после ухода со страницы
  useEffect(() => () => removePagedStyles(), []);

  const pick = (st: BookletStyle) => {
    if (st === style) return;
    setReady(false);
    setStyle(st);
    try {
      const u = new URL(location.href);
      u.searchParams.set("style", st);
      history.replaceState(history.state, "", u);
    } catch {}
  };

  return (
    <div className={`buklet buklet-${view}`}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* шрифты нужны только буклету, на остальном сайте не грузятся */}
      <link rel="stylesheet" href={BOOKLET_FONTS_URL} precedence="default" />
      <style>{SCREEN_CSS}</style>

      <div className="buklet-bar no-print">
        <div className="buklet-bar-in">
          <div className="buklet-title">
            <p className="font-semibold">Буклет для печати{doc.who ? ` · ${doc.who}` : ""}</p>
            <p className="text-sm text-muted">A5 · {doc.date}</p>
          </div>
          <button type="button" className="btn" disabled={!ready} onClick={() => window.print()}>
            {ready ? "Распечатать или сохранить в PDF" : "Собираю страницы…"}
          </button>
          <div className="buklet-seg" role="group" aria-label="Стиль буклета">
            {(Object.keys(STYLES) as BookletStyle[]).map((st) => (
              <button key={st} type="button" aria-pressed={st === style} disabled={!ready && st !== style} onClick={() => pick(st)}>
                {STYLES[st].name}
              </button>
            ))}
          </div>
          <div className="buklet-seg" role="group" aria-label="Вид">
            <button type="button" aria-pressed={view === "spreads"} onClick={() => setView("spreads")}>Развороты</button>
            <button type="button" aria-pressed={view === "single"} onClick={() => setView("single")}>По страницам</button>
          </div>
          <p className="buklet-status mono" aria-live="polite">{status}</p>
        </div>
        <p className="buklet-note">
          <b>Печать брошюрой:</b> сохрани PDF, открой в Adobe Reader → Печать → Брошюра, двусторонняя печать на A4. Листы сложи пополам — получится книжка A5. <Link href={backHref} className="underline">Вернуться к разбору</Link>
        </p>
      </div>

      <div className="buklet-stage">
        <div ref={bookRef} className="buklet-book" />
      </div>
    </div>
  );
}

/** Окно просмотра: без шапки и подвала сайта, страницы — всегда белая бумага; на печати остаются только страницы paged.js. */
const SCREEN_CSS = `
body > header, body > footer, body > nav { display: none !important; }
body { padding-bottom: 0 !important; }
.buklet-bar { position: sticky; top: 0; z-index: 20; background: var(--surface); border-bottom: 1px solid var(--line); padding: 10px max(16px, env(safe-area-inset-left)) 10px max(16px, env(safe-area-inset-right)); }
.buklet-bar-in { max-width: 72rem; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; }
.buklet-bar .btn:disabled { opacity: .6; cursor: progress; }
.buklet-seg { display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 3px; border: 1px solid var(--line); border-radius: 999px; }
.buklet-seg button { font-size: 13px; line-height: 1; padding: 8px 13px; border-radius: 999px; color: var(--ink); cursor: pointer; }
.buklet-seg button[aria-pressed="true"] { background: var(--accent); color: var(--accent-ink); }
.buklet-seg button:disabled { opacity: .5; cursor: progress; }
.buklet-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.buklet-status { margin-left: auto; }
.buklet-note { max-width: 72rem; margin: 8px auto 0; font-size: 13.5px; color: var(--muted); }
.buklet-note b { color: var(--ink); font-weight: 600; }
.buklet-stage { padding: 18px 0 60px; overflow-x: hidden; }
.buklet-book { margin: 0 auto; }
@media screen {
  .buklet-book .pagedjs_pages { display: flex; flex-wrap: wrap; justify-content: center; gap: 26px 0; }
  .buklet-book .pagedjs_page { background: #fff; box-shadow: 0 1px 2px rgba(20,10,40,.12), 0 8px 24px rgba(20,10,40,.10); }
  .buklet-spreads .buklet-book .pagedjs_first_page { margin-left: 148mm; }
  .buklet-single .buklet-book .pagedjs_pages { flex-direction: column; align-items: center; }
}
@media screen and (max-width: 699px) {
  .buklet-book .pagedjs_pages { flex-direction: column; align-items: center; }
  .buklet-spreads .buklet-book .pagedjs_first_page { margin-left: 0; }
}
@media print {
  body { display: block !important; background: #fff !important; }
  main { display: block !important; }
  .buklet-stage { padding: 0; overflow: visible; }
  .buklet-book .pagedjs_pages { zoom: 1 !important; }
  .buklet-book .pagedjs_page { box-shadow: none !important; margin: 0 !important; }
}
`;
