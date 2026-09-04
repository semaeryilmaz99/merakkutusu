import { describe, it, expect } from "vitest";
import calculateTrendingScore from "./calculateTrendingScore.js";

describe("calculateTrendingScore", () => {
  it("etkileşimi olmayan bir makale için 0 döner", () => {
    const article = { views: 0, favorites: [], comments: [], createdAt: new Date() };
    expect(calculateTrendingScore(article)).toBe(0);
  });

  it("daha fazla etkileşimi olan makale, aynı yaştaki daha az etkileşimli makaleden yüksek skor alır", () => {
    const now = new Date();
    const popular = { views: 100, favorites: Array(10).fill("x"), comments: Array(5).fill("x"), createdAt: now };
    const unpopular = { views: 5, favorites: [], comments: [], createdAt: now };

    expect(calculateTrendingScore(popular)).toBeGreaterThan(calculateTrendingScore(unpopular));
  });

  it("aynı etkileşime sahip eski bir makale, yeni bir makaleden daha düşük skor alır (zaman ağırlığı)", () => {
    const engagement = { views: 50, favorites: Array(3).fill("x"), comments: Array(2).fill("x") };
    const fresh = { ...engagement, createdAt: new Date() };
    const old = { ...engagement, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) }; // 30 gün önce

    expect(calculateTrendingScore(fresh)).toBeGreaterThan(calculateTrendingScore(old));
  });
});
