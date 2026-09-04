import { describe, it, expect } from "vitest";
import parsePagination from "./parsePagination.js";

describe("parsePagination", () => {
  it("hiç parametre verilmezse varsayılan değerleri kullanır", () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("page ve limit'e göre doğru skip'i hesaplar", () => {
    expect(parsePagination({ page: "3", limit: "10" })).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it("maxLimit'i aşan bir limit isteğini üst sınıra sabitler", () => {
    const { limit } = parsePagination({ limit: "500" }, { maxLimit: 100 });
    expect(limit).toBe(100);
  });

  it("0 veya negatif page/limit değerlerini 1'e sabitler", () => {
    expect(parsePagination({ page: "-5", limit: "0" })).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it("sayısal olmayan değerler için varsayılana döner", () => {
    expect(parsePagination({ page: "abc", limit: "xyz" })).toEqual({ page: 1, limit: 20, skip: 0 });
  });
});
