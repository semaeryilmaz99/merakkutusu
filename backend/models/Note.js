import mongoose from "mongoose";

// Makalelerden farklı olarak tamamen kişisel/özel — yorum, favori, chat room
// yok. Kullanıcının yüklediği ders notu (ekran görüntüsü/PDF) ve AI özeti.
const NoteSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    sourceType: { type: String, enum: ["image", "pdf"], required: true },
    fileUrl: { type: String, required: true }, // Cloudinary secure_url (orijinal dosya)
    extractedText: { type: String }, // ham OCR/PDF metni (kırpılmış)
    summary: { type: String, required: true } // AI özeti (markdown)
}, { timestamps: true });

const Note = mongoose.model("Note", NoteSchema);
export default Note;
