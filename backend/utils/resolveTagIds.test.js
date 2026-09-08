import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import Tag from "../models/Tag.js";
import resolveTagIds from "./resolveTagIds.js";
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

describe("resolveTagIds", () => {
  it("olmayan tag'leri oluşturup id'lerini döner", async () => {
    const ids = await resolveTagIds("psikoloji, finans");
    expect(ids).toHaveLength(2);
    const tags = await Tag.find({ _id: { $in: ids } });
    expect(tags.map((t) => t.name).sort()).toEqual(["finans", "psikoloji"]);
  });

  it("var olan bir tag'i tekrar oluşturmaz", async () => {
    const existing = await Tag.create({ name: "yazılım" });
    const ids = await resolveTagIds(["yazılım"]);
    expect(ids).toHaveLength(1);
    expect(ids[0].toString()).toBe(existing._id.toString());
    expect(await Tag.countDocuments({ name: "yazılım" })).toBe(1);
  });

  it("büyük/küçük harf ve boşlukları normalize eder, tekrarları eler", async () => {
    const ids = await resolveTagIds([" Sanat ", "sanat", "SANAT"]);
    expect(ids).toHaveLength(1);
    expect(await Tag.countDocuments({ name: "sanat" })).toBe(1);
  });

  it("boş girdi için boş dizi döner", async () => {
    expect(await resolveTagIds("")).toEqual([]);
    expect(await resolveTagIds(undefined)).toEqual([]);
    expect(await resolveTagIds([])).toEqual([]);
  });

  it("eşzamanlı çağrılarda aynı yeni tag'i iki kere oluşturmaz", async () => {
    const [idsA, idsB] = await Promise.all([
      resolveTagIds(["gelişim"]),
      resolveTagIds(["gelişim"])
    ]);
    expect(idsA[0].toString()).toBe(idsB[0].toString());
    expect(await Tag.countDocuments({ name: "gelişim" })).toBe(1);
  });
});
