"use client";

import { useRef, useState } from "react";
import { cleanQuestion, type VerdictTone } from "@/lib/tarotVerdict";

export type ShareCardItem = { slug: string; name: string; reversed: boolean };
type Props = {
  kind: "yn" | "three";
  cards: ShareCardItem[];
  question: string;
  /** Ответ «да/нет» (для превью; на картинке сервер считает его сам по карте). */
  answer?: { text: string; tone: VerdictTone };
  /** Совет расклада (для превью «трёх карт»). */
  advice?: string;
};

type State = "idle" | "loading" | "ready" | "done" | "error";

const MSK = 3 * 3600 * 1000;
const mskKey = () => new Date(Date.now() + MSK).toISOString().slice(0, 10);
const dateRu = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" }) + ` ${y}`;
};
// Превью всегда ночное, поэтому цвета ответа — как на тёмной теме (те же, что на картинке).
const TONE_NIGHT: Record<VerdictTone, string> = { yes: "text-[#8fcf9c]", no: "text-[#f19a8f]", maybe: "text-[#d9c49a]" };

function isAbort(e: unknown) {
  return e instanceof DOMException && e.name === "AbortError";
}

/** Карточка результата гадания и кнопка «Поделиться картинкой»: PNG 9:16 для сторис из /api/taro-card. */
export default function TarotShareCard({ kind, cards, question, answer, advice }: Props) {
  const [date] = useState(mskKey);
  const file = useRef<{ key: string; file: File } | null>(null);
  const q = cleanQuestion(question, 110);
  const key = JSON.stringify([kind, cards.map((c) => [c.slug, c.reversed]), q, date]);

  // Состояние привязано к раскладу и вопросу: новый расклад сбрасывает его без эффекта.
  const [st, setSt] = useState<{ key: string; state: State }>({ key: "", state: "idle" });
  const state: State = st.key === key ? st.state : "idle";
  const setState = (s: State) => setSt({ key, state: s });

  async function load(): Promise<File> {
    if (file.current?.key === key) return file.current.file;
    const r = await fetch("/api/taro-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, cards: cards.map((c) => ({ slug: c.slug, r: c.reversed })), date, q: q || undefined }),
    });
    if (!r.ok) throw new Error(String(r.status));
    const blob = await r.blob();
    const f = new File([blob], `karta-dnya-taro-${date}.png`, { type: "image/png" });
    file.current = { key, file: f };
    return f;
  }

  function download(f: File) {
    const url = URL.createObjectURL(f);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function share(f: File): Promise<"shared" | "gesture" | "unsupported"> {
    const data: ShareData = { files: [f], title: "Карта дня — расклад Таро" };
    if (typeof navigator.share !== "function" || !navigator.canShare?.(data)) return "unsupported";
    try {
      await navigator.share(data);
      return "shared";
    } catch (e) {
      if (isAbort(e)) return "shared"; // пользователь закрыл меню
      // Картинка готовилась дольше, чем живёт разрешение на «Поделиться» после нажатия: просим нажать ещё раз.
      if (e instanceof DOMException && e.name === "NotAllowedError") return "gesture";
      return "unsupported";
    }
  }

  async function onShare() {
    if (state === "loading") return;
    const cached = file.current?.key === key;
    if (!cached) setState("loading");
    try {
      const f = await load();
      const r = await share(f);
      if (r === "gesture") return setState("ready");
      if (r === "unsupported") download(f);
      setState("done");
    } catch {
      setState("error");
    }
  }

  async function onDownload() {
    try {
      download(await load());
      setState("done");
    } catch {
      setState("error");
    }
  }

  const label = state === "loading" ? "Готовим картинку…" : state === "ready" ? "Картинка готова — поделиться" : "Поделиться картинкой";
  const status =
    state === "done" ? "Готово. Картинка 9:16 подходит для сторис." : state === "error" ? "Не получилось подготовить картинку. Попробуйте ещё раз чуть позже." : state === "ready" ? "Нажмите кнопку ещё раз, чтобы открыть меню «Поделиться»." : "";

  return (
    <section aria-label="Карточка для сторис" className="frame-gold bg-surface rounded-[4px] mt-8 p-4 sm:p-5 grid gap-5 sm:grid-cols-[minmax(0,168px)_1fr] items-center">
      {/* Превью: та же композиция, что у картинки (ночной фон, двойная латунная рамка), в уменьшенном виде. */}
      <div aria-hidden className="night rounded-[4px] aspect-[9/16] w-40 sm:w-full mx-auto p-1.5">
        <div className="h-full border border-gold/70 rounded-[3px] px-2 py-3 flex flex-col items-center justify-between text-center">
          <div className="grid gap-0.5">
            <span className="mono !text-[0.5rem] !text-gold">{kind === "yn" ? "Таро · да или нет" : "Таро · три карты"}</span>
            <span className="mono !text-[0.46rem]">{dateRu(date)}</span>
            {q && <span className="text-[0.58rem] leading-snug line-clamp-2 mt-1">«{q}»</span>}
          </div>
          <div className={`flex justify-center w-full ${kind === "three" ? "gap-1" : ""}`}>
            {cards.map((c) => (
              // eslint-disable-next-line @next/next/no-img-element -- миниатюра 160 px
              <img key={c.slug} src={`/cards/${c.slug}-160.webp`} alt="" width={160} height={276} loading="lazy" className={`${kind === "three" ? "w-[31%]" : "w-[62%]"} h-auto rounded-[2px] border border-gold/70 ${c.reversed ? "rotate-180" : ""}`} />
            ))}
          </div>
          {kind === "yn" && answer ? (
            <span className={`display !leading-none ${answer.text.length > 10 ? "text-sm" : "text-3xl"} ${TONE_NIGHT[answer.tone]}`}>{answer.text}</span>
          ) : (
            <span className="grid gap-0.5">
              <span className="mono !text-[0.42rem] !text-gold">Совет расклада</span>
              {advice && <span className="display text-[0.6rem] !leading-snug line-clamp-3">{advice}</span>}
            </span>
          )}
          <span className="mono !text-[0.42rem]">karta-dnya.ru</span>
        </div>
      </div>
      <div className="grid gap-3 content-center text-center sm:text-left">
        <p className="mono">Карточка для сторис</p>
        <p className="text-sm text-muted max-w-md mx-auto sm:mx-0">
          Картинка с датой, {q ? "вашим вопросом, " : ""}{kind === "yn" ? "картой и ответом" : "тремя картами и советом расклада"} — для сторис или переписки. Вопрос остаётся только на картинке, мы его не сохраняем.
        </p>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          <button type="button" onClick={onShare} disabled={state === "loading"} aria-busy={state === "loading"} className="btn disabled:opacity-60">{label}</button>
          <button type="button" onClick={onDownload} disabled={state === "loading"} className="btn btn-ghost disabled:opacity-60">Скачать PNG</button>
        </div>
        <p role="status" aria-live="polite" className="text-sm text-muted min-h-5">{status}</p>
      </div>
    </section>
  );
}
