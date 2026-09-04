import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import Article from "../models/Article.js";
import generateToken from "../utils/generateToken.js";
import { connect, clearDatabase, closeDatabase } from "./dbHandler.js";

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

const createVerifiedUser = async (username) => {
  const user = await User.create({
    username,
    email: `${username}@test.com`,
    password: "Test1234",
    isVerified: true
  });
  const token = generateToken(user._id, user.role);
  return { user, token };
};

describe("POST /api/articles", () => {
  it("token olmadan makale oluşturmaya çalışınca 401 döner", async () => {
    const res = await request(app)
      .post("/api/articles")
      .send({ title: "Başlık", content: "İçerik" });

    expect(res.status).toBe(401);
  });

  it("geçerli token ile makale oluşturulur", async () => {
    const { token } = await createVerifiedUser("yazar");

    const res = await request(app)
      .post("/api/articles")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test Makalesi", content: "Bu bir test içeriğidir." });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Test Makalesi");
  });
});

// Faz 1'de bulunup düzeltilen bug için regresyon testi: deleteArticle'da
// req.user._id yerine yanlışlıkla deleteArticle fonksiyon referansı
// karşılaştırılıyordu, bu da sahiplik kontrolünü işlevsiz kılıyordu.
describe("Makale sahiplik kontrolü (ownership)", () => {
  it("sahibi olmayan biri makaleyi silmeye çalışınca 403 döner", async () => {
    const { user: owner, token: ownerToken } = await createVerifiedUser("sahip");
    const { token: otherToken } = await createVerifiedUser("baskasi");

    const article = await Article.create({
      title: "Sahiplik Testi",
      content: "İçerik",
      author: owner._id
    });

    const res = await request(app)
      .delete(`/api/articles/${article._id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);

    // Makale gerçekten silinmemiş olmalı
    const stillExists = await Article.findById(article._id);
    expect(stillExists).not.toBeNull();

    // Sahibi kendi makalesini silebilmeli
    const ownerRes = await request(app)
      .delete(`/api/articles/${article._id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(ownerRes.status).toBe(200);
  });

  it("sahibi olmayan biri makaleyi düzenlemeye çalışınca 403 döner", async () => {
    const { user: owner } = await createVerifiedUser("sahip2");
    const { token: otherToken } = await createVerifiedUser("baskasi2");

    const article = await Article.create({
      title: "Orijinal Başlık",
      content: "İçerik",
      author: owner._id
    });

    const res = await request(app)
      .put(`/api/articles/${article._id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ title: "Değiştirilmiş Başlık" });

    expect(res.status).toBe(403);

    const unchanged = await Article.findById(article._id);
    expect(unchanged.title).toBe("Orijinal Başlık");
  });
});

describe("GET /api/articles (pagination)", () => {
  it("varsayılan limiti (20) aşmaz", async () => {
    const { user } = await createVerifiedUser("cokyazan");
    const articles = Array.from({ length: 25 }, (_, i) => ({
      title: `Makale ${i}`,
      content: "İçerik",
      author: user._id
    }));
    await Article.insertMany(articles);

    const res = await request(app).get("/api/articles");

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(20);
  });

  it("limit query parametresi ile sayfa boyutu değiştirilebilir", async () => {
    const { user } = await createVerifiedUser("cokyazan2");
    const articles = Array.from({ length: 15 }, (_, i) => ({
      title: `Makale ${i}`,
      content: "İçerik",
      author: user._id
    }));
    await Article.insertMany(articles);

    const res = await request(app).get("/api/articles").query({ limit: 5, page: 2 });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(5);
  });
});
