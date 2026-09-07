import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from "vitest";
import { Writable } from "stream";
import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import Note from "../models/Note.js";
import generateToken from "../utils/generateToken.js";
import { connect, clearDatabase, closeDatabase } from "./dbHandler.js";

// Gerçek Cloudinary/OpenAI/PDF işleme yok — CI'da ne ağ bağımlılığı ne
// maliyet olsun diye hepsi mock'lanıyor.
vi.mock("../config/cloudinary.js", () => ({
  default: {
    uploader: {
      upload_stream: (options, callback) => {
        // Gerçek bir Writable stream gibi davranan minimal bir mock —
        // controller bufferStream.pipe(stream) çağırıyor, biz sadece
        // callback'i hemen tetikliyoruz.
        const stream = new Writable({
          write(chunk, enc, cb) {
            cb();
          }
        });
        stream.on("finish", () => {
          callback(null, { secure_url: "https://example.com/mock-file" });
        });
        return stream;
      }
    }
  }
}));

vi.mock("../utils/openaiClient.js", () => ({
  default: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: "Erteleme Üzerine Kısa Bir Özet\n\n- Madde 1\n- Madde 2" } }]
        })
      }
    }
  }
}));

vi.mock("pdf-parse", () => ({
  // Arrow function constructor olamıyor — `new PDFParse(...)` çağrısını
  // desteklemesi için düz bir function kullanıyoruz.
  PDFParse: vi.fn(function MockPDFParse() {
    return {
      getText: vi.fn().mockResolvedValue({ text: "PDF içindeki örnek metin." }),
      destroy: vi.fn().mockResolvedValue(undefined)
    };
  })
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

const createVerifiedUser = async (username = "notkullanici") => {
  const user = await User.create({
    username,
    email: `${username}@test.com`,
    password: "Test1234",
    isVerified: true
  });
  const token = generateToken(user._id, user.role);
  return { user, token };
};

describe("POST /api/notes", () => {
  it("token olmadan 401 döner", async () => {
    const res = await request(app).post("/api/notes");
    expect(res.status).toBe(401);
  });

  it("dosya olmadan 400 döner", async () => {
    const { token } = await createVerifiedUser();
    const res = await request(app).post("/api/notes").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it("görsel yüklenince özetlenip kaydedilir", async () => {
    const { token } = await createVerifiedUser();

    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("fake-image-bytes"), { filename: "not.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.sourceType).toBe("image");
    expect(res.body.title).toBe("Erteleme Üzerine Kısa Bir Özet");
    expect(res.body.fileUrl).toBe("https://example.com/mock-file");
  });

  it("PDF yüklenince metin çıkarılıp özetlenir", async () => {
    const { token } = await createVerifiedUser();

    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("%PDF-1.4 fake"), { filename: "not.pdf", contentType: "application/pdf" });

    expect(res.status).toBe(201);
    expect(res.body.sourceType).toBe("pdf");
    expect(res.body.extractedText).toBe("PDF içindeki örnek metin.");
  });
});

describe("Not sahiplik kontrolü", () => {
  it("başkasının notunu görme/silme denemesi 403 döner", async () => {
    const { user: owner } = await createVerifiedUser("sahip");
    const { token: otherToken } = await createVerifiedUser("baskasi");

    const note = await Note.create({
      owner: owner._id,
      title: "Test Notu",
      sourceType: "image",
      fileUrl: "https://example.com/x",
      summary: "Özet"
    });

    const getRes = await request(app)
      .get(`/api/notes/${note._id}`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(getRes.status).toBe(403);

    const deleteRes = await request(app)
      .delete(`/api/notes/${note._id}`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(deleteRes.status).toBe(403);

    const stillExists = await Note.findById(note._id);
    expect(stillExists).not.toBeNull();
  });
});

describe("GET /api/notes (pagination)", () => {
  it("sadece kendi notlarını döner", async () => {
    const { user: owner, token } = await createVerifiedUser("coknotlu");
    const { user: other } = await createVerifiedUser("digerkullanici");

    await Note.insertMany([
      { owner: owner._id, title: "Not 1", sourceType: "image", fileUrl: "https://a.com", summary: "s" },
      { owner: owner._id, title: "Not 2", sourceType: "pdf", fileUrl: "https://b.com", summary: "s" },
      { owner: other._id, title: "Başkasının Notu", sourceType: "image", fileUrl: "https://c.com", summary: "s" }
    ]);

    const res = await request(app).get("/api/notes").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.notes).toHaveLength(2);
    expect(res.body.totalCount).toBe(2);
  });
});
