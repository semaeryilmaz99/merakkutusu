import { describe, it, expect } from "vitest";
import toArticleSummary from "./toArticleSummary.js";

describe("toArticleSummary", () => {
  it("content alanını çıkarıp excerpt ve readingMinutes ekler", () => {
    const article = { _id: "1", title: "Test", content: "kelime ".repeat(50).trim() };
    const summary = toArticleSummary(article);

    expect(summary.content).toBeUndefined();
    expect(summary.excerpt).toBe("kelime ".repeat(50).trim().slice(0, 300));
    expect(summary.title).toBe("Test");
  });

  it("200 kelime/dakika üzerinden okuma süresini hesaplar", () => {
    const shortArticle = { content: "kelime ".repeat(50) }; // 50 kelime -> 1 dk
    const longArticle = { content: "kelime ".repeat(450) }; // 450 kelime -> 3 dk (ceil)

    expect(toArticleSummary(shortArticle).readingMinutes).toBe(1);
    expect(toArticleSummary(longArticle).readingMinutes).toBe(3);
  });

  it("içerik boş/yoksa bile en az 1 dakika döner", () => {
    expect(toArticleSummary({}).readingMinutes).toBe(1);
    expect(toArticleSummary({ content: "" }).excerpt).toBe("");
  });
});
