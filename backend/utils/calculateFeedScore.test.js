import { describe, it, expect } from "vitest";
import calculateFeedScore from "./calculateFeedScore.js";

describe("calculateFeedScore", () => {
  const baseArticle = {
    tags: [],
    favorites: [],
    comments: [],
    createdAt: new Date()
  };

  it("favori tag'e sahip bir makale, olmayana göre daha yüksek skor alır", () => {
    const tagId = "tag1";
    const withFavoriteTag = { ...baseArticle, tags: [{ _id: tagId }] };
    const withoutFavoriteTag = { ...baseArticle, tags: [{ _id: "tag2" }] };

    const scoreWithBoost = calculateFeedScore(withFavoriteTag, {}, [tagId]);
    const scoreWithoutBoost = calculateFeedScore(withoutFavoriteTag, {}, [tagId]);

    expect(scoreWithBoost).toBeGreaterThan(scoreWithoutBoost);
  });

  it("tagWeights'teki ağırlık skora eklenir", () => {
    const tagId = "tag1";
    const article = { ...baseArticle, tags: [{ _id: tagId }] };

    const scoreWithWeight = calculateFeedScore(article, { [tagId]: 0.5 }, []);
    const scoreWithoutWeight = calculateFeedScore(article, {}, []);

    expect(scoreWithWeight).toBeCloseTo(scoreWithoutWeight + 0.5, 5);
  });

  it("48 saatten eski bir makale recency boost almaz", () => {
    const old = { ...baseArticle, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72) };
    expect(calculateFeedScore(old, {}, [])).toBe(0);
  });
});
