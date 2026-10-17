/** Описание для meta description: 140–160 знаков, без обрыва посреди слова.
 *  Порядок: конец предложения в [min, max] → граница фразы (запятая, точка с запятой, тире) → граница слова; в двух последних случаях — «…». */
export function metaDescription(text: string, min = 140, max = 160): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const lastIn = (re: RegExp, lo: number, hi: number): number => {
    let pos = -1;
    for (const m of t.matchAll(re)) {
      const i = m.index ?? 0;
      if (i > hi) break;
      if (i >= lo) pos = i;
    }
    return pos;
  };
  const sentence = lastIn(/[.!?…](?=\s)/g, min - 1, max - 1);
  if (sentence >= 0) return t.slice(0, sentence + 1);
  // «…» занимает один знак, поэтому текст до него — не длиннее max - 1.
  const clause = lastIn(/[,;](?=\s)|\s[—–](?=\s)/g, min - 1, max - 1);
  const space = t.lastIndexOf(" ", max - 1);
  const cut = clause >= 0 ? clause : space > 0 ? space : max - 1;
  return `${t.slice(0, cut).replace(/[\s,;:—–-]+$/, "")}…`;
}
