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
  "full": { name: "Полнолуние", emoji: "🌕", text: "Кульминация. Многое проявляется и завершается, чувства на максимуме. Не лучший день для операций и серьёзных споров." },
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

export const LUNAR_DAYS: Record<number, { symbol: string; good: string; avoid: string; hair: string; garden: string }> = {
  1: { symbol: "Светильник", good: "загадывать желания, строить планы, начинать внутреннюю работу", avoid: "резких действий, конфликтов, тяжёлой еды", hair: "стрижка укорачивает жизнь по поверьям — лучше воздержаться", garden: "отдых, подготовка инвентаря" },
  2: { symbol: "Рог изобилия", good: "начинать дела, щедро тратить и дарить, учиться новому", avoid: "гнева и скупости", hair: "благоприятна, волосы растут быстрее", garden: "посев зелени и быстрорастущих культур" },
  3: { symbol: "Барс", good: "активных действий, спорта, борьбы за своё", avoid: "пассивности, накопленной злости", hair: "нейтрально", garden: "обработка почвы, прополка" },
  4: { symbol: "Древо познания", good: "уединения, размышлений, работы с прошлым и родом", avoid: "спешки и лишних встреч", hair: "не рекомендуется", garden: "посадка деревьев и кустов" },
  5: { symbol: "Единорог", good: "усвоения: еды, знаний, впечатлений", avoid: "голодания и переедания", hair: "благоприятна, укрепляет", garden: "подкормка растений" },
  6: { symbol: "Облако", good: "интуиции, отдыха, прощения", avoid: "тяжёлой работы и зависти", hair: "можно, стрижка идёт на пользу", garden: "посев цветов" },
  7: { symbol: "Ветер", good: "слова: переговоров, молитвы, просьб", avoid: "лжи, пустой болтовни и ссор", hair: "нейтрально", garden: "обрезка, формирование кроны" },
  8: { symbol: "Пожар", good: "очищения, перемен, обновления", avoid: "рискованных поездок и огня", hair: "благоприятна для долгой жизни по поверьям", garden: "обработка от вредителей" },
  9: { symbol: "Летучая мышь", good: "тихой работы, уборки, завершения", avoid: "новых знакомств и важных решений", hair: "не стоит", garden: "сбор корнеплодов" },
  10: { symbol: "Фонтан", good: "семьи, традиций, дома", avoid: "одиночества и агрессии", hair: "благоприятна", garden: "полив, посев" },
  11: { symbol: "Меч", good: "решительности, силы, физической нагрузки", avoid: "тяжёлых слов, ссор", hair: "благоприятна, усиливает", garden: "активные посадки" },
  12: { symbol: "Чаша", good: "доброты, благотворительности, молитвы", avoid: "конфликтов и обид", hair: "нейтрально", garden: "посев цветущих" },
  13: { symbol: "Колесо", good: "обучения, исправления ошибок, накопления", avoid: "повторять старые промахи", hair: "благоприятна", garden: "подкормка и рыхление" },
  14: { symbol: "Труба", good: "начала больших дел, пути, активности", avoid: "уныния и пассивности", hair: "благоприятна", garden: "посадка всего, что должно расти вверх" },
  15: { symbol: "Змей", good: "сдержанности, самоконтроля, аскезы", avoid: "соблазнов, споров, переедания", hair: "лучше не стричься", garden: "отдых, не поливать" },
  16: { symbol: "Голубь", good: "гармонии, созерцания, спокойных встреч", avoid: "громких событий", hair: "благоприятна", garden: "посев, прививка" },
  17: { symbol: "Виноградная лоза", good: "радости, праздников, свадеб, творчества", avoid: "пьянства и излишеств", hair: "благоприятна", garden: "сбор урожая" },
  18: { symbol: "Зеркало", good: "честного взгляда на себя, работы над собой", avoid: "самообмана, тщеславия", hair: "благоприятна, особенно окрашивание", garden: "прополка, борьба с вредителями" },
  19: { symbol: "Паук", good: "распутывания сложных ситуаций, разрыва вредных связей", avoid: "интриг, обмана", hair: "благоприятна, защищает по поверьям", garden: "обрезка сухих веток" },
  20: { symbol: "Орёл", good: "смелых решений и духовных практик", avoid: "гордыни и спешки", hair: "нейтрально", garden: "посадка и пересадка" },
  21: { symbol: "Конь", good: "движения, путешествий, справедливости", avoid: "лени, уныния", hair: "благоприятна", garden: "активные работы" },
  22: { symbol: "Слон", good: "мудрости, щедрости, спокойной учёбы", avoid: "жадности, переедания", hair: "нейтрально", garden: "подкормка, посев" },
  23: { symbol: "Крокодил", good: "защиты, покаяния, тишины", avoid: "агрессии, новых начинаний", hair: "лучше воздержаться", garden: "уборка участка" },
  24: { symbol: "Медведь", good: "созидания, физического труда, укрепления здоровья", avoid: "разрушительных действий", hair: "благоприятна", garden: "посев корнеплодов" },
  25: { symbol: "Черепаха", good: "неторопливости, уединения, созерцания", avoid: "спешки и давления на других", hair: "нейтрально", garden: "работы в хранилище" },
  26: { symbol: "Жаба", good: "осторожности, экономии сил, бережливости", avoid: "хвастовства, пустых трат", hair: "лучше не стричься", garden: "не сажать" },
  27: { symbol: "Трезубец", good: "интуиции, отдыха, прощания с ненужным", avoid: "суеты", hair: "благоприятна", garden: "обрезка" },
  28: { symbol: "Лотос", good: "целостности, домашних дел, тихого счастья", avoid: "резких перемен", hair: "благоприятна", garden: "посев и посадка" },
  29: { symbol: "Спрут", good: "осторожности, подведения итогов, очищения", avoid: "важных встреч и решений", hair: "не стоит", garden: "прополка, уборка" },
  30: { symbol: "Лебедь", good: "благодарности, прощения, завершения цикла", avoid: "споров и начинаний", hair: "нейтрально", garden: "отдых" },
};

export function monthDays(year: number, month: number): DayInfo[] {
  const n = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => dayInfo(`${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`));
}
