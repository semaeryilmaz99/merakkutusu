import { describe, it, expect } from "vitest";
import escapeRegExp from "./escapeRegExp.js";

describe("escapeRegExp", () => {
  it("regex özel karakterlerini kaçışlar", () => {
    expect(escapeRegExp("[test]")).toBe("\\[test\\]");
    expect(escapeRegExp("a.b*c")).toBe("a\\.b\\*c");
  });

  it("kaçışlanmış metin geçerli bir regex olarak derlenebilir (önceden çökerdi)", () => {
    expect(() => new RegExp(escapeRegExp("["), "i")).not.toThrow();
  });

  it("normal metni değiştirmeden bırakır", () => {
    expect(escapeRegExp("merak kutusu")).toBe("merak kutusu");
  });
});
