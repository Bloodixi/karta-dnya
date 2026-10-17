/** Поиск по сайту без внешних сервисов: компактный индекс (собирается при сборке, /poisk-index.json) и ранжирование на клиенте.
 *  Модуль чистый — без fs, его импортирует клиентский компонент. */

/** Запись индекса: [заголовок, путь, номер раздела в `sections`, ключевые слова (уже нормализованы, через пробел)]. */
export type SearchRow = [title: string, url: string, section: number, keywords: string];
export type SearchIndex = { v: 1; sections: string[]; items: SearchRow[] };

export type SearchHit = { title: string; url: string; section: string; score: number };

/** Нижний регистр, ё → е, только буквы и цифры, одиночные пробелы. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const words = (s: string) => (s ? s.split(" ") : []);

/** Расстояние Левенштейна с ранним выходом, если оно заведомо больше `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Насколько слово запроса `q` совпадает со словом документа `w` (0 — никак).
 * Точное > начало слова > общая основа (русские окончания: «змея» и «змеи») > опечатка (1 правка до 7 букв, 2 — длиннее).
 */
function wordScore(q: string, w: string): number {
  if (q === w) return 10;
  if (w.startsWith(q)) return q.length >= 2 ? 7 : 3;
  if (q.length >= 4) {
    const stem = q.slice(0, Math.max(3, q.length - 2));
    if (w.startsWith(stem)) return 5;
  }
  if (q.length >= 4 && w.length >= 3) {
    const max = q.length >= 7 ? 2 : 1;
    // опечатка в целом слове или в начале длинного слова (запрос ещё не допечатан)
    if (editDistance(q, w, max) <= max) return 4;
    if (w.length > q.length && editDistance(q, w.slice(0, q.length), max) <= max) return 3;
  }
  return 0;
}

type Prepared = { row: SearchRow; title: string[]; titleFull: string; kw: string[] };

/** Нормализует заголовки один раз после загрузки индекса. */
export function prepare(index: SearchIndex): Prepared[] {
  return index.items.map((row) => {
    const titleFull = normalize(row[0]);
    return { row, title: words(titleFull), titleFull, kw: words(row[3]) };
  });
}

/** Каждое слово запроса должно найтись в заголовке или ключевых словах; заголовок весит больше. */
export function search(prepared: Prepared[], sections: string[], query: string, limit = 50): SearchHit[] {
  const q = normalize(query);
  const qs = words(q);
  if (!qs.length) return [];
  const hits: SearchHit[] = [];
  for (const p of prepared) {
    let total = 0;
    let ok = true;
    for (const t of qs) {
      let best = 0;
      for (const w of p.title) best = Math.max(best, wordScore(t, w) * 2);
      if (best < 20) for (const w of p.kw) best = Math.max(best, wordScore(t, w));
      if (!best) { ok = false; break; }
      total += best;
    }
    if (!ok) continue;
    if (p.titleFull === q) total += 40;
    else if (p.titleFull.startsWith(q)) total += 15;
    total -= p.title.length * 0.3; // при равных — короче и точнее
    hits.push({ title: p.row[0], url: p.row[1], section: sections[p.row[2]] ?? "", score: total });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
