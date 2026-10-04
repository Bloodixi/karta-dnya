"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PairPicker({ signs, initial }: { signs: { slug: string; name: string; symbol: string }[]; initial?: [string, string] }) {
  const router = useRouter();
  const [a, setA] = useState(initial?.[0] || signs[0]?.slug || "");
  const [b, setB] = useState(initial?.[1] || signs[1]?.slug || "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (a && b) router.push(`/sovmestimost/${a}-${b}`);
      }}
      className="card p-5 flex flex-wrap items-end gap-3"
    >
      <label className="grid gap-1 text-sm flex-1 min-w-[140px]">
        Первый знак
        <select value={a} onChange={(e) => setA(e.target.value)} className="border border-line rounded-lg px-3 py-2 bg-surface">
          {signs.map((s) => <option key={s.slug} value={s.slug}>{s.symbol} {s.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm flex-1 min-w-[140px]">
        Второй знак
        <select value={b} onChange={(e) => setB(e.target.value)} className="border border-line rounded-lg px-3 py-2 bg-surface">
          {signs.map((s) => <option key={s.slug} value={s.slug}>{s.symbol} {s.name}</option>)}
        </select>
      </label>
      <button type="submit" className="btn">Проверить</button>
    </form>
  );
}
