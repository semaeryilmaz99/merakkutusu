import { describe, it, expect } from "vitest";
import shuffleArray from "./shuffleArray.js";

describe("shuffleArray", () => {
  it("orijinal diziyi değiştirmez", () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffleArray(original);
    expect(original).toEqual(copy);
  });

  it("aynı elemanları (farklı sırada olabilir) içeren yeni bir dizi döner", () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(original);
    expect(shuffled).not.toBe(original); // farklı referans
    expect(shuffled.sort()).toEqual(original.sort());
  });

  it("boş diziyi bozmadan döner", () => {
    expect(shuffleArray([])).toEqual([]);
  });
});
