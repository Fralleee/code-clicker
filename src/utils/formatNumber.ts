const SUFFIXES = [
  "",
  "K", // 10^3
  "M", // 10^6
  "B", // 10^9
  "T", // 10^12
  "Qa", // 10^15
  "Qt", // 10^18
  "Sx", // 10^21
];

export function formatNumber(n: number, decimals: number = 1): string {
  if (n < 0) return `-${formatNumber(-n, decimals)}`;
  if (n < 10_000) {
    if (Number.isInteger(n)) return Math.floor(n).toLocaleString();
    return n.toFixed(decimals);
  }

  const tier = Math.floor(Math.log10(n) / 3);

  // Use suffixes for numbers up to sextillions
  if (tier < SUFFIXES.length) {
    const scaled = n / 10 ** (tier * 3);
    return `${scaled.toFixed(decimals)}${SUFFIXES[tier]}`;
  }

  // Beyond that, use compact scientific notation: "1.5e24"
  const exp = Math.floor(Math.log10(n));
  const mantissa = n / 10 ** exp;
  return `${mantissa.toFixed(1)}e${exp}`;
}

export function formatLoC(n: number): string {
  return formatNumber(n);
}

export function formatRate(n: number): string {
  if (n === 0) return "0";
  if (n < 0.1) return n.toFixed(2);
  return `${formatNumber(n)}/s`;
}
