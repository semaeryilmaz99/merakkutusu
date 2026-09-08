import { PDFParse } from "pdf-parse";
import openai from "../utils/openaiClient.js";
import Note from "../models/Note.js";
import asyncHandler from "../utils/asyncHandler.js";
import parsePagination from "../utils/parsePagination.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

const CHAT_MODEL = "gpt-4o-mini"; // multimodal — görsel girdiyi de kabul ediyor
const MAX_EXTRACTED_TEXT = 8000; // PDF metnini LLM'e göndermeden önce kırp (token maliyeti)

const SUMMARY_SYSTEM_PROMPT =
  "Sen bir ders notu özetleme asistanısın. Sana bir öğrencinin yüklediği ders notu (ekran görüntüsü veya PDF metni) verilecek. " +
  "Bunu, öğrencinin tekrar çalışırken kullanabileceği yapılandırılmış bir Türkçe özete çevir: ana başlıklar, önemli " +
  "tanımlar/formüller, kısa madde işaretli bir özet. Markdown formatında yaz. İlk satır, notun kısa bir başlığı olsun " +
  "(3-8 kelime, # olmadan düz metin).";

// Görsel için: Cloudinary URL'i doğrudan gpt-4o-mini'ye gönderilir — tek
// çağrıda hem OCR (görseldeki metni okuma) hem özetleme yapılır, ayrı bir
// OCR servisi gerekmez.
const summarizeImage = async (imageUrl) => {
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: SUMMARY_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Bu ders notunu oku ve özetle." },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ]
  });
  return completion.choices[0].message.content.trim();
};

// PDF için: metin önce pdf-parse ile çıkarılır, sonra düz metin olarak
// aynı özetleme promptuna gönderilir.
const summarizeText = async (text) => {
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: SUMMARY_SYSTEM_PROMPT },
      { role: "user", content: `Ders notu metni:\n\n${text.slice(0, MAX_EXTRACTED_TEXT)}` }
    ]
  });
  return completion.choices[0].message.content.trim();
};

const deriveTitle = (summary) => {
  const firstLine = summary.split("\n").find((line) => line.trim().length > 0) || "Not";
  return firstLine.replace(/^#+\s*/, "").slice(0, 100);
};

// Not yükleme: dosya (görsel ya da PDF) Cloudinary'ye yüklenir, içeriği AI
// ile özetlenir, özet + orijinal dosya linki kaydedilir.
export const createNote = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Bir dosya yüklemelisiniz." });

  const isPdf = req.file.mimetype === "application/pdf";
  const uploadResult = await uploadToCloudinary(
    req.file.buffer,
    isPdf
      ? { folder: "merakkutusu_notes", resource_type: "raw" }
      : { folder: "merakkutusu_notes", quality: "auto", fetch_format: "auto" }
  );

  let summary;
  let extractedText;

  if (isPdf) {
    const parser = new PDFParse({ data: req.file.buffer });
    try {
      const result = await parser.getText();
      extractedText = result.text.slice(0, MAX_EXTRACTED_TEXT);
    } finally {
      await parser.destroy();
    }
    summary = await summarizeText(extractedText);
  } else {
    summary = await summarizeImage(uploadResult.secure_url);
  }

  const note = await Note.create({
    owner: req.user._id,
    title: deriveTitle(summary),
    sourceType: isPdf ? "pdf" : "image",
    fileUrl: uploadResult.secure_url,
    extractedText,
    summary
  });

  res.status(201).json(note);
});

// Kendi notlarını sayfalı listeleme
export const getMyNotes = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });

  const [notes, totalCount] = await Promise.all([
    Note.find({ owner: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Note.countDocuments({ owner: req.user._id })
  ]);

  res.json({ notes, page, totalPages: Math.ceil(totalCount / limit), totalCount });
});

export const getNoteById = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ message: "Not bulunamadı." });
  if (note.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Bu notu görme yetkiniz yok." });
  }
  res.json(note);
});

export const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ message: "Not bulunamadı." });
  if (note.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Bu notu silme yetkiniz yok." });
  }
  await note.deleteOne();
  res.json({ message: "Not silindi." });
});
