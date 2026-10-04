/** Число судьбы: сумма всех цифр даты рождения, свёрнутая до 1–9, кроме мастер-чисел 11, 22, 33. */
export function digitsSum(n: number): number {
  return String(n).split("").reduce((s, d) => s + Number(d), 0);
}

export function reduceNumber(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = digitsSum(n);
  return n;
}

export function destinyNumber(day: number, month: number, year: number): { number: number; steps: string[] } {
  const steps: string[] = [];
  const all = `${day}${month}${year}`.split("").map(Number);
  const total = all.reduce((a, b) => a + b, 0);
  steps.push(`${all.join(" + ")} = ${total}`);
  let n = total;
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    const next = digitsSum(n);
    steps.push(`${String(n).split("").join(" + ")} = ${next}`);
    n = next;
  }
  return { number: n, steps };
}

export function isValidDate(day: number, month: number, year: number): boolean {
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}
