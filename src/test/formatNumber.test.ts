import { describe, expect, it } from "vitest";
import { formatNumber, formatRate } from "../utils/formatNumber";

describe("formatNumber", () => {
  it("formats small integers", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
    // toLocaleString uses locale-specific separators
    expect(formatNumber(1234)).toMatch(/1.?234/);
    expect(formatNumber(9999)).toMatch(/9.?999/);
  });

  it("formats decimals", () => {
    expect(formatNumber(1.5)).toBe("1.5");
    expect(formatNumber(0.1)).toBe("0.1");
  });

  it("uses K suffix for 10K+", () => {
    expect(formatNumber(10_000)).toBe("10.0K");
    expect(formatNumber(50_000)).toBe("50.0K");
    expect(formatNumber(999_999)).toBe("1000.0K");
  });

  it("uses M/B/T suffixes", () => {
    expect(formatNumber(1_000_000)).toBe("1.0M");
    expect(formatNumber(2_500_000_000)).toBe("2.5B");
    expect(formatNumber(1_000_000_000_000)).toBe("1.0T");
  });

  it("uses scientific notation for very large numbers", () => {
    const result = formatNumber(1e24);
    expect(result).toMatch(/e24$/);
  });

  it("handles negatives", () => {
    expect(formatNumber(-500)).toBe("-500");
    expect(formatNumber(-1_000_000)).toBe("-1.0M");
  });
});

describe("formatRate", () => {
  it("formats zero", () => {
    expect(formatRate(0)).toBe("0");
  });

  it("formats small rates with decimals", () => {
    expect(formatRate(0.05)).toBe("0.05");
  });

  it("appends /s", () => {
    expect(formatRate(100)).toBe("100/s");
    expect(formatRate(50_000)).toBe("50.0K/s");
  });
});
