export function money(n: number, withSign = false): string {
  const neg = n < 0;
  const v = Math.abs(Math.round(n));
  let body: string;
  if (v >= 100_000_000) body = `${trim(v / 100_000_000)}億`;
  else if (v >= 10_000) body = `${trim(v / 10_000)}萬`;
  else body = v.toLocaleString("zh-Hant");
  const sign = neg ? "−" : withSign && n > 0 ? "+" : "";
  return sign + body;
}

function trim(n: number): string {
  if (n >= 100) return n.toFixed(0);
  const digits = n >= 10 ? 1 : 2;
  return n
    .toFixed(digits)
    .replace(/0+$/, "")
    .replace(/\.$/, "");
}
