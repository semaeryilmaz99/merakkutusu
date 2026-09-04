import { describe, it, expect } from "vitest";
import calculateTagWeights from "./calculateTagWeights.js";

describe("calculateTagWeights", () => {
  it("okuma sayılarını toplam üzerinden yüzdeye çevirir", () => {
    const weights = calculateTagWeights({ tagA: 3, tagB: 1 });
    expect(weights.tagA).toBe(0.75);
    expect(weights.tagB).toBe(0.25);
  });

  it("boş girdi için boş bir obje döner", () => {
    expect(calculateTagWeights({})).toEqual({});
  });

  it("tek bir tag varsa ağırlığı 1 olur", () => {
    const weights = calculateTagWeights({ tekTag: 5 });
    expect(weights.tekTag).toBe(1);
  });
});
