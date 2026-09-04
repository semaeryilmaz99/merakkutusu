import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ArticleCard from "./ArticleCard";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { _id: "user1", library: [] } })
}));

vi.mock("../services/articleService", () => ({
  toggleFavorite: vi.fn(),
  toggleLibrary: vi.fn()
}));

const baseArticle = {
  _id: "article1",
  title: "Test Makalesi",
  content: "Bu bir test içeriğidir.",
  author: { username: "yazar" },
  tags: [{ _id: "t1", name: "yazılım" }, { _id: "t2", name: "tasarım" }],
  favorites: [],
  createdAt: new Date().toISOString()
};

const renderCard = (article = baseArticle) =>
  render(
    <MemoryRouter>
      <ArticleCard article={article} />
    </MemoryRouter>
  );

describe("ArticleCard", () => {
  it("makale başlığını gösterir", () => {
    renderCard();
    expect(screen.getByText("Test Makalesi")).toBeInTheDocument();
  });

  it("ilk 2 tag'i # işaretiyle gösterir", () => {
    renderCard();
    expect(screen.getByText("#yazılım")).toBeInTheDocument();
    expect(screen.getByText("#tasarım")).toBeInTheDocument();
  });

  it("2'den fazla tag varsa sadece ilk ikisini gösterir", () => {
    renderCard({
      ...baseArticle,
      tags: [{ _id: "t1", name: "a" }, { _id: "t2", name: "b" }, { _id: "t3", name: "c" }]
    });
    expect(screen.getByText("#a")).toBeInTheDocument();
    expect(screen.getByText("#b")).toBeInTheDocument();
    expect(screen.queryByText("#c")).not.toBeInTheDocument();
  });

  it("yazar kullanıcı adını gösterir", () => {
    renderCard();
    expect(screen.getByText("yazar")).toBeInTheDocument();
  });
});
