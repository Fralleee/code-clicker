import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

const KEY = "test_key";

afterEach(() => {
  localStorage.clear();
});

describe("useLocalStorageState", () => {
  it("returns initial value when storage is empty", () => {
    const { result } = renderHook(() => useLocalStorageState(KEY, "default"));
    expect(result.current[0]).toBe("default");
  });

  it("reads existing value from localStorage on mount", () => {
    localStorage.setItem(KEY, JSON.stringify(42));
    const { result } = renderHook(() => useLocalStorageState(KEY, 0));
    expect(result.current[0]).toBe(42);
  });

  it("falls back to initial on invalid JSON", () => {
    localStorage.setItem(KEY, "{not json");
    const { result } = renderHook(() => useLocalStorageState(KEY, "fallback"));
    expect(result.current[0]).toBe("fallback");
  });

  it("falls back to initial when validate rejects the stored value", () => {
    localStorage.setItem(KEY, JSON.stringify("garbage"));
    const isNumber = (v: unknown): v is number => typeof v === "number";
    const { result } = renderHook(() => useLocalStorageState(KEY, 7, isNumber));
    expect(result.current[0]).toBe(7);
  });

  it("accepts stored value when validate passes", () => {
    localStorage.setItem(KEY, JSON.stringify(100));
    const isNumber = (v: unknown): v is number => typeof v === "number";
    const { result } = renderHook(() => useLocalStorageState(KEY, 1, isNumber));
    expect(result.current[0]).toBe(100);
  });

  it("writes updates back to localStorage", () => {
    const { result } = renderHook(() => useLocalStorageState<number>(KEY, 1));
    act(() => {
      result.current[1](10);
    });
    expect(result.current[0]).toBe(10);
    expect(JSON.parse(localStorage.getItem(KEY) ?? "null")).toBe(10);
  });

  it("removes the key when the new value serializes to undefined", () => {
    localStorage.setItem(KEY, JSON.stringify(1));
    const { result } = renderHook(() => useLocalStorageState<number | undefined>(KEY, 1));
    act(() => {
      result.current[1](undefined);
    });
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
