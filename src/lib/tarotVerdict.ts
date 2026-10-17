/** Ответ гадания «да или нет» по карте и положению. Общий для страницы (YesNo) и картинки для сторис (/api/taro-card). */

const NEGATIVE = new Set(["bashnya", "smert", "dyavol", "luna", "povesheniy", "povechenny", "troyka-mechey", "desyatka-mechey", "pyaterka-pentakley", "pyaterka-kubkov", "vosmerka-kubkov", "devyatka-mechey", "pyaterka-mechey", "semerka-mechey", "vosmerka-mechey"]);
const NEUTRAL = new Set(["dvoyka-mechey", "semerka-pentakley", "chetvyorka-kubkov", "otshelnik", "umerennost", "koleso-fortuny", "sud", "spravedlivost"]);

export type VerdictTone = "yes" | "no" | "maybe";
export type Verdict = { answer: string; tone: VerdictTone; why: string };

export function tarotVerdict(slug: string, reversed: boolean): Verdict {
  const neg = NEGATIVE.has(slug), neu = NEUTRAL.has(slug);
  if (neu) return { answer: "Скорее нет, пока рано", tone: "maybe", why: "Карта говорит о паузе и неопределённости: ответ зависит от ваших следующих шагов." };
  if (!reversed && !neg) return { answer: "Да", tone: "yes", why: "Прямое положение благоприятной карты: обстоятельства на вашей стороне." };
  if (reversed && neg) return { answer: "Скорее да", tone: "yes", why: "Перевёрнутая сложная карта смягчает её значение: препятствие ослабевает." };
  if (!reversed && neg) return { answer: "Нет", tone: "no", why: "Карта предупреждает: сейчас затея потребует больше, чем даст." };
  return { answer: "Скорее нет", tone: "no", why: "Перевёрнутая карта: нужное пока заблокировано или требует другого подхода." };
}

/** Позиции расклада на три карты. */
export const THREE_POSITIONS = ["Прошлое", "Настоящее", "Будущее"];

/** Вопрос для карточки: одна строка без управляющих символов, не длиннее max (с многоточием). */
export function cleanQuestion(q: unknown, max = 110): string {
  if (typeof q !== "string") return "";
  const s = q.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, " ").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:!?—-]+$/, "")}…`;
}
