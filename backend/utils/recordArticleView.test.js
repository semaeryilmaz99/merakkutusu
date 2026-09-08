import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import mongoose from "mongoose";
import User from "../models/User.js";
import recordArticleView from "./recordArticleView.js";
import { connect, clearDatabase, closeDatabase } from "../tests/dbHandler.js";

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

const createUser = () =>
  User.create({ username: "okuyucu", email: "okuyucu@test.com", password: "Test1234", isVerified: true });

describe("recordArticleView", () => {
  it("yeni bir makaleyi okuma geçmişine ekler", async () => {
    const user = await createUser();
    const articleId = new mongoose.Types.ObjectId();

    await recordArticleView(user._id, articleId);

    const updated = await User.findById(user._id);
    expect(updated.readingHistory).toHaveLength(1);
    expect(updated.readingHistory[0].article.toString()).toBe(articleId.toString());
  });

  it("aynı makale tekrar görüntülenince yeni kayıt eklemez, viewedAt'ı günceller", async () => {
    const user = await createUser();
    const articleId = new mongoose.Types.ObjectId();

    await recordArticleView(user._id, articleId);
    const firstViewedAt = (await User.findById(user._id)).readingHistory[0].viewedAt;

    await new Promise((resolve) => setTimeout(resolve, 10));
    await recordArticleView(user._id, articleId);

    const updated = await User.findById(user._id);
    expect(updated.readingHistory).toHaveLength(1);
    expect(updated.readingHistory[0].viewedAt.getTime()).toBeGreaterThan(firstViewedAt.getTime());
  });

  it("farklı makaleler ayrı kayıt olarak eklenir", async () => {
    const user = await createUser();
    const articleA = new mongoose.Types.ObjectId();
    const articleB = new mongoose.Types.ObjectId();

    await recordArticleView(user._id, articleA);
    await recordArticleView(user._id, articleB);

    const updated = await User.findById(user._id);
    expect(updated.readingHistory).toHaveLength(2);
  });

  it("eşzamanlı (concurrent) çağrılarda bile aynı makale için tek kayıt kalır", async () => {
    const user = await createUser();
    const articleId = new mongoose.Types.ObjectId();

    // Aynı anda 5 istek — eski (iki ayrı updateOne'lı) versiyonda bu,
    // hepsi "henüz yok" kontrolünü aynı anda geçtiği için birden fazla
    // kayıt oluşturabilirdi. Atomik pipeline update'te tek kayıt kalmalı.
    await Promise.all(Array.from({ length: 5 }, () => recordArticleView(user._id, articleId)));

    const updated = await User.findById(user._id);
    expect(updated.readingHistory).toHaveLength(1);
  });
});
