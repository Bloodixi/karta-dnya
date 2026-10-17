import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { C, cardDataUrl, ogFonts } from "../../_og/og";
import { findTarot } from "@/lib/content";
import { formatDateRu, todayKey } from "@/lib/daily";
import { BodyTooLarge, readJson, tooLarge } from "@/lib/bodyLimit";
import { clientIp, sharedRateLimit } from "@/lib/rateLimit";
import { cleanQuestion, tarotVerdict, THREE_POSITIONS, type VerdictTone } from "@/lib/tarotVerdict";

/**
 * Картинка результата гадания для сторис (1080×1920, PNG): «да или нет» или «три карты».
 * POST с JSON { kind: "yn" | "three", cards: [{ slug, r }], date?: "ГГГГ-ММ-ДД", q?: "вопрос" }.
 * Вопрос передаётся в теле, а не в адресе, чтобы не попадать в журналы запросов; ответ не кэшируется и нигде не пишется.
 * Ответ «да/нет» и тексты карт считаются здесь же по слагам — произвольный текст, кроме вопроса, на картинку не попадает.
 */
export const dynamic = "force-dynamic";

const W = 1080, H = 1920;
const byIp = sharedRateLimit("taro-card-ip", 30, 10 * 60_000);
const TONE: Record<VerdictTone, string> = { yes: "#8fcf9c", no: "#f19a8f", maybe: "#d9c49a" };
const CARD_RATIO = 691 / 400;

type Picked = { slug: string; name: string; reversed: boolean; img: string; upright: string; reversedText: string; advice: string };

let logo: Promise<string | null> | null = null;
function logoDataUrl() {
  logo ??= readFile(join(process.cwd(), "public", "logo-192.png")).then((b) => `data:image/png;base64,${b.toString("base64")}`).catch(() => null);
  return logo;
}

/**
 * Только символы, которые есть во встроенных шрифтах картинки: кириллица, латиница, цифры, обычная пунктуация.
 * Для остального (эмодзи, иероглифы, редкие алфавиты) satori подгрузил бы шрифт из интернета, передав туда текст
 * вопроса, а @vercel/og копит такие шрифты в памяти без предела; сбой загрузки эмодзи давал 500.
 */
const OFF_FONT = /[^\u0020-\u007e\u00a0-\u00ff\u0400-\u045f\u2013\u2014\u2018\u2019\u201c\u201d\u201e\u2026\u2116\s]/gu;
function questionForImage(q: unknown, max: number): string {
  return typeof q === "string" ? cleanQuestion(cleanQuestion(q, 400).replace(OFF_FONT, " "), max) : "";
}

function bad(msg: string, status = 400) {
  return new Response(msg, { status, headers: { "Cache-Control": "no-store" } });
}

function firstSentence(text: string, max = 150): string {
  const m = text.match(/^[^.!?]+[.!?]/);
  const s = (m ? m[0] : text).trim();
  return s.length > max ? cleanQuestion(s, max) : s;
}

function CardImg({ c, w }: { c: Picked; w: number }) {
  const h = Math.round(w * CARD_RATIO);
  return (
    <div style={{ display: "flex", width: w + 8, height: h + 8, padding: 3, border: `1px solid ${C.gold}`, borderRadius: 12, background: C.bg2, boxShadow: "0 30px 70px rgba(0,0,0,0.55)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- satori */}
      <img src={c.img} width={w} height={h} alt="" style={{ borderRadius: 8, objectFit: "cover", ...(c.reversed ? { transform: "rotate(180deg)" } : {}) }} />
    </div>
  );
}

function Mono({ children, size = 26, color = C.muted }: { children: string; size?: number; color?: string }) {
  return <div style={{ display: "flex", fontFamily: "Mono", fontSize: size, letterSpacing: "4px", textTransform: "uppercase", color }}>{children}</div>;
}

export async function POST(req: Request) {
  if (!byIp.take(clientIp(req))) return bad("Too many requests", 429);
  let body: { kind?: unknown; cards?: unknown; date?: unknown; q?: unknown };
  try {
    body = await readJson(req);
  } catch (e) {
    if (e instanceof BodyTooLarge) return tooLarge();
    return bad("Bad JSON");
  }
  const kind = body.kind === "three" ? "three" : body.kind === "yn" ? "yn" : null;
  if (!kind || !Array.isArray(body.cards) || body.cards.length !== (kind === "three" ? 3 : 1)) return bad("Bad cards");
  const picked: Picked[] = [];
  for (const raw of body.cards as unknown[]) {
    const slug = typeof raw === "object" && raw && "slug" in raw ? String((raw as { slug: unknown }).slug) : "";
    const c = /^[a-z0-9-]{1,40}$/.test(slug) ? findTarot(slug) : null;
    if (!c || picked.some((p) => p.slug === slug)) return bad("Bad cards");
    let img: string;
    try {
      img = await cardDataUrl(c.slug);
    } catch {
      return bad("No image", 500);
    }
    picked.push({ slug: c.slug, name: c.name, reversed: !!(raw as { r?: unknown }).r, img, upright: c.upright, reversedText: c.reversed, advice: c.advice });
  }
  const dateKey = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) && Math.abs(Date.parse(body.date) - Date.parse(todayKey())) <= 2 * 86_400_000 ? body.date : todayKey();
  const question = questionForImage(body.q, kind === "three" ? 100 : 110);
  const [fonts, logoUrl] = await Promise.all([ogFonts(), logoDataUrl()]);

  const header = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <Mono size={26} color={C.gold}>{kind === "yn" ? "Таро · да или нет" : "Таро · три карты"}</Mono>
      <Mono size={24}>{`${formatDateRu(dateKey, { day: "numeric", month: "long" })} ${dateKey.slice(0, 4)}`}</Mono>
      {question ? (
        <div style={{ display: "flex", textAlign: "center", justifyContent: "center", marginTop: 26, fontSize: question.length > 70 ? 40 : 46, lineHeight: 1.3, color: C.cream, maxWidth: 860 }}>«{question}»</div>
      ) : (
        <div style={{ display: "flex", marginTop: 26, fontSize: 42, color: C.cream, fontFamily: "Prata" }}>{kind === "yn" ? "Мой вопрос картам" : "Прошлое, настоящее, будущее"}</div>
      )}
    </div>
  );

  let main;
  if (kind === "yn") {
    const c = picked[0];
    const v = tarotVerdict(c.slug, c.reversed);
    main = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <CardImg c={c} w={question ? 400 : 440} />
        <div style={{ display: "flex", marginTop: 30 }}><Mono size={26} color={C.cream}>{`${c.name}${c.reversed ? " · перевёрнутая" : ""}`}</Mono></div>
        <div style={{ display: "flex", marginTop: 18, fontFamily: "Prata", fontSize: v.answer.length > 10 ? 92 : 150, lineHeight: 1.05, color: TONE[v.tone], textAlign: "center" }}>{v.answer}</div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 34, lineHeight: 1.4, color: C.muted, textAlign: "center", maxWidth: 820, justifyContent: "center" }}>{v.why}</div>
      </div>
    );
  } else {
    const w = 272;
    main = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 34 }}>
          {picked.map((c, i) => (
            <div key={c.slug} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: w + 8 }}>
              <CardImg c={c} w={w} />
              <div style={{ display: "flex", marginTop: 24 }}><Mono size={22} color={C.gold}>{`${i + 1} · ${THREE_POSITIONS[i]}`}</Mono></div>
              <div style={{ display: "flex", marginTop: 10, fontSize: 30, lineHeight: 1.2, color: C.ink, textAlign: "center", justifyContent: "center" }}>{c.name}</div>
              {c.reversed && <div style={{ display: "flex", marginTop: 4, fontSize: 22, color: C.muted }}>перевёрнутая</div>}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 56, padding: "34px 44px", border: `1px solid ${C.gold}`, borderRadius: 6, maxWidth: 900 }}>
          <Mono size={22} color={C.gold}>Совет расклада</Mono>
          <div style={{ display: "flex", marginTop: 16, fontFamily: "Prata", fontSize: 40, lineHeight: 1.3, color: C.ink, textAlign: "center", justifyContent: "center" }}>{firstSentence(picked[2].advice)}</div>
        </div>
      </div>
    );
  }

  const res = new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", background: `linear-gradient(180deg, ${C.bg2} 0%, ${C.bg} 55%, #120d26 100%)`, color: C.ink, fontFamily: "Golos" }}>
        {/* Звёзды только по краям, чтобы не ложились на текст. */}
        {Array.from({ length: 90 }, (_, i) => ({ x: (i * 137.508 * 7.3) % W, y: (i * 97.31 * 5.1) % H, r: 1 + ((i * 11) % 5) * 0.5, o: 0.25 + ((i * 3) % 4) * 0.12 })).filter((s) => s.x < 150 || s.x > W - 150).map((s, i) => (
          <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, borderRadius: 99, background: C.cream, opacity: s.o, display: "flex" }} />
        ))}
        <div style={{ position: "absolute", left: 36, top: 36, width: W - 72, height: H - 72, border: `2px solid ${C.gold}`, borderRadius: 8, display: "flex" }} />
        <div style={{ position: "absolute", left: 48, top: 48, width: W - 96, height: H - 96, border: `1px solid ${C.gold}`, opacity: 0.45, borderRadius: 6, display: "flex" }} />
        <div style={{ position: "absolute", left: 90, top: 130, width: W - 180, height: H - 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
          {header}
          {main}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- satori
              <img src={logoUrl} width={48} height={48} alt="" style={{ borderRadius: 10 }} />
            ) : (
              <div style={{ display: "flex", width: 16, height: 16, background: C.gold, transform: "rotate(45deg)" }} />
            )}
            <div style={{ display: "flex", fontFamily: "Digits, Prata", fontSize: 38, color: C.cream }}>Карта дня</div>
            <div style={{ display: "flex", marginLeft: 10 }}><Mono size={24}>karta-dnya.ru</Mono></div>
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts },
  );
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}
