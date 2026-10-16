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
  printCss,
  type BookletGift,
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

/**
 * paged.js 0.4.3 (UMD, global Paged) из статики сайта: npm-сборка ломается в Turbopack («s.call is not a function»).
 * Файл public/vendor/paged-0.4.3.js — копия unpkg.com/pagedjs@0.4.3/dist/paged.js, sha384 VrggD9Mk…FHUrI.
 */
type BreakToken = { node?: Node; offset?: number } | undefined;
type HandlerCtor = new (...args: unknown[]) => object;
type PagedGlobal = {
  Previewer: new () => { preview: (content: Node, styles: Record<string, string>[], to: HTMLElement) => Promise<{ total: number }> };
  Handler: HandlerCtor;
  registerHandlers: (...handlers: HandlerCtor[]) => void;
};

const LETTER = /[A-Za-zА-Яа-яЁё]/;
const lastText = (root: Element): Text | null => {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  while (w.nextNode()) if ((w.currentNode.textContent || "").trim()) last = w.currentNode as Text;
  return last;
};
const cssString = (t: string) => `"${t.replace(/\s+/g, " ").trim().replace(/["\\]/g, "\\$&")}"`;

/**
 * Свои обработчики страниц paged.js (регистрируются один раз на окно, создаются заново на каждую раскладку):
 * 1) перенос на стыке страниц — paged.js сам ставит дефис только после латинских букв (\w), русское слово рвалось без знака;
 * 2) колонтитул правой страницы — раздел, который действует в начале страницы, а на странице, открывающейся заголовком, — пусто.
 *    Так над хвостом прошлой главы не встаёт заголовок следующей (paged.js «first» берёт первый заголовок на странице).
 */
function registerBookletHandlers(P: PagedGlobal) {
  // флаг на самом объекте Paged: если скрипт загрузится заново, обработчики нужно зарегистрировать и в нём
  const w = P as PagedGlobal & { __bukletHandlers?: boolean };
  if (w.__bukletHandlers) return;
  w.__bukletHandlers = true;
  class BookletPages extends (P.Handler as new (...args: unknown[]) => object) {
    part = "";
    afterPageLayout(page: HTMLElement, _p: unknown, token: BreakToken) {
      const area = page.querySelector<HTMLElement>(".pagedjs_page_content");
      if (!area) return;
      const src = token?.node, off = token?.offset ?? 0;
      if (src && src.nodeType === Node.TEXT_NODE && off > 0) {
        const t = src.textContent || "";
        const last = lastText(area), lt = last?.textContent || "";
        // слово разрезано: буква до и после точки разрыва, а страница кончается этим же куском слова
        if (last && LETTER.test(t[off - 1] || "") && LETTER.test(t[off] || "") && lt.endsWith(t.slice(Math.max(0, off - 3), off))) last.textContent = lt + "-";
      }
      const hs = area.querySelectorAll<HTMLElement>("section h2, section h3");
      let value = this.part;
      if (hs.length) {
        const r = area.getBoundingClientRect(), top = r.height ? (hs[0].getBoundingClientRect().top - r.top) / r.height : 0;
        if (top < 0.25) value = "";
        this.part = hs[hs.length - 1].textContent || "";
      }
      page.style.setProperty("--pagedjs-string-first-except-part", cssString(value));
    }
  }
  P.registerHandlers(BookletPages as unknown as HandlerCtor);
}
let pagedLoading: Promise<PagedGlobal> | null = null;
/** Один скрипт на окно: два параллельных запуска (StrictMode, смена стиля) ждут одну загрузку. */
function loadPaged(): Promise<PagedGlobal> {
  const w = window as unknown as { Paged?: PagedGlobal };
  if (w.Paged) return Promise.resolve(w.Paged);
  return (pagedLoading ||= new Promise<PagedGlobal>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "/vendor/paged-0.4.3.js";
    s.integrity = "sha384-VrggD9MksqQ3Idi2YIpgdXj83Sqfn/THOJuJFf2ENcgxdDxR0Tp6Ls87wlyFHUrI";
    s.crossOrigin = "anonymous";
    const fail = () => {
      s.remove(); // повторная попытка вставит скрипт заново
      pagedLoading = null;
      reject(new Error("paged.js не загрузился"));
    };
    s.onload = () => (w.Paged ? resolve(w.Paged) : fail());
    s.onerror = fail;
    document.head.appendChild(s);
  }));
}

/** Короткий хеш для ключа кэша (ссылка на разбор + стиль): сам токен в sessionStorage не кладём. */
const hash = (t: string) => {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
};
const PLAN_VER = 2;
const planKey = (backHref: string, st: BookletStyle) => `buklet-plan:${PLAN_VER}:${hash(backHref)}:${st}`;
function readPlan(key: string): BookletPlan | null {
  try {
    const p = JSON.parse(sessionStorage.getItem(key) || "null");
    return p && typeof p === "object" && p.fit && p.fill && p.pre && Number.isInteger(p.pad) ? (p as BookletPlan) : null;
  } catch {
    return null;
  }
}
function savePlan(key: string, plan: BookletPlan) {
  try {
    sessionStorage.setItem(key, JSON.stringify(plan));
  } catch {}
}
/** Номер страницы (с 1) с карточками на вырезание; 0 — не нашли. */
const cardPageNo = (book: HTMLElement) => [...book.querySelectorAll(".pagedjs_page")].findIndex((p) => p.querySelector("section.cardpage")) + 1;
/** Сборка дольше минуты — показываем то, что уже разложено, без дальнейшей подгонки. */
const DEADLINE_MS = 60_000;

const removePagedStyles = () => document.querySelectorAll("style[data-pagedjs-inserted-styles]").forEach((e) => e.remove());

/** Печатный буклет A5: раскладка paged.js в браузере, подгонка страниц, печать или PDF через window.print. */
export default function RazborBooklet({ doc, questions, initialStyle, qr, backHref, gift = null }: { doc: RazborDoc; questions: BookletQuestions; initialStyle: BookletStyle; qr: string; backHref: string; gift?: BookletGift | null }) {
  const bookRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<BookletStyle>(initialStyle);
  const [view, setView] = useState<View>("spreads");
  const [status, setStatus] = useState("собираю страницы…");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

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
    const t0 = Date.now();
    const late = () => Date.now() - t0 > DEADLINE_MS;
    (async () => {
      const P = await loadPaged();
      registerBookletHandlers(P);
      const { Previewer } = P;
      // шрифты ждём не дольше 10 с: без них раскладка всё равно соберётся системными
      await Promise.race([
        Promise.all(BOOKLET_FONT_FAMILIES.map((f) => document.fonts.load(`16px "${f}"`, "Ааz1").catch(() => []))),
        new Promise((r) => setTimeout(r, 10_000)),
      ]);
      if (cancelled) return;
      const css = bookCss(style, doc.who);
      const layout = async (plan: BookletPlan) => {
        removePagedStyles();
        book.innerHTML = "";
        const tpl = document.createElement("div");
        tpl.innerHTML = bookHtml(doc, questions, style, plan, qr, gift);
        const flow = await new Previewer().preview(tpl, [{ [`buklet-${style}.css`]: css }], book);
        const pages = book.querySelector<HTMLElement>(".pagedjs_pages");
        if (pages) pages.style.zoom = "1";
        return flow;
      };

      const key = planKey(backHref, style);
      const finish = (plan: BookletPlan, total: number, rough: boolean) => {
        if (!rough) savePlan(key, plan);
        // для проверки: недозаполненные текстовые страницы (оформленные — не в счёт)
        const weak = measure(book).pages.filter((p) => !p.designed && p.fill < 0.7).map((p) => p.page);
        (window as unknown as { __bukletPlan?: unknown }).__bukletPlan = { plan, rough, weak, ms: Date.now() - t0 };
        setStatus(`${STYLES[style].name}: ${total} страниц A5 · ${Math.ceil(total / 4)} листов A4${rough ? " · без полной подгонки" : ""}`);
        setReady(true);
      };
      // повторное открытие: готовый план из sessionStorage — один проход, если кратность 4 и карточки на месте
      const cached = readPlan(key);
      if (cached) {
        setStatus("собираю страницы…");
        const f = await layout(cached);
        if (cancelled) return;
        const cp = cardPageNo(book);
        if (f.total % 4 === 0 && cp % 2 === 1) return finish(cached, f.total, false);
      }

      const plan = emptyPlan();
      const tried: Record<string, boolean> = {}, ups: Record<string, number> = {}, settled: Record<string, boolean> = {};
      let flow = { total: 0 };
      let m: Measure = { pages: [], chains: {} };
      for (let pass = 1; pass <= 14; pass++) {
        if (cancelled) return;
        setStatus(`подгоняю страницы… проход ${pass}`);
        flow = await layout(plan);
        if (cancelled) return;
        if (late()) return finish(plan, flow.total, true);
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
      if (JSON.stringify(plan.fill) !== before && !cancelled && !late()) {
        const saved = JSON.parse(before);
        flow = await layout(plan);
        const m2 = measure(book);
        if (Object.keys(m2.chains).some((c) => !c.startsWith("M") && m2.chains[c].length > (m.chains[c]?.length || 0))) {
          plan.fill = saved; flow = await layout(plan);
        }
      }
      if (cancelled) return;
      // карточки на вырезание — на правой (нечётной) странице, их оборот с рубашками — следующая страница
      if (cardPageNo(book) % 2 === 0 && !late()) {
        plan.cardsLate = !plan.cardsLate;
        flow = await layout(plan);
        if (cancelled) return;
      }
      // брошюра печатается листами A4 по 4 страницы A5: дневник добирает страницы до кратного 4
      const rest = flow.total % 4;
      if (rest && !late()) { plan.pad = 4 - rest; flow = await layout(plan); }
      if (cancelled) return;
      finish(plan, flow.total, late());
    })().catch((e) => {
      console.error(e);
      if (cancelled) return;
      setFailed(true);
      setStatus("не удалось собрать буклет");
    });
    return () => {
      cancelled = true;
    };
  }, [doc, questions, style, qr, gift, backHref, attempt]);

  // стили paged.js (@page A5 и раскладка) не должны остаться на сайте после ухода со страницы
  useEffect(() => () => removePagedStyles(), []);

  const retry = () => {
    setFailed(false);
    setReady(false);
    setStatus("собираю страницы…");
    setAttempt((a) => a + 1);
  };

  const pick = (st: BookletStyle) => {
    if (st === style) return;
    setReady(false);
    setFailed(false);
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
      <style>{SCREEN_CSS + printCss(style)}</style>

      <div className="buklet-bar no-print">
        <div className="buklet-bar-in">
          <div className="buklet-title">
            <p className="font-semibold">Буклет для печати{doc.who ? ` · ${doc.who}` : ""}</p>
            <p className="text-sm text-muted">A5 · {doc.date}</p>
          </div>
          <button type="button" className="btn" disabled={!ready} onClick={() => window.print()}>
            {ready ? "Распечатать или сохранить в PDF" : failed ? "Буклет не собран" : "Собираю страницы…"}
          </button>
          <div className="buklet-seg" role="group" aria-label="Стиль буклета">
            {(Object.keys(STYLES) as BookletStyle[]).map((st) => (
              <button key={st} type="button" aria-pressed={st === style} disabled={!ready && !failed && st !== style} onClick={() => pick(st)}>
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
        {failed && (
          <div className="buklet-fail" role="alert">
            <p>Не получилось собрать страницы буклета. Обычно помогает повторить; разбор целиком всегда открыт онлайн.</p>
            <button type="button" className="btn" onClick={retry}>Повторить</button>
            <Link href={backHref} className="underline">Открыть онлайн-версию</Link>
          </div>
        )}
        <p className="buklet-note">
          <b>Печать брошюрой:</b> сохрани PDF → Adobe Reader (компьютер) → Печать → Брошюра, двусторонняя, переворот по короткому краю; согни стопку пополам и скрепи степлером по сгибу; первый лист можно печатать на плотной бумаге. <Link href={backHref} className="underline">Вернуться к разбору</Link>
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
.buklet-fail { max-width: 72rem; margin: 10px auto 0; display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; padding: 10px 14px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg); }
.buklet-fail p { flex: 1 1 18rem; margin: 0; }
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
  /* без разрыва после задней обложки — иначе в PDF лишняя пустая страница и число страниц не кратно 4 */
  .buklet-book .pagedjs_page:last-child { break-after: avoid !important; page-break-after: avoid !important; }
  .buklet-book .pagedjs_pages { display: block !important; }
}
`;
