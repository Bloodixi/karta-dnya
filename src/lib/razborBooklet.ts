/** Печатный буклет разбора A5 (раскладка paged.js): HTML страниц, CSS страниц и мотивы трёх стилей.
 *  Чистые функции без DOM — их вызывает клиентский RazborBooklet, они же проверяются из tsx. */
import type { Block, RazborDoc, Section } from "./razbor";

export type BookletStyle = "obs" | "geo" | "bot";
/** Вопросы «для себя»: по числу судьбы (destiny/love/work) и по личному году (year). */
export type BookletQuestions = Partial<Record<"destiny" | "love" | "work" | "year", Record<string, string[]>>>;
/** Подгонка: fit[цепочка] — шаг уменьшения кегля, fill[цепочка] — вставка в конце цепочки, pre[раздел] — вставка перед разделом, pad — страницы дневника до кратного 4. */
export type BookletPlan = { fit: Record<string, number>; fill: Record<string, string | null>; pre: Record<string, string | null>; pad: number };

export const emptyPlan = (): BookletPlan => ({ fit: {}, fill: {}, pre: {}, pad: 0 });

export const STYLES: Record<BookletStyle, { name: string; ink: string; muted: string; accent: string; gold: string; soft: string; line: string; display: string; displayWeight: number; body: string; num: string; script: string; bodySize: string }> = {
  obs: { name: "Обсерватория", ink: "#2a2433", muted: "#6b6377", accent: "#5b3e96", gold: "#a9844a", soft: "#efe9f6", line: "#ddd5e6",
    display: '"Cormorant Garamond", Georgia, serif', displayWeight: 600, body: '"Lora", Georgia, serif', num: '"Playfair Display", Georgia, serif', script: '"Cormorant Garamond", Georgia, serif', bodySize: "9.6pt" },
  geo: { name: "Геометрия", ink: "#1f1b2e", muted: "#6f6a7c", accent: "#4b2e83", gold: "#b08d57", soft: "#f4f1f8", line: "#dcd7e4",
    display: '"Spectral", Georgia, serif', displayWeight: 400, body: '"Manrope", system-ui, sans-serif', num: '"Manrope", system-ui, sans-serif', script: '"Spectral", Georgia, serif', bodySize: "9pt" },
  bot: { name: "Ботаника", ink: "#3a2f45", muted: "#74687f", accent: "#6a4c9c", gold: "#a67c3d", soft: "#efe8f6", line: "#e2d8ea",
    display: '"Playfair Display", Georgia, serif', displayWeight: 400, body: '"PT Serif", Georgia, serif', num: '"Playfair Display", Georgia, serif', script: '"Marck Script", cursive', bodySize: "9.6pt" },
};
export const isBookletStyle = (s: unknown): s is BookletStyle => s === "obs" || s === "geo" || s === "bot";

/** Шрифты буклета (Google Fonts) — ссылка в клиентском компоненте и список семейств для ожидания загрузки. */
export const BOOKLET_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Lora:ital,wght@0,400;0,600;1,400&family=Playfair+Display:wght@400;600&family=Spectral:wght@300;400;500&family=Manrope:wght@400;500;600&family=PT+Serif:ital,wght@0,400;0,700;1,400&family=Marck+Script&display=swap";
export const BOOKLET_FONT_FAMILIES = ["Cormorant Garamond", "Lora", "Playfair Display", "Spectral", "Manrope", "PT Serif", "Marck Script"];

const MONTH_WORD: Record<number, string> = { 1: "старт", 2: "союзы", 3: "общение", 4: "порядок", 5: "перемены", 6: "дом и близкие", 7: "пауза и смысл", 8: "дела и решения", 9: "итоги" };
const DIVIDER: Record<BookletStyle, string> = { obs: "✦", geo: "◇", bot: "❦" };

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rich = (s: string) => esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

/** Детерминированный «случай» от даты — звёзды на обложке одинаковы у одного человека. */
function rng(seed: number) {
  let x = seed % 2147483647 || 7;
  return () => (x = (x * 16807) % 2147483647) / 2147483647;
}

/** Родительный падеж имени для «Разбор для Анны», «Портрет Олега» (простые правила; несклоняемое остаётся как есть). */
export const genitive = (name: string) =>
  /[гкхжшчщ]а$/i.test(name) ? name.replace(/а$/, "и")
  : /а$/.test(name) ? name.replace(/а$/, "ы")
  : /[ья]$/.test(name) ? name.replace(/[ья]$/, "и").replace(/ьи$/, "я")
  : /й$/.test(name) ? name.replace(/й$/, "я")
  : /[бвгдзклмнпрстфхцчшщ]$/i.test(name) ? name + "а"
  : name;

/* ---------- SVG-мотивы ---------- */
const GOLD = "var(--gold)";
export function medallion(n: string | number, st: BookletStyle, size = 120, sub = ""): string {
  const c = size / 2, r = c - 2;
  let art = "";
  if (st === "obs") {
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2, long = i % 6 === 0;
      const r1 = r - (long ? 7 : 3.5);
      art += `<line x1="${c + r * Math.cos(a)}" y1="${c + r * Math.sin(a)}" x2="${c + r1 * Math.cos(a)}" y2="${c + r1 * Math.sin(a)}" stroke="${GOLD}" stroke-width="${long ? 0.8 : 0.4}"/>`;
    }
    art += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${GOLD}" stroke-width="0.9"/><circle cx="${c}" cy="${c}" r="${r - 10}" fill="none" stroke="${GOLD}" stroke-width="0.4"/><circle cx="${c}" cy="${c}" r="${r * 0.62}" fill="none" stroke="${GOLD}" stroke-width="0.4" stroke-dasharray="1 2.2"/>`;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      art += `<circle cx="${c + (r - 5) * Math.cos(a)}" cy="${c + (r - 5) * Math.sin(a)}" r="1.4" fill="${GOLD}"/>`;
    }
  } else if (st === "geo") {
    const pts = [...Array(9)].map((_, i) => {
      const a = -Math.PI / 2 + (i / 9) * Math.PI * 2;
      return [c + (r - 1) * Math.cos(a), c + (r - 1) * Math.sin(a)];
    });
    art += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${GOLD}" stroke-width="0.6"/>`;
    art += `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${GOLD}" stroke-width="0.5"/>`;
    art += `<polygon points="${pts.map((_, i) => pts[(i * 4) % 9].join(",")).join(" ")}" fill="none" stroke="${GOLD}" stroke-width="0.35" opacity=".7"/>`;
    art += `<circle cx="${c}" cy="${c}" r="${r * 0.42}" fill="#fff" stroke="${GOLD}" stroke-width="0.6"/>`;
    pts.forEach((p) => (art += `<circle cx="${p[0]}" cy="${p[1]}" r="1.6" fill="${GOLD}"/>`));
  } else {
    art += `<circle cx="${c}" cy="${c}" r="${r * 0.66}" fill="none" stroke="${GOLD}" stroke-width="0.6"/>`;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 9; i++) {
        const t = 0.62 + i * 0.105, a = Math.PI / 2 + side * t * 1.42;
        const x = c + r * 0.8 * Math.cos(a), y = c + r * 0.8 * Math.sin(a);
        const rot = (a * 180) / Math.PI + (side > 0 ? 60 : 120);
        art += `<ellipse cx="${x}" cy="${y}" rx="${size * 0.055}" ry="${size * 0.02}" transform="rotate(${rot} ${x} ${y})" fill="none" stroke="${GOLD}" stroke-width="0.55"/>`;
      }
      art += `<path d="M ${c} ${c + r * 0.86} A ${r * 0.8} ${r * 0.8} 0 0 ${side > 0 ? 0 : 1} ${c + side * r * 0.62} ${c - r * 0.52}" fill="none" stroke="${GOLD}" stroke-width="0.5"/>`;
    }
  }
  const fs = size * (String(n).length > 1 ? 0.34 : 0.42);
  return `<svg class="med" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">${art}
    <text x="${c}" y="${c + fs * 0.35 - (sub ? size * 0.04 : 0)}" text-anchor="middle" style="font-family:var(--f-num);font-size:${fs}px;fill:var(--accent)">${esc(n)}</text>
    ${sub ? `<text x="${c}" y="${c + size * 0.24}" text-anchor="middle" style="font-family:var(--f-body);font-size:${size * 0.065}px;letter-spacing:.12em;fill:var(--muted)">${esc(sub)}</text>` : ""}</svg>`;
}

export function coverArt(st: BookletStyle, seed: number): string {
  const W = 148, H = 210;
  const rand = rng(seed);
  let a = "";
  if (st === "obs") {
    for (let i = 0; i < 90; i++) {
      const x = rand() * W, y = rand() * H * 0.9 + 6, s = rand();
      a += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.15 + s * s * 0.55).toFixed(2)}" fill="var(--gold)" opacity="${(0.35 + s * 0.6).toFixed(2)}"/>`;
    }
    for (const r of [36, 46, 66, 84]) a += `<circle cx="${W / 2}" cy="80" r="${r}" fill="none" stroke="var(--gold)" stroke-width="${r === 46 ? 0.25 : 0.15}" ${r > 50 ? 'stroke-dasharray="0.6 1.4"' : ""}/>`;
    a += `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" fill="none" stroke="var(--gold)" stroke-width="0.35"/><rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="none" stroke="var(--gold)" stroke-width="0.15"/>`;
  } else if (st === "geo") {
    const c = [W / 2, 80], R = 62;
    const pts = [...Array(9)].map((_, i) => {
      const t = -Math.PI / 2 + (i / 9) * Math.PI * 2;
      return [c[0] + R * Math.cos(t), c[1] + R * Math.sin(t)];
    });
    for (let i = 0; i < 9; i++) for (let j = i + 1; j < 9; j++) a += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[j][0]}" y2="${pts[j][1]}" stroke="var(--gold)" stroke-width="0.12" opacity=".75"/>`;
    a += `<circle cx="${c[0]}" cy="${c[1]}" r="${R}" fill="none" stroke="var(--gold)" stroke-width="0.3"/>`;
    for (let x = 14; x < W - 10; x += 8) a += `<line x1="${x}" y1="${H - 26}" x2="${x}" y2="${H - 24.5}" stroke="var(--gold)" stroke-width="0.2"/>`;
  } else {
    const sprig = (x: number, y: number, rot: number, s: number) => {
      let g = `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0 C 6 -14 8 -28 4 -44" fill="none" stroke="var(--gold)" stroke-width="0.35"/>`;
      for (let i = 1; i < 8; i++) {
        const t = i / 8, py = -44 * t, px = 6 * Math.sin(t * 2.4);
        g += `<ellipse cx="${px + 3.4}" cy="${py}" rx="3.6" ry="1.3" transform="rotate(-35 ${px + 3.4} ${py})" fill="none" stroke="var(--gold)" stroke-width="0.3"/><ellipse cx="${px - 3}" cy="${py - 1.5}" rx="3.2" ry="1.2" transform="rotate(35 ${px - 3} ${py - 1.5})" fill="none" stroke="var(--gold)" stroke-width="0.3"/>`;
      }
      return g + "</g>";
    };
    a += sprig(16, 60, 20, 1) + sprig(W - 16, 60, -20, 1) + sprig(22, H - 14, 60, 0.8) + sprig(W - 22, H - 14, -60, 0.8);
    a += `<rect x="9" y="9" width="${W - 18}" height="${H - 18}" rx="3" fill="none" stroke="var(--gold)" stroke-width="0.25"/>`;
  }
  return `<svg class="cover-art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${a}</svg>`;
}

/* ---------- Блоки текста ---------- */
type BlockOpts = { listClass?: string };
function blocks(list: Block[], opts: BlockOpts = {}): string {
  return list
    .map((b) => {
      if (b.kind === "p") return `<p>${rich(b.text)}</p>`;
      if (b.kind === "list") return `<ol class="${opts.listClass || "lst"}">${b.items.map((x) => `<li>${rich(x)}</li>`).join("")}</ol>`;
      // «Как посчитано» на бумаге не сворачивается: заголовок жирной строкой и все блоки расчёта
      if (b.kind === "details") return `<p class="dsum"><strong>${esc(b.summary)}</strong></p>${blocks(b.blocks, opts)}`;
      if (b.kind === "facts") return `<div class="facts">${b.items.map((f) => `<div><span class="fl">${esc(f.label)}</span><b class="fv">${esc(f.value)}</b></div>`).join("")}</div>`;
      return "";
    })
    .join("");
}

const QUARTER = (ms: { label: string }[]) => {
  const a = ms[0].label.split(" "), b = ms[ms.length - 1].label.split(" ");
  return a[1] === b[1] ? `${a[0]} — ${b[0]} ${a[1]}` : `${a[0]} ${a[1]} — ${b[0]} ${b[1]}`;
};
const YOU = /(^|[^а-яё])(ты|тебе|тебя|твой|твоя|твоё|твои)([^а-яё]|$)/i;

/** Собранный HTML буклета. qr — готовый SVG ссылки на онлайн-версию (сервер). */
export function bookHtml(D: RazborDoc, QUESTIONS: BookletQuestions | null, st: BookletStyle, plan: BookletPlan, qr = ""): string {
  const sec = (id: string): Section | undefined => D.sections.find((s) => s.id === id);
  const DIV = DIVIDER[st];
  const orn = `<div class="orn" aria-hidden="true"><i></i><span>${DIV}</span><i></i></div>`;
  const head = (s: { title: string; subtitle?: string }, eyebrow: string) =>
    `<header class="sh"><p class="eyebrow">${esc(eyebrow)}</p><h2>${esc(s.title)}</h2>${s.subtitle ? `<p class="subt">${esc(s.subtitle)}</p>` : ""}${orn}</header>`;
  /** Заголовок раздела держится вместе с первым блоком: paged.js не умеет break-after: avoid. */
  const keep = (s: { title: string; subtitle?: string }, eyebrow: string, list: Block[], cls = "", opts: BlockOpts = {}) =>
    `<div class="keep">${head(s, eyebrow)}<div class="txt ${cls}">${blocks(list.slice(0, 1), opts)}</div></div><div class="txt ${cls}">${blocks(list.slice(1), opts)}</div>`;

  /** Цитата для вставки: самое ёмкое предложение раздела 70–170 знаков, лучше с обращением на «ты». */
  const quoteOf = (ids: string[]) => {
    const text = ids
      .flatMap((id) => (sec(id)?.blocks ?? []).filter((b): b is Extract<Block, { kind: "p" }> => b.kind === "p").map((b) => b.text.replace(/\*\*[^*]+\*\*\s*/g, "")))
      .join(" ");
    const ss = (text.match(/[^.!?]+[.!?]/g) || []).map((s) => s.trim()).filter((s) => s.length >= 70 && s.length <= 170 && !/^(Чего не|Не )/.test(s));
    return ss.sort((a, b) => (YOU.test(b) ? 1 : 0) - (YOU.test(a) ? 1 : 0))[0] || "";
  };

  const ch = sec("chisla");
  const facts = (ch?.blocks.find((b) => b.kind === "facts") as Extract<Block, { kind: "facts" }> | undefined)?.items ?? [];
  const destiny = facts[0] ?? { label: "Число судьбы", value: "", hint: "" };
  const monthsBlock = sec("mesyacy")?.blocks.find((b) => b.kind === "months") as Extract<Block, { kind: "months" }> | undefined;
  const months = monthsBlock?.items ?? [];
  const grid = sec("kvadrat")?.blocks.find((b) => b.kind === "grid") as Extract<Block, { kind: "grid" }> | undefined;
  const dk = String(destiny.value), py = String(facts[2]?.value ?? ""), pyN = String(facts[3]?.value ?? "");
  const Q = QUESTIONS || {};
  const qd = Q.destiny?.[dk] || [], ql = Q.love?.[dk] || [], qw = Q.work?.[dk] || [], qy = Q.year?.[py] || [], qyN = Q.year?.[pyN] || [];
  const yr = (facts[2]?.label.match(/\d{4}/) || [String(new Date().getFullYear())])[0], yrN = String(+yr + 1);
  const who = D.who.trim(), whoG = who ? genitive(who) : "";
  /** «Портрет Анны» — с именем; без имени — запасной вариант. */
  const of = (base: string, alt = base) => (whoG ? `${base} ${whoG}` : alt);
  const lower = (t: string | undefined) => String(t || "").charAt(0).toLowerCase() + String(t || "").slice(1);
  const upper = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  const addr = (t: string, list: Block[]): Block[] => [{ kind: "p", text: who ? `**${who},** ${t}` : upper(t) }, ...list];
  const ch_ = (c: string) => `data-chain="${c}" data-fit="${plan.fit[c] || 0}"`;
  const dateSeed = Number(D.date.replace(/\D/g, "")) || 14031991;

  /** Вставка в конец цепочки или перед разделом по размеру: вопросы со строками, вопросы без строк, цитата, орнамент. */
  const filler = (kind: string | null | undefined, qs: string[], quoteIds: string[], tag: string) => {
    if (!kind) return "";
    let html = "";
    if (kind === "orn") html = `<div class="fill-orn" aria-hidden="true"><i></i><span>${DIV}</span><i></i></div>`;
    else if (kind === "quote") {
      const q = quoteOf(quoteIds);
      html = q ? `<blockquote class="fill-quote"><span aria-hidden="true">${DIV}</span><p>${esc(q)}</p><cite>${esc(of("из разбора для", "из разбора"))}</cite></blockquote>` : "";
    } else {
      // «qfit:N» — три вопроса по N строк: заполняет страницу-хвост целиком
      const fitN = kind.startsWith("qfit:") ? +kind.slice(5) : 0;
      const n = fitN || kind.startsWith("q3") ? 3 : 2, lines = "<i></i>".repeat(fitN || (kind.endsWith("x") ? 3 : 2));
      if (!qs.length) return "";
      html = `<aside class="fill-q"><p class="eyebrow">${esc(who ? `${who}, вопросы для себя` : "Вопросы для себя")}</p>${qs.slice(0, n).map((q) => `<div class="q"><p>${esc(q)}</p>${lines}</div>`).join("")}</aside>`;
    }
    return html.replace(/^<(\w+) class="/, `<$1 data-f="${tag}" class="`);
  };
  /** Вставка перед разделом: закрывает дыру над заголовком, который не поместился с первым абзацем. Вопросы — с конца банка, чтобы не повторять концевые. */
  const PRE_Q: Record<string, string[]> = { period: qd, svod: qd, chisla: qd, talant: qd, lyubov: qd, rabota: ql, god: qw, sovety: qyN };
  const PRE_QUOTE: Record<string, string[]> = { period: ["chisla"], chisla: ["svod"], talant: ["prizvanie"], lyubov: ["kvadrat"], rabota: ["lyubov"], god: ["rabota"], sovety: ["sledgod"] };
  const pre = (id: string) => (plan.pre[id] ? filler(plan.pre[id], [...(PRE_Q[id] || [])].reverse(), PRE_QUOTE[id] || [], "pre:" + id) : "");
  const end = (c: string, qs: string[], ids: string[]) => filler(plan.fill[c], qs, ids, "end:" + c);

  const sv = sec("svod"), per = sec("period"), pm = sec("pamyatka");
  /** С версии 4 раздел называется «Главное о тебе», раньше — «Сведение: …». */
  const svTitle = sv ? sv.title.split(":")[0] : "";
  const toc: [string, string][] = [
    ...(sv ? [["svod", svTitle] as [string, string]] : []),
    ["chisla", "Твои числа"],
    ...(per ? [["period", "Период жизни"] as [string, string]] : []),
    ["sut", "Число судьбы"], ["talant", "Талант дня рождения"], ["kvadrat", "Квадрат Пифагора"], ["lyubov", "Любовь и отношения"], ["rabota", "Работа и дело"],
    ["god", `Личный год ${yr}`], ["kalendar", "Календарь года"], ["mesyacy", "Двенадцать месяцев"], ["sledgod", "Следующий год"], ["sovety", "Пять советов"],
    ...(pm ? [["pamyatka", "Памятка на год"] as [string, string]] : []),
    ["dnevnik", "Дневник года"],
  ];
  let h = "";

  // Обложка, посвящение, содержание — оформленные страницы
  h += `<section class="cover">${coverArt(st, dateSeed)}
    <p class="c-kicker">Нумерологический разбор</p>
    <div class="c-med">${medallion(destiny.value, st, 250)}</div>
    <p class="c-cap">число судьбы</p>
    ${who ? `<p class="c-name">${esc(who)}</p>` : ""}
    <p class="c-date">${esc(D.date.split(".").join(" · "))}</p>
    <p class="c-title">${esc(destiny.hint)}</p>
    <p class="c-foot">${yr} — ${yrN} · Карта дня</p></section>`;
  h += `<section class="ded">
    <p class="d-for">${esc(of("Для", "Для тебя"))}</p>
    <div class="d-lines"><p>от кого <span></span></p><p>с пожеланием <span></span></p><p><span></span></p><p><span></span></p><p>вручено <span class="short"></span></p></div>
    <p class="d-epi">Числа ничего не решают за человека. Они подсказывают, где ему легче, а где стоит быть бережнее к себе.</p></section>`;
  h += `<section class="toc">${head({ title: "Содержание" }, of("Разбор для", "Нумерологический разбор"))}
    <ol>${toc.map(([id, t]) => `<li><a href="#b-${id}">${esc(t)}</a></li>`).join("")}</ol>
    <p class="howto">${sv ? `Начни с раздела «${esc(svTitle)}»: там суть разбора собрана в несколько строк. ` : ""}Календарь года удобно держать на виду, карточку — вырезать и носить с собой, а в «Дневнике года» отмечать, что сбылось.</p></section>`;

  // Цепочка A: главное о тебе + твои числа + период жизни
  if (sv) {
    const listFirst = sv.blocks[0]?.kind === "list";
    h += `<section class="chap pg" id="b-svod" ${ch_("A")}>${keep(sv, of("Портрет", "Портрет"), sv.blocks, listFirst ? "" : "lead", { listClass: listFirst ? "gist" : "lst" })}</section>`;
  }
  const calc = (ch?.blocks ?? []).filter((b) => b.kind !== "facts");
  h += `<section class="chap${sv ? "" : " pg"}" id="b-chisla" data-sid="chisla" ${ch_("A")}>${pre("chisla")}${head({ title: "Твои числа" }, of("Расчёт для", "Расчёт"))}
    <div class="nums">${facts.map((f) => `<figure>${medallion(f.value, st, 96)}<figcaption><b>${esc(f.label)}</b><span>${esc(f.hint || "")}</span></figcaption></figure>`).join("")}</div>
    <div class="txt small">${blocks(calc, { listClass: "calc" })}</div>${per ? "" : end("A", qd, ["svod"])}</section>`;
  if (per) {
    const pf = (per.blocks.find((b) => b.kind === "facts") as Extract<Block, { kind: "facts" }> | undefined)?.items ?? [];
    h += `<section class="chap" id="b-period" data-sid="period" ${ch_("A")}>${pre("period")}<div class="keep">${head(per, of("Путь", "Путь"))}
      <div class="periods">${pf.map((f) => { const now = /сейчас/.test(f.hint || ""); return `<div class="${now ? "now" : ""}"><b>${esc(f.value)}</b><span class="pl">${esc(f.label)}</span><span>${esc((f.hint || "").replace(" · сейчас", ""))}</span>${now ? "<em>сейчас</em>" : ""}</div>`; }).join("")}</div></div>
      <div class="txt">${blocks(per.blocks.filter((b) => b.kind !== "facts"))}</div>${end("A", qd, ["svod", "period"])}</section>`;
  }

  // Разворот числа судьбы + цепочка B: суть, сильные, тени, призвание, талант
  const sut = sec("sut");
  h += `<section class="opener" id="b-sut"><p class="eyebrow">${esc(of("Число судьбы", "Число судьбы"))}</p><div class="o-num">${esc(destiny.value)}</div><h2>${esc(destiny.hint)}</h2>${orn}<p class="o-words">${esc(D.date)}</p></section>`;
  h += `<section class="flow" ${ch_("B")}><div class="txt dropcap">${blocks(addr("число судьбы — главное число твоей даты. Оно описывает, как ты идёшь по жизни, на что опираешься и где тебе легче всего.", sut?.blocks ?? []))}</div>`;
  for (const id of ["sily", "teni", "prizvanie"]) {
    const s = sec(id);
    if (!s) continue;
    h += `<div class="keep"><h3 id="b-${id}">${esc(s.title)}</h3>${s.subtitle ? `<p class="subt3">${esc(s.subtitle)}</p>` : ""}<div class="txt">${blocks(s.blocks.slice(0, 1))}</div></div><div class="txt">${blocks(s.blocks.slice(1))}</div>`;
  }
  h += `</section>`;
  const tal = sec("talant");
  if (tal) h += `<section class="chap" id="b-talant" data-sid="talant" ${ch_("B")}>${pre("talant")}${keep(tal, of("День рождения", "День рождения"), addr("к основному характеру день рождения добавляет свой отдельный талант.", tal.blocks))}${end("B", qw, ["prizvanie", "talant"])}</section>`;

  // Цепочка C: квадрат, любовь, работа, личный год
  const kv = sec("kvadrat"), order = [1, 4, 7, 2, 5, 8, 3, 6, 9];
  if (kv && grid) {
    h += `<section class="chap pg" id="b-kvadrat" ${ch_("C")}>${head(kv, of("Психоматрица", "Психоматрица"))}
    <div class="sq">${order.map((d) => { const c = grid.cells.find((x) => x.digit === d); const cnt = c?.count ?? 0; return `<div class="${cnt ? "" : "empty"}"><b>${cnt ? String(d).repeat(cnt) : "—"}</b><span>${esc(c?.title)}</span></div>`; }).join("")}</div>
    <p class="sq-cap">Цифры даты и рабочих чисел: ${grid.work.join(" · ")}. Ячейки читаются по столбцам.</p>
    <div class="txt cells">${blocks(kv.blocks.filter((b) => b.kind === "p"))}</div></section>`;
  }
  for (const [id, eb] of [["lyubov", "Отношения"], ["rabota", "Дело"]]) {
    const s = sec(id);
    if (!s) continue;
    h += `<section class="chap" id="b-${id}" data-sid="${id}" ${ch_("C")}>${pre(id)}${keep(s, eb, addr(id === "lyubov" ? "в близких отношениях число судьбы раскрывается особенно ясно." : "в деле твоё число подсказывает, где ты сильнее всего и что даётся с усилием.", s.blocks))}</section>`;
  }
  const god = sec("god");
  if (god) h += `<section class="chap" id="b-god" data-sid="god" ${ch_("C")}>${pre("god")}${keep(god, `Год ${yr}`, addr(`${yr} год для тебя — ${lower(facts[2]?.hint)}.`, god.blocks))}${end("C", qy, ["god"])}</section>`;

  // Календарь — оформленная страница
  h += `<section class="cal" id="b-kalendar"><header class="sh"><p class="eyebrow">Повесь на видное место</p><h2>${esc(of("Календарь", "Календарь года"))}</h2><p class="subt">Тон каждого месяца по личному числу</p>${orn}</header>
    <div class="cal-grid">${months.map((m) => { const [mn, yy] = m.label.split(" "); return `<div><span class="cm">${esc(mn)}</span><span class="cy">${esc(yy)}</span><b>${m.number}</b><span class="cw">${esc(MONTH_WORD[m.number])}</span></div>`; }).join("")}</div>
    <p class="cal-legend">${Object.entries(MONTH_WORD).map(([k, v]) => `<span><b>${k}</b> ${v}</span>`).join("")}</p></section>`;

  // Месяцы: четыре квартала, по три месяца на странице (каждый квартал — своя цепочка, только подгонка). Абзац «Для тебя» — внутри текста месяца.
  for (let qn = 0; qn < 4; qn++) {
    const ms = months.slice(qn * 3, qn * 3 + 3), c = "M" + qn;
    if (!ms.length) continue;
    h += `<section class="quarter" ${qn === 0 ? 'id="b-mesyacy"' : ""} ${ch_(c)}>
      <header class="qh"><p class="eyebrow">${esc(of("Год", "Год"))} по месяцам · ${qn + 1} из 4</p><h2>${esc(QUARTER(ms))}</h2></header>
      ${ms.map((m) => `<article class="mo"><h4><b>${m.number}</b>${esc(m.label)} <em>${esc(MONTH_WORD[m.number])}</em></h4><div class="txt">${m.text.split(/\n{2,}/).map((p) => `<p>${rich(p)}</p>`).join("")}</div></article>`).join("")}</section>`;
  }

  // Цепочка D: следующий год, советы
  const sg = sec("sledgod"), so = sec("sovety");
  if (sg) h += `<section class="chap pg" id="b-sledgod" ${ch_("D")}>${keep(sg, `Год ${yrN}`, addr(`в ${yrN} году тема меняется: это ${lower(facts[3]?.hint)}.`, sg.blocks))}</section>`;
  if (so) h += `<section class="chap${sg ? "" : " pg"}" id="b-sovety" data-sid="sovety" ${ch_("D")}>${pre("sovety")}${keep(so, "На каждый день", addr("здесь собрано главное из разбора — пять привычек, к которым стоит возвращаться.", so.blocks), "", { listClass: "adv" })}${end("D", qyN, ["sledgod"])}</section>`;

  // Памятка — цепочка E (только подгонка и орнамент/цитата)
  if (pm) {
    h += `<section class="chap pg memo" id="b-pamyatka" ${ch_("E")}>${head({ title: of("Памятка для", "Памятка на год"), subtitle: pm.subtitle }, "Коротко о главном")}<div class="txt small">${blocks(pm.blocks, { listClass: "memo-l" })}</div>
    ${end("E", ql, ["sovety"])}</section>`;
  }
  // Карточки на отдельной странице: одна себе, вторая тому, кто подарил
  const card = `<div class="kcard">
      <div class="kcard-l">${medallion(destiny.value, st, 64)}</div>
      <div class="kcard-r"><p class="k-name">${esc([who, D.date].filter(Boolean).join(" · "))}</p><p class="k-row"><b>Судьба ${esc(destiny.value)}</b> ${esc(destiny.hint)}</p>${facts[2] ? `<p class="k-row"><b>${yr} — ${esc(py)}</b> ${esc(facts[2].hint)}</p>` : ""}${facts[3] ? `<p class="k-row"><b>${yrN} — ${esc(pyN)}</b> ${esc(facts[3].hint)}</p>` : ""}<p class="k-site">karta-dnya.ru</p></div>
    </div>`;
  h += `<section class="cardpage"><header class="sh"><p class="eyebrow">Вырежи по пунктиру</p><h2>Карточки на год</h2><p class="subt">Одну — в кошелёк или телефонный чехол. Вторую — тому, кто подарил этот разбор, или тому, кто рядом</p>${orn}</header><div class="cards">${card}${card}</div></section>`;

  // Дневник года: намерения и трекер всегда, дальше — «что сбылось» и заметки до кратного 4
  const jEyebrow = esc(of("Дневник", "Дневник года"));
  const lines = (n: number) => "<i></i>".repeat(n);
  h += `<section class="journal" id="b-dnevnik"><header class="sh"><p class="eyebrow">${jEyebrow}</p><h2>Мои намерения на ${yr}</h2>${orn}</header>
    ${["Что хочу начать", "Что пора завершить", "О ком и о чём хочу позаботиться"].map((t) => `<div class="jb"><p class="jt">${t}</p>${lines(4)}</div>`).join("")}</section>`;
  h += `<section class="journal"><header class="sh"><p class="eyebrow">${jEyebrow}</p><h2>Год по месяцам</h2><p class="subt">Раз в месяц — одна строка: что получилось</p></header>
    <table class="trk"><tbody>${months.map((m) => `<tr><td class="tm">${esc(m.label)}</td><td class="tn">${m.number}</td><td></td></tr>`).join("")}</tbody></table></section>`;
  const extra = [
    `<section class="journal"><header class="sh"><p class="eyebrow">${jEyebrow}</p><h2>Что сбылось</h2><p class="subt">Заполни в конце года и перечитай намерения</p>${orn}</header>
    ${["Чем горжусь", "Что оказалось важнее, чем казалось", "С чем иду в следующий год"].map((t) => `<div class="jb"><p class="jt">${t}</p>${lines(4)}</div>`).join("")}</section>`,
    `<section class="journal"><header class="sh"><p class="eyebrow">${jEyebrow}</p><h2>Письмо себе</h2><p class="subt">Напиши сейчас, перечитай через год</p>${orn}</header><div class="nl">${lines(17)}</div></section>`,
    `<section class="journal"><header class="sh"><p class="eyebrow">${jEyebrow}</p><h2>Важные даты</h2><p class="subt">Дни рождения, события, планы</p></header><table class="trk"><tbody>${months.map((m) => `<tr><td class="tm">${esc(m.label)}</td><td></td></tr>`).join("")}</tbody></table></section>`,
  ];
  for (let i = 0; i < plan.pad; i++) h += extra[i] || `<section class="journal"><p class="eyebrow">Заметки</p><div class="nl">${lines(19)}</div></section>`;

  // Задняя обложка
  h += `<section class="back"><div>${medallion(DIV, st, 70)}</div>
    <p class="b-made">${esc(whoG ? `Составлено для ${whoG} · ${yr}` : `Составлено в ${yr} году`)}</p>
    ${qr ? `<div class="qr">${qr}</div><p class="b-qr">Онлайн-версия разбора с прогнозом на 12 месяцев</p>` : ""}
    <p class="b-site">karta-dnya.ru</p>
    <p class="b-legal">Разбор носит ознакомительный характер и не заменяет консультацию специалиста. Решения остаются за тобой.</p></section>`;
  return h;
}

/* ---------- CSS страниц ----------
 * Переменные стиля объявлены на section, а не на :root: у сайта свои --ink/--accent и тёмная тема на :root[data-theme].
 * Заголовки h2/h3 сайт оформляет глобально (Prata, вес 400 !important, обводка) — здесь это перекрыто. */
export function bookCss(st: BookletStyle, who: string): string {
  const S = STYLES[st];
  const running = (who ? `${who} · нумерологический разбор` : "Нумерологический разбор").replace(/["\\]/g, "");
  return `
section { --ink:${S.ink}; --muted:${S.muted}; --accent:${S.accent}; --gold:${S.gold}; --soft:${S.soft}; --line:${S.line};
  --f-display:${S.display}; --f-body:${S.body}; --f-num:${S.num}; --f-script:${S.script}; --dw:${S.displayWeight}; --bs:${S.bodySize}; }
@page { size: 148mm 210mm; margin: 17mm 15mm 19mm;
  @bottom-center { content: counter(page); font-family: ${S.num}; font-size: 8pt; color: ${S.gold}; } }
@page :left { margin-left: 15mm; margin-right: 19mm; @top-left { content: "${running}"; vertical-align: bottom; padding-bottom: 5mm; font-family: ${S.body}; font-size: 6.6pt; letter-spacing: .16em; text-transform: uppercase; color: ${S.muted}; } }
@page :right { margin-left: 19mm; margin-right: 15mm; @top-right { content: string(part); vertical-align: bottom; padding-bottom: 5mm; font-family: ${S.body}; font-size: 6.6pt; letter-spacing: .16em; text-transform: uppercase; color: ${S.muted}; } }
@page cover { margin: 0; @bottom-center { content: none } @top-left { content: none } @top-right { content: none } }
@page plain { @bottom-center { content: none } @top-left { content: none } @top-right { content: none } }
section { color: var(--ink); font-family: var(--f-body); font-size: var(--bs); line-height: 1.5; hyphens: auto; -webkit-hyphens: auto; text-align: left; }
section h2, section h3 { string-set: part content(text); }
section h2, section h3, section h4 { font-family: var(--f-display); font-weight: var(--dw) !important; letter-spacing: normal; -webkit-text-stroke: 0 !important; text-rendering: auto; font-synthesis: weight style; }
section { font-variant-numeric: lining-nums; }
section p { margin: 0; }
section svg { display: inline-block; }
.cover, .ded, .toc, .opener, .flow, .pg, .cal, .notes, .back { break-before: page; }
.chap { margin-top: 11mm; } .pg { margin-top: 0; }
.cover { page: cover; position: relative; height: 210mm; width: 148mm; display: flex; flex-direction: column; align-items: center; text-align: center; }
.cover-art { position: absolute; inset: 0; width: 148mm; height: 210mm; }
.cover > p, .c-med { position: absolute; left: 0; right: 0; margin: 0; }
.c-kicker { top: 24mm; font-family: var(--f-body); font-size: 7.4pt; letter-spacing: .32em; text-transform: uppercase; color: var(--muted); }
.c-med { top: 47mm; display: flex; justify-content: center; }
.c-cap { top: 117mm; font-size: 7pt; letter-spacing: .3em; text-transform: uppercase; color: var(--gold); }
.c-med .med { width: 66mm; height: 66mm; }
.c-name { top: 129mm; font-family: var(--f-script); font-size: ${st === "bot" ? "34pt" : "30pt"}; line-height: 1.1; color: var(--ink); font-weight: ${st === "geo" ? 300 : 500}; }
.c-date { top: ${st === "bot" ? 146 : 144}mm; font-family: var(--f-num); font-size: 11pt; letter-spacing: .2em; color: var(--accent); }
.c-title { top: ${st === "bot" ? 153 : 151}mm; font-family: var(--f-display); font-style: ${st === "geo" ? "normal" : "italic"}; font-size: 11pt; color: var(--muted); }
.c-foot { bottom: 15mm; top: auto; font-size: 6.8pt; letter-spacing: .26em; text-transform: uppercase; color: var(--gold); }
.ded { page: plain; display: flex; flex-direction: column; justify-content: center; min-height: 170mm; text-align: center; }
.d-for { font-family: var(--f-script); font-size: ${st === "bot" ? "30pt" : "24pt"}; color: var(--accent); margin: 0 0 12mm !important; font-weight: ${st === "geo" ? 300 : 500}; }
.d-lines p { display: flex; gap: 3mm; align-items: baseline; margin: 0 0 7mm; font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
.d-lines span { flex: 1; border-bottom: 0.3mm solid var(--line); height: 4mm; }
.d-lines span.short { flex: 0 0 34mm; }
.d-epi { margin: 14mm 8mm 0 !important; font-family: var(--f-display); font-style: italic; font-size: 10.5pt; line-height: 1.45; color: var(--muted); }
.sh { text-align: center; margin: 2mm 0 6mm; break-after: avoid; }
.eyebrow { margin: 0 0 1.5mm !important; font-family: var(--f-body); font-size: 6.6pt; letter-spacing: .26em; text-transform: uppercase; color: var(--gold); }
.sh h2, .opener h2 { margin: 0; font-family: var(--f-display); font-size: 19pt; line-height: 1.15; color: var(--ink); text-wrap: balance; }
.subt { margin: 1.6mm 0 0 !important; font-size: 8pt; color: var(--muted); font-style: italic; }
.orn { display: flex; align-items: center; justify-content: center; gap: 2.5mm; margin-top: 3mm; color: var(--gold); font-size: 7pt; }
.orn i { display: block; width: 14mm; height: 0; border-top: 0.25mm solid var(--gold); }
.txt p { margin: 0 0 2.4mm; text-align: justify; orphans: 3; widows: 3; }
.txt strong { font-weight: 600; color: var(--accent); }
.txt.lead p:first-child { font-size: 10.6pt; line-height: 1.45; }
.txt.small { font-size: 8.4pt; }
.dsum { margin-top: 1mm !important; }
.dropcap > p:first-child::first-letter { float: left; font-family: var(--f-num); font-size: 31pt; line-height: .9; padding: 1mm 1.6mm 0 0; color: var(--accent); }
h3 { margin: 6mm 0 2mm; font-family: var(--f-display); font-size: 13pt; line-height: 1.2; color: var(--accent); break-after: avoid; }
.subt3 { margin: -1mm 0 2mm !important; font-size: 8pt; font-style: italic; color: var(--muted); }
.nums { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 6mm; margin: 0 0 5mm; }
.nums figure { margin: 0; display: flex; gap: 3mm; align-items: center; }
.nums .med { width: 22mm; height: 22mm; flex: none; }
.nums figcaption b { display: block; font-size: 7pt; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-weight: 600; }
.nums figcaption span { font-family: var(--f-display); font-size: 10pt; line-height: 1.2; }
.lst, .adv, .calc { list-style: decimal; }
.calc { padding-left: 4mm; margin: 0; } .calc li { margin: 0 0 1.8mm; } .calc li::marker { color: var(--gold); font-family: var(--f-num); }
.facts { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 4mm; margin: 1mm 0 3mm; padding-top: 2mm; border-top: .15mm solid var(--line); break-inside: avoid; }
.facts .fl { display: block; font-size: 6.6pt; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.facts .fv { font-family: var(--f-num); font-weight: 400; font-size: 12pt; color: var(--accent); }
.gist { list-style: none; padding: 0; margin: 0 0 4mm; border-top: .3mm solid var(--gold); }
.gist li { padding: 2.2mm 0; border-bottom: .15mm solid var(--line); font-size: 1.04em; line-height: 1.42; }
.opener { page: plain; text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 172mm; }
.o-num { font-family: var(--f-num); font-size: 150pt; line-height: 1; color: var(--accent); font-weight: 400; }
.o-words { margin: 5mm 0 0 !important; font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
.flow { break-before: page; }
.sq { display: grid; grid-template-columns: repeat(3, 1fr); width: 84mm; margin: 0 auto; border: 0.35mm solid var(--gold); }
.sq div { border: 0.15mm solid var(--line); height: 19mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 1mm; }
.sq b { font-family: var(--f-num); font-weight: 400; font-size: 14pt; color: var(--accent); letter-spacing: .04em; }
.sq .empty b { color: var(--line); }
.sq span { font-size: 6.4pt; color: var(--muted); line-height: 1.15; margin-top: .8mm; }
.sq-cap { text-align: center; font-size: 7pt; color: var(--muted); margin: 2mm 0 5mm !important; }
.cal { page: plain; }
.cal-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-top: 0.3mm solid var(--gold); border-left: 0.15mm solid var(--line); }
.cal-grid div { border-right: 0.15mm solid var(--line); border-bottom: 0.15mm solid var(--line); padding: 2.4mm 2.6mm 2.8mm; display: grid; grid-template-columns: 1fr auto; align-items: start; min-height: 30mm; }
.cal-grid .cm { font-family: var(--f-display); font-size: 10.5pt; text-transform: capitalize; grid-column: 1; }
.cal-grid .cy { font-size: 6.4pt; color: var(--muted); grid-column: 2; letter-spacing: .1em; }
.cal-grid b { grid-column: 1 / -1; font-family: var(--f-num); font-weight: 400; font-size: 26pt; line-height: 1.05; color: var(--accent); margin-top: 1mm; }
.cal-grid .cw { grid-column: 1 / -1; font-size: 7pt; letter-spacing: .08em; text-transform: uppercase; color: var(--gold); }
.cal-legend { display: flex; flex-wrap: wrap; gap: 1mm 4mm; justify-content: center; margin: 5mm 0 0 !important; font-size: 7pt; color: var(--muted); }
.cal-legend b { font-family: var(--f-num); color: var(--accent); font-weight: 400; }
.mo h4 { margin: 0 0 1.2mm; font-family: var(--f-display); font-size: 11pt; text-transform: capitalize; }
.mo h4 em { font-style: normal; font-family: var(--f-body); font-size: 6.6pt; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); margin-left: 2mm; }
.adv, .lst, .memo-l { padding-left: 5mm; margin: 0; } .adv li, .lst li { margin: 0 0 2.6mm; } .adv li::marker { color: var(--gold); font-family: var(--f-num); }
.memo-l { list-style: none; padding: 0; } .memo-l li { padding: 2mm 0; font-size: 8.6pt; line-height: 1.45; border-bottom: 0.15mm solid var(--line); }
.toc ol { list-style: none; padding: 0; margin: 2mm 6mm 0; }
.toc li { display: flex; padding: 1.05mm 0; border-bottom: 0.15mm dotted var(--line); }
.toc a { color: var(--ink); text-decoration: none; display: flex; width: 100%; font-family: var(--f-display); font-size: 10.5pt; }
.toc a::after { content: target-counter(attr(href), page); margin-left: auto; font-family: var(--f-num); color: var(--accent); }
.howto { margin: 5mm 6mm 0 !important; font-size: 8pt; font-style: italic; color: var(--muted); }
.cardpage { page: plain; break-before: page; }
.cards { display: grid; gap: 9mm; justify-items: center; margin-top: 8mm; }
.kcard { width: 85mm; height: 55mm; margin: 0 auto; border: 0.3mm dashed var(--muted); display: flex; align-items: center; gap: 4mm; padding: 0 5mm; box-sizing: border-box; }
.kcard .med { width: 27mm; height: 27mm; }
.kcard-r p { margin: 0 0 1.2mm; font-size: 8pt; line-height: 1.3; }
.k-name { font-family: var(--f-script); font-size: ${st === "bot" ? "16pt" : "13pt"} !important; color: var(--accent); }
.k-row b { font-family: var(--f-num); font-weight: 400; color: var(--accent); margin-right: 1mm; }
.k-site { font-size: 6pt !important; letter-spacing: .18em; text-transform: uppercase; color: var(--gold); margin-top: 1.6mm !important; }
.notes { page: plain; }
.nl i { display: block; height: 7.2mm; border-bottom: 0.15mm solid var(--line); }
.back { page: plain; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 172mm; }
.back .med { width: 18mm; height: 18mm; }
.b-made { font-family: var(--f-display); font-style: italic; font-size: 10pt; color: var(--muted); margin: 5mm 0 10mm !important; }
.qr { width: 24mm; height: 24mm; } .qr svg { display: block; width: 100%; height: 100%; } .qr svg path[stroke] { stroke: var(--ink); }
.b-qr { font-size: 7pt; color: var(--muted); margin: 2.5mm 0 0 !important; }
.b-site { font-size: 7.4pt; letter-spacing: .3em; text-transform: uppercase; color: var(--gold); margin: 8mm 0 0 !important; }
.b-legal { font-size: 6.2pt; color: var(--muted); margin: 3mm 8mm 0 !important; }
[data-fit="1"] { font-size: calc(var(--bs) - .3pt); line-height: 1.46; }
[data-fit="2"] { font-size: calc(var(--bs) - .6pt); line-height: 1.43; }
[data-fit="3"] { font-size: calc(var(--bs) - .9pt); line-height: 1.4; }
[data-fit="4"] { font-size: calc(var(--bs) - 1.1pt); line-height: 1.37; }
[data-fit="4"] .mo .txt p { margin-bottom: .8mm; }
.quarter { break-before: page; }
.qh { margin: 0 0 2mm; padding-bottom: 2mm; border-bottom: .3mm solid var(--gold); display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 1mm 4mm; }
.qh .eyebrow { order: 2; margin: 0 !important; }
.qh h2 { margin: 0; font-family: var(--f-display); font-size: 15pt; line-height: 1.15; }
.qh h2::first-letter { text-transform: uppercase; }
.quarter .mo { display: block; padding: 2.6mm 0 .6mm; border-bottom: .15mm solid var(--line); }
.quarter .mo:last-child { border-bottom: 0; }
.quarter .mo h4 { display: flex; align-items: baseline; gap: 2.4mm; margin: 0 0 1mm; }
.quarter .mo h4 b { font-family: var(--f-num); font-weight: 400; font-size: 17pt; line-height: 1; color: var(--accent); }
.quarter .mo .txt p { font-size: .94em; margin-bottom: 1.4mm; }
.fill-q { margin-top: 6mm; padding-top: 3mm; border-top: .3mm solid var(--gold); break-inside: avoid; }
.fill-q .eyebrow { margin-bottom: 1mm !important; }
.fill-q .q p { margin: 2.6mm 0 0; font-family: var(--f-display); font-style: ${st === "geo" ? "normal" : "italic"}; font-size: 10.4pt; line-height: 1.35; color: var(--accent); text-align: left; }
.fill-q i, .jb i { display: block; height: 7mm; border-bottom: .15mm solid var(--line); }
.fill-quote { margin: 9mm 7mm 3mm; text-align: center; break-inside: avoid; }
.fill-quote span { display: block; color: var(--gold); font-size: 9pt; margin-bottom: 2mm; }
.fill-quote cite { display: block; margin-top: 2.4mm; font-style: normal; font-family: var(--f-body); font-size: 6.6pt; letter-spacing: .18em; text-transform: uppercase; color: var(--gold); }
.fill-quote p { margin: 0; font-family: var(--f-display); font-style: ${st === "geo" ? "normal" : "italic"}; font-size: 12.5pt; line-height: 1.42; color: var(--accent); text-wrap: balance; }
.fill-orn { display: flex; align-items: center; justify-content: center; gap: 3mm; margin: 8mm 0 2mm; color: var(--gold); font-size: 9pt; }
.fill-orn i { display: block; width: 22mm; border-top: .25mm solid var(--gold); }
.journal { page: plain; break-before: page; }
.keep { break-inside: avoid; }
.periods { display: grid; grid-template-columns: repeat(4, 1fr); margin: 0 0 5mm; border-top: .3mm solid var(--gold); border-bottom: .15mm solid var(--line); }
.periods > div { padding: 2.4mm 1.6mm 2.2mm; text-align: center; display: flex; flex-direction: column; align-items: center; gap: .4mm; border-right: .15mm solid var(--line); }
.periods > div:last-child { border-right: 0; }
.periods b { font-family: var(--f-num); font-weight: 400; font-size: 20pt; line-height: 1.05; color: var(--muted); }
.periods .now b { color: var(--accent); font-size: 24pt; }
.periods .now { background: var(--soft); }
.periods span { font-size: 6.6pt; color: var(--muted); line-height: 1.25; }
.periods .pl { letter-spacing: .1em; text-transform: uppercase; }
.periods em { font-style: normal; font-size: 6.2pt; letter-spacing: .16em; text-transform: uppercase; color: var(--gold); }
.jb { margin: 0 0 5mm; }
.jt { margin: 0 0 .5mm !important; font-family: var(--f-display); font-weight: var(--dw); font-size: 11.5pt; color: var(--accent); }
.trk { width: 100%; border-collapse: collapse; }
.trk td { border-bottom: .15mm solid var(--line); height: 11.4mm; vertical-align: bottom; padding: 0 0 1.2mm; }
.trk .tm { width: 30mm; font-family: var(--f-display); font-size: 10pt; }
.trk .tm::first-letter { text-transform: uppercase; }
.trk .tn { width: 10mm; font-family: var(--f-num); font-size: 13pt; color: var(--accent); text-align: center; }
.txt.small { font-size: .9em; } .cells p { font-size: .93em; } .txt.lead p:first-child { font-size: 1.1em; }
`;
}
