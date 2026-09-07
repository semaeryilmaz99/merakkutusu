import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { connect, clearDatabase, closeDatabase } from "./dbHandler.js";
import searchOpenAlex from "../utils/openAlex.js";
import searchCore from "../utils/core.js";
import PaperCache from "../models/PaperCache.js";

// Gerçek OpenAlex/CORE/OpenAI çağrısı yok — CI'da ne ağ bağımlılığı ne
// maliyet olsun diye hepsi mock'lanıyor. CORE.js env'de CORE_API_KEY yoksa
// zaten kendi başına [] dönüyor, ama geliştiricinin lokal .env'inde bir key
// varsa testler yine de gerçek ağa çıkmasın diye burada da açıkça mock'luyoruz.
vi.mock("../utils/openAlex.js", () => ({
  default: vi.fn().mockResolvedValue([
    {
      externalId: "paper1",
      title: "Mock Makale",
      abstract: "Bu bir test özetidir.",
      url: "https://example.com/paper1",
      year: 2023,
      authors: ["Test Yazar"]
    }
  ])
}));

vi.mock("../utils/core.js", () => ({
  default: vi.fn().mockResolvedValue([])
}));

vi.mock("../utils/embedText.js", () => ({
  default: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
  embedTexts: vi.fn().mockImplementation((texts) => Promise.resolve(texts.map(() => new Array(1536).fill(0.1))))
}));

// PaperCache.aggregate ($vectorSearch) gerçek bir Atlas Search index'i
// gerektiriyor — mongodb-memory-server bunu desteklemiyor, bu yüzden
// aggregate'i de mock'luyoruz.
vi.mock("../models/PaperCache.js", async () => {
  const actual = await vi.importActual("../models/PaperCache.js");
  return {
    ...actual,
    default: {
      ...actual.default,
      find: () => ({ select: () => Promise.resolve([]) }),
      insertMany: vi.fn().mockResolvedValue([]),
      aggregate: vi.fn().mockResolvedValue([
        { title: "Mock Makale", abstract: "Bu bir test özetidir.", url: "https://example.com/paper1", year: 2023, authors: ["Test Yazar"] }
      ])
    }
  };
});

vi.mock("../utils/openaiClient.js", () => ({
  default: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestions: [
                    { paperIndex: 1, reason: "Konuyla doğrudan alakalı.", suggestedCitation: "Test Yazar (2023)" }
                  ]
                })
              }
            }
          ]
        })
      }
    }
  }
}));

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

const createVerifiedUser = async () => {
  const user = await User.create({
    username: "yazar",
    email: "yazar@test.com",
    password: "Test1234",
    isVerified: true
  });
  return generateToken(user._id, user.role);
};

describe("POST /api/ai/suggest-sources", () => {
  it("token olmadan 401 döner", async () => {
    const res = await request(app)
      .post("/api/ai/suggest-sources")
      .send({ title: "Başlık", content: "İçerik" });

    expect(res.status).toBe(401);
  });

  it("boş title/content ile 400 döner", async () => {
    const token = await createVerifiedUser();

    const res = await request(app)
      .post("/api/ai/suggest-sources")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "", content: "" });

    expect(res.status).toBe(400);
  });

  it("geçerli istekte mock'lanmış öneri listesini döner", async () => {
    const token = await createVerifiedUser();

    const res = await request(app)
      .post("/api/ai/suggest-sources")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Kuantum Bilgisayarlar", content: "Kuantum bilgisayarlar hakkında bir taslak.", tags: ["fizik"] });

    expect(res.status).toBe(200);
    expect(res.body.suggestions).toHaveLength(1);
    expect(res.body.suggestions[0]).toMatchObject({
      paperTitle: "Mock Makale",
      url: "https://example.com/paper1"
    });
  });

  it("OpenAlex ve CORE'dan gelen aynı makaleyi (başlık normalize edilerek) tekilleştirir", async () => {
    const token = await createVerifiedUser();

    searchOpenAlex.mockResolvedValueOnce([
      { externalId: "oa1", title: "Ortak Makale", abstract: "Özet A", url: "https://a.com", year: 2022, authors: ["A"] },
      { externalId: "oa2", title: "Sadece OpenAlex'te", abstract: "Özet B", url: "https://b.com", year: 2021, authors: ["B"] }
    ]);
    searchCore.mockResolvedValueOnce([
      { externalId: "core:1", title: "  ortak makale  ", abstract: "Özet A (CORE)", url: "https://a2.com", year: 2022, authors: ["A"] },
      { externalId: "core:2", title: "Sadece CORE'da", abstract: "Özet C", url: "https://c.com", year: 2020, authors: ["C"] }
    ]);

    const res = await request(app)
      .post("/api/ai/suggest-sources")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test", content: "Test içerik" });

    expect(res.status).toBe(200);
    // insertMany'e giden liste 4 değil 3 olmalı — "Ortak Makale"/"ortak makale" tekilleşti
    const insertedTitles = PaperCache.insertMany.mock.calls.at(-1)[0].map((p) => p.title);
    expect(insertedTitles).toHaveLength(3);
  });
});
