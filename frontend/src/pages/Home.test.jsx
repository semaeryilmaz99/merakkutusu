import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import { getPersonalizedFeed, searchArticles } from "../services/articleService";
import { searchUsers } from "../services/userService";
import api from "../services/api";

// Home kendi arama/feed mantığına odaklanan bir test olduğu için ArticleCard'ı
// sade bir placeholder ile değiştiriyoruz — Router/Auth bağımlılıklarını
// (useNavigate, useAuth) bu testin dışında tutmak için.
vi.mock("../components/ArticleCard", () => ({
  default: ({ article }) => <div data-testid="article-card">{article.title}</div>
}));

vi.mock("../services/articleService", () => ({
  getPersonalizedFeed: vi.fn(),
  searchArticles: vi.fn()
}));

vi.mock("../services/userService", () => ({
  searchUsers: vi.fn()
}));

vi.mock("../services/api", () => ({
  default: { get: vi.fn() }
}));

const renderHome = () => render(<MemoryRouter><Home /></MemoryRouter>);

beforeEach(() => {
  vi.useFakeTimers();
  getPersonalizedFeed.mockResolvedValue([]);
  api.get.mockResolvedValue({ data: [] });
  searchUsers.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("Home - arama debounce", () => {
  it("her tuşta değil, yazma durduktan 350ms sonra tek bir arama isteği atar", async () => {
    searchArticles.mockResolvedValue([]);
    renderHome();

    // İlk mount'taki personalized feed çağrısının çözülmesini bekle
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const input = screen.getByPlaceholderText(/Makale, kullanıcı veya konu arayın/);

    fireEvent.change(input, { target: { value: "m" } });
    fireEvent.change(input, { target: { value: "me" } });
    fireEvent.change(input, { target: { value: "mer" } });

    // Henüz 350ms dolmadı — arama atılmamış olmalı
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(searchArticles).not.toHaveBeenCalled();

    // Son tuştan 350ms sonra tek bir istek atılmalı
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(searchArticles).toHaveBeenCalledTimes(1);
    expect(searchArticles).toHaveBeenCalledWith(expect.objectContaining({ q: "mer" }));
  });
});

describe("Home - yarış durumu (race condition) regresyon testi", () => {
  it("geç dönen eski bir arama cevabı, daha yeni ve doğru sonucun üzerine yazmaz", async () => {
    // "me" için yavaş (1000ms), "merak" için hızlı (100ms) dönen sahte cevaplar —
    // gerçek hayatta network gecikmesi öngörülemez, "merak" isteği daha SONRA
    // başlasa bile "me" isteğinden daha ÖNCE dönebilir.
    searchArticles.mockImplementation(({ q }) => {
      const delay = q === "me" ? 1000 : 100;
      const results = q === "me"
        ? [{ _id: "stale", title: "Eski (yanlış) sonuç" }]
        : [{ _id: "fresh", title: "Güncel (doğru) sonuç" }];
      return new Promise((resolve) => setTimeout(() => resolve(results), delay));
    });

    renderHome();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    const input = screen.getByPlaceholderText(/Makale, kullanıcı veya konu arayın/);

    // "me" yaz, duraklama 350ms'yi bulsun — debounce ateşlenir, yavaş istek başlar
    fireEvent.change(input, { target: { value: "me" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(searchArticles).toHaveBeenCalledWith(expect.objectContaining({ q: "me" }));

    // Yazmaya devam et: "merak" — yeni bir debounce döngüsü başlar, hızlı istek
    fireEvent.change(input, { target: { value: "merak" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(searchArticles).toHaveBeenCalledWith(expect.objectContaining({ q: "merak" }));

    // "merak" isteği 100ms'de döner (toplam 450ms geçti, "me" isteği için hâlâ 1000ms dolmadı)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(screen.getByText("Güncel (doğru) sonuç")).toBeInTheDocument();

    // "me" isteği şimdi (gecikmeli) dönüyor — ekranı ESKİ sonuçla EZMEMELİ
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(screen.getByText("Güncel (doğru) sonuç")).toBeInTheDocument();
    expect(screen.queryByText("Eski (yanlış) sonuç")).not.toBeInTheDocument();
  });
});
