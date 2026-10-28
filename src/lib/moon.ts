/** Лунный календарь без внешних данных: фаза, возраст Луны, лунный день и знак Луны по упрощённым формулам
 *  (точность фазы ~несколько часов, знака Луны ~1–2°). Для лунных дней используется возраст Луны по московскому полудню,
 *  без учёта восхода Луны в конкретном городе — так считают большинство массовых календарей. */

const SYNODIC = 29.530588853;
const JD_REF_NEW_MOON = 2451550.1; // 6 января 2000, 18:14 UTC — опорное новолуние

export function julianDay(y: number, m: number, d: number, hourUtc = 9): number {
  // 12:00 МСК = 09:00 UTC
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + hourUtc / 24;
}

export function moonAge(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  const jd = julianDay(y, m, d);
  const age = (jd - JD_REF_NEW_MOON) % SYNODIC;
  return age < 0 ? age + SYNODIC : age;
}

export type PhaseKey = "new" | "waxing-crescent" | "first-quarter" | "waxing-gibbous" | "full" | "waning-gibbous" | "last-quarter" | "waning-crescent";

export const PHASES: Record<PhaseKey, { name: string; emoji: string; text: string }> = {
  "new": { name: "Новолуние", emoji: "🌑", text: "Начало цикла: время намерений и планов, а не громких действий. Хорошо формулировать цели и отдыхать." },
  "waxing-crescent": { name: "Растущая Луна, молодой серп", emoji: "🌒", text: "Энергия прибывает. Подходит для старта дел, знакомств, новых привычек, покупок на долгий срок." },
  "first-quarter": { name: "Первая четверть", emoji: "🌓", text: "Первые препятствия на пути к цели. Время решений и корректировки курса, не отступать." },
  "waxing-gibbous": { name: "Растущая Луна, почти полная", emoji: "🌔", text: "Пик активности: доделывать, договариваться, презентовать. Эмоции усиливаются, следите за сном." },
  "full": { name: "Полнолуние", emoji: "🌕", text: "Кульминация. Многое проявляется и завершается, чувства на максимуме. Хороший день, чтобы подвести итог и поблагодарить, а серьёзные споры лучше отложить." },
  "waning-gibbous": { name: "Убывающая Луна, после полнолуния", emoji: "🌖", text: "Спад напряжения. Хорошо подводить итоги, благодарить, делиться результатами." },
  "last-quarter": { name: "Последняя четверть", emoji: "🌗", text: "Время отпускать лишнее: разбирать завалы, завершать отношения и проекты, которые не работают." },
  "waning-crescent": { name: "Убывающая Луна, старый серп", emoji: "🌘", text: "Тишина перед новым циклом: отдых, уборка, очищение, никаких новых стартов." },
};

export function phaseOf(age: number): PhaseKey {
  if (age < 1.85) return "new";
  if (age < 7.38) return "waxing-crescent";
  if (age < 9.23) return "first-quarter";
  if (age < 14.77) return "waxing-gibbous";
  if (age < 16.61) return "full";
  if (age < 22.15) return "waning-gibbous";
  if (age < 24.0) return "last-quarter";
  if (age < 29.53) return "waning-crescent";
  return "new";
}

export function illumination(age: number): number {
  return Math.round(50 * (1 - Math.cos((2 * Math.PI * age) / SYNODIC)));
}

export function lunarDay(age: number): number {
  return Math.min(30, Math.floor(age) + 1);
}

const SIGNS = ["oven", "telets", "bliznetsy", "rak", "lev", "deva", "vesy", "skorpion", "strelets", "kozerog", "vodoley", "ryby"];
const SIGN_NAMES: Record<string, string> = { oven: "Овен", telets: "Телец", bliznetsy: "Близнецы", rak: "Рак", lev: "Лев", deva: "Дева", vesy: "Весы", skorpion: "Скорпион", strelets: "Стрелец", kozerog: "Козерог", vodoley: "Водолей", ryby: "Рыбы" };

/** Эклиптическая долгота Луны (упрощённый ряд, точность ~1°). */
export function moonSign(key: string): { slug: string; name: string } {
  const [y, m, d] = key.split("-").map(Number);
  const T = (julianDay(y, m, d) - 2451545.0) / 36525;
  const rad = Math.PI / 180;
  const L = 218.3164477 + 481267.88123421 * T;      // средняя долгота
  const M = 134.9633964 + 477198.8675055 * T;        // средняя аномалия Луны
  const Ms = 357.5291092 + 35999.0502909 * T;        // средняя аномалия Солнца
  const D = 297.8501921 + 445267.1114034 * T;        // элонгация
  const F = 93.272095 + 483202.0175233 * T;          // аргумент широты
  let lon = L + 6.289 * Math.sin(M * rad) + 1.274 * Math.sin((2 * D - M) * rad) + 0.658 * Math.sin(2 * D * rad)
    + 0.214 * Math.sin(2 * M * rad) - 0.186 * Math.sin(Ms * rad) - 0.114 * Math.sin(2 * F * rad);
  lon = ((lon % 360) + 360) % 360;
  const slug = SIGNS[Math.floor(lon / 30)];
  return { slug, name: SIGN_NAMES[slug] };
}

export type DayInfo = { key: string; age: number; phase: PhaseKey; illumination: number; lunarDay: number; sign: { slug: string; name: string } };

export function dayInfo(key: string): DayInfo {
  const age = moonAge(key);
  return { key, age, phase: phaseOf(age), illumination: illumination(age), lunarDay: lunarDay(age), sign: moonSign(key) };
}

/** Тексты 30 лунных дней. good — инфинитивы («Благоприятно: что делать»), avoid — существительные в родительном падеже
 *  («Лучше избегать: чего»). Подробные описания дней — content/data/lunar-days.json (страница /lunnyy-kalendar/[date]). */
export const LUNAR_DAYS: Record<number, { symbol: string; good: string; avoid: string; hair: string; garden: string }> = {
  1: { symbol: "Светильник", good: "загадывать желания, строить планы, начинать внутреннюю работу", avoid: "резких действий, конфликтов и суеты", hair: "по поверьям, лучше отложить до следующих дней", garden: "отдых, подготовка инвентаря" },
  2: { symbol: "Рог изобилия", good: "начинать дела, щедро делиться и дарить, учиться новому", avoid: "гнева и скупости", hair: "благоприятна, волосы растут быстрее", garden: "посев зелени и быстрорастущих культур" },
  3: { symbol: "Барс", good: "действовать активно, заниматься спортом, отстаивать своё", avoid: "пассивности и накопленной злости", hair: "нейтрально", garden: "обработка почвы, прополка" },
  4: { symbol: "Древо познания", good: "побыть в уединении, поразмышлять, вспомнить историю семьи", avoid: "спешки и лишних встреч", hair: "не рекомендуется", garden: "посадка деревьев и кустов" },
  5: { symbol: "Единорог", good: "осваивать новое, спокойно и вкусно есть, собирать впечатления", avoid: "крайностей в еде и спешки", hair: "благоприятна, укрепляет", garden: "подкормка растений" },
  6: { symbol: "Облако", good: "прислушиваться к интуиции, отдыхать, прощать", avoid: "тяжёлой работы и зависти", hair: "можно, стрижка идёт на пользу", garden: "посев цветов" },
  7: { symbol: "Ветер", good: "договариваться, просить о важном, молиться или медитировать", avoid: "лжи, пустой болтовни и ссор", hair: "нейтрально", garden: "обрезка, формирование кроны" },
  8: { symbol: "Пожар", good: "очищать дом и мысли, менять привычное, обновляться", avoid: "рискованных поездок и неосторожности с огнём", hair: "благоприятна, по поверьям приносит удачу", garden: "обработка от вредителей" },
  9: { symbol: "Летучая мышь", good: "тихо работать, убирать, завершать начатое", avoid: "новых знакомств и важных решений", hair: "не стоит", garden: "сбор корнеплодов" },
  10: { symbol: "Фонтан", good: "проводить время с семьёй, хранить традиции, заниматься домом", avoid: "одиночества и резкости", hair: "благоприятна", garden: "полив, посев" },
  11: { symbol: "Меч", good: "действовать решительно, браться за трудное, больше двигаться", avoid: "резких слов и ссор", hair: "благоприятна, усиливает", garden: "активные посадки" },
  12: { symbol: "Чаша", good: "помогать, делать добрые дела, молиться или медитировать", avoid: "конфликтов и обид", hair: "нейтрально", garden: "посев цветущих" },
  13: { symbol: "Колесо", good: "учиться, исправлять ошибки, копить знания и силы", avoid: "повторения старых промахов", hair: "благоприятна", garden: "подкормка и рыхление" },
  14: { symbol: "Труба", good: "начинать большие дела, отправляться в путь, действовать", avoid: "уныния и пассивности", hair: "благоприятна", garden: "посадка всего, что должно расти вверх" },
  15: { symbol: "Змей", good: "сдерживаться, держать слово, обходиться малым", avoid: "соблазнов, споров и излишеств", hair: "лучше не стричься", garden: "отдых, не поливать" },
  16: { symbol: "Голубь", good: "созерцать, встречаться в спокойной обстановке, мириться", avoid: "шумных событий и громких решений", hair: "благоприятна", garden: "посев, прививка" },
  17: { symbol: "Виноградная лоза", good: "праздновать, играть свадьбы, творить", avoid: "излишеств во всём", hair: "благоприятна", garden: "сбор урожая" },
  18: { symbol: "Зеркало", good: "честно смотреть на себя, работать над собой", avoid: "самообмана и тщеславия", hair: "благоприятна, особенно окрашивание", garden: "прополка, борьба с вредителями" },
  19: { symbol: "Паук", good: "распутывать сложные ситуации, отпускать изжившие себя связи", avoid: "интриг и обмана", hair: "благоприятна, по поверьям оберегает", garden: "обрезка сухих веток" },
  20: { symbol: "Орёл", good: "принимать смелые решения, заниматься духовными практиками", avoid: "гордыни и спешки", hair: "нейтрально", garden: "посадка и пересадка" },
  21: { symbol: "Конь", good: "двигаться, путешествовать, отстаивать справедливость", avoid: "лени и уныния", hair: "благоприятна", garden: "активные работы" },
  22: { symbol: "Слон", good: "учиться без спешки, делиться знаниями, быть щедрым", avoid: "жадности и лишнего", hair: "нейтрально", garden: "подкормка, посев" },
  23: { symbol: "Крокодил", good: "беречь своё, просить прощения, побыть в тишине", avoid: "агрессии и новых начинаний", hair: "лучше воздержаться", garden: "уборка участка" },
  24: { symbol: "Медведь", good: "созидать, трудиться руками, набираться сил", avoid: "разрушительных поступков", hair: "благоприятна", garden: "посев корнеплодов" },
  25: { symbol: "Черепаха", good: "действовать неторопливо, побыть наедине с собой, созерцать", avoid: "спешки и давления на других", hair: "нейтрально", garden: "работы в хранилище" },
  26: { symbol: "Жаба", good: "беречь силы, экономить, действовать осторожно", avoid: "хвастовства и пустых трат", hair: "лучше не стричься", garden: "не сажать" },
  27: { symbol: "Трезубец", good: "доверять интуиции, отдыхать, прощаться с ненужным", avoid: "суеты и распыления сил", hair: "благоприятна", garden: "обрезка" },
  28: { symbol: "Лотос", good: "заниматься домом, беречь близость, радоваться простому", avoid: "резких перемен", hair: "благоприятна", garden: "посев и посадка" },
  29: { symbol: "Спрут", good: "подводить итоги, очищать пространство, действовать осторожно", avoid: "важных встреч и решений", hair: "не стоит", garden: "прополка, уборка" },
  30: { symbol: "Лебедь", good: "благодарить, прощать, завершать цикл", avoid: "споров и новых начинаний", hair: "нейтрально", garden: "отдых" },
};

export function monthDays(year: number, month: number): DayInfo[] {
  const n = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => dayInfo(`${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`));
}

/** Окно дат лунного календаря, которые сайт показывает, ссылает и отдаёт в sitemap:
 *  с 1-го числа прошлого месяца до конца месяца через один (≈ 90 дней). Вне окна страницы дня тоже открываются, но на них не ссылаемся. */
export function moonWindow(today: string): { from: string; to: string } {
  const [y, m] = today.split("-").map(Number);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(new Date(Date.UTC(y, m - 2, 1))), to: iso(new Date(Date.UTC(y, m + 2, 0))) };
}

export function moonWindowKeys(today: string): string[] {
  const { from, to } = moonWindow(today);
  const out: string[] = [];
  for (let d = new Date(`${from}T00:00:00Z`); d.toISOString().slice(0, 10) <= to; d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
}

/** Сколько дней от «сегодня» (по Москве) в обе стороны лунные дни открыты для поиска; остальные — noindex и вне sitemap. */
export const MOON_INDEX_DAYS = 7;

/** Окно индексации лунных дней: [сегодня − 7; сегодня + 7]. Одна правда для страницы (robots) и sitemap. */
export function moonIndexWindow(today: string): { from: string; to: string } {
  const [y, m, d] = today.split("-").map(Number);
  const iso = (n: number) => new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
  return { from: iso(-MOON_INDEX_DAYS), to: iso(MOON_INDEX_DAYS) };
}

export function isMoonDayIndexed(date: string, today: string): boolean {
  const { from, to } = moonIndexWindow(today);
  return date >= from && date <= to;
}

export function moonIndexKeys(today: string): string[] {
  const { from } = moonIndexWindow(today);
  const [y, m, d] = from.split("-").map(Number);
  return Array.from({ length: 2 * MOON_INDEX_DAYS + 1 }, (_, i) => new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10));
}
