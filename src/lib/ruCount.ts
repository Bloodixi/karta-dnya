/** Числа прописью для текстов сайта: «шестнадцать разделов», «двадцать один раздел». */

const ONES = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
const TEENS = ["десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать", "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать"];
const TENS = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];

/** Форма существительного для числа: [1 раздел, 2 раздела, 5 разделов]. */
export function plural(n: number, forms: readonly [string, string, string]): string {
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return forms[0];
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return forms[1];
  return forms[2];
}

/** Число от 0 до 99 прописью (мужской род); больше — цифрами. */
export function numberWord(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) return String(n);
  if (n === 0) return "ноль";
  if (n < 10) return ONES[n];
  if (n < 20) return TEENS[n - 10];
  return [TENS[Math.floor(n / 10)], ONES[n % 10]].filter(Boolean).join(" ");
}

/** «шестнадцать разделов» — число прописью и согласованное существительное. */
export function countWords(n: number, forms: readonly [string, string, string]): string {
  return `${numberWord(n)} ${plural(n, forms)}`;
}
