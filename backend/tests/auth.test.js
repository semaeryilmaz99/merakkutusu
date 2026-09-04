import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import { connect, clearDatabase, closeDatabase } from "./dbHandler.js";

// registerUser gerçek bir email göndermeye çalışıyor (config/mailer.js) —
// testte gerçek SMTP sunucusuna bağlanmayı önlemek için mock'luyoruz.
vi.mock("../config/mailer.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined)
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

describe("POST /api/auth/register", () => {
  it("geçerli bilgiyle kayıt olur (kullanıcı doğrulanmamış olarak oluşur)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "yenikullanici", email: "yeni@test.com", password: "Test1234" });

    expect(res.status).toBe(201);
    const user = await User.findOne({ email: "yeni@test.com" });
    expect(user).not.toBeNull();
    expect(user.isVerified).toBe(false);
  });

  it("aynı email ile ikinci kayıt 400 döner", async () => {
    await User.create({ username: "var", email: "var@test.com", password: "Test1234" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "baska", email: "var@test.com", password: "Test1234" });

    expect(res.status).toBe(400);
  });

  it("kısa şifreyle 400 döner (validator)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "kisasifre", email: "kisa@test.com", password: "123" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("var olmayan bir kullanıcıyla 401 döner", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "yok@test.com", password: "Test1234" });

    expect(res.status).toBe(401);
  });

  it("email doğrulanmamış bir kullanıcı için 401 döner", async () => {
    await User.create({
      username: "dogrulanmamis",
      email: "dogrulanmamis@test.com",
      password: "Test1234",
      isVerified: false
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "dogrulanmamis@test.com", password: "Test1234" });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/doğrulayın/);
  });

  it("yanlış şifreyle 401 döner", async () => {
    await User.create({
      username: "sifretest",
      email: "sifretest@test.com",
      password: "Test1234",
      isVerified: true
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "sifretest@test.com", password: "YanlisSifre" });

    expect(res.status).toBe(401);
  });

  it("doğru bilgilerle giriş yapınca access+refresh token döner", async () => {
    await User.create({
      username: "gecerlikullanici",
      email: "gecerli@test.com",
      password: "Test1234",
      isVerified: true
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "gecerli@test.com", password: "Test1234" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });
});
