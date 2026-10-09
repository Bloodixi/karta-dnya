import { digitsSum } from "./numerology";

/** Квадрат Пифагора (психоматрица): рабочие числа и количество каждой цифры 1–9. */
export function pythagoras(d: number, m: number, y: number) {
  const digits = `${d}${m}${y}`.split("").map(Number);
  const first = digits.reduce((a, b) => a + b, 0);
  const second = digitsSum(first);
  const third = first - 2 * digits.find((x) => x !== 0)!;
  const fourth = digitsSum(Math.abs(third));
  const all = [...digits, ...String(first).split("").map(Number), ...String(second).split("").map(Number), ...String(Math.abs(third)).split("").map(Number), ...String(fourth).split("").map(Number)];
  const counts: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) counts[i] = all.filter((x) => x === i).length;
  return { digits, work: [first, second, third, fourth], counts };
}
